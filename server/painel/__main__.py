"""Comandos do servidor.

  python -m painel migrate                                  cria/atualiza as tabelas
  python -m painel create-admin --email E --name "Nome"     cria o primeiro administrador
  python -m painel emergency-reset --email E                nova senha provisória para um administrador
  python -m painel verify-activity                          confere se o registro de atividades está íntegro

A senha provisória aparece só no terminal, uma única vez.
"""

import argparse
import sys
from datetime import timedelta
from pathlib import Path

from alembic import command
from alembic.config import Config
from sqlalchemy import select

from . import alerts, audit
from .config import load_settings
from .db import make_engine, make_sessionmaker, utcnow, write
from .models import User
from .passwords import generate_temp_password, hash_password
from .security import revoke_user_sessions


def migrate(database_url: str) -> None:
    root = Path(__file__).resolve().parent.parent
    cfg = Config(str(root / 'alembic.ini'))
    cfg.set_main_option('script_location', str(root / 'migrations'))
    cfg.set_main_option('sqlalchemy.url', database_url)
    command.upgrade(cfg, 'head')


def _print_temp(email: str, temp: str, hours: int) -> None:
    print()
    print('  Senha provisória (aparece só agora):')
    print()
    print(f'    E-mail: {email}')
    print(f'    Senha:  {temp}')
    print()
    print(f'  Vale por {hours} horas e só para o primeiro acesso, quando o painel pede uma senha nova.')
    print()


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(prog='python -m painel')
    sub = parser.add_subparsers(dest='cmd', required=True)
    sub.add_parser('migrate')
    p = sub.add_parser('create-admin')
    p.add_argument('--email', required=True)
    p.add_argument('--name', required=True)
    p = sub.add_parser('emergency-reset')
    p.add_argument('--email', required=True)
    sub.add_parser('verify-activity')
    args = parser.parse_args(argv)

    settings = load_settings()
    if args.cmd == 'migrate':
        migrate(settings.database_url)
        print('Banco atualizado.')
        return 0

    db = make_sessionmaker(make_engine(settings.database_url))()
    expires = utcnow() + timedelta(hours=settings.temp_password_hours)

    if args.cmd == 'create-admin':
        email = args.email.strip().lower()
        if db.scalar(select(User).where(User.email == email)):
            print(f'Já existe um usuário com o e-mail {email}.', file=sys.stderr)
            return 1
        temp = generate_temp_password()
        with write(db):
            user = User(
                email=email, name=' '.join(args.name.split()), role='admin', password_hash=hash_password(temp),
                must_change_password=True, temp_password_expires_at=expires, is_active=True, created_at=utcnow(),
            )
            db.add(user)
            db.flush()
            audit.record(db, 'usuario_criado', actor_email='terminal do servidor', target=email, details={'papel': 'admin'})
        _print_temp(email, temp, settings.temp_password_hours)
        return 0

    if args.cmd == 'emergency-reset':
        email = args.email.strip().lower()
        user = db.scalar(select(User).where(User.email == email))
        if user is None or user.role != 'admin':
            print('Nenhum administrador com esse e-mail.', file=sys.stderr)
            return 1
        temp = generate_temp_password()
        with write(db):
            user.password_hash = hash_password(temp)
            user.must_change_password = True
            user.temp_password_expires_at = expires
            user.is_active = True
            db.add(user)
            revoke_user_sessions(db, user.id)
            audit.record(db, 'recuperacao_de_emergencia', actor_email='terminal do servidor', target=email)
        alerts.send(settings, f'emergencia:{email}', 'Recuperação de emergência usada',
                    f'Foi gerada uma senha provisória nova para {email} pelo terminal do servidor.')
        _print_temp(email, temp, settings.temp_password_hours)
        return 0

    if args.cmd == 'verify-activity':
        ok, broken_at = audit.verify_chain(db)
        print('Registro de atividades íntegro.' if ok else f'ATENÇÃO: o registro foi adulterado a partir da linha {broken_at}.')
        return 0 if ok else 2

    return 1


if __name__ == '__main__':
    sys.exit(main())
