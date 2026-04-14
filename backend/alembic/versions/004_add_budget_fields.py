"""Add budget fields to hotels and ai_usage

Revision ID: 004
Revises: 003
Create Date: 2026-04-14
"""
from alembic import op
import sqlalchemy as sa

revision = '004'
down_revision = '003'
branch_labels = None
depends_on = None


def upgrade():
    # Hotel: monthly budget and status
    op.add_column('hotels', sa.Column('monthly_budget', sa.Float(), nullable=True, server_default='5.0'))
    op.add_column('hotels', sa.Column('status', sa.String(20), nullable=True, server_default='demo'))

    # AIUsage: pre-calculated cost
    op.add_column('ai_usage', sa.Column('cost_usd', sa.Float(), nullable=True, server_default='0.0'))


def downgrade():
    op.drop_column('ai_usage', 'cost_usd')
    op.drop_column('hotels', 'status')
    op.drop_column('hotels', 'monthly_budget')
