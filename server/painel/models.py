"""Tabelas do painel. Conteúdo e fotos chegam nas próximas fases."""

from datetime import datetime
from typing import Literal

from sqlalchemy import JSON, Boolean, DateTime, ForeignKey, Index, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from .db import Base, utcnow

Role = Literal['admin', 'editor']


class User(Base):
    __tablename__ = 'users'

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    email: Mapped[str] = mapped_column(String(254), unique=True, index=True)
    name: Mapped[str] = mapped_column(String(80))
    role: Mapped[str] = mapped_column(String(10))
    # Hash Argon2id. Nem o administrador nem quem ler o banco consegue ver a senha.
    password_hash: Mapped[str] = mapped_column(String(255))
    must_change_password: Mapped[bool] = mapped_column(Boolean, default=True)
    temp_password_expires_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)
    created_by_id: Mapped[int | None] = mapped_column(ForeignKey('users.id', ondelete='SET NULL'), nullable=True)
    password_changed_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    last_login_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)


class AuthSession(Base):
    """Sessão de login. O navegador guarda o token; o banco guarda só o hash dele."""

    __tablename__ = 'sessions'

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    token_hash: Mapped[str] = mapped_column(String(64), unique=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey('users.id', ondelete='CASCADE'), index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)
    last_seen_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)
    expires_at: Mapped[datetime] = mapped_column(DateTime)
    revoked_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    ip: Mapped[str] = mapped_column(String(64))
    user_agent: Mapped[str] = mapped_column(String(300))


class LoginAttempt(Base):
    __tablename__ = 'login_attempts'
    __table_args__ = (
        Index('ix_login_attempts_email_time', 'email', 'created_at'),
        Index('ix_login_attempts_ip_time', 'ip', 'created_at'),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    # O e-mail digitado (exista ou não): o limite vale igual para contas reais e inventadas.
    email: Mapped[str] = mapped_column(String(254))
    ip: Mapped[str] = mapped_column(String(64))
    success: Mapped[bool] = mapped_column(Boolean)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)


class AuditEntry(Base):
    """Registro de atividades. Triggers no banco impedem alterar ou apagar (só após 1 ano)."""

    __tablename__ = 'audit_log'

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow, index=True)
    actor_id: Mapped[int | None] = mapped_column(Integer, nullable=True)
    # Guardado por extenso: o registro continua legível mesmo depois que o usuário é excluído.
    actor_email: Mapped[str | None] = mapped_column(String(254), nullable=True)
    action: Mapped[str] = mapped_column(String(60), index=True)
    target: Mapped[str | None] = mapped_column(String(254), nullable=True)
    ip: Mapped[str | None] = mapped_column(String(64), nullable=True)
    details: Mapped[dict] = mapped_column(JSON, default=dict)
    prev_hash: Mapped[str] = mapped_column(String(64))
    hash: Mapped[str] = mapped_column(String(64))


class Document(Base):
    """Um bloco de conteúdo do site: rascunho (o que se edita) e publicado (o que está no ar)."""

    __tablename__ = 'documents'

    key: Mapped[str] = mapped_column(String(160), primary_key=True)
    # Itens de coleção (artigos, páginas de produto…): "article:slug".
    collection: Mapped[str | None] = mapped_column(String(40), nullable=True, index=True)
    position: Mapped[int] = mapped_column(Integer, default=0)
    draft: Mapped[dict] = mapped_column(JSON)
    published: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    # Item marcado para sair do site na próxima publicação.
    draft_deleted: Mapped[bool] = mapped_column(Boolean, default=False)
    draft_updated_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)
    draft_updated_by: Mapped[str | None] = mapped_column(String(254), nullable=True)
    published_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    published_by: Mapped[str | None] = mapped_column(String(254), nullable=True)
    scheduled_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True, index=True)
    scheduled_by: Mapped[str | None] = mapped_column(String(254), nullable=True)


class Version(Base):
    """Cada publicação vira uma página do caderno: dá para voltar a ela depois."""

    __tablename__ = 'versions'

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    key: Mapped[str] = mapped_column(String(160), index=True)
    # None = o item saiu do site nesta publicação.
    data: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    position: Mapped[int] = mapped_column(Integer, default=0)
    action: Mapped[str] = mapped_column(String(20))
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow, index=True)
    created_by: Mapped[str | None] = mapped_column(String(254), nullable=True)


class Presence(Base):
    """Quem está com um documento aberto agora (aviso "a Laura está editando")."""

    __tablename__ = 'presence'

    key: Mapped[str] = mapped_column(String(160), primary_key=True)
    user_id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(80))
    seen_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)


class Media(Base):
    """Foto da biblioteca. Os arquivos ficam em public/media/<id>/<largura>.webp."""

    __tablename__ = 'media'

    id: Mapped[str] = mapped_column(String(32), primary_key=True)
    original_name: Mapped[str] = mapped_column(String(200))
    alt: Mapped[str] = mapped_column(String(300))
    focal_x: Mapped[int] = mapped_column(Integer, default=50)
    focal_y: Mapped[int] = mapped_column(Integer, default=50)
    width: Mapped[int] = mapped_column(Integer)
    height: Mapped[int] = mapped_column(Integer)
    widths: Mapped[list] = mapped_column(JSON)
    size_bytes: Mapped[int] = mapped_column(Integer)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)
    created_by: Mapped[str | None] = mapped_column(String(254), nullable=True)
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True, index=True)


class Setting(Base):
    """Pequenos valores do sistema (último backup baixado, etc.)."""

    __tablename__ = 'settings'

    key: Mapped[str] = mapped_column(String(60), primary_key=True)
    value: Mapped[str] = mapped_column(String(500))
