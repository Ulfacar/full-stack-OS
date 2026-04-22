"""Add hotels.payment_details (JSON, nullable) for bank/phone/IBAN

Revision ID: 019
Revises: 018
Create Date: 2026-04-22

Optional payment requisites the bot quotes to the guest when asked.
Left NULLable — the sales wizard marks this as optional and the prompt
fails loud (owner alert) if the bot tries to quote requisites while the
field is empty.
"""
from alembic import op
import sqlalchemy as sa

revision = '019'
down_revision = '018'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column(
        'hotels',
        sa.Column('payment_details', sa.JSON(), nullable=True),
    )


def downgrade():
    op.drop_column('hotels', 'payment_details')
