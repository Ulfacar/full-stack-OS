"""Add messages.sender for business-level author (client/bot/operator)

Revision ID: 015
Revises: 014
Create Date: 2026-04-22
"""
from alembic import op
import sqlalchemy as sa

revision = '015'
down_revision = '014'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column(
        'messages',
        sa.Column('sender', sa.String(length=20), nullable=True),
    )
    op.create_index('ix_messages_sender', 'messages', ['sender'])


def downgrade():
    op.drop_index('ix_messages_sender', table_name='messages')
    op.drop_column('messages', 'sender')
