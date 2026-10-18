"""Biblioteca de fotos."""

from fastapi import APIRouter, Depends, Form, Request, UploadFile
from fastapi.responses import FileResponse
from starlette.concurrency import run_in_threadpool
from pydantic import Field
from sqlalchemy import select
from sqlalchemy.orm import Session

from .. import audit, media as svc
from ..config import Settings
from ..content import ContentError, write_bundle
from ..db import write
from ..deps import fail, get_db, get_settings, user_session
from ..models import Media
from ..schemas import Api
from ..security import ActiveSession, client_ip

router = APIRouter(prefix='/api/media', tags=['media'])


class MediaUpdate(Api):
    alt: str | None = Field(default=None, min_length=1, max_length=300)
    focal: list[int] | None = Field(default=None, min_length=2, max_length=2)


def _get(db: Session, media_id: str) -> Media:
    m = db.get(Media, media_id)
    if m is None:
        fail(404, 'not_found', 'Foto não encontrada.')
    return m


@router.get('')
def list_media(trash: bool = False, _: ActiveSession = Depends(user_session), db: Session = Depends(get_db)):
    used = svc.usage(db)
    stmt = select(Media).where(Media.deleted_at.is_not(None) if trash else Media.deleted_at.is_(None)).order_by(Media.created_at.desc())
    return [svc.to_dict(m, used.get(m.id)) for m in db.scalars(stmt)]


@router.post('', status_code=201)
async def upload(
    request: Request,
    file: UploadFile,
    alt: str = Form(max_length=300),
    active: ActiveSession = Depends(user_session),
    db: Session = Depends(get_db),
    settings: Settings = Depends(get_settings),
):
    data = await file.read(svc.MAX_BYTES + 1)
    try:
        # A foto é processada fora da trava de escrita: os outros salvamentos não esperam.
        # (e numa thread à parte: o servidor continua respondendo os outros pedidos).
        m = await run_in_threadpool(svc.prepare_upload, data, settings, original_name=file.filename or 'foto', alt=alt, user=active.user)
    except ContentError as err:
        fail(err.status, err.code, err.message)

    def register():
        with write(db):
            svc.register_upload(db, m, settings, user=active.user, ip=client_ip(request, settings))

    await run_in_threadpool(register)
    return svc.to_dict(m)


@router.patch('/{media_id}')
def update(media_id: str, body: MediaUpdate, request: Request, active: ActiveSession = Depends(user_session), db: Session = Depends(get_db), settings: Settings = Depends(get_settings)):
    m = _get(db, media_id)
    with write(db):
        if body.alt is not None:
            m.alt = ' '.join(body.alt.split())
        if body.focal is not None:
            x, y = body.focal
            if not (0 <= x <= 100 and 0 <= y <= 100):
                fail(422, 'invalid', 'Ponto de foco inválido.')
            m.focal_x, m.focal_y = x, y
        db.add(m)
        audit.record(db, 'foto_alterada', actor=active.user, target=m.original_name, ip=client_ip(request, settings))
        # Descrição e foco valem na hora em todo o site.
        write_bundle(db, settings)
    return svc.to_dict(m, svc.usage(db).get(m.id))


@router.get('/{media_id}/trash-preview')
def trash_preview(media_id: str, _: ActiveSession = Depends(user_session), db: Session = Depends(get_db), settings: Settings = Depends(get_settings)):
    """Miniatura de uma foto da lixeira (fora da pasta pública), só para quem está no painel."""
    m = _get(db, media_id)
    f = svc.trash_dir(settings, m.id) / f'{min(m.widths)}.webp'
    if m.deleted_at is None or not f.is_file():
        fail(404, 'not_found', 'Foto não encontrada.')
    return FileResponse(f, media_type='image/webp', headers={'Cache-Control': 'private, no-store'})


@router.delete('/{media_id}')
def remove(media_id: str, request: Request, active: ActiveSession = Depends(user_session), db: Session = Depends(get_db), settings: Settings = Depends(get_settings)):
    m = _get(db, media_id)
    try:
        with write(db):
            svc.trash(db, m, active.user, client_ip(request, settings), settings)
    except ContentError as err:
        fail(err.status, err.code, err.message, usedIn=err.problems)
    return {'ok': True}


@router.post('/{media_id}/restore')
def restore(media_id: str, request: Request, active: ActiveSession = Depends(user_session), db: Session = Depends(get_db), settings: Settings = Depends(get_settings)):
    m = _get(db, media_id)
    with write(db):
        svc.restore(db, m, active.user, client_ip(request, settings), settings)
    return svc.to_dict(m)
