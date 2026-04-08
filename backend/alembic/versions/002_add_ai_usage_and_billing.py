"""Add ai_usage and billing tables

Revision ID: 002
Revises: 001
Create Date: 2026-04-08
"""
from alembic import op
import sqlalchemy as sa

revision = '002'
down_revision = '001'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'ai_usage',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('hotel_id', sa.Integer(), sa.ForeignKey('hotels.id'), nullable=False),
        sa.Column('conversation_id', sa.Integer(), sa.ForeignKey('conversations.id'), nullable=True),
        sa.Column('prompt_tokens', sa.Integer(), default=0),
        sa.Column('completion_tokens', sa.Integer(), default=0),
        sa.Column('model', sa.String(100)),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index('ix_ai_usage_hotel_id', 'ai_usage', ['hotel_id'])
    op.create_index('ix_ai_usage_created_at', 'ai_usage', ['created_at'])

    op.create_table(
        'billing',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('hotel_id', sa.Integer(), sa.ForeignKey('hotels.id'), nullable=False),
        sa.Column('month', sa.String(7), nullable=False),
        sa.Column('amount', sa.Integer(), default=20),
        sa.Column('status', sa.String(20), default='pending'),
        sa.Column('paid_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index('ix_billing_hotel_id', 'billing', ['hotel_id'])
    op.create_index('ix_billing_status', 'billing', ['status'])


def downgrade() -> None:
    op.drop_table('billing')
    op.drop_table('ai_usage')
