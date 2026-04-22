"""Add Conversation.last_message_at / last_message_preview / unread_count

Revision ID: 017
Revises: 016
Create Date: 2026-04-22

Denormalised fields so the admin conversation list can render without
joining the messages table. Maintained by webhook handlers after each
incoming/outgoing message.
"""
from alembic import op
import sqlalchemy as sa

revision = '017'
down_revision = '016'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column(
        'conversations',
        sa.Column('last_message_at', sa.DateTime(timezone=True), nullable=True),
    )
    op.add_column(
        'conversations',
        sa.Column('last_message_preview', sa.String(length=500), nullable=True),
    )
    op.add_column(
        'conversations',
        sa.Column('unread_count', sa.Integer(), nullable=False, server_default='0'),
    )


def downgrade():
    op.drop_column('conversations', 'unread_count')
    op.drop_column('conversations', 'last_message_preview')
    op.drop_column('conversations', 'last_message_at')
