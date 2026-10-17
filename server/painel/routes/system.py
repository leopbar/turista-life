"""Situação do painel (avisos, lembrete de backup) e os backups (só administradores)."""

from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, Request
from fastapi.responses import FileResponse
from sqlalchemy import select
from sqlalchemy.orm import Session

from .. import alerts, audit, maintenance
from ..config import Settings
from ..db import utcnow, write
from ..deps import admin_session, fail, get_db, get_settings, user_session
from ..models import AuditEntry
from ..security import ActiveSession, client_ip

router = APIRouter(prefix='/api/system', tags=['system'])

REMIND_DAYS = 30


@router.get('/status')
def status(active: ActiveSession = Depends(user_session), db: Session = Depends(get_db), settings: Settings = Depends(get_settings)):
    out: dict = {'role': active.user.role}
    if active.user.role != 'admin':
        return out
    last = maintenance.get_setting(db, 'last_backup_download')
    last_dt = datetime.fromisoformat(last) if last else None
    since = utcnow() - timedelta(days=7)
    warnings = db.scalars(
        select(AuditEntry).where(AuditEntry.action.in_(alerts.ALERT_ACTIONS), AuditEntry.created_at > since).order_by(AuditEntry.id.desc()).limit(10)
    )
    out.update({
        'lastBackupDownloadAt': last_dt,
        'needsBackupDownload': last_dt is None or last_dt < utcnow() - timedelta(days=REMIND_DAYS),
        'emailAlerts': alerts.configured(settings),
        'warnings': [
            {'id': w.id, 'action': w.action, 'createdAt': w.created_at, 'actorEmail': w.actor_email, 'target': w.target, 'details': w.details}
            for w in warnings
        ],
    })
    return out


@router.get('/backups')
def backups(_: ActiveSession = Depends(admin_session), settings: Settings = Depends(get_settings)):
    return maintenance.list_backups(settings)


@router.post('/backups', status_code=201)
def create(request: Request, active: ActiveSession = Depends(admin_session), db: Session = Depends(get_db), settings: Settings = Depends(get_settings)):
    path = maintenance.create_backup(settings)
    with write(db):
        audit.record(db, 'backup_criado', actor=active.user, target=path.name, ip=client_ip(request, settings))
    return {'name': path.name, 'sizeBytes': path.stat().st_size}


@router.get('/backups/{name}')
def download(name: str, request: Request, active: ActiveSession = Depends(admin_session), db: Session = Depends(get_db), settings: Settings = Depends(get_settings)):
    if not maintenance.BACKUP_NAME.match(name):
        fail(404, 'not_found', 'Backup não encontrado.')
    path = maintenance.backups_dir(settings) / name
    if not path.is_file():
        fail(404, 'not_found', 'Backup não encontrado.')
    with write(db):
        maintenance.set_setting(db, 'last_backup_download', utcnow().isoformat())
        audit.record(db, 'backup_baixado', actor=active.user, target=name, ip=client_ip(request, settings))
    return FileResponse(path, media_type='application/zip', filename=name, headers={'Cache-Control': 'no-store'})
