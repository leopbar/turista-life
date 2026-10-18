"""Conteúdo do site: listar, editar o rascunho, publicar, histórico, agendar, buscar."""

from datetime import UTC, datetime
from typing import Any

from fastapi import APIRouter, Depends, Query, Request
from pydantic import Field
from sqlalchemy import select
from sqlalchemy.orm import Session

from .. import content as svc
from ..cms_schema import load_schema
from ..config import Settings
from ..db import write
from ..deps import fail, get_db, get_settings, user_session
from ..models import Document, Version
from ..schemas import Api
from ..security import ActiveSession, client_ip

router = APIRouter(tags=['content'])


class DraftIn(Api):
    draft: dict[str, Any]
    # O rascunho como estava quando a pessoa começou a editar: se alguém salvou no meio, o servidor junta as duas edições.
    base: dict[str, Any] | None = None


class CreateIn(Api):
    item: dict[str, Any]


class ScheduleIn(Api):
    at: datetime | None = None


class OrderIn(Api):
    keys: list[str] = Field(max_length=1000)


class MoveIn(Api):
    key: str = Field(max_length=200)
    to: int = Field(ge=0)


class RestoreSiteIn(Api):
    """Uma versão do caderno (o site fica como estava logo depois dela), o conteúdo original ou um momento."""

    at: datetime | None = None
    version_id: int | None = None
    original: bool = False


def _run(fn):
    try:
        return fn()
    except svc.ContentError as err:
        fail(err.status, err.code, err.message, problems=err.problems)


def _meta(doc: Document, editing: dict[str, list[str]] | None = None) -> dict:
    schema = load_schema()
    d = schema.definition(doc.key) or {}
    return {
        'key': doc.key,
        'collection': doc.collection,
        'group': d.get('group'),
        'label': svc.label_of(doc.key, doc.draft, schema),
        'route': svc.route_of(doc.key, doc.draft, schema),
        'status': svc.status_of(doc),
        'position': doc.position,
        'draftUpdatedAt': doc.draft_updated_at,
        'draftUpdatedBy': doc.draft_updated_by,
        'publishedAt': doc.published_at,
        'publishedBy': doc.published_by,
        'scheduledAt': doc.scheduled_at,
        'editingBy': (editing or {}).get(doc.key, []),
        # Escolhas de outras listas (assunto, destino…), para filtrar a lista de itens no painel.
        'refs': _refs(d, doc.draft) if doc.collection else {},
        'date': doc.draft.get('date') if doc.collection and isinstance(doc.draft, dict) else None,
    }


def _refs(d: dict, draft: Any) -> dict[str, str]:
    if not isinstance(draft, dict):
        return {}
    return {k: draft[k] for k, f in d.get('fields', {}).items() if f.get('kind') == 'ref' and isinstance(draft.get(k), str) and draft[k]}


def _naive_utc(dt: datetime) -> datetime:
    return dt.astimezone(UTC).replace(tzinfo=None) if dt.tzinfo else dt


@router.get('/api/content/schema')
def schema(_: ActiveSession = Depends(user_session)):
    s = load_schema()
    return {'docs': list(s.docs.values()), 'collections': list(s.collections.values())}


@router.get('/api/content')
def list_content(active: ActiveSession = Depends(user_session), db: Session = Depends(get_db)):
    editing = svc.editing_now(db, active.user)
    docs = db.scalars(select(Document).order_by(Document.collection, Document.position, Document.key))
    return [_meta(d, editing) for d in docs]


@router.get('/api/content/search')
def search(q: str = Query(min_length=1, max_length=100), _: ActiveSession = Depends(user_session), db: Session = Depends(get_db)):
    return svc.search(db, q)


@router.get('/api/content/history')
def history(limit: int = Query(default=60, ge=1, le=200), _: ActiveSession = Depends(user_session), db: Session = Depends(get_db)):
    """Últimas publicações do site inteiro (o "caderno de viagem")."""
    rows = db.scalars(select(Version).where(Version.action != 'original').order_by(Version.id.desc()).limit(limit))
    return [
        {'id': v.id, 'key': v.key, 'label': svc.label_of(v.key, v.data), 'action': v.action, 'createdAt': v.created_at, 'createdBy': v.created_by}
        for v in rows
    ]


def _moment(db: Session, body: RestoreSiteIn) -> datetime | None:
    return svc.moment_of(db, at=_naive_utc(body.at) if body.at else None, version_id=body.version_id, original=body.original)


@router.get('/api/content/restore-site/preview')
def restore_site_preview(
    at: datetime | None = None, version_id: int | None = Query(default=None, alias='versionId'), original: bool = False,
    _: ActiveSession = Depends(user_session), db: Session = Depends(get_db),
):
    """O que muda se o site voltar para esta versão (para mostrar no aviso antes de confirmar)."""
    body = RestoreSiteIn(at=at, version_id=version_id, original=original)
    return _run(lambda: svc.preview_site(db, _moment(db, body)))


@router.post('/api/content/restore-site')
def restore_site(body: RestoreSiteIn, request: Request, active: ActiveSession = Depends(user_session), db: Session = Depends(get_db), settings: Settings = Depends(get_settings)):
    with write(db):
        n = _run(lambda: svc.restore_site(db, _moment(db, body), active.user, client_ip(request, settings), settings))
    return {'changed': n}


@router.get('/api/content/{key}')
def get_content(key: str, active: ActiveSession = Depends(user_session), db: Session = Depends(get_db)):
    doc = _run(lambda: svc.get_doc(db, key))
    return {**_meta(doc, svc.editing_now(db, active.user)), 'draft': doc.draft, 'published': doc.published, 'draftDeleted': doc.draft_deleted}


@router.put('/api/content/{key}')
def save(key: str, body: DraftIn, active: ActiveSession = Depends(user_session), db: Session = Depends(get_db)):
    with write(db):
        doc = _run(lambda: svc.save_draft(db, key, body.draft, active.user, body.base))
    return {**_meta(doc), 'draft': doc.draft}


@router.post('/api/content/{key}/publish')
def publish(key: str, request: Request, active: ActiveSession = Depends(user_session), db: Session = Depends(get_db), settings: Settings = Depends(get_settings)):
    with write(db):
        labels = _run(lambda: svc.publish(db, [key], active.user.email, client_ip(request, settings), settings, actor=active.user))
    return {'published': labels}


@router.post('/api/content/{key}/discard')
def discard(key: str, request: Request, active: ActiveSession = Depends(user_session), db: Session = Depends(get_db), settings: Settings = Depends(get_settings)):
    with write(db):
        doc = _run(lambda: svc.discard(db, key, active.user, client_ip(request, settings)))
    return _meta(doc) if doc else {'deleted': True}


@router.delete('/api/content/{key}')
def remove(key: str, request: Request, active: ActiveSession = Depends(user_session), db: Session = Depends(get_db), settings: Settings = Depends(get_settings)):
    with write(db):
        doc = _run(lambda: svc.mark_removal(db, key, active.user, client_ip(request, settings)))
    return _meta(doc) if doc else {'deleted': True}


@router.post('/api/content/{key}/schedule')
def schedule(key: str, body: ScheduleIn, request: Request, active: ActiveSession = Depends(user_session), db: Session = Depends(get_db), settings: Settings = Depends(get_settings)):
    when = _naive_utc(body.at) if body.at else None
    with write(db):
        doc = _run(lambda: svc.schedule(db, key, when, active.user, client_ip(request, settings)))
    return _meta(doc)


@router.get('/api/content/{key}/versions')
def versions(key: str, _: ActiveSession = Depends(user_session), db: Session = Depends(get_db)):
    rows = db.scalars(select(Version).where(Version.key == key).order_by(Version.id.desc()).limit(200))
    return [{'id': v.id, 'action': v.action, 'createdAt': v.created_at, 'createdBy': v.created_by, 'data': v.data} for v in rows]


@router.post('/api/content/{key}/versions/{version_id}/restore')
def restore(key: str, version_id: int, request: Request, active: ActiveSession = Depends(user_session), db: Session = Depends(get_db), settings: Settings = Depends(get_settings)):
    with write(db):
        _run(lambda: svc.restore_version(db, key, version_id, active.user, client_ip(request, settings), settings))
    return {'ok': True}


@router.post('/api/content/{key}/presence')
def presence(key: str, active: ActiveSession = Depends(user_session), db: Session = Depends(get_db)):
    _run(lambda: svc.get_doc(db, key))
    with write(db):
        others = svc.touch_presence(db, key, active.user)
    return {'editingBy': others}


@router.post('/api/collections/{collection}', status_code=201)
def create(collection: str, body: CreateIn, request: Request, active: ActiveSession = Depends(user_session), db: Session = Depends(get_db), settings: Settings = Depends(get_settings)):
    with write(db):
        doc = _run(lambda: svc.create_item(db, collection, body.item, active.user, client_ip(request, settings)))
    return _meta(doc)


@router.post('/api/collections/{collection}/order')
def order(collection: str, body: OrderIn, request: Request, active: ActiveSession = Depends(user_session), db: Session = Depends(get_db), settings: Settings = Depends(get_settings)):
    with write(db):
        _run(lambda: svc.reorder(db, collection, body.keys, active.user, client_ip(request, settings), settings))
    return {'ok': True}


@router.post('/api/collections/{collection}/move')
def move(collection: str, body: MoveIn, request: Request, active: ActiveSession = Depends(user_session), db: Session = Depends(get_db), settings: Settings = Depends(get_settings)):
    with write(db):
        _run(lambda: svc.move(db, collection, body.key, body.to, active.user, client_ip(request, settings), settings))
    return {'ok': True}


@router.get('/api/preview/bundle')
def preview_bundle(_: ActiveSession = Depends(user_session), db: Session = Depends(get_db), settings: Settings = Depends(get_settings)):
    """O site com todos os rascunhos, para a pré-visualização dentro do painel."""
    return svc.build_bundle(db, settings, draft=True)
