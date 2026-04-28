"""Add hotels.activated_at — first-message activation timestamp (#23)

Revision ID: 022
Revises: 021
Create Date: 2026-04-28

Set when the very first client message reaches the bot, then stays put.
Drives the "Активирован ✓" badge in the admin and the celebratory TG ping
to the manager. Nullable: pre-#23 hotels stay NULL until next interaction.
"""
from alembic import op
import sqlalchemy as sa


revision = '022'
down_revision = '021'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column(
        'hotels',
        sa.Column('activated_at', sa.DateTime(timezone=True), nullable=True),
    )


def downgrade():
    op.drop_column('hotels', 'activated_at')
