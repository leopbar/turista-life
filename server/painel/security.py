"""Sessões de login, token anti-CSRF e limite de tentativas."""

import hashlib
import hmac
import math
import secrets
from dataclasses import dataclass
from datetime import timedelta

from fastapi import Request
from sqlalchemy import func, select, update
from sqlalchemy.orm import Session

from .config import Settings
from .db import utcnow
from .models import AuthSession, LoginAttempt, User


def client_ip(request: Request, settings: Settings) -> str:
    """IP de quem fez o pedido. Atrás do nginx do servidor, ele vem no X-Real-IP (definido pelo nginx)."""
    if settings.trust_proxy and (real := request.headers.get('x-real-ip')):
        return real.strip()[:64]
    return (request.client.host if request.client else 'desconhecido')[:64]


def _hash_token(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()


# ------------------------------------------------------------------ #
# Sessões                                                              #
# ------------------------------------------------------------------ #


def create_session(db: Session, settings: Settings, user: User, *, ip: str, user_agent: str) -> str:
    """Cria uma sessão nova e devolve o token (que só o navegador guarda)."""
    token = secrets.token_urlsafe(32)
    now = utcnow()
    db.add(
        AuthSession(
            token_hash=_hash_token(token),
            user_id=user.id,
            created_at=now,
            last_seen_at=now,
            expires_at=now + timedelta(hours=settings.session_max_hours),
            ip=ip,
            user_agent=user_agent[:300],
        )
    )
    return token


@dataclass
class ActiveSession:
    session: AuthSession
    user: User


def load_session(db: Session, settings: Settings, token: str | None) -> ActiveSession | None:
    """Sessão válida: existe, não foi encerrada, não expirou, não ficou parada demais e a conta está ativa."""
    if not token or len(token) > 100:
        return None
    s = db.scalar(select(AuthSession).where(AuthSession.token_hash == _hash_token(token)))
    if s is None or s.revoked_at is not None:
        return None
    now = utcnow()
    if s.expires_at <= now or s.last_seen_at + timedelta(minutes=settings.session_idle_minutes) <= now:
        return None
    user = db.get(User, s.user_id)
    if user is None or not user.is_active:
        return None
    return ActiveSession(s, user)


def touch_session(s: AuthSession) -> bool:
    """Atualiza o "visto por último" no máximo uma vez por minuto. True = precisa salvar."""
    now = utcnow()
    if now - s.last_seen_at >= timedelta(seconds=60):
        s.last_seen_at = now
        return True
    return False


def revoke_user_sessions(db: Session, user_id: int, *, keep_id: int | None = None) -> None:
    stmt = update(AuthSession).where(AuthSession.user_id == user_id, AuthSession.revoked_at.is_(None))
    if keep_id is not None:
        stmt = stmt.where(AuthSession.id != keep_id)
    db.execute(stmt.values(revoked_at=utcnow()))


def csrf_token(settings: Settings, session_token: str) -> str:
    """Token anti-CSRF ligado à sessão: o painel manda de volta no cabeçalho X-CSRF-Token."""
    return hmac.new(settings.secret_key.encode(), _hash_token(session_token).encode(), hashlib.sha256).hexdigest()


def csrf_ok(settings: Settings, session_token: str, sent: str | None) -> bool:
    return bool(sent) and hmac.compare_digest(csrf_token(settings, session_token), sent)


# ------------------------------------------------------------------ #
# Limite de tentativas de login                                       #
# ------------------------------------------------------------------ #


def login_wait_seconds(db: Session, settings: Settings, *, email: str, ip: str) -> int:
    """Quantos segundos faltam para poder tentar de novo (0 = pode tentar agora).

    Por conta: as primeiras falhas são livres; depois, a espera dobra a cada erro (1 min, 2, 4…, até 1 h).
    Por IP: muitas falhas em pouco tempo, de qualquer conta, bloqueiam aquele IP por um tempo.
    """
    now = utcnow()
    if wait := ip_wait_seconds(db, settings, ip=ip):
        return wait

    # Só contam as falhas desde o último login certo dessa conta.
    acc_since = now - timedelta(minutes=settings.account_window_minutes)
    last_ok = db.scalar(select(func.max(LoginAttempt.created_at)).where(LoginAttempt.email == email, LoginAttempt.success.is_(True)))
    if last_ok and last_ok > acc_since:
        acc_since = last_ok
    fails = db.execute(
        select(func.count(), func.max(LoginAttempt.created_at)).where(
            LoginAttempt.email == email, LoginAttempt.success.is_(False), LoginAttempt.created_at > acc_since
        )
    ).one()
    count, last_fail = fails
    if count < settings.account_free_failures:
        return 0
    wait = min(60 * 2 ** (count - settings.account_free_failures), settings.account_max_wait_seconds)
    remaining = (last_fail + timedelta(seconds=wait) - now).total_seconds()
    return max(0, math.ceil(remaining))


def ip_wait_seconds(db: Session, settings: Settings, *, ip: str) -> int:
    """Espera imposta a um IP com falhas demais (de qualquer conta) em pouco tempo."""
    now = utcnow()
    ip_since = now - timedelta(minutes=settings.ip_window_minutes)
    ip_fails = db.scalar(
        select(func.count()).where(LoginAttempt.ip == ip, LoginAttempt.success.is_(False), LoginAttempt.created_at > ip_since)
    )
    if ip_fails < settings.ip_max_failures:
        return 0
    oldest = db.scalar(
        select(func.min(LoginAttempt.created_at)).where(
            LoginAttempt.ip == ip, LoginAttempt.success.is_(False), LoginAttempt.created_at > ip_since
        )
    )
    return max(1, math.ceil((oldest + timedelta(minutes=settings.ip_window_minutes) - now).total_seconds()))


def record_attempt(db: Session, *, email: str, ip: str, success: bool) -> None:
    db.add(LoginAttempt(email=email, ip=ip, success=success, created_at=utcnow()))


def prune_attempts(db: Session) -> None:
    """Tentativas com mais de 30 dias não servem mais para o limite."""
    db.query(LoginAttempt).filter(LoginAttempt.created_at < utcnow() - timedelta(days=30)).delete()
