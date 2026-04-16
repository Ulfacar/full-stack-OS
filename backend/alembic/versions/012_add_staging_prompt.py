"""Add staging_prompt to hotels and prompt_history table

Revision ID: 012
Revises: 011
Create Date: 2026-04-16
"""
from alembic import op
import sqlalchemy as sa

revision = '012'
down_revision = '011'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('hotels', sa.Column('staging_prompt', sa.Text(), nullable=True))

    op.create_table(
        'prompt_history',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('hotel_id', sa.Integer(), sa.ForeignKey('hotels.id'), nullable=False),
        sa.Column('old_prompt', sa.Text(), nullable=True),
        sa.Column('new_prompt', sa.Text(), nullable=True),
        sa.Column('changed_by', sa.Integer(), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('changed_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
    )


def downgrade():
    op.drop_table('prompt_history')
    op.drop_column('hotels', 'staging_prompt')
