"""Registro de atividades com corrente de hashes: cada linha carimba a anterior.

Se alguém mexer no banco por fora, a corrente quebra e `verify_chain` aponta onde.
"""

import hashlib
import json

from sqlalchemy import select
from sqlalchemy.orm import Session

from .db import utcnow
from .models import AuditEntry, User

GENESIS = '0' * 64


def _digest(prev_hash: str, entry: AuditEntry) -> str:
    payload = json.dumps(
        {
            'prev': prev_hash,
            'at': entry.created_at.isoformat(),
            'actor_id': entry.actor_id,
            'actor_email': entry.actor_email,
            'action': entry.action,
            'target': entry.target,
            'ip': entry.ip,
            'details': entry.details,
        },
        sort_keys=True,
        ensure_ascii=False,
        separators=(',', ':'),
    )
    return hashlib.sha256(payload.encode()).hexdigest()


def record(
    db: Session,
    action: str,
    *,
    actor: User | None = None,
    actor_email: str | None = None,
    target: str | None = None,
    ip: str | None = None,
    details: dict | None = None,
) -> AuditEntry:
    """Acrescenta uma linha. Chamar dentro de `db.write(...)`, que mantém a ordem da corrente."""
    last = db.scalar(select(AuditEntry).order_by(AuditEntry.id.desc()).limit(1))
    prev_hash = last.hash if last else GENESIS
    entry = AuditEntry(
        created_at=utcnow(),
        actor_id=actor.id if actor else None,
        actor_email=actor.email if actor else actor_email,
        action=action,
        target=target,
        ip=ip,
        details=details or {},
        prev_hash=prev_hash,
    )
    entry.hash = _digest(prev_hash, entry)
    db.add(entry)
    db.flush()
    return entry


def verify_chain(db: Session) -> tuple[bool, int | None]:
    """(True, None) se a corrente está íntegra; senão (False, id da primeira linha adulterada).

    A primeira linha que sobrou pode apontar para uma linha já removida pela limpeza de 1 ano.
    """
    prev: str | None = None
    for entry in db.scalars(select(AuditEntry).order_by(AuditEntry.id)):
        if prev is not None and entry.prev_hash != prev:
            return False, entry.id
        if _digest(entry.prev_hash, entry) != entry.hash:
            return False, entry.id
        prev = entry.hash
    return True, None
