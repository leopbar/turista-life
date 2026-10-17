from datetime import timedelta

from sqlalchemy import text, update

from painel.db import utcnow, write
from painel.models import AuthSession, LoginAttempt

from .conftest import ADMIN_EMAIL, ADMIN_PASSWORD, Painel, add_user


def test_login_cria_cookie_protegido_e_me_responde(admin: Painel):
    r = admin.get('/api/auth/me')
    assert r.status_code == 200
    assert r.json()['user']['email'] == ADMIN_EMAIL
    assert 'passwordHash' not in r.json()['user']


def test_cookie_httponly_samesite_strict(app, db):
    add_user(db, 'a@exemplo.com', 'Senha-Muito-Boa-2026')
    r = Painel(app).login('a@exemplo.com', 'Senha-Muito-Boa-2026')
    cookie = r.headers['set-cookie'].lower()
    assert 'httponly' in cookie and 'samesite=strict' in cookie and 'path=/' in cookie


def test_email_inexistente_e_senha_errada_dao_a_mesma_resposta(app, db):
    add_user(db, 'a@exemplo.com', 'Senha-Muito-Boa-2026')
    p = Painel(app)
    wrong = p.login('a@exemplo.com', 'errada-errada-errada')
    ghost = p.login('ninguem@exemplo.com', 'errada-errada-errada')
    assert wrong.status_code == ghost.status_code == 401
    assert wrong.json() == ghost.json()


def test_conta_inativa_nao_entra_e_nao_se_denuncia(app, db):
    user = add_user(db, 'a@exemplo.com', 'Senha-Muito-Boa-2026')
    with write(db):
        user.is_active = False
        db.add(user)
    r = Painel(app).login('a@exemplo.com', 'Senha-Muito-Boa-2026')
    assert r.status_code == 401 and r.json()['detail']['code'] == 'invalid_credentials'


def test_espera_progressiva_por_conta(app, db):
    add_user(db, 'a@exemplo.com', 'Senha-Muito-Boa-2026')
    p = Painel(app)
    for _ in range(5):
        assert p.login('a@exemplo.com', 'errada-errada-errada').status_code == 401
    # Depois de 5 erros, nem a senha certa entra até a espera passar.
    r = p.login('a@exemplo.com', 'Senha-Muito-Boa-2026')
    assert r.status_code == 429 and r.json()['detail']['retryAfter'] > 0
    with write(db):
        db.execute(update(LoginAttempt).values(created_at=utcnow() - timedelta(minutes=2)))
    assert p.login('a@exemplo.com', 'Senha-Muito-Boa-2026').status_code == 200


def test_bloqueio_por_ip_com_contas_variadas(app):
    p = Painel(app)
    for i in range(20):
        p.login(f'robo{i}@exemplo.com', 'errada-errada-errada')
    assert p.login('outro@exemplo.com', 'qualquer-coisa-aqui').status_code == 429


def test_sessao_parada_expira(admin: Painel, db):
    with write(db):
        db.execute(update(AuthSession).values(last_seen_at=utcnow() - timedelta(hours=2)))
    assert admin.get('/api/auth/me').status_code == 401


def test_sessao_expira_no_limite_absoluto(admin: Painel, db):
    with write(db):
        db.execute(update(AuthSession).values(expires_at=utcnow() - timedelta(seconds=1)))
    assert admin.get('/api/auth/me').status_code == 401


def test_logout_exige_token_csrf(admin: Painel):
    r = admin.client.post('/api/auth/logout')
    assert r.status_code == 403 and r.json()['detail']['code'] == 'csrf'
    assert admin.post('/api/auth/logout').status_code == 204
    assert admin.get('/api/auth/me').status_code == 401


def test_origem_estranha_e_recusada(app, db):
    add_user(db, 'a@exemplo.com', 'Senha-Muito-Boa-2026')
    p = Painel(app)
    r = p.client.post('/api/auth/login', json={'email': 'a@exemplo.com', 'password': 'Senha-Muito-Boa-2026'}, headers={'Origin': 'https://site-falso.com'})
    assert r.status_code == 403
    # Sem Origin e sem Sec-Fetch-Site: same-origin, também não passa.
    from fastapi.testclient import TestClient

    bare = TestClient(app)
    assert bare.post('/api/auth/login', json={'email': 'a@exemplo.com', 'password': 'x'}).status_code == 403


def test_formulario_que_nao_e_json_e_recusado(app):
    r = Painel(app).client.post('/api/auth/login', content=b'email=a&password=b', headers={'Content-Type': 'application/x-www-form-urlencoded'})
    assert r.status_code == 415


def test_trocar_senha_derruba_outras_sessoes(app, db, admin: Painel):
    other = Painel(app)
    assert other.login(ADMIN_EMAIL, ADMIN_PASSWORD).status_code == 200
    r = admin.post('/api/auth/change-password', json={'currentPassword': ADMIN_PASSWORD, 'newPassword': 'Outra-Rota-Bem-Longa-77'})
    assert r.status_code == 200
    assert other.get('/api/auth/me').status_code == 401
    assert admin.get('/api/auth/me').status_code == 200  # a sessão nova veio no cookie


def test_senha_atual_errada_conta_como_tentativa(admin: Painel, db):
    r = admin.post('/api/auth/change-password', json={'currentPassword': 'chute-chute-chute', 'newPassword': 'Outra-Rota-Bem-Longa-77'})
    assert r.status_code == 400 and r.json()['detail']['code'] == 'wrong_current_password'
    assert db.execute(text('select count(*) from login_attempts where success = 0')).scalar() == 1


def test_cabecalhos_de_seguranca(app):
    r = Painel(app).get('/api/health')
    h = r.headers
    assert "frame-ancestors 'none'" in h['content-security-policy']
    assert h['x-frame-options'] == 'DENY'
    assert h['x-content-type-options'] == 'nosniff'
    assert h['x-robots-tag'] == 'noindex, nofollow'
    assert h['cache-control'] == 'no-store'


def test_documentacao_da_api_fica_escondida_em_producao(app):
    assert Painel(app).get('/api/openapi.json').status_code == 404


def test_painel_compilado_nao_entrega_arquivos_de_fora(settings, tmp_path):
    from dataclasses import replace

    from painel.app import create_app

    dist = tmp_path / 'dist'
    (dist / 'assets').mkdir(parents=True)
    (dist / 'index.html').write_text('<!doctype html>painel')
    (dist / 'assets' / 'app.js').write_text('console.log(1)')
    (tmp_path / 'segredo.txt').write_text('NAO-PODE-SAIR')
    client = Painel(create_app(replace(settings, admin_dist=dist))).client

    assert client.get('/assets/app.js').text == 'console.log(1)'
    assert 'immutable' in client.get('/assets/app.js').headers['cache-control']
    assert client.get('/equipe').text == '<!doctype html>painel'
    for path in ('/../segredo.txt', '/..%2fsegredo.txt', '/assets/..%2f..%2fsegredo.txt'):
        assert 'NAO-PODE-SAIR' not in client.get(path).text
    assert client.get('/api/nada').status_code == 404
