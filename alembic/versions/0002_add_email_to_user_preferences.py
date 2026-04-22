"""add email to user_preferences

Revision ID: 0002
Revises: 0001
Create Date: 2026-04-22

"""
from typing import Sequence, Union

import sqlalchemy as sa

from alembic import op

revision: str = "0002"
down_revision: Union[str, None] = "0001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("user_preferences", sa.Column("email", sa.String(), nullable=True))
    op.create_index("ix_user_preferences_email", "user_preferences", ["email"])


def downgrade() -> None:
    op.drop_index("ix_user_preferences_email", table_name="user_preferences")
    op.drop_column("user_preferences", "email")
