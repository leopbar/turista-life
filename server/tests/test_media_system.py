import io
import zipfile
from datetime import timedelta

from PIL import Image
from sqlalchemy import update

from painel import alerts, maintenance, media
from painel.db import utcnow, write
from painel.models import Media, Version

from .conftest import Painel, add_user


def jpeg_with_gps(w=3000, h=2000) -> bytes:
    im = Image.new('RGB', (w, h), (30, 120, 90))
    exif = Image.Exif()
    exif[0x010F] = 'Celular da Laura'  # fabricante
    exif[0x8825] = {1: 'S', 2: (8.0, 39.0, 0.0), 3: 'E', 4: (115.0, 8.0, 0.0)}  # GPS em Bali
    buf = io.BytesIO()
    im.save(buf, 'JPEG', exif=exif)
    return buf.getvalue()


def upload(p: Painel, data: bytes, name='foto.jpg', alt='Praia em Bali'):
    return p.client.post('/api/media', files={'file': (name, data, 'image/jpeg')}, data={'alt': alt}, headers={'X-CSRF-Token': p.csrf})


def test_foto_enviada_perde_gps_e_ganha_versoes(admin: Painel, settings):
    r = upload(admin, jpeg_with_gps())
    assert r.status_code == 201, r.text
    m = r.json()
    assert m['widths'] == [480, 960, 1600, 2400] and m['url'] == f"cms/media/{m['id']}/1600.webp"
    folder = settings.data_dir / 'public' / 'media' / m['id']
    for w in m['widths']:
        with Image.open(folder / f'{w}.webp') as im:
            assert im.width == w and im.format == 'WEBP'
            assert not im.getexif(), 'a foto não pode levar GPS nem dados da câmera'
    # Entra no conteúdo publicado (descrição e foco valem no site todo).
    assert m['id'] in admin.get('/api/preview/bundle').json()['media']


def test_foto_pequena_nao_e_aumentada(admin: Painel):
    m = upload(admin, jpeg_with_gps(300, 200)).json()
    assert m['widths'] == [300]


def test_arquivos_disfarcados_e_svg_sao_recusados(admin: Painel):
    assert upload(admin, b'<?php echo 1; ?>', name='foto.jpg').status_code == 415
    svg = b'<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>'
    assert upload(admin, svg, name='logo.svg').status_code == 415
    # Cabeçalho de JPEG verdadeiro, mas o resto é lixo.
    assert upload(admin, b'\xff\xd8\xff' + b'0' * 5000).status_code == 415


def test_descricao_obrigatoria_e_limite_de_tamanho(admin: Painel):
    assert upload(admin, jpeg_with_gps(), alt='   ').status_code == 422
    assert upload(admin, b'\xff\xd8\xff' + b'0' * (media.MAX_BYTES + 10)).status_code == 413


def test_upload_exige_login_e_csrf(app, admin: Painel):
    assert Painel(app).client.post('/api/media', files={'file': ('a.jpg', jpeg_with_gps(), 'image/jpeg')}, data={'alt': 'x'}).status_code == 401
    r = admin.client.post('/api/media', files={'file': ('a.jpg', jpeg_with_gps(), 'image/jpeg')}, data={'alt': 'x'})
    assert r.status_code == 403


def test_foto_em_uso_nao_vai_para_a_lixeira(admin: Painel, db, settings):
    m = upload(admin, jpeg_with_gps()).json()
    hero = admin.get('/api/content/inicio.hero').json()['draft']
    admin.client.put('/api/content/inicio.hero', json={'draft': {**hero, 'image': m['url']}}, headers={'X-CSRF-Token': admin.csrf})
    listed = [x for x in admin.get('/api/media').json() if x['id'] == m['id']][0]
    assert listed['usedIn'][0]['key'] == 'inicio.hero'

    r = admin.delete(f"/api/media/{m['id']}")
    assert r.status_code == 409 and r.json()['detail']['usedIn'][0]['key'] == 'inicio.hero'

    admin.post('/api/content/inicio.hero/discard')
    assert admin.delete(f"/api/media/{m['id']}").status_code == 200
    assert [x['id'] for x in admin.get('/api/media?trash=true').json()] == [m['id']]
    assert admin.post(f"/api/media/{m['id']}/restore").status_code == 200

    admin.delete(f"/api/media/{m['id']}")
    with write(db):
        db.execute(update(Media).values(deleted_at=utcnow() - timedelta(days=31)))
    with write(db):
        assert media.purge_trash(db, settings) == 1
    assert not (settings.data_dir / 'public' / 'media' / m['id']).exists()


def test_foco_e_descricao(admin: Painel):
    m = upload(admin, jpeg_with_gps()).json()
    r = admin.patch(f"/api/media/{m['id']}", json={'alt': 'Laura na praia', 'focal': [20, 70]})
    assert r.json()['alt'] == 'Laura na praia' and r.json()['focal'] == [20, 70]
    assert admin.get('/api/preview/bundle').json()['media'][m['id']]['focal'] == [20, 70]
    assert admin.patch(f"/api/media/{m['id']}", json={'focal': [120, 0]}).status_code == 422


def test_capas_de_videos_novos(admin: Painel, db, settings):
    doc = admin.get('/api/content/diario.page').json()['draft']
    doc['departure']['video']['id'] = 'NovoVideo01'
    admin.client.put('/api/content/diario.page', json={'draft': doc}, headers={'X-CSRF-Token': admin.csrf})
    buf = io.BytesIO()
    Image.new('RGB', (480, 360), 'red').save(buf, 'JPEG')
    # Vídeos que ainda não têm capa no site (o novo e alguns shorts) ganham uma.
    assert media.fetch_missing_thumbs(db, settings, fetch=lambda url: buf.getvalue()) >= 1
    assert 'NovoVideo01' in admin.get('/api/preview/bundle').json()['thumbs']


def test_backup_baixado_pelo_admin(app, admin: Painel, db, settings):
    assert admin.get('/api/system/status').json()['needsBackupDownload'] is True
    r = admin.post('/api/system/backups')
    assert r.status_code == 201
    name = r.json()['name']
    file = admin.get(f'/api/system/backups/{name}')
    assert file.status_code == 200
    with zipfile.ZipFile(io.BytesIO(file.content)) as z:
        names = z.namelist()
    assert 'painel.db' in names and 'public/site.json' in names and not any('secret' in n for n in names)
    assert admin.get('/api/system/status').json()['needsBackupDownload'] is False
    assert admin.get('/api/system/backups/..%2f..%2fpainel.db').status_code == 404

    add_user(db, 'laura@exemplo.com', 'Senha-Da-Laura-Bem-Longa', role='editor', name='Laura')
    laura = Painel(app)
    laura.login('laura@exemplo.com', 'Senha-Da-Laura-Bem-Longa')
    assert laura.post('/api/system/backups').status_code == 403
    assert laura.get(f'/api/system/backups/{name}').status_code == 403


def test_backups_guardados_30_diarios_e_12_mensais(settings):
    folder = maintenance.backups_dir(settings)
    day = utcnow()
    for i in range(400):
        (folder / f'backup-{(day - timedelta(days=i)):%Y%m%d}-0300.zip').write_bytes(b'x')
    maintenance.prune_backups(settings)
    kept = sorted(f.name for f in folder.iterdir())
    assert 30 <= len(kept) <= 42


def test_limpeza_de_um_ano(admin: Painel, db, settings):
    doc = admin.get('/api/content/inicio.hero').json()['draft']
    admin.client.put('/api/content/inicio.hero', json={'draft': {**doc, 'title': 'nova'}}, headers={'X-CSRF-Token': admin.csrf})
    admin.post('/api/content/inicio.hero/publish')
    with write(db):
        db.execute(update(Version).values(created_at=utcnow() - timedelta(days=400)))
    with write(db):
        out = maintenance.cleanup(db, settings)
    assert out['versoes'] >= 1
    # A versão mais nova de cada conteúdo sempre fica.
    assert admin.get('/api/content/inicio.hero/versions').json()[0]['data']['title'] == 'nova'


def test_alerta_de_conta_bloqueada(app, db, settings, monkeypatch):
    sent = []
    monkeypatch.setattr(alerts, 'configured', lambda s: True)
    monkeypatch.setattr(alerts, '_last_sent', {})
    real_send = alerts.send
    monkeypatch.setattr(alerts, 'send', lambda s, kind, subject, body, **kw: sent.append(subject) or real_send(s, kind, subject, body, sender=lambda *a: None))
    add_user(db, 'laura@exemplo.com', 'Senha-Da-Laura-Bem-Longa', role='editor', name='Laura')
    p = Painel(app)
    for _ in range(6):
        p.login('laura@exemplo.com', 'chute-errado-de-novo')
    assert sent == ['Muitas senhas erradas na conta laura@exemplo.com']
