"""Senhas: hash Argon2id, regras para a senha nova e a senha provisória fácil de ditar."""

import gzip
import secrets
from datetime import datetime
from functools import lru_cache
from pathlib import Path

from argon2 import PasswordHasher
from argon2.exceptions import InvalidHashError, VerificationError, VerifyMismatchError

# Argon2id com os parâmetros recomendados pela RFC 9106 (perfil de pouca memória): 64 MiB, 3 passadas.
_hasher = PasswordHasher(time_cost=3, memory_cost=64 * 1024, parallelism=4)

MIN_LENGTH = 12
MAX_LENGTH = 128


def hash_password(password: str) -> str:
    return _hasher.hash(password)


def verify_password(password_hash: str, password: str) -> bool:
    try:
        return _hasher.verify(password_hash, password)
    except (VerifyMismatchError, VerificationError, InvalidHashError):
        return False


def needs_rehash(password_hash: str) -> bool:
    return _hasher.check_needs_rehash(password_hash)


# Hash de uma senha qualquer: usado quando o e-mail não existe, para a resposta levar o mesmo
# tempo e não denunciar quais contas são reais.
DUMMY_HASH = _hasher.hash(secrets.token_urlsafe(24))


@lru_cache(maxsize=1)
def _common_passwords() -> frozenset[str]:
    """Senhas que já apareceram em vazamentos (lista offline; nada é enviado para fora)."""
    path = Path(__file__).parent / 'data' / 'common-passwords.txt.gz'
    with gzip.open(path, 'rt', encoding='utf-8') as f:
        return frozenset(line.strip() for line in f if line.strip())


def password_problem(password: str, *, email: str, name: str = '') -> str | None:
    """Motivo, em português simples, para recusar a senha nova. None = senha aceita."""
    if len(password) < MIN_LENGTH:
        return f'A senha precisa ter pelo menos {MIN_LENGTH} caracteres.'
    if len(password) > MAX_LENGTH:
        return f'A senha pode ter no máximo {MAX_LENGTH} caracteres.'
    if len(set(password)) < 5:
        return 'Essa senha repete demais os mesmos caracteres. Tente misturar mais.'
    lower = password.lower()
    if lower in _common_passwords():
        return 'Essa senha já apareceu em vazamentos na internet. Escolha outra.'
    personal = [email.split('@')[0].lower(), *(p.lower() for p in name.split())]
    if any(len(p) >= 4 and p in lower for p in personal):
        return 'A senha não pode conter seu nome ou seu e-mail.'
    return None


# Palavras curtas, sem acento e fáceis de ditar por telefone ou mensagem.
_WORDS = (
    'abacaxi agosto alegre amora ancora anel areia arroz asas atlas aurora avenida azul baleia bambu banana '
    'barco barro beija bela bicho bolo bombom bosque brisa bussola cabana cacau cafe caju calma camelo campo '
    'canela canoa cantor capim caqui caravela carta castelo cavalo cedro cereja cesta chave cidade cinema '
    'coala cobre coco colina cometa coral coruja costa cravo cristal dado delta doce dragao duna eclipse '
    'escada estrela farol fazenda feira festa figo floresta fogueira folha fonte foto fruta gaivota galho '
    'garrafa gato gelo girafa girassol globo golfinho goiaba grilo guia horta hotel ilha jade janela jardim '
    'jasmim jipe joia jornal kiwi lago lagoa lapis laranja lareira leque limao lince livro lontra lua '
    'macaco madeira malha mamao manga mapa mar mare medalha mel melao menta mesa milho mochila moeda montanha '
    'morango museu nuvem oceano oliva onda orquidea ouro ovelha palmeira panda papel parque passaporte pato '
    'pedra pena perola pescador piano pimenta pinheiro planeta polvo ponte porto praia prato quiosque raposa '
    'rede rio rocha roda rosa rota sabia safira sal salvia samba sapato selo serra sino sol sorvete tamara '
    'tatu teatro tenda tigre tomate trem trilha trovao tucano tulipa uva vale vela verao viagem vila vinho '
    'violao vulcao zebra'
).split()


def generate_temp_password() -> str:
    """Ex.: Coala-Farol-Trilha-Manga-48. Cerca de 37 bits de acaso, o bastante para algo que vale
    por 48 horas, só serve para o primeiro acesso e passa pelo limite de tentativas."""
    words = [secrets.choice(_WORDS).capitalize() for _ in range(4)]
    return '-'.join(words) + f'-{secrets.randbelow(90) + 10}'


def temp_password_expired(expires_at: datetime | None, now: datetime) -> bool:
    return expires_at is not None and expires_at <= now
