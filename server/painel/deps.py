"""Dependências das rotas: banco, configuração, quem está logado e as checagens de segurança."""

from collections.abc import Iterator
from typing import NoReturn

from fastapi import Depends, HTTPException, Request
from sqlalchemy.orm import Session

from . import db as dbmod
from .config import Settings
from .security import ActiveSession, csrf_ok, load_session, touch_session


def fail(status: int, code: str, message: str, **extra) -> NoReturn:
    """Erro com código (para o painel decidir o que fazer) e mensagem pronta para mostrar."""
    raise HTTPException(status_code=status, detail={'code': code, 'message': message, **extra})


def get_settings(request: Request) -> Settings:
    return request.app.state.settings


def get_db(request: Request) -> Iterator[Session]:
    db = request.app.state.sessionmaker()
    try:
        yield db
    finally:
        db.close()


def session_token(request: Request, settings: Settings = Depends(get_settings)) -> str | None:
    return request.cookies.get(settings.cookie_name)


def any_session(
    request: Request,
    db: Session = Depends(get_db),
    settings: Settings = Depends(get_settings),
    token: str | None = Depends(session_token),
) -> ActiveSession:
    """Qualquer sessão válida, inclusive a de quem ainda precisa trocar a senha provisória.

    Em pedidos que alteram dados, exige também o token anti-CSRF.
    """
    active = load_session(db, settings, token)
    if active is None:
        fail(401, 'not_authenticated', 'Sua sessão terminou. Entre de novo.')
    if request.method not in {'GET', 'HEAD', 'OPTIONS'} and not csrf_ok(settings, token, request.headers.get('x-csrf-token')):
        fail(403, 'csrf', 'Não foi possível confirmar este pedido. Recarregue a página e tente de novo.')
    if touch_session(active.session):
        with dbmod.write(db):
            pass
    return active


def user_session(active: ActiveSession = Depends(any_session)) -> ActiveSession:
    """Sessão de quem já trocou a senha provisória (o resto do painel fica fechado até lá)."""
    if active.user.must_change_password:
        fail(403, 'must_change_password', 'Antes de continuar, crie a sua senha.')
    return active


def admin_session(active: ActiveSession = Depends(user_session)) -> ActiveSession:
    if active.user.role != 'admin':
        fail(403, 'forbidden', 'Só administradores podem fazer isso.')
    return active
