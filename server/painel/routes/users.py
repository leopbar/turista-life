"""Gestão de usuários (só administradores)."""

from datetime import timedelta

from fastapi import APIRouter, Depends, Request, Response
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from .. import audit
from ..config import Settings
from ..db import utcnow, write
from ..deps import admin_session, fail, get_db, get_settings
from ..models import User
from ..passwords import generate_temp_password, hash_password
from ..schemas import TempPasswordOut, UserCreate, UserOut, UserUpdate
from ..security import ActiveSession, client_ip, revoke_user_sessions

router = APIRouter(prefix='/api/users', tags=['users'])

ROLE_LABEL = {'admin': 'Administrador', 'editor': 'Editor'}


def _get(db: Session, user_id: int) -> User:
    user = db.get(User, user_id)
    if user is None:
        fail(404, 'not_found', 'Essa pessoa não foi encontrada.')
    return user


def _active_admins(db: Session) -> int:
    return db.scalar(select(func.count()).where(User.role == 'admin', User.is_active.is_(True)))


def _guard_last_admin(db: Session, user: User) -> None:
    if user.role == 'admin' and user.is_active and _active_admins(db) <= 1:
        fail(409, 'last_admin', 'Essa é a única pessoa administradora. Promova outra pessoa antes.')


def _not_self(active: ActiveSession, user: User, message: str) -> None:
    if user.id == active.user.id:
        fail(409, 'self', message)


def _new_temp_password(settings: Settings) -> tuple[str, str, object]:
    temp = generate_temp_password()
    return temp, hash_password(temp), utcnow() + timedelta(hours=settings.temp_password_hours)


@router.get('', response_model=list[UserOut])
def list_users(_: ActiveSession = Depends(admin_session), db: Session = Depends(get_db)):
    users = db.scalars(select(User).order_by(User.is_active.desc(), User.name)).all()
    return [UserOut.of(u) for u in users]


@router.post('', response_model=TempPasswordOut, status_code=201)
def create_user(body: UserCreate, request: Request, active: ActiveSession = Depends(admin_session), db: Session = Depends(get_db), settings: Settings = Depends(get_settings)):
    email = str(body.email).strip().lower()
    if db.scalar(select(User).where(User.email == email)):
        fail(409, 'email_taken', 'Já existe uma pessoa com esse e-mail.')
    temp, temp_hash, expires = _new_temp_password(settings)
    with write(db):
        user = User(
            email=email,
            name=body.name,
            role=body.role,
            password_hash=temp_hash,
            must_change_password=True,
            temp_password_expires_at=expires,
            is_active=True,
            created_at=utcnow(),
            created_by_id=active.user.id,
        )
        db.add(user)
        db.flush()
        audit.record(db, 'usuario_criado', actor=active.user, target=email, ip=client_ip(request, settings), details={'papel': body.role})
    return TempPasswordOut(user=UserOut.of(user), temp_password=temp, expires_at=expires)


@router.patch('/{user_id}', response_model=UserOut)
def update_user(user_id: int, body: UserUpdate, request: Request, active: ActiveSession = Depends(admin_session), db: Session = Depends(get_db), settings: Settings = Depends(get_settings)):
    user = _get(db, user_id)
    changes: dict = {}
    if body.name is not None and body.name != user.name:
        changes['nome'] = [user.name, body.name]
    if body.role is not None and body.role != user.role:
        if user.role == 'admin':
            _guard_last_admin(db, user)
        changes['papel'] = [user.role, body.role]
    if not changes:
        return UserOut.of(user)
    with write(db):
        if 'nome' in changes:
            user.name = body.name
        if 'papel' in changes:
            user.role = body.role
            # Mudou o poder da pessoa: ela entra de novo para valer o papel novo.
            revoke_user_sessions(db, user.id, keep_id=active.session.id if user.id == active.user.id else None)
        db.add(user)
        audit.record(db, 'usuario_alterado', actor=active.user, target=user.email, ip=client_ip(request, settings), details=changes)
    return UserOut.of(user)


@router.post('/{user_id}/temp-password', response_model=TempPasswordOut)
def reset_temp_password(user_id: int, request: Request, active: ActiveSession = Depends(admin_session), db: Session = Depends(get_db), settings: Settings = Depends(get_settings)):
    user = _get(db, user_id)
    _not_self(active, user, 'Para mudar a sua própria senha, use "Minha senha".')
    if not user.is_active:
        fail(409, 'inactive', 'Reative a pessoa antes de gerar uma senha provisória.')
    temp, temp_hash, expires = _new_temp_password(settings)
    with write(db):
        user.password_hash = temp_hash
        user.must_change_password = True
        user.temp_password_expires_at = expires
        db.add(user)
        revoke_user_sessions(db, user.id)
        audit.record(db, 'senha_provisoria_gerada', actor=active.user, target=user.email, ip=client_ip(request, settings))
    return TempPasswordOut(user=UserOut.of(user), temp_password=temp, expires_at=expires)


@router.post('/{user_id}/deactivate', response_model=UserOut)
def deactivate_user(user_id: int, request: Request, active: ActiveSession = Depends(admin_session), db: Session = Depends(get_db), settings: Settings = Depends(get_settings)):
    user = _get(db, user_id)
    _not_self(active, user, 'Você não pode desativar a sua própria conta.')
    if not user.is_active:
        return UserOut.of(user)
    _guard_last_admin(db, user)
    with write(db):
        user.is_active = False
        db.add(user)
        revoke_user_sessions(db, user.id)
        audit.record(db, 'usuario_desativado', actor=active.user, target=user.email, ip=client_ip(request, settings))
    return UserOut.of(user)


@router.post('/{user_id}/activate', response_model=UserOut)
def activate_user(user_id: int, request: Request, active: ActiveSession = Depends(admin_session), db: Session = Depends(get_db), settings: Settings = Depends(get_settings)):
    user = _get(db, user_id)
    if user.is_active:
        return UserOut.of(user)
    with write(db):
        user.is_active = True
        db.add(user)
        audit.record(db, 'usuario_reativado', actor=active.user, target=user.email, ip=client_ip(request, settings))
    return UserOut.of(user)


@router.delete('/{user_id}', status_code=204)
def delete_user(user_id: int, request: Request, active: ActiveSession = Depends(admin_session), db: Session = Depends(get_db), settings: Settings = Depends(get_settings)):
    user = _get(db, user_id)
    _not_self(active, user, 'Você não pode excluir a sua própria conta.')
    if user.is_active:
        fail(409, 'still_active', 'Desative a pessoa antes de excluir.')
    with write(db):
        email = user.email
        db.delete(user)
        audit.record(db, 'usuario_excluido', actor=active.user, target=email, ip=client_ip(request, settings))
    return Response(status_code=204)
