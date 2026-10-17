"""Configuração do painel, lida das variáveis de ambiente (nunca do código ou do Git)."""

import os
import secrets
from dataclasses import dataclass
from pathlib import Path


def _bool(name: str, default: bool) -> bool:
    value = os.environ.get(name)
    return default if value is None else value.strip().lower() in {'1', 'true', 'sim', 'yes'}


def _load_secret(data_dir: Path) -> str:
    """Chave usada para assinar o token anti-CSRF. Vem do ambiente ou de um arquivo gerado uma vez em data/."""
    if key := os.environ.get('PAINEL_SECRET_KEY'):
        return key
    path = data_dir / 'secret.key'
    if path.exists():
        return path.read_text().strip()
    data_dir.mkdir(parents=True, exist_ok=True)
    key = secrets.token_urlsafe(48)
    path.write_text(key)
    try:
        path.chmod(0o600)
    except OSError:
        pass
    return key


@dataclass(frozen=True)
class Settings:
    data_dir: Path
    database_url: str
    secret_key: str
    # Produção: True (cookie __Host- só por HTTPS). Desenvolvimento local em http: False.
    cookie_secure: bool
    # Endereços de onde o painel aceita pedidos que alteram dados (proteção contra CSRF).
    allowed_origins: tuple[str, ...]
    # Atrás do nginx do servidor: o IP real vem no cabeçalho X-Real-IP.
    trust_proxy: bool
    debug: bool
    admin_dist: Path | None
    # Cópia do site compilada para a pré-visualização (base /site/), servida pelo próprio painel.
    site_dist: Path | None = None
    # Alertas de segurança por e-mail (Gmail com "senha de app"). Vazio = só avisos no painel.
    gmail_user: str = ''
    gmail_app_password: str = ''
    alert_to: tuple[str, ...] = ()
    session_idle_minutes: int = 60
    session_max_hours: int = 12
    temp_password_hours: int = 48
    # Tentativas de login: por conta (com espera progressiva) e por IP.
    account_free_failures: int = 5
    account_window_minutes: int = 60
    account_max_wait_seconds: int = 3600
    ip_max_failures: int = 20
    ip_window_minutes: int = 15

    @property
    def cookie_name(self) -> str:
        # O prefixo __Host- obriga o navegador a só aceitar o cookie via HTTPS, sem domínio e no caminho "/".
        return '__Host-painel' if self.cookie_secure else 'painel_session'


def load_settings() -> Settings:
    data_dir = Path(os.environ.get('PAINEL_DATA_DIR', Path(__file__).resolve().parent.parent / 'data'))
    data_dir.mkdir(parents=True, exist_ok=True)
    dist = os.environ.get('PAINEL_ADMIN_DIST')
    origins = os.environ.get('PAINEL_ALLOWED_ORIGINS', 'http://localhost:4322')
    return Settings(
        data_dir=data_dir,
        database_url=os.environ.get('PAINEL_DATABASE_URL', f'sqlite:///{(data_dir / "painel.db").as_posix()}'),
        secret_key=_load_secret(data_dir),
        cookie_secure=_bool('PAINEL_COOKIE_SECURE', False),
        allowed_origins=tuple(o.strip().rstrip('/') for o in origins.split(',') if o.strip()),
        trust_proxy=_bool('PAINEL_TRUST_PROXY', False),
        debug=_bool('PAINEL_DEBUG', False),
        admin_dist=Path(dist) if dist else None,
        site_dist=Path(site) if (site := os.environ.get('PAINEL_SITE_DIST')) else None,
        gmail_user=os.environ.get('PAINEL_GMAIL_USER', '').strip(),
        gmail_app_password=os.environ.get('PAINEL_GMAIL_APP_PASSWORD', '').replace(' ', ''),
        alert_to=tuple(a.strip() for a in os.environ.get('PAINEL_ALERT_TO', os.environ.get('PAINEL_GMAIL_USER', '')).split(',') if a.strip()),
    )
