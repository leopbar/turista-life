"""Tarefas em segundo plano: publicações agendadas e a manutenção diária.

Roda numa thread dentro do único processo do servidor (uvicorn --workers 1).
"""

import logging
import threading

from . import content
from .config import Settings
from .db import write

log = logging.getLogger('painel.worker')

TICK_SECONDS = 20


def tick(sessionmaker, settings: Settings) -> None:
    db = sessionmaker()
    try:
        with write(db):
            content.run_scheduled(db, settings)
        from . import maintenance

        maintenance.daily_if_due(sessionmaker, settings)
    finally:
        db.close()


def start(sessionmaker, settings: Settings) -> threading.Event:
    stop = threading.Event()

    def loop():
        while not stop.wait(TICK_SECONDS):
            try:
                tick(sessionmaker, settings)
            except Exception:  # noqa: BLE001 (a thread não pode morrer por um erro)
                log.exception('Erro nas tarefas em segundo plano')

    threading.Thread(target=loop, name='painel-worker', daemon=True).start()
    return stop
