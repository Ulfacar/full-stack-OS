"""Add Meta WhatsApp Cloud API fields

Revision ID: 008
Revises: 007
Create Date: 2026-04-14
"""
from alembic import op
import sqlalchemy as sa

revision = '008'
down_revision = '007'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('hotels', sa.Column('whatsapp_provider', sa.String(20), nullable=True, server_default='none'))
    op.add_column('hotels', sa.Column('meta_access_token', sa.String(500), nullable=True))
    op.add_column('hotels', sa.Column('meta_phone_number_id', sa.String(100), nullable=True))
    op.add_column('hotels', sa.Column('meta_business_id', sa.String(100), nullable=True))


def downgrade():
    op.drop_column('hotels', 'meta_business_id')
    op.drop_column('hotels', 'meta_phone_number_id')
    op.drop_column('hotels', 'meta_access_token')
    op.drop_column('hotels', 'whatsapp_provider')
