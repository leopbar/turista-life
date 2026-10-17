"""Conteúdo (rascunho/publicado), histórico, presença, fotos e configurações.

Revision ID: 0002
Revises: 0001
Create Date: 2026-10-17
"""
import sqlalchemy as sa
from alembic import op

revision = '0002'
down_revision = '0001'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'documents',
        sa.Column('key', sa.String(160), primary_key=True),
        sa.Column('collection', sa.String(40), nullable=True),
        sa.Column('position', sa.Integer, nullable=False),
        sa.Column('draft', sa.JSON, nullable=False),
        sa.Column('published', sa.JSON, nullable=True),
        sa.Column('draft_deleted', sa.Boolean, nullable=False),
        sa.Column('draft_updated_at', sa.DateTime, nullable=False),
        sa.Column('draft_updated_by', sa.String(254), nullable=True),
        sa.Column('published_at', sa.DateTime, nullable=True),
        sa.Column('published_by', sa.String(254), nullable=True),
        sa.Column('scheduled_at', sa.DateTime, nullable=True),
        sa.Column('scheduled_by', sa.String(254), nullable=True),
    )
    op.create_index('ix_documents_collection', 'documents', ['collection'])
    op.create_index('ix_documents_scheduled_at', 'documents', ['scheduled_at'])

    op.create_table(
        'versions',
        sa.Column('id', sa.Integer, primary_key=True),
        sa.Column('key', sa.String(160), nullable=False),
        sa.Column('data', sa.JSON, nullable=True),
        sa.Column('position', sa.Integer, nullable=False),
        sa.Column('action', sa.String(20), nullable=False),
        sa.Column('created_at', sa.DateTime, nullable=False),
        sa.Column('created_by', sa.String(254), nullable=True),
    )
    op.create_index('ix_versions_key', 'versions', ['key'])
    op.create_index('ix_versions_created_at', 'versions', ['created_at'])

    op.create_table(
        'presence',
        sa.Column('key', sa.String(160), primary_key=True),
        sa.Column('user_id', sa.Integer, primary_key=True),
        sa.Column('name', sa.String(80), nullable=False),
        sa.Column('seen_at', sa.DateTime, nullable=False),
    )

    op.create_table(
        'media',
        sa.Column('id', sa.String(32), primary_key=True),
        sa.Column('original_name', sa.String(200), nullable=False),
        sa.Column('alt', sa.String(300), nullable=False),
        sa.Column('focal_x', sa.Integer, nullable=False),
        sa.Column('focal_y', sa.Integer, nullable=False),
        sa.Column('width', sa.Integer, nullable=False),
        sa.Column('height', sa.Integer, nullable=False),
        sa.Column('widths', sa.JSON, nullable=False),
        sa.Column('size_bytes', sa.Integer, nullable=False),
        sa.Column('created_at', sa.DateTime, nullable=False),
        sa.Column('created_by', sa.String(254), nullable=True),
        sa.Column('deleted_at', sa.DateTime, nullable=True),
    )
    op.create_index('ix_media_deleted_at', 'media', ['deleted_at'])

    op.create_table(
        'settings',
        sa.Column('key', sa.String(60), primary_key=True),
        sa.Column('value', sa.String(500), nullable=False),
    )


def downgrade() -> None:
    for t in ('settings', 'media', 'presence', 'versions', 'documents'):
        op.drop_table(t)
