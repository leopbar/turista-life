import re

import pytest
from sqlalchemy import text
from sqlalchemy.exc import IntegrityError, OperationalError

from painel import __main__ as cli
from painel.audit import verify_chain
from painel.passwords import generate_temp_password, password_problem

from .conftest import Painel


def test_registro_guarda_as_acoes(admin: Painel):
    admin.post('/api/users', json={'email': 'laura@exemplo.com', 'name': 'Laura', 'role': 'editor'})
    actions = [i['action'] for i in admin.get('/api/activity').json()['items']]
    assert actions[:2] == ['usuario_criado', 'login']
    assert admin.get('/api/activity/verify').json() == {'ok': True, 'brokenAt': None}


def test_registro_nao_pode_ser_alterado_nem_apagado(admin: Painel, db):
    with pytest.raises((IntegrityError, OperationalError)):
        db.execute(text("update audit_log set action = 'nada'"))
    db.rollback()
    with pytest.raises((IntegrityError, OperationalError)):
        db.execute(text('delete from audit_log'))
    db.rollback()


def test_adulteracao_por_fora_e_detectada(admin: Painel, db):
    db.execute(text('drop trigger audit_log_no_update'))
    db.execute(text("update audit_log set ip = '1.2.3.4' where id = 1"))
    db.commit()
    assert verify_chain(db) == (False, 1)


def test_regras_da_senha():
    assert password_problem('curta', email='a@b.com')
    assert password_problem('aaaaaaaaaaaaaaa', email='a@b.com')
    assert password_problem('passwordpassword', email='a@b.com')
    assert password_problem('Laura-Viaja-Muito-2026', email='x@b.com', name='Laura Irigoyen')
    assert password_problem('Mochila-Laura-Azul-9', email='laura@b.com', name='Ana') is not None
    assert password_problem('Mochila-Azul-No-Vietna-9', email='x@b.com', name='Ana') is None


def test_formato_da_senha_provisoria():
    temp = generate_temp_password()
    assert re.fullmatch(r'([A-Z][a-z]+-){4}\d{2}', temp)
    assert password_problem(temp, email='x@b.com') is None


def test_comandos_do_servidor(settings, monkeypatch, capsys, app):
    monkeypatch.setenv('PAINEL_DATA_DIR', str(settings.data_dir))
    monkeypatch.setenv('PAINEL_DATABASE_URL', settings.database_url)

    assert cli.main(['create-admin', '--email', 'Leo@Exemplo.com', '--name', 'Leonardo']) == 0
    temp = re.search(r'Senha:\s+(\S+)', capsys.readouterr().out).group(1)
    assert cli.main(['create-admin', '--email', 'leo@exemplo.com', '--name', 'De novo']) == 1

    p = Painel(app)
    assert p.login('leo@exemplo.com', temp).json()['user']['mustChangePassword'] is True

    assert cli.main(['emergency-reset', '--email', 'leo@exemplo.com']) == 0
    new_temp = re.search(r'Senha:\s+(\S+)', capsys.readouterr().out).group(1)
    assert p.get('/api/auth/me').status_code == 401
    assert Painel(app).login('leo@exemplo.com', new_temp).status_code == 200
    assert cli.main(['verify-activity']) == 0
