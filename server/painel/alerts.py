"""Alertas de segurança por e-mail, pelo Gmail (com "senha de app" colocada no .env do servidor).

Sem Gmail configurado, os alertas continuam aparecendo no painel (registro de atividades).
O envio acontece numa thread separada e cada tipo de alerta sai no máximo uma vez a cada 15 minutos.
"""

import logging
import smtplib
import threading
import time
from email.message import EmailMessage

from .config import Settings

log = logging.getLogger('painel.alerts')

_last_sent: dict[str, float] = {}
_lock = threading.Lock()
QUIET_SECONDS = 15 * 60

# Ações do registro que viram aviso no painel e e-mail.
ALERT_ACTIONS = {
    'conta_bloqueada', 'ip_bloqueado', 'recuperacao_de_emergencia', 'registro_adulterado',
    'backup_falhou', 'agendamento_falhou', 'admin_criado', 'admin_promovido',
}


def configured(settings: Settings) -> bool:
    return bool(settings.gmail_user and settings.gmail_app_password and settings.alert_to)


def send(settings: Settings, kind: str, subject: str, body: str, *, sender=None) -> bool:
    """Agenda o envio. Devolve False se não há Gmail configurado ou se o mesmo alerta acabou de sair."""
    if not configured(settings):
        return False
    with _lock:
        now = time.monotonic()
        if now - _last_sent.get(kind, -QUIET_SECONDS) < QUIET_SECONDS:
            return False
        _last_sent[kind] = now
    msg = EmailMessage()
    msg['Subject'] = f'[Turista-Life Administração] {subject}'
    msg['From'] = settings.gmail_user
    msg['To'] = ', '.join(settings.alert_to)
    msg.set_content(body + '\n\nVeja os detalhes em Atividades, no painel.\n')
    threading.Thread(target=sender or _smtp, args=(settings, msg), daemon=True).start()
    return True


def _smtp(settings: Settings, msg: EmailMessage) -> None:
    try:
        with smtplib.SMTP_SSL('smtp.gmail.com', 465, timeout=20) as s:
            s.login(settings.gmail_user, settings.gmail_app_password)
            s.send_message(msg)
    except Exception:  # noqa: BLE001
        log.exception('Não foi possível enviar o alerta por e-mail')
