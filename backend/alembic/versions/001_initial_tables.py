"""Initial tables

Revision ID: 001
Revises: None
Create Date: 2026-04-08
"""
from alembic import op
import sqlalchemy as sa

revision = '001'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'users',
        sa.Column('id', sa.Integer(), primary_key=True, index=True),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('email', sa.String(255), unique=True, index=True, nullable=False),
        sa.Column('hashed_password', sa.String(255), nullable=False),
        sa.Column('is_active', sa.Boolean(), server_default='true'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
    )

    op.create_table(
        'hotels',
        sa.Column('id', sa.Integer(), primary_key=True, index=True),
        sa.Column('owner_id', sa.Integer(), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('slug', sa.String(255), unique=True, index=True),
        sa.Column('address', sa.String(500), nullable=True),
        sa.Column('phone', sa.String(50), nullable=True),
        sa.Column('email', sa.String(255), nullable=True),
        sa.Column('website', sa.String(500), nullable=True),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('telegram_bot_token', sa.String(255), unique=True, index=True, nullable=True),
        sa.Column('whatsapp_phone', sa.String(50), nullable=True),
        sa.Column('ai_model', sa.String(100), server_default='deepseek/deepseek-chat'),
        sa.Column('system_prompt', sa.Text(), nullable=True),
        sa.Column('rooms', sa.JSON(), nullable=True),
        sa.Column('rules', sa.JSON(), nullable=True),
        sa.Column('amenities', sa.JSON(), nullable=True),
        sa.Column('communication_style', sa.String(50), server_default='friendly'),
        sa.Column('languages', sa.JSON(), nullable=True),
        sa.Column('is_active', sa.Boolean(), server_default='true'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
    )

    op.create_table(
        'clients',
        sa.Column('id', sa.Integer(), primary_key=True, index=True),
        sa.Column('hotel_id', sa.Integer(), sa.ForeignKey('hotels.id'), nullable=False),
        sa.Column('telegram_id', sa.String(100), index=True, nullable=True),
        sa.Column('telegram_username', sa.String(255), nullable=True),
        sa.Column('whatsapp_phone', sa.String(50), nullable=True),
        sa.Column('name', sa.String(255), nullable=True),
        sa.Column('language', sa.String(10), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
    )

    op.create_table(
        'conversations',
        sa.Column('id', sa.Integer(), primary_key=True, index=True),
        sa.Column('hotel_id', sa.Integer(), sa.ForeignKey('hotels.id'), nullable=False),
        sa.Column('client_id', sa.Integer(), sa.ForeignKey('clients.id'), nullable=False),
        sa.Column('status', sa.String(50), server_default='active'),
        sa.Column('channel', sa.String(50), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
    )

    op.create_table(
        'messages',
        sa.Column('id', sa.Integer(), primary_key=True, index=True),
        sa.Column('conversation_id', sa.Integer(), sa.ForeignKey('conversations.id'), nullable=False),
        sa.Column('role', sa.String(20), nullable=False),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
    )


def downgrade() -> None:
    op.drop_table('messages')
    op.drop_table('conversations')
    op.drop_table('clients')
    op.drop_table('hotels')
    op.drop_table('users')
