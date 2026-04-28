"""Add hotels.avg_booking_price_usd + sub_fee_usd for ROI report (#33)

Revision ID: 024
Revises: 023
Create Date: 2026-04-28

avg_booking_price_usd: fallback when ConfirmedBooking row has no amount_usd
(legacy hotels created before #25). Default 50 USD — covers a typical
1-2 night stay in КР mini-hotel segment.

sub_fee_usd: monthly subscription. Default 40 (current Назира-tier price).
Stored per-hotel so we can grandfather pricing if needed.
"""
from alembic import op
import sqlalchemy as sa


revision = '024'
down_revision = '023'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column(
        'hotels',
        sa.Column('avg_booking_price_usd', sa.Float(), nullable=False, server_default='50.0'),
    )
    op.add_column(
        'hotels',
        sa.Column('sub_fee_usd', sa.Float(), nullable=False, server_default='40.0'),
    )


def downgrade():
    op.drop_column('hotels', 'sub_fee_usd')
    op.drop_column('hotels', 'avg_booking_price_usd')
