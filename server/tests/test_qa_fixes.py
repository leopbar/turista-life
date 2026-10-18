"""Correções do relatório de QA (QA/RELATORIO-DE-TESTES-PAINEL.md). Cada teste cita o defeito (DEF-xx)."""

import io
import json
from datetime import UTC, datetime, timedelta

from fastapi.testclient import TestClient
from PIL import Image
from sqlalchemy import select, update

from painel import __main__ as cli, maintenance
from painel.db import utcnow, write
from painel.models import AuditEntry, Version

from .conftest import Painel, add_user

KEY = 'inicio.hero'
GOOD_PW = 'Caravela-Azul-No-Porto-77'


def site_json(settings) -> dict:
    return json.loads((settings.data_dir / 'public' / 'site.json').read_text(encoding='utf-8'))


def put(p: Painel, key, draft, base=None):
    body = {'draft': draft} if base is None else {'draft': draft, 'base': base}
    return p.client.put(f'/api/content/{key}', json=body, headers={'X-CSRF-Token': p.csrf})


def draft(p: Painel, key=KEY) -> dict:
    return p.get(f'/api/content/{key}').json()['draft']


def upload(p: Painel, data: bytes, name='foto.jpg', ctype='image/jpeg'):
    return p.client.post('/api/media', files={'file': (name, data, ctype)}, data={'alt': 'Foto de teste'}, headers={'X-CSRF-Token': p.csrf})


def jpeg(w=800, h=600) -> bytes:
    buf = io.BytesIO()
    Image.new('RGB', (w, h), (200, 120, 40)).save(buf, 'JPEG')
    return buf.getvalue()


# ------------------------------------------------------------------ #
# Voltar no tempo                                                     #
# ------------------------------------------------------------------ #


def test_DEF01_voltar_para_antes_da_instalacao_e_recusado(admin: Painel, settings):
    before = len(site_json(settings)['collections']['article'])
    r = admin.post('/api/content/restore-site', json={'at': '2020-01-01T00:00:00Z'})
    assert r.status_code == 400 and r.json()['detail']['code'] == 'too_old'
    assert len(site_json(settings)['collections']['article']) == before


def test_DEF01_limpeza_de_um_ano_guarda_a_versao_que_estava_no_ar(admin: Painel, db, settings):
    key = 'article:vale-a-pena-ir-para-bali'
    put(admin, key, {**draft(admin, key), 'title': 'Título novo'})
    admin.post(f'/api/content/{key}/publish')
    with write(db):
        vs = db.scalars(select(Version).where(Version.key == key).order_by(Version.id)).all()
        vs[0].created_at = utcnow() - timedelta(days=420)
        vs[1].created_at = utcnow() - timedelta(days=60)
        db.execute(update(Version).where(Version.key != key).values(created_at=utcnow() - timedelta(days=420)))
    with write(db):
        maintenance.cleanup(db, settings)
    at = (datetime.now(UTC) - timedelta(days=180)).isoformat()
    assert admin.post('/api/content/restore-site', json={'at': at}).status_code == 200
    articles = {a['slug']: a for a in site_json(settings)['collections']['article']}
    # Continua no ar, com o texto que tinha seis meses atrás.
    assert articles['vale-a-pena-ir-para-bali']['title'] != 'Título novo'


def test_DEF02_voltar_versao_mantem_o_rascunho_em_andamento(admin: Painel, settings):
    d = draft(admin)
    put(admin, KEY, {**d, 'title': 'V2'})
    admin.post(f'/api/content/{KEY}/publish')
    put(admin, KEY, {**d, 'title': 'Rascunho importante'})
    original = [v for v in admin.get(f'/api/content/{KEY}/versions').json() if v['action'] == 'original'][0]
    assert admin.post(f'/api/content/{KEY}/versions/{original["id"]}/restore').status_code == 200
    assert site_json(settings)['docs'][KEY]['title'] == d['title']  # a versão antiga foi ao ar
    full = admin.get(f'/api/content/{KEY}').json()
    assert full['draft']['title'] == 'Rascunho importante' and full['status'] == 'alterado'


def test_DEF02_voltar_o_site_mantem_rascunhos(admin: Painel, db):
    with write(db):
        db.execute(update(Version).values(created_at=utcnow() - timedelta(minutes=10)))
    d = draft(admin)
    put(admin, KEY, {**d, 'title': 'Publicado 1'})
    admin.post(f'/api/content/{KEY}/publish')
    h = admin.get('/api/content/history').json()[0]
    put(admin, KEY, {**d, 'title': 'Rascunho em andamento'})
    at = (datetime.fromisoformat(h['createdAt']).replace(tzinfo=UTC) - timedelta(seconds=1)).isoformat()
    assert admin.post('/api/content/restore-site', json={'at': at}).status_code == 200
    assert draft(admin)['title'] == 'Rascunho em andamento'


def test_voltar_para_a_versao_que_ja_esta_no_ar(admin: Painel):
    v = admin.get(f'/api/content/{KEY}/versions').json()[0]
    assert admin.post(f'/api/content/{KEY}/versions/{v["id"]}/restore').status_code == 409


# ------------------------------------------------------------------ #
# Validação                                                           #
# ------------------------------------------------------------------ #


def test_DEF04_obrigatorio_em_branco_salva_rascunho_mas_nao_publica(admin: Painel, settings):
    d = draft(admin)
    assert put(admin, KEY, {**d, 'title': '   ', 'image': ''}).status_code == 200  # rascunho pode, enquanto escreve
    r = admin.post(f'/api/content/{KEY}/publish')
    assert r.status_code == 422
    paths = {p['path'] for p in r.json()['detail']['problems']}
    assert {'title', 'image'} <= paths
    assert site_json(settings)['docs'][KEY]['title'] == d['title']


def test_DEF05_link_com_tabulacao_ou_quebra_de_linha(admin: Painel):
    d = draft(admin)
    for href in ('/\t/evil.com', '/\n/evil.com', '/\r/evil.com', 'https://a.com/\tx'):
        assert put(admin, KEY, {**d, 'cta': {**d['cta'], 'href': href}}).status_code == 422, href
    assert put(admin, KEY, {**d, 'cta': {**d['cta'], 'href': '/produtos'}}).status_code == 200


def test_DEF15_foto_que_nao_existe_e_recusada(admin: Painel):
    d = draft(admin)
    assert put(admin, KEY, {**d, 'image': 'images/nao-existe.jpg'}).status_code == 422
    assert put(admin, KEY, {**d, 'image': 'cms/media/ffffffffffffffff/1600.webp'}).status_code == 422
    m = upload(admin, jpeg()).json()
    assert put(admin, KEY, {**d, 'image': m['url']}).status_code == 200
    assert put(admin, KEY, {**d, 'image': f'cms/media/{m["id"]}/2400.webp'}).status_code == 422  # tamanho que não existe
    assert put(admin, KEY, {**d, 'image': 'images/hero.jpg'}).status_code == 200


def test_DEF16_publicar_sem_mudanca_nao_cria_versao(admin: Painel):
    n0 = len(admin.get(f'/api/content/{KEY}/versions').json())
    assert admin.post(f'/api/content/{KEY}/publish').json() == {'published': []}
    assert len(admin.get(f'/api/content/{KEY}/versions').json()) == n0


# ------------------------------------------------------------------ #
# Edição simultânea                                                   #
# ------------------------------------------------------------------ #


def test_DEF06_duas_pessoas_em_campos_diferentes_nao_se_apagam(app, db, admin: Painel):
    add_user(db, 'editora@exemplo.com', GOOD_PW, role='editor', name='Editora')
    ed = Painel(app)
    ed.login('editora@exemplo.com', GOOD_PW)
    base = draft(admin)
    assert put(admin, KEY, {**base, 'title': 'Texto do admin'}, base).status_code == 200
    r = put(ed, KEY, {**base, 'subtitle': 'Subtítulo da editora'}, base)  # a editora abriu antes
    assert r.status_code == 200
    final = draft(admin)
    assert final['title'] == 'Texto do admin' and final['subtitle'] == 'Subtítulo da editora'
    assert r.json()['draft'] == final  # a editora recebe a versão junta


def test_DEF06_mesmo_campo_e_conflito(app, db, admin: Painel):
    add_user(db, 'editora@exemplo.com', GOOD_PW, role='editor', name='Editora')
    ed = Painel(app)
    ed.login('editora@exemplo.com', GOOD_PW)
    base = draft(admin)
    put(admin, KEY, {**base, 'title': 'Do admin'}, base)
    r = put(ed, KEY, {**base, 'title': 'Da editora'}, base)
    assert r.status_code == 409 and r.json()['detail']['code'] == 'conflict'
    assert draft(admin)['title'] == 'Do admin'


# ------------------------------------------------------------------ #
# Fotos                                                               #
# ------------------------------------------------------------------ #


def test_DEF07_versao_com_foto_na_lixeira_nao_volta(admin: Painel):
    m = upload(admin, jpeg()).json()
    d = draft(admin)
    put(admin, KEY, {**d, 'image': m['url']})
    admin.post(f'/api/content/{KEY}/publish')
    put(admin, KEY, d)
    admin.post(f'/api/content/{KEY}/publish')
    assert admin.delete(f'/api/media/{m["id"]}').status_code == 200
    v = [v for v in admin.get(f'/api/content/{KEY}/versions').json() if v['data'] and v['data'].get('image') == m['url']][0]
    r = admin.post(f'/api/content/{KEY}/versions/{v["id"]}/restore')
    assert r.status_code == 422 and 'lixeira' in r.json()['detail']['problems'][0]['message']
    # Recuperada a foto, a versão volta.
    admin.post(f'/api/media/{m["id"]}/restore')
    assert admin.post(f'/api/content/{KEY}/versions/{v["id"]}/restore').status_code == 200


def test_DEF13_imagem_acima_de_80_megapixels(admin: Painel):
    buf = io.BytesIO()
    Image.new('L', (9500, 9500), 0).save(buf, 'PNG', optimize=True)
    r = upload(admin, buf.getvalue(), name='grande.png', ctype='image/png')
    assert r.status_code == 415 and r.json()['detail']['code'] == 'too_many_pixels'


def test_DEF14_foto_na_lixeira_sai_do_ar_e_volta_ao_recuperar(admin: Painel, app):
    m = upload(admin, jpeg()).json()
    public = TestClient(app)
    url = f'/site/cms/media/{m["id"]}/{m["widths"][0]}.webp'
    assert public.get(url).status_code == 200
    admin.delete(f'/api/media/{m["id"]}')
    assert public.get(url).status_code == 404
    # O painel ainda mostra a miniatura na lixeira (só com login).
    assert admin.get(f'/api/media/{m["id"]}/trash-preview').status_code == 200
    assert public.get(f'/api/media/{m["id"]}/trash-preview').status_code == 401
    admin.post(f'/api/media/{m["id"]}/restore')
    assert public.get(url).status_code == 200
    assert admin.get(f'/api/media/{m["id"]}/trash-preview').status_code == 404


# ------------------------------------------------------------------ #
# Backups                                                             #
# ------------------------------------------------------------------ #


def test_DEF09_dois_backups_seguidos_tem_nomes_diferentes(admin: Painel):
    a = admin.post('/api/system/backups').json()['name']
    b = admin.post('/api/system/backups').json()['name']
    assert a != b
    names = [x['name'] for x in admin.get('/api/system/backups').json()]
    assert a in names and b in names


def test_DEF08_copias_manuais_nao_apagam_os_diarios(settings):
    folder = maintenance.backups_dir(settings)
    today = utcnow()
    for i in range(1, 31):
        (folder / f'backup-{today - timedelta(days=i):%Y%m%d}-0300.zip').write_bytes(b'x')
    for i in range(30):
        (folder / f'backup-{today:%Y%m%d}-1200{i:02d}.zip').write_bytes(b'x')
    maintenance.prune_backups(settings)
    old = [f for f in folder.iterdir() if not f.name.startswith(f'backup-{today:%Y%m%d}')]
    assert len(old) >= 29
    assert len(list(folder.iterdir())) <= 30 + 3


def test_DEF27_lista_de_backups_traz_a_hora_em_utc(admin: Painel):
    name = admin.post('/api/system/backups').json()['name']
    item = next(x for x in admin.get('/api/system/backups').json() if x['name'] == name)
    created = datetime.fromisoformat(item['createdAt']).replace(tzinfo=UTC)
    assert abs((datetime.now(UTC) - created).total_seconds()) < 60


# ------------------------------------------------------------------ #
# Equipe e registro                                                   #
# ------------------------------------------------------------------ #


def test_DEF19_nao_se_rebaixa_se_o_outro_admin_nunca_entrou(admin: Painel, app):
    b = admin.post('/api/users', json={'email': 'b@exemplo.com', 'name': 'B', 'role': 'admin'}).json()
    me = admin.get('/api/auth/me').json()['user']
    r = admin.patch(f'/api/users/{me["id"]}', json={'role': 'editor'})
    assert r.status_code == 409 and 'primeiro acesso' in r.json()['detail']['message']
    # Depois que a outra pessoa cria a senha, pode.
    pb = Painel(app)
    pb.login('b@exemplo.com', b['tempPassword'])
    pb.post('/api/auth/change-password', json={'currentPassword': b['tempPassword'], 'newPassword': GOOD_PW})
    assert admin.patch(f'/api/users/{me["id"]}', json={'role': 'editor'}).status_code == 200


def test_DEF24_promover_gera_uma_linha_so(admin: Painel, db):
    u = admin.post('/api/users', json={'email': 'c@exemplo.com', 'name': 'C', 'role': 'editor'}).json()['user']
    admin.patch(f'/api/users/{u["id"]}', json={'role': 'admin'})
    actions = [i['action'] for i in admin.get('/api/activity').json()['items']]
    assert actions[0] == 'admin_promovido' and 'usuario_alterado' not in actions
    admin.post('/api/users', json={'email': 'd@exemplo.com', 'name': 'D', 'role': 'admin'})
    actions = [i['action'] for i in admin.get('/api/activity').json()['items']]
    assert actions[0] == 'admin_criado' and actions[1] != 'usuario_criado'


def test_DEF28_admin_criado_pelo_terminal_gera_alerta(settings, db, monkeypatch):
    monkeypatch.setattr(cli, 'load_settings', lambda: settings)
    assert cli.main(['create-admin', '--email', 'novo@exemplo.com', '--name', 'Novo']) == 0
    last = db.scalars(select(AuditEntry).order_by(AuditEntry.id.desc())).first()
    assert last.action == 'admin_criado' and last.target == 'novo@exemplo.com'



def test_DEF25_medidor_pergunta_ao_servidor_se_a_senha_passa(admin: Painel, app):
    assert 'vazamentos' in admin.post('/api/auth/check-password', json={'password': 'password1234'}).json()['problem']
    assert admin.post('/api/auth/check-password', json={'password': 'Mochila-Verde-Rio-Lagoa-2026'}).json() == {'problem': None}
    assert Painel(app).post('/api/auth/check-password', json={'password': 'x'}).status_code == 401
