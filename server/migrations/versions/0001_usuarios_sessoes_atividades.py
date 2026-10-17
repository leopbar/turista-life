"""Usuários, sessões, tentativas de login e registro de atividades.

Revision ID: 0001
Revises:
Create Date: 2026-10-17
"""
import sqlalchemy as sa
from alembic import op

revision = '0001'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'users',
        sa.Column('id', sa.Integer, primary_key=True),
        sa.Column('email', sa.String(254), nullable=False),
        sa.Column('name', sa.String(80), nullable=False),
        sa.Column('role', sa.String(10), nullable=False),
        sa.Column('password_hash', sa.String(255), nullable=False),
        sa.Column('must_change_password', sa.Boolean, nullable=False),
        sa.Column('temp_password_expires_at', sa.DateTime, nullable=True),
        sa.Column('is_active', sa.Boolean, nullable=False),
        sa.Column('created_at', sa.DateTime, nullable=False),
        sa.Column('created_by_id', sa.Integer, sa.ForeignKey('users.id', ondelete='SET NULL'), nullable=True),
        sa.Column('password_changed_at', sa.DateTime, nullable=True),
        sa.Column('last_login_at', sa.DateTime, nullable=True),
        sa.CheckConstraint("role IN ('admin', 'editor')", name='ck_users_role'),
    )
    op.create_index('ix_users_email', 'users', ['email'], unique=True)

    op.create_table(
        'sessions',
        sa.Column('id', sa.Integer, primary_key=True),
        sa.Column('token_hash', sa.String(64), nullable=False),
        sa.Column('user_id', sa.Integer, sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('created_at', sa.DateTime, nullable=False),
        sa.Column('last_seen_at', sa.DateTime, nullable=False),
        sa.Column('expires_at', sa.DateTime, nullable=False),
        sa.Column('revoked_at', sa.DateTime, nullable=True),
        sa.Column('ip', sa.String(64), nullable=False),
        sa.Column('user_agent', sa.String(300), nullable=False),
    )
    op.create_index('ix_sessions_token_hash', 'sessions', ['token_hash'], unique=True)
    op.create_index('ix_sessions_user_id', 'sessions', ['user_id'])

    op.create_table(
        'login_attempts',
        sa.Column('id', sa.Integer, primary_key=True),
        sa.Column('email', sa.String(254), nullable=False),
        sa.Column('ip', sa.String(64), nullable=False),
        sa.Column('success', sa.Boolean, nullable=False),
        sa.Column('created_at', sa.DateTime, nullable=False),
    )
    op.create_index('ix_login_attempts_email_time', 'login_attempts', ['email', 'created_at'])
    op.create_index('ix_login_attempts_ip_time', 'login_attempts', ['ip', 'created_at'])

    op.create_table(
        'audit_log',
        sa.Column('id', sa.Integer, primary_key=True),
        sa.Column('created_at', sa.DateTime, nullable=False),
        sa.Column('actor_id', sa.Integer, nullable=True),
        sa.Column('actor_email', sa.String(254), nullable=True),
        sa.Column('action', sa.String(60), nullable=False),
        sa.Column('target', sa.String(254), nullable=True),
        sa.Column('ip', sa.String(64), nullable=True),
        sa.Column('details', sa.JSON, nullable=False),
        sa.Column('prev_hash', sa.String(64), nullable=False),
        sa.Column('hash', sa.String(64), nullable=False),
    )
    op.create_index('ix_audit_log_created_at', 'audit_log', ['created_at'])
    op.create_index('ix_audit_log_action', 'audit_log', ['action'])

    # O registro de atividades não pode ser alterado por ninguém, e só pode ser apagado depois de 1 ano.
    op.execute(
        """
        CREATE TRIGGER audit_log_no_update BEFORE UPDATE ON audit_log
        BEGIN SELECT RAISE(ABORT, 'O registro de atividades não pode ser alterado.'); END;
        """
    )
    op.execute(
        """
        CREATE TRIGGER audit_log_no_delete BEFORE DELETE ON audit_log
        WHEN OLD.created_at > datetime('now', '-365 days')
        BEGIN SELECT RAISE(ABORT, 'O registro de atividades só pode ser apagado depois de 1 ano.'); END;
        """
    )


def downgrade() -> None:
    op.execute('DROP TRIGGER IF EXISTS audit_log_no_delete')
    op.execute('DROP TRIGGER IF EXISTS audit_log_no_update')
    op.drop_table('audit_log')
    op.drop_table('login_attempts')
    op.drop_table('sessions')
    op.drop_table('users')
