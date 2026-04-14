"""Add wappi.pro fields to hotels

Revision ID: 005
Revises: 004
Create Date: 2026-04-14
"""
from alembic import op
import sqlalchemy as sa

revision = '005'
down_revision = '004'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('hotels', sa.Column('wappi_api_key', sa.String(255), nullable=True))
    op.add_column('hotels', sa.Column('wappi_profile_id', sa.String(100), nullable=True))


def downgrade():
    op.drop_column('hotels', 'wappi_profile_id')
    op.drop_column('hotels', 'wappi_api_key')
