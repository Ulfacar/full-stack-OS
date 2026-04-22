"""Add conversations.category for GPT-classified dialog topic

Revision ID: 014
Revises: 013
Create Date: 2026-04-22
"""
from alembic import op
import sqlalchemy as sa

revision = '014'
down_revision = '013'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column(
        'conversations',
        sa.Column('category', sa.String(length=50), nullable=True),
    )
    op.create_index('ix_conversations_category', 'conversations', ['category'])


def downgrade():
    op.drop_index('ix_conversations_category', table_name='conversations')
    op.drop_column('conversations', 'category')
