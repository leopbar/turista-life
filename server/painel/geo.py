"""Busca de cidades para a posição no mapa (OpenStreetMap / Nominatim).

O painel não fala direto com o OpenStreetMap: o pedido passa por aqui, com a identificação
exigida pela política de uso do Nominatim, no máximo um pedido por segundo e com cache.
"""

import json
import threading
import time
import urllib.parse
import urllib.request

ENDPOINT = 'https://nominatim.openstreetmap.org/search'
USER_AGENT = 'TuristaLife-Painel/1.0 (+https://lbai.dev/turista-life)'

_lock = threading.Lock()
_last_call = 0.0
_cache: dict[str, list[dict]] = {}


class GeoError(Exception):
    pass


def _download(url: str) -> bytes:
    req = urllib.request.Request(url, headers={'User-Agent': USER_AGENT, 'Accept': 'application/json'})
    with urllib.request.urlopen(req, timeout=8) as r:  # noqa: S310 (endereço fixo do Nominatim)
        return r.read(1_000_000)


def _label(item: dict) -> str:
    """'Ubud, Bali, Indonésia' em vez do endereço completo do OpenStreetMap."""
    parts = [p.strip() for p in str(item.get('display_name', '')).split(',') if p.strip()]
    address = item.get('address') if isinstance(item.get('address'), dict) else {}
    name = str(item.get('name') or (parts[0] if parts else '')).strip()
    region = str(address.get('state') or address.get('region') or address.get('province') or '').strip()
    country = str(address.get('country') or (parts[-1] if len(parts) > 1 else '')).strip()
    out: list[str] = []
    for p in (name, region, country):
        if p and p not in out:
            out.append(p)
    return ', '.join(out)


def search(q: str, fetch=None) -> list[dict]:
    q = ' '.join(q.split())
    key = q.lower()
    if key in _cache:
        return _cache[key]
    params = urllib.parse.urlencode({'q': q, 'format': 'jsonv2', 'limit': 8, 'addressdetails': 1, 'accept-language': 'pt-BR,pt,en'})
    global _last_call
    with _lock:
        wait = 1.0 - (time.monotonic() - _last_call)
        if wait > 0:
            time.sleep(wait)
        try:
            raw = (fetch or _download)(f'{ENDPOINT}?{params}')
        except Exception as err:  # noqa: BLE001 (sem internet, fora do ar, tempo esgotado)
            raise GeoError('A busca de cidades não respondeu agora. Tente de novo em instantes.') from err
        finally:
            _last_call = time.monotonic()
    try:
        items = json.loads(raw)
    except ValueError as err:
        raise GeoError('A busca de cidades respondeu algo inesperado. Tente de novo.') from err
    out = []
    for item in items if isinstance(items, list) else []:
        try:
            lat, lon = round(float(item['lat']), 4), round(float(item['lon']), 4)
        except (KeyError, TypeError, ValueError):
            continue
        label = _label(item)
        # A cidade e o município de mesmo nome vêm separados; fica só o primeiro (o mais relevante).
        if any(o['label'] == label for o in out):
            continue
        out.append({'label': label, 'detail': str(item.get('display_name', ''))[:200], 'lat': lat, 'lon': lon})
    out = out[:6]
    if len(_cache) > 500:
        _cache.clear()
    _cache[key] = out
    return out
