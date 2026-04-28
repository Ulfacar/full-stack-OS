"""Add confirmed_bookings table for ROI raw data (#25)

Revision ID: 020
Revises: 019
Create Date: 2026-04-28

Manager confirms a booking from the admin panel and types the $ amount
manually. Each row is a single confirmed booking — feeds #33 monthly ROI
report. Will be replaced by Exely auto-confirm in R2 (#37, June 2026), at
which point this table stays as the storage layer.
"""
from alembic import op
import sqlalchemy as sa


revision = '020'
down_revision = '019'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        'confirmed_bookings',
        sa.Column('id', sa.Integer(), primary_key=True, index=True),
        sa.Column(
            'conversation_id', sa.Integer(),
            sa.ForeignKey('conversations.id'), nullable=False, index=True,
        ),
        sa.Column(
            'hotel_id', sa.Integer(),
            sa.ForeignKey('hotels.id'), nullable=False, index=True,
        ),
        sa.Column('amount_usd', sa.Float(), nullable=False),
        sa.Column('nights', sa.Integer(), nullable=False),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column(
            'confirmed_by_user_id', sa.Integer(),
            sa.ForeignKey('users.id'), nullable=False,
        ),
        sa.Column(
            'confirmed_at', sa.DateTime(timezone=True),
            server_default=sa.func.now(), nullable=False,
        ),
    )
    # Compound index for #33 monthly aggregation: by hotel + date range
    op.create_index(
        'ix_confirmed_bookings_hotel_date',
        'confirmed_bookings',
        ['hotel_id', 'confirmed_at'],
    )


def downgrade():
    op.drop_index('ix_confirmed_bookings_hotel_date', table_name='confirmed_bookings')
    op.drop_table('confirmed_bookings')
