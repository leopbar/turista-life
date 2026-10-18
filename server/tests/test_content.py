import json
from datetime import timedelta

from sqlalchemy import select, update

from painel import content
from painel.cms_schema import load_defaults, load_schema, validate
from painel.db import utcnow, write
from painel.models import Document, Version

from .conftest import Painel, add_user


def site_json(settings) -> dict:
    return json.loads((settings.data_dir / 'public' / 'site.json').read_text(encoding='utf-8'))


def test_todo_o_conteudo_atual_respeita_o_mapa():
    schema, defaults = load_schema(), load_defaults()
    for key, value in defaults['docs'].items():
        problems = validate(schema, key, value)
        assert not problems, (key, problems.items)
    for ckey, items in defaults['collections'].items():
        id_field = schema.collections[ckey]['idField']
        for item in items:
            key = f'{ckey}:{item[id_field]}'
            problems = validate(schema, key, item)
            assert not problems, (key, problems.items)


def test_referencias_do_conteudo_atual_existem():
    schema, defaults = load_schema(), load_defaults()
    docs = dict(defaults['docs'])
    for ckey, items in defaults['collections'].items():
        for item in items:
            docs[f'{ckey}:{item[schema.collections[ckey]["idField"]]}'] = item
    from painel.cms_schema import broken_refs

    assert broken_refs(schema, docs, lambda k: k) == []


def test_conteudo_original_ja_esta_publicado(admin: Painel, settings):
    items = admin.get('/api/content').json()
    assert {i['key'] for i in items} >= {'inicio.hero', 'geral.nav', 'article:morar-na-australia-vale-a-pena'}
    assert all(i['status'] == 'publicado' for i in items)
    bundle = site_json(settings)
    assert bundle['docs']['inicio.hero']['title'] == 'Viajar mais. Viver mais.'
    assert len(bundle['collections']['article']) >= 10


def test_rascunho_publicar_e_desfazer(admin: Painel, settings):
    doc = admin.get('/api/content/inicio.hero').json()
    draft = {**doc['draft'], 'title': 'Título novo de teste'}
    r = admin.client.put('/api/content/inicio.hero', json={'draft': draft}, headers={'X-CSRF-Token': admin.csrf})
    assert r.status_code == 200 and r.json()['status'] == 'alterado'
    # Rascunho não vai para o ar…
    assert site_json(settings)['docs']['inicio.hero']['title'] == 'Viajar mais. Viver mais.'
    # …mas aparece na pré-visualização.
    assert admin.get('/api/preview/bundle').json()['docs']['inicio.hero']['title'] == 'Título novo de teste'

    assert admin.post('/api/content/inicio.hero/publish').status_code == 200
    assert site_json(settings)['docs']['inicio.hero']['title'] == 'Título novo de teste'

    versions = admin.get('/api/content/inicio.hero/versions').json()
    original = [v for v in versions if v['action'] == 'original'][0]
    assert admin.post(f"/api/content/inicio.hero/versions/{original['id']}/restore").status_code == 200
    assert site_json(settings)['docs']['inicio.hero']['title'] == 'Viajar mais. Viver mais.'
    assert [h['action'] for h in admin.get('/api/content/history').json()][:2] == ['restaurado', 'publicado']


def test_descartar_rascunho(admin: Painel):
    doc = admin.get('/api/content/inicio.hero').json()
    admin.client.put('/api/content/inicio.hero', json={'draft': {**doc['draft'], 'title': 'xx'}}, headers={'X-CSRF-Token': admin.csrf})
    assert admin.post('/api/content/inicio.hero/discard').json()['status'] == 'publicado'


def _put(p: Painel, key: str, draft: dict):
    return p.client.put(f'/api/content/{key}', json={'draft': draft}, headers={'X-CSRF-Token': p.csrf})


def test_links_perigosos_e_campos_estranhos_sao_recusados(admin: Painel):
    doc = admin.get('/api/content/inicio.hero').json()['draft']
    for bad in ('javascript:alert(1)', 'JaVaScRiPt:alert(1)', 'data:text/html,oi', '//site-falso.com', 'vbscript:x'):
        r = _put(admin, 'inicio.hero', {**doc, 'cta': {**doc['cta'], 'href': bad}})
        assert r.status_code == 422, bad
        assert r.json()['detail']['problems'][0]['path'] == 'cta.href'
    assert _put(admin, 'inicio.hero', {**doc, 'hacker': 'x'}).status_code == 422
    assert _put(admin, 'inicio.hero', {**doc, 'image': '../../secret.key'}).status_code == 422
    assert _put(admin, 'inicio.hero', {**doc, 'image': 'https://outro-site.com/foto.jpg'}).status_code == 422
    good = {**doc, 'cta': {**doc['cta'], 'href': 'https://youtube.com/@turistalife'}}
    assert _put(admin, 'inicio.hero', good).status_code == 200


def test_artigo_novo_entra_e_sai_do_site(admin: Painel, settings):
    base = admin.get('/api/content/article:morar-na-australia-vale-a-pena').json()['draft']
    novo = {**base, 'slug': 'meu-artigo-novo', 'title': 'Meu artigo novo'}
    r = admin.post('/api/collections/article', json={'item': novo})
    assert r.status_code == 201 and r.json()['status'] == 'novo'
    assert admin.post('/api/collections/article', json={'item': novo}).status_code == 409

    slugs = lambda: [a['slug'] for a in site_json(settings)['collections']['article']]  # noqa: E731
    assert 'meu-artigo-novo' not in slugs()
    admin.post('/api/content/article:meu-artigo-novo/publish')
    assert slugs()[0] == 'meu-artigo-novo'  # o blog mostra o mais novo primeiro
    # A data de publicação é preenchida sozinha na primeira publicação.
    assert site_json(settings)['collections']['article'][0]['date'] == utcnow().date().isoformat()

    # O endereço não muda depois de criado.
    assert _put(admin, 'article:meu-artigo-novo', {**novo, 'slug': 'outro'}).status_code == 422

    assert admin.delete('/api/content/article:meu-artigo-novo').json()['status'] == 'sair'
    assert 'meu-artigo-novo' in slugs()
    admin.post('/api/content/article:meu-artigo-novo/publish')
    assert 'meu-artigo-novo' not in slugs()


def test_reordenar_colecao(admin: Painel, settings):
    keys = [i['key'] for i in admin.get('/api/content').json() if i['collection'] == 'productPage']
    assert admin.post('/api/collections/productPage/order', json={'keys': list(reversed(keys))}).status_code == 200
    assert [p['slug'] for p in site_json(settings)['collections']['productPage']] == [k.split(':')[1] for k in reversed(keys)]
    assert admin.post('/api/collections/productPage/order', json={'keys': keys[:1]}).status_code == 409


def test_levar_item_para_o_topo(admin: Painel, settings):
    keys = [i['key'] for i in admin.get('/api/content').json() if i['collection'] == 'article']
    ultimo = keys[-1]
    assert admin.post('/api/collections/article/move', json={'key': ultimo, 'to': 0}).status_code == 200
    assert site_json(settings)['collections']['article'][0]['slug'] == ultimo.split(':')[1]
    assert admin.post('/api/collections/article/move', json={'key': 'article:nao-existe', 'to': 0}).status_code == 404


def test_lista_traz_as_escolhas_para_filtrar(admin: Painel):
    artigo = next(i for i in admin.get('/api/content').json() if i['collection'] == 'article')
    assert set(artigo['refs']) == {'destination', 'category'}


def test_nao_publica_o_que_quebraria_outra_pagina(admin: Painel):
    dests = admin.get('/api/content/blog.destinations').json()['draft']
    sem_bali = {'items': [d for d in dests['items'] if d['id'] != 'bali']}
    assert _put(admin, 'blog.destinations', sem_bali).status_code == 200
    r = admin.post('/api/content/blog.destinations/publish')
    assert r.status_code == 409 and 'bali' in r.json()['detail']['problems'][0]['message']


def test_agendar_publicacao(admin: Painel, app, db, settings):
    doc = admin.get('/api/content/inicio.hero').json()['draft']
    _put(admin, 'inicio.hero', {**doc, 'title': 'Lançamento agendado'})
    past = (utcnow() - timedelta(minutes=5)).isoformat() + 'Z'
    assert admin.post('/api/content/inicio.hero/schedule', json={'at': past}).status_code == 400
    future = (utcnow() + timedelta(days=1)).isoformat() + 'Z'
    assert admin.post('/api/content/inicio.hero/schedule', json={'at': future}).json()['scheduledAt']

    with write(db):
        db.execute(update(Document).where(Document.key == 'inicio.hero').values(scheduled_at=utcnow() - timedelta(seconds=1)))
    with write(db):
        assert content.run_scheduled(db, settings) == 1
    assert site_json(settings)['docs']['inicio.hero']['title'] == 'Lançamento agendado'


def test_voltar_o_site_inteiro_no_tempo(admin: Painel, db, settings):
    with write(db):
        db.execute(update(Version).values(created_at=utcnow() - timedelta(days=2)))
    antes = (utcnow() - timedelta(days=1)).isoformat() + 'Z'
    doc = admin.get('/api/content/inicio.hero').json()['draft']
    _put(admin, 'inicio.hero', {**doc, 'title': 'Mudança de hoje'})
    admin.post('/api/content/inicio.hero/publish')
    r = admin.post('/api/content/restore-site', json={'at': antes})
    assert r.status_code == 200 and r.json()['changed'] == 1
    assert site_json(settings)['docs']['inicio.hero']['title'] == 'Viajar mais. Viver mais.'


def test_previa_de_voltar_o_site_mostra_o_que_vai_ficar_no_ar(admin: Painel, db, settings):
    # O caso da produção: botão trocado e desfeito; voltar para antes do "Restaurado" traz o botão trocado de volta.
    with write(db):
        db.execute(update(Version).values(created_at=utcnow() - timedelta(days=2)))
    doc = admin.get('/api/content/inicio.hero').json()['draft']
    _put(admin, 'inicio.hero', {**doc, 'cta': {**doc['cta'], 'label': 'Botão errado'}})
    admin.post('/api/content/inicio.hero/publish')
    original = [v for v in admin.get('/api/content/inicio.hero/versions').json() if v['action'] == 'original'][0]
    with write(db):
        db.execute(update(Version).where(Version.action == 'publicado').values(created_at=utcnow() - timedelta(hours=2)))
    admin.post(f"/api/content/inicio.hero/versions/{original['id']}/restore")
    antes_da_restauracao = (utcnow() - timedelta(hours=1)).isoformat() + 'Z'
    no_ar = site_json(settings)['docs']['inicio.hero']

    r = admin.get('/api/content/restore-site/preview', params={'at': antes_da_restauracao})
    assert r.status_code == 200
    [parte] = r.json()
    assert parte['key'] == 'inicio.hero' and parte['label'] == 'Capa (topo da página inicial)'
    assert parte['current']['cta']['label'] == doc['cta']['label'] and parte['target']['cta']['label'] == 'Botão errado'
    assert site_json(settings)['docs']['inicio.hero'] == no_ar  # a prévia não muda nada

    assert admin.get('/api/content/restore-site/preview', params={'at': (utcnow() - timedelta(days=1)).isoformat() + 'Z'}).json() == []
    assert admin.get('/api/content/restore-site/preview', params={'at': '2020-01-01T00:00:00Z'}).status_code == 400


def test_voltar_para_uma_versao_ignora_tudo_o_que_veio_depois(admin: Painel, db, settings):
    def publicar(**mudanca):
        d = admin.get('/api/content/inicio.hero').json()['draft']
        _put(admin, 'inicio.hero', {**d, **mudanca})
        assert admin.post('/api/content/inicio.hero/publish').status_code == 200
        with write(db):  # cada publicação um pouco depois da anterior
            for v in db.scalars(select(Version)):
                v.created_at -= timedelta(minutes=1)

    original = site_json(settings)['docs']['inicio.hero']
    publicar(title='T1')
    publicar(cta={**original['cta'], 'label': 'Botão 2'})
    versao_2 = admin.get('/api/content/history').json()[0]
    publicar(title='T3')
    publicar(cta={**original['cta'], 'label': 'Botão 4'})

    # A versão escolhida conta: o site fica exatamente como logo depois dela.
    previa = admin.get('/api/content/restore-site/preview', params={'versionId': versao_2['id']}).json()
    assert [p['target']['cta']['label'] for p in previa] == ['Botão 2']
    assert admin.post('/api/content/restore-site', json={'versionId': versao_2['id']}).status_code == 200
    hero = site_json(settings)['docs']['inicio.hero']
    assert (hero['title'], hero['cta']['label']) == ('T1', 'Botão 2')

    # Conteúdo original: ignora todas as versões.
    assert admin.post('/api/content/restore-site', json={'original': True}).status_code == 200
    assert site_json(settings)['docs']['inicio.hero'] == original
    assert admin.post('/api/content/restore-site', json={'versionId': 999999}).status_code == 404
    assert admin.post('/api/content/restore-site', json={}).status_code == 400


def test_voltar_para_versao_com_campo_que_saiu_do_mapa(admin: Painel, db, settings):
    # Versões antigas guardam campos e textos fixos que o código já removeu: voltar a elas não pode falhar.
    with write(db):
        for key, extra in (('produtos.page', {'campoQueSaiu': 'x'}), ('geral.textos', {'texto.que.saiu': 'y'})):
            v = db.scalar(select(Version).where(Version.key == key))
            v.data = {**v.data, **extra}
            v.created_at = utcnow() - timedelta(days=2)
        for v in db.scalars(select(Version).where(Version.key.not_in(['produtos.page', 'geral.textos']))):
            v.created_at = utcnow() - timedelta(days=2)
    original_produtos = [v for v in admin.get('/api/content/produtos.page/versions').json() if v['action'] == 'original'][0]
    doc = admin.get('/api/content/inicio.hero').json()['draft']
    _put(admin, 'inicio.hero', {**doc, 'title': 'Depois'})
    admin.post('/api/content/inicio.hero/publish')

    # Só a capa muda de verdade: o campo removido não conta como diferença.
    previa = admin.get('/api/content/restore-site/preview', params={'original': 'true'}).json()
    assert [p['key'] for p in previa] == ['inicio.hero']
    assert admin.post('/api/content/restore-site', json={'original': True}).status_code == 200
    assert admin.post(f"/api/content/produtos.page/versions/{original_produtos['id']}/restore").status_code == 409  # já é a que está no ar
    assert 'campoQueSaiu' not in site_json(settings)['docs']['produtos.page']


def test_publicar_espera_o_site_json_ser_liberado(admin: Painel, settings, monkeypatch):
    # No Windows a troca do site.json falha enquanto outro programa o lê: a publicação tenta de novo.
    real, falhas = content.os.replace, []

    def ocupado(src, dst):
        if len(falhas) < 2:
            falhas.append(1)
            raise PermissionError(5, 'Acesso negado')
        return real(src, dst)

    monkeypatch.setattr(content.os, 'replace', ocupado)
    doc = admin.get('/api/content/inicio.hero').json()['draft']
    _put(admin, 'inicio.hero', {**doc, 'title': 'Publicado mesmo assim'})
    assert admin.post('/api/content/inicio.hero/publish').status_code == 200
    assert len(falhas) == 2 and site_json(settings)['docs']['inicio.hero']['title'] == 'Publicado mesmo assim'


def test_aviso_de_quem_esta_editando(app, db, admin: Painel):
    add_user(db, 'laura@exemplo.com', 'Senha-Da-Laura-Bem-Longa', role='editor', name='Laura')
    laura = Painel(app)
    laura.login('laura@exemplo.com', 'Senha-Da-Laura-Bem-Longa')
    assert laura.post('/api/content/inicio.hero/presence').json()['editingBy'] == []
    assert admin.post('/api/content/inicio.hero/presence').json()['editingBy'] == ['Laura']
    hero = [i for i in admin.get('/api/content').json() if i['key'] == 'inicio.hero'][0]
    assert hero['editingBy'] == ['Laura']


def test_editor_edita_e_publica(app, db):
    add_user(db, 'laura@exemplo.com', 'Senha-Da-Laura-Bem-Longa', role='editor', name='Laura')
    laura = Painel(app)
    laura.login('laura@exemplo.com', 'Senha-Da-Laura-Bem-Longa')
    doc = laura.get('/api/content/inicio.hero').json()['draft']
    assert _put(laura, 'inicio.hero', {**doc, 'title': 'Da Laura'}).status_code == 200
    assert laura.post('/api/content/inicio.hero/publish').status_code == 200


def test_busca(admin: Painel):
    results = admin.get('/api/content/search', params={'q': 'liberdade geografica'}).json()
    assert results and all('liberdade geogr' in r['snippet'].lower() for r in results)
    assert results[0]['route'].startswith('/')


def test_sem_login_nada_de_conteudo(app):
    p = Painel(app)
    for url in ('/api/content', '/api/content/inicio.hero', '/api/preview/bundle', '/api/content/schema'):
        assert p.get(url).status_code == 401


def test_secoes_da_pagina(admin: Painel, settings):
    layout = admin.get('/api/content/layout.home').json()['draft']
    assert [s['id'] for s in layout['sections']][:2] == ['hero', 'about']
    sections = [{**s, 'visible': s['id'] != 'brands'} for s in reversed(layout['sections'])]
    assert _put(admin, 'layout.home', {'sections': sections}).status_code == 200
    admin.post('/api/content/layout.home/publish')
    published = site_json(settings)['docs']['layout.home']['sections']
    assert published[0]['id'] == 'diary' and not [s for s in published if s['id'] == 'brands'][0]['visible']
    dup = {'sections': sections + [sections[0]]}
    assert _put(admin, 'layout.home', dup).status_code == 422
    assert _put(admin, 'layout.home', {'sections': [{'id': 'inventada', 'visible': True}]}).status_code == 422


def test_pagina_nova_com_blocos(admin: Painel, settings):
    page = {
        'slug': 'trabalhe-comigo', 'title': 'Trabalhe comigo',
        'blocks': [
            {'type': 'hero', 'title': 'Vamos juntos', 'image': 'images/hero.jpg'},
            {'type': 'p', 'text': 'Texto da página.'},
            {'type': 'cards', 'items': [{'image': 'images/bali.jpg', 'title': 'Card', 'text': 'Oi', 'href': '/produtos'}]},
            {'type': 'button', 'label': 'Fale comigo', 'href': 'mailto:contato@exemplo.com', 'style': 'sun'},
        ],
    }
    assert admin.post('/api/collections/page', json={'item': page}).status_code == 201
    admin.post('/api/content/page:trabalhe-comigo/publish')
    assert site_json(settings)['collections']['page'][0]['title'] == 'Trabalhe comigo'
    # Endereços que já são páginas do site não podem ser usados.
    r = admin.post('/api/collections/page', json={'item': {**page, 'slug': 'blog'}})
    assert r.status_code == 422 and 'já é uma página' in r.json()['detail']['problems'][0]['message']
    bad = {**page, 'slug': 'outra', 'blocks': [{'type': 'button', 'label': 'x', 'href': 'javascript:alert(1)', 'style': 'sun'}]}
    assert admin.post('/api/collections/page', json={'item': bad}).status_code == 422


def test_formulario_do_mailerlite(admin: Painel, settings):
    form = 'https://assets.mailerlite.com/jsonp/2510968/forms/999/subscribe'
    news = admin.get('/api/content/geral.newsletter').json()['draft']
    assert news['form'].startswith('https://assets.mailerlite.com/jsonp/')
    for bad in ('', 'https://site-falso.com/jsonp/1/forms/2/subscribe', 'javascript:alert(1)', f'{form}?x=1'):
        r = _put(admin, 'geral.newsletter', {**news, 'form': bad})
        assert r.status_code == 422, bad
        assert r.json()['detail']['problems'][0]['path'] == 'form'
    assert _put(admin, 'geral.newsletter', {**news, 'form': form}).status_code == 200

    # Lista de espera: geral da página e, opcional, um por produto.
    page = admin.get('/api/content/produtos.page').json()['draft']
    catalog = [{**page['catalog'][0], 'waitlistForm': form}, *page['catalog'][1:]]
    assert _put(admin, 'produtos.page', {**page, 'waitlistForm': '', 'catalog': catalog}).status_code == 200
    assert _put(admin, 'produtos.page', {**page, 'waitlistForm': 'https://subscribepage.io/abc'}).status_code == 422
    assert admin.post('/api/content/produtos.page/publish').status_code == 200
    assert site_json(settings)['docs']['produtos.page']['catalog'][0]['waitlistForm'] == form


def test_campo_que_saiu_do_mapa_sai_do_conteudo_guardado(admin: Painel, db):
    # Ex.: "waitlistUrl" virou "waitlistForm"; o conteúdo antigo não pode travar a próxima publicação.
    with write(db):
        doc = db.get(Document, 'produtos.page')
        doc.draft = {**doc.draft, 'waitlistUrl': ''}
        doc.published = {**doc.published, 'waitlistUrl': ''}
    with write(db):
        content.seed(db)
    db.expire_all()
    doc = db.get(Document, 'produtos.page')
    assert 'waitlistUrl' not in doc.draft and 'waitlistUrl' not in doc.published
    assert admin.post('/api/content/produtos.page/publish').status_code == 200
