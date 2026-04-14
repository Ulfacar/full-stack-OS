"""Add debug logging fields to ai_usage

Revision ID: 009
Revises: 008
Create Date: 2026-04-14
"""
from alembic import op
import sqlalchemy as sa

revision = '009'
down_revision = '008'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('ai_usage', sa.Column('prompt_text', sa.Text(), nullable=True))
    op.add_column('ai_usage', sa.Column('response_text', sa.Text(), nullable=True))


def downgrade():
    op.drop_column('ai_usage', 'response_text')
    op.drop_column('ai_usage', 'prompt_text')
