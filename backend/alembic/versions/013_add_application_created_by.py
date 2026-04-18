"""Add created_by_user_id to applications

Revision ID: 013
Revises: 012
Create Date: 2026-04-18
"""
from alembic import op
import sqlalchemy as sa

revision = '013'
down_revision = '012'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column(
        'applications',
        sa.Column('created_by_user_id', sa.Integer(), sa.ForeignKey('users.id'), nullable=True),
    )
    op.create_index(
        'ix_applications_created_by_user_id',
        'applications',
        ['created_by_user_id'],
    )


def downgrade():
    op.drop_index('ix_applications_created_by_user_id', table_name='applications')
    op.drop_column('applications', 'created_by_user_id')
