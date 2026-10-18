"""Conteúdo do site: rascunho, publicação, histórico, agendamento e o arquivo publicado (site.json)."""

import json
import os
import re
import unicodedata
from datetime import datetime, timedelta
from pathlib import Path
from typing import Any

from sqlalchemy import delete, func, select
from sqlalchemy.orm import Session

from . import audit
from .cms_schema import Schema, broken_refs, load_defaults, load_schema, validate, values_of_kind
from .config import Settings
from .db import utcnow
from .models import Document, Media, Presence, User, Version


class ContentError(Exception):
    def __init__(self, status: int, code: str, message: str, problems: list | None = None):
        super().__init__(message)
        self.status, self.code, self.message, self.problems = status, code, message, problems or []


# ------------------------------------------------------------------ #
# Nomes para mostrar                                                  #
# ------------------------------------------------------------------ #


def label_of(key: str, value: Any = None, schema: Schema | None = None) -> str:
    schema = schema or load_schema()
    d = schema.definition(key)
    if not d:
        return key
    if ':' not in key:
        return d['label']
    title = value.get(d['titleField']) if isinstance(value, dict) else None
    return f'{d["itemLabel"]} "{title or key.split(":", 1)[1]}"'


def status_of(doc: Document) -> str:
    if doc.draft_deleted:
        return 'sair'
    if doc.published is None:
        return 'novo'
    if doc.draft != doc.published:
        return 'alterado'
    return 'publicado'


# ------------------------------------------------------------------ #
# Conteúdo inicial                                                    #
# ------------------------------------------------------------------ #


def _fill(value: Any, default: Any) -> Any:
    """Campos novos no código entram no conteúdo guardado com o valor do código."""
    if not isinstance(value, dict) or not isinstance(default, dict):
        return value
    out = dict(value)
    for k, d in default.items():
        out[k] = d if k not in out else _fill(out[k], d)
    return out


def _prune(value: Any, fields: dict) -> Any:
    """Campos que saíram do mapa (ex.: renomeados) saem do conteúdo guardado; senão a próxima publicação falharia."""
    if not isinstance(value, dict) or not fields:
        return value
    return {k: v for k, v in value.items() if k in fields}


def seed(db: Session) -> int:
    """Garante que todo documento do mapa existe. Chamar dentro de db.write()."""
    schema, defaults = load_schema(), load_defaults()
    existing = {d.key: d for d in db.scalars(select(Document))}
    now = utcnow()
    added = 0

    def add(key: str, value: Any, collection: str | None, position: int):
        nonlocal added
        db.add(Document(
            key=key, collection=collection, position=position, draft=value, published=value, draft_deleted=False,
            draft_updated_at=now, draft_updated_by=None, published_at=now, published_by='conteúdo original',
        ))
        db.add(Version(key=key, data=value, position=position, action='original', created_at=now, created_by='conteúdo original'))
        added += 1

    for key in schema.docs:
        default = defaults['docs'].get(key, {})
        doc = existing.get(key)
        if doc is None:
            add(key, default, None, 0)
        elif key == 'geral.textos':
            # Textos fixos novos entram; os que sumiram do código saem.
            known = set(default)
            for attr in ('draft', 'published'):
                current = getattr(doc, attr) or {}
                setattr(doc, attr, {k: current.get(k, v) for k, v in default.items() if k in known})
        else:
            fields = schema.fields(key) or {}
            doc.draft = _prune(_fill(doc.draft, default), fields)
            if doc.published is not None:
                doc.published = _prune(_fill(doc.published, default), fields)

    for ckey, c in schema.collections.items():
        if any(k.startswith(f'{ckey}:') for k in existing):
            continue
        for i, item in enumerate(defaults['collections'].get(ckey, [])):
            add(f'{ckey}:{item[c["idField"]]}', item, ckey, i)
    db.flush()
    return added


# ------------------------------------------------------------------ #
# Arquivo publicado (o que o site lê)                                 #
# ------------------------------------------------------------------ #


def public_dir(settings: Settings) -> Path:
    p = settings.data_dir / 'public'
    p.mkdir(parents=True, exist_ok=True)
    return p


def build_bundle(db: Session, settings: Settings, *, draft: bool) -> dict:
    docs: dict[str, Any] = {}
    collections: dict[str, list] = {}
    rows = db.scalars(select(Document).order_by(Document.collection, Document.position, Document.key))
    for d in rows:
        value = (None if d.draft_deleted else d.draft) if draft else d.published
        if value is None:
            continue
        if d.collection:
            collections.setdefault(d.collection, []).append(value)
        else:
            docs[d.key] = value
    media = {
        m.id: {'alt': m.alt, 'focal': [m.focal_x, m.focal_y], 'w': m.width, 'h': m.height, 'widths': m.widths}
        for m in db.scalars(select(Media).where(Media.deleted_at.is_(None)))
    }
    thumbs_dir = public_dir(settings) / 'thumbs'
    thumbs = sorted(p.stem for p in thumbs_dir.glob('*.jpg')) if thumbs_dir.is_dir() else []
    return {
        'version': int(utcnow().timestamp() * 1000),
        'docs': docs,
        'collections': collections,
        'media': media,
        'thumbs': thumbs,
    }


def write_bundle(db: Session, settings: Settings) -> None:
    bundle = build_bundle(db, settings, draft=False)
    target = public_dir(settings) / 'site.json'
    tmp = target.with_suffix('.json.tmp')
    tmp.write_text(json.dumps(bundle, ensure_ascii=False, separators=(',', ':')), encoding='utf-8')
    os.replace(tmp, target)


# ------------------------------------------------------------------ #
# Rascunho                                                            #
# ------------------------------------------------------------------ #


def get_doc(db: Session, key: str) -> Document:
    doc = db.get(Document, key)
    if doc is None:
        raise ContentError(404, 'not_found', 'Este conteúdo não foi encontrado.')
    return doc


def _validated(db: Session, key: str, value: Any) -> None:
    problems = validate(load_schema(), key, value).items + image_problems(db, key, value)
    if problems:
        raise ContentError(422, 'invalid_content', 'Confira os campos destacados.', problems)


MEDIA_URL = re.compile(r'^cms/media/([a-f0-9]{16})/(\d+)\.webp(?:#.*)?$')


def image_problems(db: Session, key: str, value: Any, *, trashed_ok: bool = True) -> list[dict]:
    """Fotos que não existem (ou, na publicação, que estão na lixeira) deixariam o site com imagem quebrada."""
    static = load_defaults().get('staticImages')
    out: list[dict] = []
    for path, f, v in values_of_kind(load_schema(), key, value, 'image'):
        if not isinstance(v, str) or not v:
            continue
        label = f.get('label', path)
        if m := MEDIA_URL.match(v):
            media = db.get(Media, m.group(1))
            if media is None or int(m.group(2)) not in (media.widths or []):
                out.append({'path': path, 'message': f'"{label}": essa foto não existe mais na biblioteca. Escolha outra.'})
            elif media.deleted_at is not None and not trashed_ok:
                out.append({'path': path, 'message': f'"{label}" usa a foto "{media.original_name}", que está na lixeira. Recupere a foto em Fotos › Lixeira ou escolha outra.'})
        elif static is not None and v.split('#', 1)[0] not in static:
            out.append({'path': path, 'message': f'"{label}": essa foto não existe no site. Escolha uma da biblioteca.'})
    return out


def _merge(base: Any, mine: Any, theirs: Any) -> Any:
    """Junta duas edições do mesmo rascunho, campo a campo (primeiro nível).

    Quem salvou depois só sobrescreve os campos que mudou. Se as duas pessoas mudaram o mesmo
    campo de jeitos diferentes, é conflito (None).
    """
    if not all(isinstance(x, dict) for x in (base, mine, theirs)):
        return None
    out = dict(theirs)
    for k in set(base) | set(mine) | set(theirs):
        b, m, t = base.get(k), mine.get(k), theirs.get(k)
        if m == b or m == t:
            continue  # não mexi aqui (ou mexemos igual): fica o que está salvo
        if t != b:
            return None  # as duas pessoas mudaram este campo
        if k in mine:
            out[k] = m
        else:
            out.pop(k, None)
    return out


def save_draft(db: Session, key: str, value: Any, user: User, base: Any = None) -> Document:
    doc = get_doc(db, key)
    if base is not None and base != doc.draft:
        # Outra pessoa salvou enquanto esta editava: junta as mudanças das duas em vez de apagar a outra.
        merged = _merge(base, value, doc.draft)
        if merged is None:
            who = doc.draft_updated_by or 'Outra pessoa'
            raise ContentError(409, 'conflict', f'{who} mudou esta mesma parte enquanto você editava. Recarregue para ver a versão atual antes de continuar.')
        value = merged
    _validated(db, key, value)
    doc.draft = value
    doc.draft_updated_at = utcnow()
    doc.draft_updated_by = user.email
    db.add(doc)
    return doc


def create_item(db: Session, collection: str, value: Any, user: User, ip: str) -> Document:
    schema = load_schema()
    c = schema.collections.get(collection)
    if c is None:
        raise ContentError(404, 'not_found', 'Coleção desconhecida.')
    item_id = value.get(c['idField']) if isinstance(value, dict) else None
    if not isinstance(item_id, str) or not item_id:
        raise ContentError(422, 'invalid_content', 'Escolha o endereço.', [{'path': c['idField'], 'message': 'Falta o endereço.'}])
    key = f'{collection}:{item_id}'
    if db.get(Document, key) is not None:
        raise ContentError(409, 'exists', 'Já existe um item com esse endereço.')
    _validated(db, key, value)
    # Coleções como o blog mostram o mais novo primeiro: o item novo entra no topo.
    if c.get('newestFirst'):
        position = (db.scalar(select(func.min(Document.position)).where(Document.collection == collection)) or 0) - 1
    else:
        position = (db.scalar(select(func.max(Document.position)).where(Document.collection == collection)) or 0) + 1
    doc = Document(
        key=key, collection=collection, position=position, draft=value, published=None, draft_deleted=False,
        draft_updated_at=utcnow(), draft_updated_by=user.email,
    )
    db.add(doc)
    audit.record(db, 'conteudo_criado', actor=user, target=label_of(key, value), ip=ip)
    return doc


def mark_removal(db: Session, key: str, user: User, ip: str) -> Document | None:
    doc = get_doc(db, key)
    if not doc.collection:
        raise ContentError(409, 'not_removable', 'Este conteúdo faz parte do site e não pode ser apagado.')
    label = label_of(key, doc.draft)
    if doc.published is None:
        db.delete(doc)
        audit.record(db, 'rascunho_descartado', actor=user, target=label, ip=ip)
        return None
    doc.draft_deleted = True
    doc.draft_updated_at = utcnow()
    doc.draft_updated_by = user.email
    db.add(doc)
    audit.record(db, 'conteudo_marcado_para_sair', actor=user, target=label, ip=ip)
    return doc


def discard(db: Session, key: str, user: User, ip: str) -> Document | None:
    doc = get_doc(db, key)
    label = label_of(key, doc.draft)
    if doc.published is None:
        db.delete(doc)
        result = None
    else:
        doc.draft = doc.published
        doc.draft_deleted = False
        doc.draft_updated_at = utcnow()
        doc.draft_updated_by = user.email
        db.add(doc)
        result = doc
    audit.record(db, 'rascunho_descartado', actor=user, target=label, ip=ip)
    return result


def reorder(db: Session, collection: str, keys: list[str], user: User, ip: str, settings: Settings) -> None:
    docs = {d.key: d for d in db.scalars(select(Document).where(Document.collection == collection))}
    if set(keys) != set(docs):
        raise ContentError(409, 'stale', 'A lista mudou enquanto você mexia. Recarregue e tente de novo.')
    for i, k in enumerate(keys):
        docs[k].position = i
    db.flush()
    audit.record(db, 'ordem_alterada', actor=user, target=load_schema().collections[collection]['label'], ip=ip)
    write_bundle(db, settings)


def move(db: Session, collection: str, key: str, to: int, user: User, ip: str, settings: Settings) -> None:
    """Muda um item de lugar (ex.: levar um artigo para o topo) sem mandar a lista inteira."""
    ordered = list(db.scalars(select(Document).where(Document.collection == collection).order_by(Document.position, Document.key)))
    current = next((d for d in ordered if d.key == key), None)
    if current is None:
        raise ContentError(404, 'not_found', 'Este item não existe mais. Recarregue a página.')
    ordered.remove(current)
    ordered.insert(max(0, min(to, len(ordered))), current)
    for i, d in enumerate(ordered):
        d.position = i
    db.flush()
    audit.record(db, 'ordem_alterada', actor=user, target=load_schema().collections[collection]['label'], ip=ip)
    write_bundle(db, settings)


# ------------------------------------------------------------------ #
# Publicar, voltar no tempo, agendar                                  #
# ------------------------------------------------------------------ #


def _published_map(db: Session) -> dict[str, Any]:
    return {d.key: d.published for d in db.scalars(select(Document)) if d.published is not None}


def _fill_publish_date(schema: Schema, doc: Document) -> None:
    """Item de coleção com "Data de publicação" vazia ganha a data de hoje na primeira publicação."""
    d = schema.definition(doc.key) or {}
    field = d.get('fields', {}).get('date') if doc.collection else None
    if field and field.get('kind') == 'date' and isinstance(doc.draft, dict) and not doc.draft.get('date'):
        doc.draft = {**doc.draft, 'date': utcnow().date().isoformat()}


def publish(db: Session, keys: list[str], actor_email: str, ip: str | None, settings: Settings, *, action: str = 'publicado', actor: User | None = None) -> list[str]:
    """Publica o rascunho dos documentos. Confere tudo antes: ou publica todos, ou nenhum."""
    schema = load_schema()
    # Sem mudança nenhuma não vira versão nova no caderno.
    docs = [d for d in (get_doc(db, k) for k in keys) if d.draft_deleted or d.draft != d.published]
    if not docs:
        return []
    candidate = _published_map(db)
    for doc in docs:
        if doc.draft_deleted:
            candidate.pop(doc.key, None)
            continue
        _fill_publish_date(schema, doc)
        problems = validate(schema, doc.key, doc.draft, publishing=True).items + image_problems(db, doc.key, doc.draft, trashed_ok=False)
        if problems:
            raise ContentError(422, 'invalid_content', f'{label_of(doc.key, doc.draft)}: confira os campos destacados.', problems)
        candidate[doc.key] = doc.draft
    broken = broken_refs(schema, candidate, lambda k: label_of(k, candidate.get(k), schema))
    if broken:
        raise ContentError(409, 'broken_refs', 'Publicar agora quebraria outras partes do site.', [{'path': '', 'message': b} for b in broken])

    now = utcnow()
    labels = []
    for doc in docs:
        label = label_of(doc.key, doc.draft)
        labels.append(label)
        if doc.draft_deleted:
            db.add(Version(key=doc.key, data=None, position=doc.position, action='removido', created_at=now, created_by=actor_email))
            db.delete(doc)
        else:
            doc.published = doc.draft
            doc.published_at = now
            doc.published_by = actor_email
            doc.scheduled_at = None
            doc.scheduled_by = None
            db.add(doc)
            db.add(Version(key=doc.key, data=doc.draft, position=doc.position, action=action, created_at=now, created_by=actor_email))
    db.flush()
    audit.record(
        db, 'conteudo_publicado' if action == 'publicado' else f'conteudo_{action}', actor=actor,
        actor_email=None if actor else actor_email, target=', '.join(labels)[:254], ip=ip,
    )
    write_bundle(db, settings)
    return labels


def restore_version(db: Session, key: str, version_id: int, user: User, ip: str, settings: Settings) -> None:
    v = db.get(Version, version_id)
    if v is None or v.key != key:
        raise ContentError(404, 'not_found', 'Versão não encontrada.')
    doc = db.get(Document, key)
    if doc is not None and v.data is not None and _with_defaults(key, v.data) == doc.published:
        raise ContentError(409, 'nothing', 'Essa já é a versão que está no ar.')
    kept = _pending_drafts(db, [key])
    _bring_back(db, key, v)
    publish(db, [key], user.email, ip, settings, action='restaurado', actor=user)
    _keep_drafts(db, kept)


def _pending_drafts(db: Session, keys) -> dict[str, tuple]:
    """Rascunhos em andamento (diferentes do que está no ar), para não se perderem ao voltar no tempo."""
    out = {}
    for key in keys:
        doc = db.get(Document, key)
        if doc is not None and doc.published is not None and not doc.draft_deleted and doc.draft != doc.published:
            out[key] = (doc.draft, doc.draft_updated_at, doc.draft_updated_by, doc.scheduled_at, doc.scheduled_by)
    return out


def _keep_drafts(db: Session, kept: dict[str, tuple]) -> None:
    """Depois de publicar a versão antiga, o rascunho em andamento volta a ser o rascunho (continua por publicar)."""
    for key, (draft, updated_at, updated_by, scheduled_at, scheduled_by) in kept.items():
        doc = db.get(Document, key)
        if doc is None or doc.published == draft:
            continue
        doc.draft, doc.draft_updated_at, doc.draft_updated_by = draft, updated_at, updated_by
        doc.scheduled_at, doc.scheduled_by = scheduled_at, scheduled_by
        db.add(doc)
    db.flush()


def _with_defaults(key: str, data: Any) -> Any:
    base = key.split(':', 1)[0]
    return _fill(data, load_defaults()['docs'].get(base, {})) if ':' not in key else data


def _bring_back(db: Session, key: str, v: Version) -> None:
    schema = load_schema()
    doc = db.get(Document, key)
    if v.data is None:
        if doc is not None:
            doc.draft_deleted = True
        return
    base = key.split(':', 1)[0]
    data = _with_defaults(key, v.data)
    if doc is None:
        collection = base if base in schema.collections else None
        doc = Document(
            key=key, collection=collection, position=v.position, draft=data, published=None, draft_deleted=False,
            draft_updated_at=utcnow(),
        )
        db.add(doc)
    doc.draft = data
    doc.draft_deleted = False
    db.flush()


def restore_site(db: Session, at: datetime, user: User, ip: str, settings: Settings) -> int:
    """Volta o site inteiro para como estava num momento: cada documento volta à versão daquela hora."""
    if at >= utcnow():
        raise ContentError(400, 'future', 'Escolha um momento no passado.')
    start = history_start(db)
    if start is None or at < start:
        when = start.strftime('%d/%m/%Y') if start else 'hoje'
        raise ContentError(400, 'too_old', f'O caderno só guarda o site a partir de {when}. Escolha um momento depois disso.')
    changed = []
    keys = set(db.scalars(select(Version.key).distinct()))
    kept = _pending_drafts(db, keys)
    for key in keys:
        before = db.scalar(select(Version).where(Version.key == key, Version.created_at <= at).order_by(Version.id.desc()).limit(1))
        doc = db.get(Document, key)
        current = doc.published if doc else None
        if before is None:
            # Ainda não existia naquele momento: sai do site.
            if doc is not None and doc.collection:
                if doc.published is None:
                    continue
                doc.draft_deleted = True
                changed.append(key)
            continue
        if (before.data if before.data is None else _with_defaults(key, before.data)) != current:
            _bring_back(db, key, before)
            changed.append(key)
    if not changed:
        raise ContentError(409, 'nothing', 'O site já está igual ao que era nesse momento.')
    publish(db, changed, user.email, ip, settings, action='restaurado', actor=user)
    _keep_drafts(db, kept)
    return len(changed)


HISTORY_DAYS = 365


def history_start(db: Session) -> datetime | None:
    """Desde quando dá para voltar o site: a instalação do painel ou, depois de um ano, o limite do caderno.

    A limpeza diária guarda a versão que estava no ar no começo desse ano, então a partir daí
    cada conteúdo tem a versão certa daquela hora.
    """
    first = db.scalar(select(func.min(Version.created_at)))
    if first is None:
        return None
    return max(first, utcnow() - timedelta(days=HISTORY_DAYS))


def schedule(db: Session, key: str, when: datetime | None, user: User, ip: str) -> Document:
    doc = get_doc(db, key)
    if when is not None and when <= utcnow() + timedelta(seconds=30):
        raise ContentError(400, 'past', 'Escolha uma data e hora no futuro.')
    doc.scheduled_at = when
    doc.scheduled_by = user.email if when else None
    db.add(doc)
    audit.record(
        db, 'publicacao_agendada' if when else 'agendamento_cancelado', actor=user, target=label_of(key, doc.draft), ip=ip,
        details={'quando': when.isoformat()} if when else {},
    )
    return doc


def run_scheduled(db: Session, settings: Settings) -> int:
    """Publica o que chegou na hora. Chamado de tempos em tempos pelo servidor."""
    due = list(db.scalars(select(Document).where(Document.scheduled_at.is_not(None), Document.scheduled_at <= utcnow())))
    done = 0
    for doc in due:
        who = doc.scheduled_by or 'agendamento'
        try:
            publish(db, [doc.key], f'{who} (agendado)', None, settings, action='publicado')
            done += 1
        except ContentError as err:
            doc.scheduled_at = None
            db.add(doc)
            audit.record(db, 'agendamento_falhou', actor_email=who, target=label_of(doc.key, doc.draft), details={'motivo': err.message})
    return done


# ------------------------------------------------------------------ #
# Presença e busca                                                    #
# ------------------------------------------------------------------ #


def touch_presence(db: Session, key: str, user: User) -> list[str]:
    now = utcnow()
    row = db.get(Presence, (key, user.id))
    if row is None:
        db.add(Presence(key=key, user_id=user.id, name=user.name, seen_at=now))
    else:
        row.seen_at = now
    db.execute(delete(Presence).where(Presence.seen_at < now - timedelta(minutes=5)))
    others = db.scalars(select(Presence).where(Presence.key == key, Presence.user_id != user.id, Presence.seen_at > now - timedelta(seconds=60)))
    return [p.name for p in others]


def editing_now(db: Session, user: User) -> dict[str, list[str]]:
    since = utcnow() - timedelta(seconds=60)
    out: dict[str, list[str]] = {}
    for p in db.scalars(select(Presence).where(Presence.user_id != user.id, Presence.seen_at > since)):
        out.setdefault(p.key, []).append(p.name)
    return out


def _norm(s: str) -> str:
    return ''.join(c for c in unicodedata.normalize('NFD', s.casefold()) if unicodedata.category(c) != 'Mn')


def search(db: Session, query: str, limit: int = 30) -> list[dict]:
    q = _norm(query.strip())
    if len(q) < 2:
        return []
    schema = load_schema()
    results: list[dict] = []

    def visit(v: Any, path: str, doc: Document):
        if len(results) >= limit:
            return
        if isinstance(v, str):
            n = _norm(v)
            i = n.find(q)
            if i >= 0 and not v.startswith(('images/', 'cms/', 'http', '/')):
                start = max(0, i - 40)
                results.append({
                    'key': doc.key, 'label': label_of(doc.key, doc.draft, schema), 'path': path,
                    'snippet': ('…' if start else '') + v[start:start + 140] + ('…' if start + 140 < len(v) else ''),
                    'route': route_of(doc.key, doc.draft, schema),
                })
        elif isinstance(v, list):
            for i, x in enumerate(v):
                visit(x, f'{path}.{i}' if path else str(i), doc)
        elif isinstance(v, dict):
            for k, x in v.items():
                visit(x, f'{path}.{k}' if path else k, doc)

    for doc in db.scalars(select(Document).order_by(Document.collection, Document.position)):
        # O título de um item conta como resultado também.
        visit(doc.draft, '', doc)
    return results


def route_of(key: str, value: Any, schema: Schema | None = None) -> str:
    schema = schema or load_schema()
    d = schema.definition(key)
    if not d:
        return '/'
    if ':' in key:
        return d['route'].replace('{id}', key.split(':', 1)[1])
    return d['route']
