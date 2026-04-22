"""Composite indices for admin conversation list + message fetch

Revision ID: 016
Revises: 015
Create Date: 2026-04-22

Two hot paths the admin UI is about to hit:
  * "latest conversations for hotel X" -> (hotel_id, updated_at)
  * "ordered messages of conversation Y" -> (conversation_id, created_at)

We intentionally store ASC order — Postgres can reverse-scan when the
query sorts DESC, and SQLite only learned DESC indexes recently so we
keep it portable.
"""
from alembic import op

revision = '016'
down_revision = '015'
branch_labels = None
depends_on = None


def upgrade():
    op.create_index(
        'ix_conversations_hotel_updated',
        'conversations',
        ['hotel_id', 'updated_at'],
    )
    op.create_index(
        'ix_messages_conversation_created',
        'messages',
        ['conversation_id', 'created_at'],
    )


def downgrade():
    op.drop_index('ix_messages_conversation_created', table_name='messages')
    op.drop_index('ix_conversations_hotel_updated', table_name='conversations')
