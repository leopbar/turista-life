from alembic import context
from sqlalchemy import create_engine

from painel import models  # noqa: F401  (registra as tabelas no metadata)
from painel.config import load_settings
from painel.db import Base

config = context.config
url = config.get_main_option('sqlalchemy.url') or load_settings().database_url


def run_migrations_offline() -> None:
    context.configure(url=url, target_metadata=Base.metadata, literal_binds=True, render_as_batch=True)
    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    engine = create_engine(url)
    with engine.connect() as connection:
        context.configure(connection=connection, target_metadata=Base.metadata, render_as_batch=True)
        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
