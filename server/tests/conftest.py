from pathlib import Path

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from painel.__main__ import migrate
from painel.app import create_app
from painel.config import Settings
from painel.db import utcnow, write
from painel.models import User
from painel.passwords import hash_password

ORIGIN = 'http://testserver'
ADMIN_EMAIL = 'leonardo@exemplo.com'
ADMIN_PASSWORD = 'Rota-Segura-Do-Teste-2026'


@pytest.fixture
def settings(tmp_path: Path) -> Settings:
    url = f'sqlite:///{(tmp_path / "painel.db").as_posix()}'
    migrate(url)
    return Settings(
        data_dir=tmp_path,
        database_url=url,
        secret_key='chave-de-teste',
        cookie_secure=False,
        allowed_origins=(ORIGIN,),
        trust_proxy=False,
        debug=False,
        admin_dist=None,
    )


@pytest.fixture
def app(settings: Settings):
    return create_app(settings)


@pytest.fixture
def db(app) -> Session:
    s = app.state.sessionmaker()
    yield s
    s.close()


def add_user(db: Session, email: str, password: str, *, role: str = 'admin', must_change: bool = False, name: str = 'Pessoa Teste') -> User:
    with write(db):
        user = User(
            email=email, name=name, role=role, password_hash=hash_password(password), must_change_password=must_change,
            temp_password_expires_at=None, is_active=True, created_at=utcnow(),
        )
        db.add(user)
    return user


class Painel:
    """Um navegador falso: guarda o cookie e manda Origin + token anti-CSRF como o painel faz."""

    def __init__(self, app):
        self.client = TestClient(app, headers={'Origin': ORIGIN})
        self.csrf: str | None = None

    def _h(self):
        return {'X-CSRF-Token': self.csrf} if self.csrf else {}

    def login(self, email: str, password: str):
        r = self.client.post('/api/auth/login', json={'email': email, 'password': password})
        if r.status_code == 200:
            self.csrf = r.json()['csrf']
        return r

    def get(self, url, **kw):
        return self.client.get(url, **kw)

    def post(self, url, json=None, **kw):
        r = self.client.post(url, json=json, headers=self._h(), **kw)
        if r.status_code == 200 and isinstance(r.json(), dict) and 'csrf' in r.json():
            self.csrf = r.json()['csrf']
        return r

    def patch(self, url, json=None):
        return self.client.patch(url, json=json, headers=self._h())

    def delete(self, url):
        return self.client.delete(url, headers=self._h())


@pytest.fixture
def admin(app, db) -> Painel:
    add_user(db, ADMIN_EMAIL, ADMIN_PASSWORD, name='Leonardo')
    p = Painel(app)
    assert p.login(ADMIN_EMAIL, ADMIN_PASSWORD).status_code == 200
    return p


@pytest.fixture
def new_browser(app):
    return lambda: Painel(app)

