"""Mapa de conteúdo (exportado do site por scripts/export-cms.mjs) e validação de cada campo.

A validação é estrita: só entram campos que existem no mapa, com o tipo certo. Links só podem ser
https/http, mailto ou caminhos do próprio site, nunca "javascript:" e afins.
"""

import json
import re
from dataclasses import dataclass
from functools import lru_cache
from pathlib import Path
from typing import Any

DATA = Path(__file__).parent / 'data'

SLUG = re.compile(r'^[a-z0-9]+(?:-[a-z0-9]+)*$')
VIDEO = re.compile(r'^[A-Za-z0-9_-]{6,20}$')
# Mesmo padrão de src/cms/mailerlite.ts.
MAILERLITE_FORM = re.compile(r'^https://assets\.mailerlite\.com/jsonp/\d+/forms/\d+/subscribe$')
DATE = re.compile(r'^\d{4}-\d{2}-\d{2}$')
IMAGE = re.compile(r'^(?:images/[A-Za-z0-9_./-]+|cms/media/[a-z0-9]+/\d+\.webp)(?:#[A-Za-z0-9=,&.%_-]*)?$')
CONTROL = re.compile(r'[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]')
MAX_TEXT = 4_000
MAX_LONG = 20_000
MAX_DOC_BYTES = 1_500_000


@dataclass(frozen=True)
class Schema:
    docs: dict[str, dict]
    collections: dict[str, dict]

    def fields(self, key: str) -> dict | None:
        base = key.split(':', 1)[0]
        d = self.docs.get(base) or self.collections.get(base)
        return d['fields'] if d else None

    def definition(self, key: str) -> dict | None:
        base = key.split(':', 1)[0]
        return self.docs.get(base) or self.collections.get(base)


@lru_cache(maxsize=1)
def load_schema() -> Schema:
    raw = json.loads((DATA / 'cms-schema.json').read_text(encoding='utf-8'))
    return Schema(docs={d['key']: d for d in raw['docs']}, collections={c['key']: c for c in raw['collections']})


@lru_cache(maxsize=1)
def load_defaults() -> dict:
    return json.loads((DATA / 'cms-defaults.json').read_text(encoding='utf-8'))


def safe_url(v: str) -> bool:
    if v == '' or v.startswith('#'):
        return True
    if v.startswith('/'):
        return not v.startswith('//') and '\\' not in v
    low = v.lower()
    return low.startswith(('https://', 'http://', 'mailto:')) and not any(c.isspace() for c in v)


class Problems:
    def __init__(self):
        self.items: list[dict] = []

    def add(self, path: str, message: str):
        if len(self.items) < 50:
            self.items.append({'path': path, 'message': message})

    def __bool__(self):
        return bool(self.items)


def _at(path: str, k: str | int) -> str:
    return f'{path}.{k}' if path else str(k)


def check_field(v: Any, f: dict, path: str, out: Problems) -> None:
    kind = f['kind']
    label = f.get('label', path)
    if kind in ('text',):
        if not isinstance(v, str):
            return out.add(path, f'"{label}" precisa ser um texto.')
        limit = f.get('max') or (MAX_LONG if f.get('long') else MAX_TEXT)
        if len(v) > limit:
            out.add(path, f'"{label}" pode ter no máximo {limit} caracteres.')
        if CONTROL.search(v):
            out.add(path, f'"{label}" tem caracteres inválidos.')
    elif kind == 'url':
        if not isinstance(v, str) or len(v) > 2000 or not safe_url(v.strip()):
            out.add(path, f'"{label}": use um link que comece com https://, mailto: ou uma página do site (ex.: /produtos).')
    elif kind == 'image':
        if not isinstance(v, str) or (v and (not IMAGE.match(v) or '..' in v)):
            out.add(path, f'"{label}": escolha uma foto da biblioteca.')
    elif kind == 'number':
        if isinstance(v, bool) or not isinstance(v, (int, float)):
            return out.add(path, f'"{label}" precisa ser um número.')
        if 'min' in f and v < f['min']:
            out.add(path, f'"{label}" não pode ser menor que {f["min"]}.')
        if 'max' in f and v > f['max']:
            out.add(path, f'"{label}" não pode ser maior que {f["max"]}.')
    elif kind == 'bool':
        if not isinstance(v, bool):
            out.add(path, f'"{label}" precisa ser sim ou não.')
    elif kind == 'select':
        if v not in {o['value'] for o in f['options']}:
            out.add(path, f'"{label}": escolha uma das opções.')
    elif kind == 'video':
        if not isinstance(v, str) or not VIDEO.match(v):
            out.add(path, f'"{label}": cole o código do vídeo (o que vem depois de youtu.be/).')
    elif kind == 'mailerlite':
        if not isinstance(v, str) or not ((v == '' and f.get('optional')) or MAILERLITE_FORM.match(v)):
            out.add(path, f'"{label}": cole o código do formulário incorporado do MailerLite.')
    elif kind in ('slug', 'ref'):
        if not isinstance(v, str) or not SLUG.match(v) or len(v) > 80:
            out.add(path, f'"{label}": use só letras minúsculas, números e hífen.')
    elif kind == 'date':
        if not isinstance(v, str) or not DATE.match(v):
            out.add(path, f'"{label}": use uma data (AAAA-MM-DD).')
    elif kind == 'coords':
        ok = isinstance(v, list) and len(v) == 2 and all(isinstance(n, (int, float)) and not isinstance(n, bool) for n in v)
        if not ok or not (-90 <= v[0] <= 90 and -180 <= v[1] <= 180):
            out.add(path, f'"{label}": latitude e longitude inválidas.')
    elif kind == 'list':
        if not isinstance(v, list):
            return out.add(path, f'"{label}" precisa ser uma lista.')
        if len(v) > 500:
            out.add(path, f'"{label}" tem itens demais.')
        for i, item in enumerate(v):
            check_field(item, f['of'], _at(path, i), out)
    elif kind == 'object':
        if not isinstance(v, dict):
            return out.add(path, f'"{label}" está num formato inválido.')
        check_fields(v, f['fields'], path, out)
    elif kind == 'blocks':
        if not isinstance(v, list):
            return out.add(path, f'"{label}" precisa ser uma lista.')
        for i, item in enumerate(v):
            p = _at(path, i)
            if not isinstance(item, dict) or item.get('type') not in f['variants']:
                out.add(p, f'Bloco de tipo desconhecido em "{label}".')
                continue
            rest = {k: x for k, x in item.items() if k != 'type'}
            check_fields(rest, f['variants'][item['type']]['fields'], p, out)
    else:
        out.add(path, f'Campo de tipo desconhecido: {kind}.')


def check_fields(obj: dict, fields: dict, path: str, out: Problems) -> None:
    for k in obj:
        if k not in fields:
            out.add(_at(path, k), f'Campo desconhecido: {k}.')
    for k, f in fields.items():
        if k not in obj or obj[k] is None:
            if not f.get('optional'):
                out.add(_at(path, k), f'Falta preencher "{f.get("label", k)}".')
            continue
        check_field(obj[k], f, _at(path, k), out)


def validate(schema: Schema, key: str, value: Any) -> Problems:
    out = Problems()
    fields = schema.fields(key)
    if fields is None:
        out.add('', 'Documento desconhecido.')
        return out
    if len(json.dumps(value, ensure_ascii=False)) > MAX_DOC_BYTES:
        out.add('', 'Este conteúdo ficou grande demais.')
        return out
    if not isinstance(value, dict):
        out.add('', 'Formato inválido.')
        return out
    # Textos fixos: o mapa é a lista de textos encontrados no código; todos são texto.
    if key == 'geral.textos':
        for k, v in value.items():
            if k not in fields:
                out.add(k, f'Texto desconhecido: {k}.')
            else:
                check_field(v, fields[k], k, out)
        return out
    check_fields(value, fields, '', out)
    definition = schema.definition(key)
    if ':' in key and definition:
        item_id = key.split(':', 1)[1]
        if value.get(definition['idField']) != item_id:
            out.add(definition['idField'], 'O endereço não pode ser trocado depois de criado.')
        if item_id in definition.get('reservedIds', []):
            out.add(definition['idField'], f'O endereço "{item_id}" já é uma página do site. Escolha outro.')
    if key.startswith('layout.'):
        ids = [s.get('id') for s in value.get('sections', []) if isinstance(s, dict)]
        if len(ids) != len(set(ids)):
            out.add('sections', 'Cada seção só pode aparecer uma vez.')
    return out


# ------------------------------------------------------------------ #
# Referências entre documentos (destino de um artigo, guia de um destino…)
# ------------------------------------------------------------------ #


def _refs(v: Any, f: dict, path: str, found: list):
    kind = f['kind']
    if kind == 'ref' and isinstance(v, str):
        found.append((path, f, v))
    elif kind == 'list' and isinstance(v, list):
        for i, x in enumerate(v):
            _refs(x, f['of'], _at(path, i), found)
    elif kind == 'object' and isinstance(v, dict):
        for k, sub in f['fields'].items():
            if k in v:
                _refs(v[k], sub, _at(path, k), found)
    elif kind == 'blocks' and isinstance(v, list):
        for i, x in enumerate(v):
            variant = f['variants'].get(x.get('type')) if isinstance(x, dict) else None
            if variant:
                for k, sub in variant['fields'].items():
                    if k in x:
                        _refs(x[k], sub, _at(_at(path, i), k), found)


def broken_refs(schema: Schema, docs: dict[str, Any], label_of) -> list[str]:
    """Referências que apontam para algo que não existe mais, em frases para mostrar."""
    problems: list[str] = []
    ids_cache: dict[tuple[str, str], set[str]] = {}
    for key, value in docs.items():
        fields = schema.fields(key)
        if not fields or not isinstance(value, dict) or key == 'geral.textos':
            continue
        found: list = []
        for k, f in fields.items():
            if k in value:
                _refs(value[k], f, k, found)
        for _path, f, target in found:
            cache_key = (f['source'], f['list'])
            if cache_key not in ids_cache:
                source = docs.get(f['source']) or {}
                ids_cache[cache_key] = {str(x.get(f['valueField'])) for x in source.get(f['list'], []) if isinstance(x, dict)}
            if target not in ids_cache[cache_key]:
                problems.append(f'{label_of(key)} usa "{target}" em "{f["label"]}", que não existe mais.')
    return problems[:10]
