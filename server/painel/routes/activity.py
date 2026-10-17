"""Registro de atividades (só administradores; somente leitura)."""

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..audit import verify_chain
from ..deps import admin_session, get_db
from ..models import AuditEntry
from ..schemas import AuditOut, AuditPage, ChainStatus
from ..security import ActiveSession

router = APIRouter(prefix='/api/activity', tags=['activity'])


@router.get('', response_model=AuditPage)
def list_activity(
    before: int | None = Query(default=None, ge=1),
    limit: int = Query(default=30, ge=1, le=100),
    _: ActiveSession = Depends(admin_session),
    db: Session = Depends(get_db),
):
    stmt = select(AuditEntry).order_by(AuditEntry.id.desc()).limit(limit + 1)
    if before:
        stmt = stmt.where(AuditEntry.id < before)
    rows = db.scalars(stmt).all()
    more = len(rows) > limit
    rows = rows[:limit]
    return AuditPage(
        items=[
            AuditOut(id=r.id, created_at=r.created_at, actor_email=r.actor_email, action=r.action, target=r.target, ip=r.ip, details=r.details)
            for r in rows
        ],
        next_before=rows[-1].id if more else None,
    )


@router.get('/verify', response_model=ChainStatus)
def verify(_: ActiveSession = Depends(admin_session), db: Session = Depends(get_db)):
    ok, broken_at = verify_chain(db)
    return ChainStatus(ok=ok, broken_at=broken_at)
