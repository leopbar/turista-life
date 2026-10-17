"""Banco SQLite: conexão, sessões do SQLAlchemy e a trava de escrita."""

import threading
from collections.abc import Iterator
from contextlib import contextmanager
from datetime import UTC, datetime

from sqlalchemy import create_engine, event
from sqlalchemy.engine import Engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker


class Base(DeclarativeBase):
    pass


def utcnow() -> datetime:
    """Hora UTC sem fuso (o SQLite guarda texto; tudo no banco é UTC)."""
    return datetime.now(UTC).replace(tzinfo=None)


def make_engine(url: str) -> Engine:
    engine = create_engine(url, connect_args={'check_same_thread': False, 'timeout': 10})

    @event.listens_for(engine, 'connect')
    def _pragmas(conn, _record):
        cur = conn.cursor()
        cur.execute('PRAGMA journal_mode=WAL')
        cur.execute('PRAGMA foreign_keys=ON')
        cur.execute('PRAGMA busy_timeout=10000')
        cur.execute('PRAGMA synchronous=NORMAL')
        cur.close()

    return engine


def make_sessionmaker(engine: Engine) -> sessionmaker[Session]:
    return sessionmaker(engine, expire_on_commit=False)


# Uma escrita por vez: mantém a corrente de hashes do registro de atividades em ordem.
# O servidor roda com um único processo (uvicorn --workers 1), então uma trava de thread basta.
_write_lock = threading.Lock()


@contextmanager
def write(db: Session) -> Iterator[Session]:
    """Bloco de escrita: serializa, confirma no fim e desfaz tudo se algo falhar.

    Trabalho pesado (como conferir senha com Argon2) deve acontecer ANTES de entrar aqui.
    """
    with _write_lock:
        try:
            yield db
            db.commit()
        except BaseException:
            db.rollback()
            raise
