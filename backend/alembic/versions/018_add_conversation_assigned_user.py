"""Add Conversation.assigned_user_id for manager/operator assignment

Revision ID: 018
Revises: 017
Create Date: 2026-04-22

Nullable FK to users.id — a conversation can be unassigned (default) or
claimed by a manager. Index added for the admin filter "my conversations".

Uses batch_alter_table so the FK can be added on SQLite (which otherwise
rejects ALTER TABLE ... ADD CONSTRAINT). On Postgres this degrades to a
normal ALTER.
"""
from alembic import op
import sqlalchemy as sa

revision = '018'
down_revision = '017'
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table('conversations') as batch_op:
        batch_op.add_column(
            sa.Column('assigned_user_id', sa.Integer(), nullable=True),
        )
        batch_op.create_foreign_key(
            'fk_conversations_assigned_user_id_users',
            'users',
            ['assigned_user_id'],
            ['id'],
        )
    op.create_index(
        'ix_conversations_assigned_user_id',
        'conversations',
        ['assigned_user_id'],
    )


def downgrade():
    op.drop_index('ix_conversations_assigned_user_id', table_name='conversations')
    with op.batch_alter_table('conversations') as batch_op:
        batch_op.drop_constraint(
            'fk_conversations_assigned_user_id_users',
            type_='foreignkey',
        )
        batch_op.drop_column('assigned_user_id')
