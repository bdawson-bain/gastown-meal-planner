"""bio data on user_preferences, macros on meals, name/is_active on meal_plans

Revision ID: 0004
Revises: 0003
Create Date: 2026-04-22

"""
from typing import Sequence, Union

import sqlalchemy as sa

from alembic import op

revision: str = "0004"
down_revision: Union[str, None] = "0003"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # user_preferences: bio / fitness fields
    op.add_column("user_preferences", sa.Column("height_cm", sa.Integer(), nullable=True))
    op.add_column("user_preferences", sa.Column("weight_kg", sa.Numeric(5, 2), nullable=True))
    op.add_column("user_preferences", sa.Column("age", sa.Integer(), nullable=True))
    op.add_column("user_preferences", sa.Column("sex", sa.String(length=10), nullable=True))
    op.add_column("user_preferences", sa.Column("activity_level", sa.String(length=30), nullable=True))
    op.add_column("user_preferences", sa.Column("fitness_goal", sa.String(length=20), nullable=True))
    op.add_column("user_preferences", sa.Column("tdee_override", sa.Integer(), nullable=True))

    # meals: macro fields
    op.add_column("meals", sa.Column("calories", sa.Integer(), nullable=True))
    op.add_column("meals", sa.Column("protein_g", sa.Numeric(5, 1), nullable=True))
    op.add_column("meals", sa.Column("carbs_g", sa.Numeric(5, 1), nullable=True))
    op.add_column("meals", sa.Column("fat_g", sa.Numeric(5, 1), nullable=True))

    # meal_plans: human-readable label + active flag
    op.add_column("meal_plans", sa.Column("name", sa.String(length=120), nullable=True))
    op.add_column("meal_plans", sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true()))


def downgrade() -> None:
    op.drop_column("meal_plans", "is_active")
    op.drop_column("meal_plans", "name")

    op.drop_column("meals", "fat_g")
    op.drop_column("meals", "carbs_g")
    op.drop_column("meals", "protein_g")
    op.drop_column("meals", "calories")

    op.drop_column("user_preferences", "tdee_override")
    op.drop_column("user_preferences", "fitness_goal")
    op.drop_column("user_preferences", "activity_level")
    op.drop_column("user_preferences", "sex")
    op.drop_column("user_preferences", "age")
    op.drop_column("user_preferences", "weight_kg")
    op.drop_column("user_preferences", "height_cm")
