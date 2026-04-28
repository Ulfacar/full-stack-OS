"""Add hotels.pms_kind for prompt branching (#21)

Revision ID: 021
Revises: 020
Create Date: 2026-04-28

PMS the hotel uses (none / exely / altegio / shelter / custom). Drives
booking-flow section in ai_service.generate_system_prompt — Exely-equipped
hotels get an auto-confirm path, no-PMS hotels get the Google-Sheets fallback
language. R2 (June 2026) plugs Exely API on top of the same field.
"""
from alembic import op
import sqlalchemy as sa


revision = '021'
down_revision = '020'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column(
        'hotels',
        sa.Column('pms_kind', sa.String(20), nullable=False, server_default='none'),
    )


def downgrade():
    op.drop_column('hotels', 'pms_kind')
