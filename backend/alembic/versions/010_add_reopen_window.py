"""Add reopen_window_hours to hotels

Revision ID: 010
Revises: 009
Create Date: 2026-04-14
"""
from alembic import op
import sqlalchemy as sa

revision = '010'
down_revision = '009'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('hotels', sa.Column('reopen_window_hours', sa.Integer(), nullable=True, server_default='24'))


def downgrade():
    op.drop_column('hotels', 'reopen_window_hours')
