"""Add manager fields to hotels and conversations

Revision ID: 007
Revises: 006
Create Date: 2026-04-14
"""
from alembic import op
import sqlalchemy as sa

revision = '007'
down_revision = '006'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('hotels', sa.Column('manager_telegram_id', sa.String(100), nullable=True))
    op.add_column('hotels', sa.Column('manager_name', sa.String(255), nullable=True))
    op.add_column('conversations', sa.Column('operator_telegram_id', sa.String(100), nullable=True))


def downgrade():
    op.drop_column('conversations', 'operator_telegram_id')
    op.drop_column('hotels', 'manager_name')
    op.drop_column('hotels', 'manager_telegram_id')
