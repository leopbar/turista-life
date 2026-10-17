import json

import pytest

from painel import geo
from painel.cms_schema import load_defaults, load_schema, validate

LISBOA = [
    {'name': 'Lisboa', 'display_name': 'Lisboa, Portugal', 'lat': '38.7077507', 'lon': '-9.1365919', 'address': {'city': 'Lisboa', 'country': 'Portugal'}},
    {'name': 'Lisboa', 'display_name': 'Lisboa, Portugal', 'lat': '38.99', 'lon': '-9.14', 'address': {'county': 'Lisboa', 'country': 'Portugal'}},
    {'name': 'Ubud', 'display_name': 'Ubud, Gianyar, Bali, 80571, Indonésia', 'lat': '-8.5', 'lon': '115.26', 'address': {'state': 'Bali', 'country': 'Indonésia'}},
    {'name': 'Lisboa', 'display_name': 'Lisboa, Paraná, Brasil', 'lat': '-24.1', 'lon': 'x'},
]


@pytest.fixture(autouse=True)
def sem_espera(monkeypatch):
    monkeypatch.setattr(geo, '_cache', {})
    monkeypatch.setattr(geo, '_last_call', 0.0)
    monkeypatch.setattr(geo.time, 'sleep', lambda s: None)


def test_busca_resume_o_nome_e_arredonda(monkeypatch):
    urls = []
    monkeypatch.setattr(geo, '_download', lambda url: urls.append(url) or json.dumps(LISBOA).encode())
    out = geo.search('  Lisboa ')
    # Nome curto, sem repetir a cidade e o município de mesmo nome; resultado sem posição fica de fora.
    assert out == [
        {'label': 'Lisboa, Portugal', 'detail': 'Lisboa, Portugal', 'lat': 38.7078, 'lon': -9.1366},
        {'label': 'Ubud, Bali, Indonésia', 'detail': 'Ubud, Gianyar, Bali, 80571, Indonésia', 'lat': -8.5, 'lon': 115.26},
    ]
    assert 'q=Lisboa&' in urls[0]
    # A mesma busca de novo vem do cache, sem outro pedido ao OpenStreetMap.
    geo.search('lisboa')
    assert len(urls) == 1


def test_busca_pelo_painel_exige_login(new_browser):
    assert new_browser().get('/api/geo/search?q=Lisboa').status_code == 401


def test_busca_pelo_painel(admin, monkeypatch):
    monkeypatch.setattr(geo, '_download', lambda url: json.dumps(LISBOA).encode())
    r = admin.get('/api/geo/search?q=Lisboa')
    assert r.status_code == 200
    assert r.json()[0]['label'] == 'Lisboa, Portugal'


def test_busca_fora_do_ar(admin, monkeypatch):
    def boom(url):
        raise OSError('sem internet')

    monkeypatch.setattr(geo, '_download', boom)
    r = admin.get('/api/geo/search?q=Lisboa')
    assert r.status_code == 502
    assert 'não respondeu' in r.json()['detail']['message']


def test_parada_sem_cidade_escolhida_e_recusada():
    schema, defaults = load_schema(), load_defaults()
    value = json.loads(json.dumps(defaults['docs']['diario.countries']))
    value['items'][0]['items'][0]['coords'] = [0, 0]
    problems = validate(schema, 'diario.countries', value)
    assert any('busque a cidade' in p['message'] for p in problems.items)
