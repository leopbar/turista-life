"""Biblioteca de fotos: recebe, confere, limpa e gera as versões leves de cada foto."""

import io
import json
import re
import secrets
import shutil
import urllib.request
from pathlib import Path

from PIL import Image, ImageOps, UnidentifiedImageError
from pillow_heif import register_heif_opener
from sqlalchemy import select
from sqlalchemy.orm import Session

from . import audit
from .cms_schema import DATA
from .config import Settings
from .content import ContentError, label_of, public_dir, route_of, write_bundle
from .db import utcnow
from .models import Document, Media, User

register_heif_opener()
# Fotos absurdamente grandes (ou "bombas" de descompressão) são recusadas.
Image.MAX_IMAGE_PIXELS = 80_000_000

MAX_BYTES = 25 * 1024 * 1024
WIDTHS = (480, 960, 1600, 2400)
DEFAULT_WIDTH = 1600
TRASH_DAYS = 30


def sniff(head: bytes) -> str | None:
    """Tipo real do arquivo pelos primeiros bytes (o nome e a extensão não contam)."""
    if head.startswith(b'\xff\xd8\xff'):
        return 'jpeg'
    if head.startswith(b'\x89PNG\r\n\x1a\n'):
        return 'png'
    if head[:4] == b'RIFF' and head[8:12] == b'WEBP':
        return 'webp'
    if head[4:8] == b'ftyp' and head[8:12] in {b'heic', b'heix', b'hevc', b'heim', b'heis', b'mif1', b'msf1'}:
        return 'heic'
    return None


def media_dir(settings: Settings, media_id: str) -> Path:
    return public_dir(settings) / 'media' / media_id


def media_url(m: Media) -> str:
    w = max([x for x in m.widths if x <= DEFAULT_WIDTH] or [min(m.widths)])
    return f'cms/media/{m.id}/{w}.webp'


def clean_name(name: str | None) -> str:
    base = re.split(r'[\\/]', name or 'foto')[-1]
    return re.sub(r'[^\w .()-]', '', base)[:200] or 'foto'


def prepare_upload(data: bytes, settings: Settings, *, original_name: str, alt: str, user: User) -> Media:
    """Confere, limpa e grava as versões da foto. Trabalho pesado: chamar FORA da trava de escrita."""
    alt = ' '.join(alt.split())
    if not alt:
        raise ContentError(422, 'alt_required', 'Conte o que aparece na foto (ajuda o Google e quem usa leitor de tela).')
    if len(alt) > 300:
        raise ContentError(422, 'alt_too_long', 'A descrição pode ter no máximo 300 caracteres.')
    if len(data) > MAX_BYTES:
        raise ContentError(413, 'too_big', 'A foto pode ter no máximo 25 MB.')
    if sniff(data[:16]) is None:
        raise ContentError(415, 'not_image', 'Esse arquivo não é uma foto aceita. Use JPG, PNG, WebP ou HEIC (iPhone).')
    try:
        with Image.open(io.BytesIO(data)) as im:
            im.load()
            # Gira conforme a câmera e descarta todos os metadados (GPS, modelo do celular…): a foto é redesenhada.
            im = ImageOps.exif_transpose(im)
            mode = 'RGBA' if im.mode in ('RGBA', 'LA', 'P') and 'transparency' in im.info or im.mode in ('RGBA', 'LA') else 'RGB'
            clean = im.convert(mode)
    except (UnidentifiedImageError, OSError, Image.DecompressionBombError, ValueError):
        raise ContentError(415, 'not_image', 'Não consegui abrir essa foto. Tente outro arquivo.') from None

    media_id = secrets.token_hex(8)
    folder = media_dir(settings, media_id)
    folder.mkdir(parents=True, exist_ok=False)
    widths = sorted({w for w in WIDTHS if w < clean.width} | {min(clean.width, WIDTHS[-1])})
    try:
        for w in widths:
            copy = clean if w == clean.width else clean.resize((w, round(clean.height * w / clean.width)), Image.Resampling.LANCZOS)
            copy.save(folder / f'{w}.webp', 'WEBP', quality=82, method=4)
    except Exception:
        shutil.rmtree(folder, ignore_errors=True)
        raise

    m = Media(
        id=media_id, original_name=clean_name(original_name), alt=alt, focal_x=50, focal_y=50,
        width=clean.width, height=clean.height, widths=widths, size_bytes=sum((folder / f'{w}.webp').stat().st_size for w in widths),
        created_at=utcnow(), created_by=user.email,
    )
    return m


def register_upload(db: Session, m: Media, settings: Settings, *, user: User, ip: str) -> Media:
    """Coloca a foto já preparada na biblioteca. Chamar dentro de db.write()."""
    db.add(m)
    audit.record(db, 'foto_enviada', actor=user, target=m.original_name, ip=ip)
    write_bundle(db, settings)
    return m


# ------------------------------------------------------------------ #
# Onde cada foto aparece                                              #
# ------------------------------------------------------------------ #

MEDIA_REF = re.compile(r'cms/media/([a-f0-9]{16})/')


def usage(db: Session) -> dict[str, list[dict]]:
    """Para cada foto: em quais conteúdos ela aparece (rascunho ou publicado)."""
    found: dict[str, dict[str, dict]] = {}
    for doc in db.scalars(select(Document)):
        for state, value in (('rascunho', doc.draft), ('publicado', doc.published)):
            if value is None:
                continue
            for media_id in set(MEDIA_REF.findall(json.dumps(value))):
                entry = found.setdefault(media_id, {}).setdefault(doc.key, {
                    'key': doc.key, 'label': label_of(doc.key, doc.draft), 'route': route_of(doc.key, doc.draft), 'states': [],
                })
                entry['states'].append(state)
    return {mid: list(docs.values()) for mid, docs in found.items()}


def to_dict(m: Media, used: list[dict] | None = None) -> dict:
    return {
        'id': m.id, 'url': media_url(m), 'alt': m.alt, 'focal': [m.focal_x, m.focal_y], 'width': m.width, 'height': m.height,
        'widths': m.widths, 'sizeBytes': m.size_bytes, 'originalName': m.original_name, 'createdAt': m.created_at,
        'createdBy': m.created_by, 'deletedAt': m.deleted_at, 'usedIn': used or [],
    }


def trash(db: Session, m: Media, user: User, ip: str, settings: Settings) -> None:
    used = usage(db).get(m.id)
    if used:
        names = ', '.join(u['label'] for u in used[:5])
        raise ContentError(409, 'in_use', f'Essa foto está em uso: {names}. Troque a foto nesses lugares antes de apagar.', used)
    m.deleted_at = utcnow()
    db.add(m)
    audit.record(db, 'foto_na_lixeira', actor=user, target=m.original_name, ip=ip)
    write_bundle(db, settings)


def purge_trash(db: Session, settings: Settings) -> int:
    """Apaga de vez as fotos que estão há mais de 30 dias na lixeira."""
    from datetime import timedelta

    old = list(db.scalars(select(Media).where(Media.deleted_at.is_not(None), Media.deleted_at < utcnow() - timedelta(days=TRASH_DAYS))))
    for m in old:
        shutil.rmtree(media_dir(settings, m.id), ignore_errors=True)
        db.delete(m)
    return len(old)


# ------------------------------------------------------------------ #
# Miniaturas de vídeos novos do YouTube                               #
# ------------------------------------------------------------------ #

VIDEO_ID = re.compile(r'^[A-Za-z0-9_-]{6,20}$')
_tried: set[str] = set()


def _static_thumbs() -> set[str]:
    try:
        return set(json.loads((DATA / 'cms-defaults.json').read_text(encoding='utf-8')).get('staticThumbs', []))
    except (OSError, ValueError):
        return set()


def _video_ids(value) -> set[str]:
    ids: set[str] = set()

    def visit(v):
        if isinstance(v, dict):
            vid = v.get('id')
            if isinstance(vid, str) and VIDEO_ID.match(vid) and 'title' in v and ('duration' in v or 'vertical' in v or 'poster' in v or v.get('type') == 'video'):
                ids.add(vid)
            for x in v.values():
                visit(x)
        elif isinstance(v, list):
            for x in v:
                visit(x)

    visit(value)
    return ids


def fetch_missing_thumbs(db: Session, settings: Settings, fetch=None) -> int:
    """Baixa a capa de vídeos novos (i.ytimg.com), limpa e guarda em public/thumbs/<id>.jpg.

    Só lê o banco e baixa da internet: chamar FORA da trava de escrita. Se baixou alguma,
    quem chamou atualiza o arquivo publicado (write_bundle).
    """
    folder = public_dir(settings) / 'thumbs'
    folder.mkdir(exist_ok=True)
    have = {p.stem for p in folder.glob('*.jpg')} | _static_thumbs()
    wanted: set[str] = set()
    for doc in db.scalars(select(Document)):
        for value in (doc.draft, doc.published):
            if value is not None:
                wanted |= _video_ids(value)
    got = 0
    for vid in sorted(wanted - have - _tried):
        _tried.add(vid)
        try:
            raw = (fetch or _download)(f'https://i.ytimg.com/vi/{vid}/hqdefault.jpg')
            with Image.open(io.BytesIO(raw)) as im:
                im.convert('RGB').save(folder / f'{vid}.jpg', 'JPEG', quality=85)
            got += 1
        except Exception:  # noqa: BLE001 (sem internet ou vídeo inexistente: fica a capa padrão)
            continue
    return got


def _download(url: str) -> bytes:
    with urllib.request.urlopen(url, timeout=8) as r:  # noqa: S310 (endereço fixo do YouTube)
        return r.read(2_000_000)
