"""Add role to users

Revision ID: 006
Revises: 005
Create Date: 2026-04-14
"""
from alembic import op
import sqlalchemy as sa

revision = '006'
down_revision = '005'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('users', sa.Column('role', sa.String(20), nullable=True, server_default='admin'))


def downgrade():
    op.drop_column('users', 'role')
