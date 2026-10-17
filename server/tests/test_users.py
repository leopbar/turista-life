from datetime import timedelta

from sqlalchemy import select, update

from painel.db import utcnow, write
from painel.models import User

from .conftest import Painel, add_user


def _create(admin: Painel, email='laura@exemplo.com', role='editor', name='Laura'):
    r = admin.post('/api/users', json={'email': email, 'name': name, 'role': role})
    assert r.status_code == 201, r.text
    return r.json()


def test_fluxo_completo_senha_provisoria(app, admin: Painel, db):
    created = _create(admin)
    temp = created['tempPassword']
    assert created['user']['mustChangePassword'] is True

    # A senha provisória não aparece em mais lugar nenhum.
    listing = admin.get('/api/users').text
    assert temp not in listing and 'passwordHash' not in listing
    stored = db.scalar(select(User).where(User.email == 'laura@exemplo.com'))
    assert temp not in stored.password_hash and stored.password_hash.startswith('$argon2id$')

    laura = Painel(app)
    r = laura.login('laura@exemplo.com', temp)
    assert r.status_code == 200 and r.json()['user']['mustChangePassword'] is True

    # Até criar a senha, o resto do painel fica fechado.
    assert laura.get('/api/activity').status_code == 403

    weak = laura.post('/api/auth/change-password', json={'currentPassword': temp, 'newPassword': 'curta'})
    assert weak.status_code == 400 and weak.json()['detail']['code'] == 'weak_password'
    leaked = laura.post('/api/auth/change-password', json={'currentPassword': temp, 'newPassword': 'iloveyou1234'})
    assert leaked.status_code == 400 and 'vazamentos' in leaked.json()['detail']['message']

    ok = laura.post('/api/auth/change-password', json={'currentPassword': temp, 'newPassword': 'Mochila-Azul-No-Vietna-9'})
    assert ok.status_code == 200 and ok.json()['user']['mustChangePassword'] is False

    # A provisória morreu; a nova funciona.
    assert Painel(app).login('laura@exemplo.com', temp).status_code == 401
    assert Painel(app).login('laura@exemplo.com', 'Mochila-Azul-No-Vietna-9').status_code == 200


def test_senha_provisoria_expira_em_48h(app, admin: Painel, db):
    created = _create(admin)
    expires = created['expiresAt']
    assert expires
    with write(db):
        db.execute(update(User).where(User.email == 'laura@exemplo.com').values(temp_password_expires_at=utcnow() - timedelta(minutes=1)))
    r = Painel(app).login('laura@exemplo.com', created['tempPassword'])
    assert r.status_code == 401 and r.json()['detail']['code'] == 'temp_password_expired'


def test_email_repetido(admin: Painel):
    _create(admin)
    r = admin.post('/api/users', json={'email': 'LAURA@exemplo.com', 'name': 'Outra', 'role': 'editor'})
    assert r.status_code == 409


def test_editor_nao_ve_usuarios(app, admin: Painel, db):
    add_user(db, 'editor@exemplo.com', 'Senha-De-Editor-Longa-1', role='editor')
    editor = Painel(app)
    assert editor.login('editor@exemplo.com', 'Senha-De-Editor-Longa-1').status_code == 200
    assert editor.get('/api/users').status_code == 403
    assert editor.post('/api/users', json={'email': 'x@exemplo.com', 'name': 'X', 'role': 'admin'}).status_code == 403


def test_nao_rebaixa_o_ultimo_admin(admin: Painel):
    me = admin.get('/api/auth/me').json()['user']
    r = admin.patch(f"/api/users/{me['id']}", json={'role': 'editor'})
    assert r.status_code == 409 and r.json()['detail']['code'] == 'last_admin'


def test_nao_desativa_nem_exclui_a_si_mesmo(admin: Painel):
    me = admin.get('/api/auth/me').json()['user']
    assert admin.post(f"/api/users/{me['id']}/deactivate").status_code == 409
    assert admin.delete(f"/api/users/{me['id']}").status_code == 409


def test_desativar_derruba_sessoes_e_excluir_exige_inativo(app, admin: Painel, db):
    add_user(db, 'editor@exemplo.com', 'Senha-De-Editor-Longa-1', role='editor')
    editor = Painel(app)
    editor.login('editor@exemplo.com', 'Senha-De-Editor-Longa-1')
    uid = db.scalar(select(User.id).where(User.email == 'editor@exemplo.com'))

    assert admin.delete(f'/api/users/{uid}').status_code == 409
    assert admin.post(f'/api/users/{uid}/deactivate').status_code == 200
    assert editor.get('/api/auth/me').status_code == 401
    assert admin.delete(f'/api/users/{uid}').status_code == 204


def test_nova_senha_provisoria_derruba_sessoes(app, admin: Painel, db):
    add_user(db, 'editor@exemplo.com', 'Senha-De-Editor-Longa-1', role='editor')
    editor = Painel(app)
    editor.login('editor@exemplo.com', 'Senha-De-Editor-Longa-1')
    uid = db.scalar(select(User.id).where(User.email == 'editor@exemplo.com'))

    r = admin.post(f'/api/users/{uid}/temp-password')
    assert r.status_code == 200 and r.json()['user']['mustChangePassword'] is True
    assert editor.get('/api/auth/me').status_code == 401
    assert Painel(app).login('editor@exemplo.com', 'Senha-De-Editor-Longa-1').status_code == 401
    assert Painel(app).login('editor@exemplo.com', r.json()['tempPassword']).status_code == 200


def test_mudar_papel_exige_novo_login(app, admin: Painel, db):
    add_user(db, 'editor@exemplo.com', 'Senha-De-Editor-Longa-1', role='editor')
    editor = Painel(app)
    editor.login('editor@exemplo.com', 'Senha-De-Editor-Longa-1')
    uid = db.scalar(select(User.id).where(User.email == 'editor@exemplo.com'))
    assert admin.patch(f'/api/users/{uid}', json={'role': 'admin'}).json()['role'] == 'admin'
    assert editor.get('/api/auth/me').status_code == 401


def test_campos_desconhecidos_sao_recusados(admin: Painel):
    r = admin.post('/api/users', json={'email': 'x@exemplo.com', 'name': 'X', 'role': 'editor', 'passwordHash': 'hack'})
    assert r.status_code == 422
    r = admin.post('/api/users', json={'email': 'x@exemplo.com', 'name': 'X', 'role': 'dono'})
    assert r.status_code == 422
