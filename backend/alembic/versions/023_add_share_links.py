"""Add share_links table for partner-share read-only demo (#11)

Revision ID: 023
Revises: 022
Create Date: 2026-04-28

Owner clicks "Поделиться с партнёром" → token created → URL goes to
bookkeeper / co-founder / spouse before signing. Public GET endpoint
exposes a sanitized hotel preview, increments view_count, expires at
created_at + 7 days.
"""
from alembic import op
import sqlalchemy as sa


revision = '023'
down_revision = '022'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        'share_links',
        sa.Column('id', sa.Integer(), primary_key=True, index=True),
        sa.Column('token', sa.String(64), nullable=False, unique=True, index=True),
        sa.Column(
            'hotel_id', sa.Integer(),
            sa.ForeignKey('hotels.id'), nullable=False, index=True,
        ),
        sa.Column(
            'created_by_user_id', sa.Integer(),
            sa.ForeignKey('users.id'), nullable=False,
        ),
        sa.Column('view_count', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('expires_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column(
            'created_at', sa.DateTime(timezone=True),
            server_default=sa.func.now(), nullable=False,
        ),
    )


def downgrade():
    op.drop_table('share_links')
