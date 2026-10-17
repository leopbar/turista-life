"""Manutenção diária: backup, limpeza (lixeira, histórico, registro com mais de 1 ano) e conferência
do registro de atividades. Também os backups baixados pelo administrador."""

import logging
import re
import sqlite3
import tempfile
import zipfile
from datetime import timedelta
from pathlib import Path

from sqlalchemy import delete, func, select
from sqlalchemy.orm import Session

from . import alerts, audit, media
from .config import Settings
from .db import utcnow, write
from .models import AuditEntry, LoginAttempt, Setting, Version

log = logging.getLogger('painel.maintenance')

BACKUP_NAME = re.compile(r'^backup-(\d{8})-(\d{4})\.zip$')
KEEP_DAILY = 30
KEEP_MONTHLY = 12
BACKUP_HOUR_UTC = 3


def backups_dir(settings: Settings) -> Path:
    p = settings.data_dir / 'backups'
    p.mkdir(parents=True, exist_ok=True)
    return p


def _db_path(settings: Settings) -> Path:
    return Path(settings.database_url.removeprefix('sqlite:///'))


def create_backup(settings: Settings) -> Path:
    """Um .zip com o banco (cópia consistente, feita com o backup do próprio SQLite) e as fotos publicadas.

    A chave secreta do servidor fica de fora: ela não é necessária para restaurar.
    """
    now = utcnow()
    target = backups_dir(settings) / f'backup-{now:%Y%m%d-%H%M}.zip'
    public = settings.data_dir / 'public'
    with tempfile.TemporaryDirectory() as tmp:
        copy = Path(tmp) / 'painel.db'
        src = sqlite3.connect(_db_path(settings))
        dst = sqlite3.connect(copy)
        try:
            src.backup(dst)
        finally:
            dst.close()
            src.close()
        partial = target.with_suffix('.zip.tmp')
        with zipfile.ZipFile(partial, 'w', zipfile.ZIP_DEFLATED) as z:
            z.write(copy, 'painel.db')
            if public.is_dir():
                for f in sorted(public.rglob('*')):
                    if f.is_file() and not f.name.endswith('.tmp'):
                        z.write(f, f'public/{f.relative_to(public).as_posix()}')
        partial.replace(target)
    prune_backups(settings)
    return target


def prune_backups(settings: Settings) -> None:
    """Fica com os 30 mais recentes e com o primeiro de cada mês dos últimos 12 meses."""
    files = sorted((f for f in backups_dir(settings).iterdir() if BACKUP_NAME.match(f.name)), key=lambda f: f.name)
    keep = set(files[-KEEP_DAILY:])
    first_of_month: dict[str, Path] = {}
    for f in files:
        first_of_month.setdefault(BACKUP_NAME.match(f.name).group(1)[:6], f)
    keep |= set(sorted(first_of_month.values(), key=lambda f: f.name)[-KEEP_MONTHLY:])
    for f in files:
        if f not in keep:
            f.unlink(missing_ok=True)


def list_backups(settings: Settings) -> list[dict]:
    out = []
    for f in sorted(backups_dir(settings).iterdir(), key=lambda f: f.name, reverse=True):
        if BACKUP_NAME.match(f.name):
            out.append({'name': f.name, 'sizeBytes': f.stat().st_size})
    return out


def get_setting(db: Session, key: str) -> str | None:
    row = db.get(Setting, key)
    return row.value if row else None


def set_setting(db: Session, key: str, value: str) -> None:
    row = db.get(Setting, key)
    if row is None:
        db.add(Setting(key=key, value=value))
    else:
        row.value = value


def cleanup(db: Session, settings: Settings) -> dict:
    """Apaga o que passou do prazo combinado."""
    year_ago = utcnow() - timedelta(days=365)
    out = {'fotos': media.purge_trash(db, settings)}
    # Histórico de versões: 1 ano. A versão mais nova de cada conteúdo sempre fica.
    newest = select(func.max(Version.id)).group_by(Version.key)
    out['versoes'] = db.execute(delete(Version).where(Version.created_at < year_ago, Version.id.not_in(newest))).rowcount
    # Registro de atividades: o banco só deixa apagar o que tem mais de 1 ano.
    out['registro'] = db.execute(delete(AuditEntry).where(AuditEntry.created_at < year_ago)).rowcount
    db.execute(delete(LoginAttempt).where(LoginAttempt.created_at < utcnow() - timedelta(days=30)))
    return out


def daily(sessionmaker, settings: Settings) -> None:
    db = sessionmaker()
    try:
        try:
            create_backup(settings)
        except Exception as err:  # noqa: BLE001
            log.exception('Backup diário falhou')
            with write(db):
                audit.record(db, 'backup_falhou', actor_email='servidor', details={'erro': str(err)[:200]})
            alerts.send(settings, 'backup', 'O backup diário falhou', f'O backup automático de hoje não foi criado: {err}')
        with write(db):
            cleanup(db, settings)
            ok, broken_at = audit.verify_chain(db)
            if not ok:
                audit.record(db, 'registro_adulterado', actor_email='servidor', details={'linha': broken_at})
                alerts.send(settings, 'audit', 'O registro de atividades foi alterado por fora',
                            f'A conferência diária encontrou uma alteração a partir da anotação nº {broken_at}.')
            set_setting(db, 'last_daily', utcnow().strftime('%Y-%m-%d'))
        refresh_thumbs(db, settings)
    finally:
        db.close()


def refresh_thumbs(db: Session, settings: Settings) -> None:
    """Capas de vídeos novos: baixa fora da trava; só a atualização do site.json entra nela."""
    from .content import write_bundle

    if media.fetch_missing_thumbs(db, settings):
        with write(db):
            write_bundle(db, settings)


def daily_if_due(sessionmaker, settings: Settings) -> None:
    db = sessionmaker()
    try:
        now = utcnow()
        due = now.hour >= BACKUP_HOUR_UTC and get_setting(db, 'last_daily') != now.strftime('%Y-%m-%d')
        # Capa de vídeo nova não precisa esperar o dia seguinte.
        refresh_thumbs(db, settings)
    finally:
        db.close()
    if due:
        daily(sessionmaker, settings)
