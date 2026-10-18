"""Entrar, sair, quem sou eu e troca de senha."""

import secrets
from datetime import timedelta

from fastapi import APIRouter, Depends, Request, Response
from sqlalchemy import select
from sqlalchemy.orm import Session

from .. import alerts, audit
from ..config import Settings
from ..db import utcnow, write
from ..deps import any_session, fail, get_db, get_settings, session_token
from ..models import AuditEntry, User
from ..passwords import DUMMY_HASH, hash_password, needs_rehash, password_problem, temp_password_expired, verify_password
from ..schemas import ChangePasswordIn, CheckPasswordIn, LoginIn, Me, UserOut
from ..security import (
    ActiveSession,
    client_ip,
    create_session,
    csrf_token,
    ip_wait_seconds,
    login_wait_seconds,
    prune_attempts,
    record_attempt,
    revoke_user_sessions,
)

router = APIRouter(prefix='/api/auth', tags=['auth'])

GENERIC_LOGIN_ERROR = 'E-mail ou senha incorretos.'


def _set_cookie(response: Response, settings: Settings, token: str) -> None:
    response.set_cookie(
        settings.cookie_name,
        token,
        max_age=settings.session_max_hours * 3600,
        path='/',
        secure=settings.cookie_secure,
        httponly=True,
        samesite='strict',
    )


def _alert_if_blocked(db: Session, settings: Settings, *, email: str, ip: str) -> None:
    """Primeira vez que uma conta ou um IP entra na espera: anota e avisa (uma vez por hora)."""
    if not login_wait_seconds(db, settings, email=email, ip=ip):
        return
    hour_ago = utcnow() - timedelta(hours=1)
    ip_blocked = ip_wait_seconds(db, settings, ip=ip) > 0
    action, target = ('ip_bloqueado', ip) if ip_blocked else ('conta_bloqueada', email[:254])
    seen = db.scalar(select(AuditEntry.id).where(AuditEntry.action == action, AuditEntry.target == target, AuditEntry.created_at > hour_ago).limit(1))
    if seen:
        return
    audit.record(db, action, actor_email=email[:254], target=target, ip=ip)
    if ip_blocked:
        alerts.send(settings, f'ip:{ip}', 'Muitas tentativas de login de um mesmo endereço',
                    f'O endereço {ip} errou a senha muitas vezes (em contas diferentes) e foi bloqueado por um tempo.')
    else:
        alerts.send(settings, f'conta:{email}', f'Muitas senhas erradas na conta {email}',
                    f'Alguém errou a senha da conta {email} várias vezes seguidas (último endereço: {ip}). '
                    'A conta entrou em espera automática. Se não foi você, avise a equipe.')


def _too_many(wait: int) -> None:
    minutes = max(1, round(wait / 60))
    fail(
        429,
        'too_many_attempts',
        f'Muitas tentativas. Aguarde {minutes} minuto{"s" if minutes > 1 else ""} e tente de novo.',
        retryAfter=wait,
    )


@router.post('/login', response_model=Me)
def login(body: LoginIn, request: Request, response: Response, db: Session = Depends(get_db), settings: Settings = Depends(get_settings)):
    email = body.email.strip().lower()
    ip = client_ip(request, settings)

    if wait := login_wait_seconds(db, settings, email=email, ip=ip):
        _too_many(wait)

    user = db.scalar(select(User).where(User.email == email))
    # Mesmo com e-mail inexistente a senha é conferida (contra um hash qualquer): a resposta
    # leva o mesmo tempo e não revela quais contas existem.
    ok = verify_password(user.password_hash if user else DUMMY_HASH, body.password)
    ok = ok and user is not None and user.is_active
    expired = ok and user.must_change_password and temp_password_expired(user.temp_password_expires_at, utcnow())

    if not ok or expired:
        with write(db):
            record_attempt(db, email=email, ip=ip, success=False)
            audit.record(
                db, 'login_falhou', actor=user if ok else None, actor_email=email[:254], ip=ip,
                details={'motivo': 'senha_provisoria_expirada' if expired else 'credenciais'},
            )
            if secrets.randbelow(50) == 0:
                prune_attempts(db)
            _alert_if_blocked(db, settings, email=email, ip=ip)
        if expired:
            fail(401, 'temp_password_expired', 'Sua senha provisória expirou. Peça uma nova ao administrador.')
        fail(401, 'invalid_credentials', GENERIC_LOGIN_ERROR)

    with write(db):
        if needs_rehash(user.password_hash):
            user.password_hash = hash_password(body.password)
        record_attempt(db, email=email, ip=ip, success=True)
        user.last_login_at = utcnow()
        token = create_session(db, settings, user, ip=ip, user_agent=request.headers.get('user-agent', ''))
        audit.record(db, 'login', actor=user, ip=ip)

    _set_cookie(response, settings, token)
    return Me(user=UserOut.of(user), csrf=csrf_token(settings, token))


@router.get('/me', response_model=Me)
def me(active: ActiveSession = Depends(any_session), token: str | None = Depends(session_token), settings: Settings = Depends(get_settings)):
    return Me(user=UserOut.of(active.user), csrf=csrf_token(settings, token))


@router.post('/logout', status_code=204)
def logout(request: Request, response: Response, active: ActiveSession = Depends(any_session), db: Session = Depends(get_db), settings: Settings = Depends(get_settings)):
    with write(db):
        active.session.revoked_at = utcnow()
        db.add(active.session)
        audit.record(db, 'logout', actor=active.user, ip=client_ip(request, settings))
    response.delete_cookie(settings.cookie_name, path='/', secure=settings.cookie_secure, httponly=True, samesite='strict')


@router.post('/check-password')
def check_password(body: CheckPasswordIn, active: ActiveSession = Depends(any_session)):
    """O medidor de força pergunta se a senha nova passaria (ex.: se já vazou), para não mostrar "Ok" e depois recusar."""
    return {'problem': password_problem(body.password, email=active.user.email, name=active.user.name)}


@router.post('/change-password', response_model=Me)
def change_password(
    body: ChangePasswordIn,
    request: Request,
    response: Response,
    active: ActiveSession = Depends(any_session),
    db: Session = Depends(get_db),
    settings: Settings = Depends(get_settings),
):
    user = active.user
    ip = client_ip(request, settings)

    # A senha atual também passa pelo limite de tentativas: uma sessão aberta não serve para chutar senhas.
    if wait := login_wait_seconds(db, settings, email=user.email, ip=ip):
        _too_many(wait)
    if not verify_password(user.password_hash, body.current_password):
        with write(db):
            record_attempt(db, email=user.email, ip=ip, success=False)
            audit.record(db, 'troca_senha_falhou', actor=user, ip=ip, details={'motivo': 'senha_atual'})
        fail(400, 'wrong_current_password', 'A senha atual não confere.' if not user.must_change_password else 'A senha provisória não confere.')

    if problem := password_problem(body.new_password, email=user.email, name=user.name):
        fail(400, 'weak_password', problem)
    if body.new_password == body.current_password:
        fail(400, 'same_password', 'A senha nova precisa ser diferente da atual.')

    new_hash = hash_password(body.new_password)
    with write(db):
        first_access = user.must_change_password
        user.password_hash = new_hash
        user.must_change_password = False
        user.temp_password_expires_at = None
        user.password_changed_at = utcnow()
        db.add(user)
        # Trocar a senha encerra todas as sessões (inclusive esta) e abre uma nova, limpa.
        revoke_user_sessions(db, user.id)
        token = create_session(db, settings, user, ip=ip, user_agent=request.headers.get('user-agent', ''))
        audit.record(db, 'senha_criada' if first_access else 'senha_alterada', actor=user, ip=ip)

    _set_cookie(response, settings, token)
    return Me(user=UserOut.of(user), csrf=csrf_token(settings, token))
