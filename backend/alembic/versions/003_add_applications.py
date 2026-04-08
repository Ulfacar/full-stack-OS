"""Add applications table

Revision ID: 003
Revises: 002
Create Date: 2026-04-08
"""
from alembic import op
import sqlalchemy as sa

revision = '003'
down_revision = '002'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'applications',
        sa.Column('id', sa.Integer(), primary_key=True, index=True),
        sa.Column('status', sa.String(20), server_default='pending'),
        sa.Column('hotel_name', sa.String(255), nullable=False),
        sa.Column('contact_name', sa.String(255), nullable=True),
        sa.Column('contact_phone', sa.String(50), nullable=True),
        sa.Column('contact_email', sa.String(255), nullable=True),
        sa.Column('form_data', sa.JSON(), nullable=True),
        sa.Column('generated_prompt', sa.Text(), nullable=True),
        sa.Column('hotel_id', sa.Integer(), sa.ForeignKey('hotels.id'), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
    )


def downgrade() -> None:
    op.drop_table('applications')
