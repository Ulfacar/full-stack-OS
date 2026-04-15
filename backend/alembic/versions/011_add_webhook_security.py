"""Add webhook_secret and meta_app_secret to hotels

Revision ID: 011
Revises: 010
Create Date: 2026-04-15
"""
from alembic import op
import sqlalchemy as sa

revision = '011'
down_revision = '010'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('hotels', sa.Column('webhook_secret', sa.String(64), nullable=True))
    op.add_column('hotels', sa.Column('meta_app_secret', sa.String(255), nullable=True))


def downgrade():
    op.drop_column('hotels', 'meta_app_secret')
    op.drop_column('hotels', 'webhook_secret')
