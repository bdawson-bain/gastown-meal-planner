"""initial schema: users, user_preferences, meal_plans, meals, grocery_lists

Revision ID: 0001
Revises:
Create Date: 2026-04-21

"""
from typing import Sequence, Union

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

revision: str = "0001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_table(
        "user_preferences",
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("household_size", sa.Integer(), nullable=True),
        sa.Column("dietary_prefs", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("allergies", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("budget", sa.Numeric(10, 2), nullable=True),
        sa.Column("cook_time_minutes", sa.Integer(), nullable=True),
        sa.Column("openai_api_key", sa.String(), nullable=True),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("user_id"),
    )

    op.create_table(
        "meal_plans",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("week_start", sa.Date(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_meal_plans_user_id"), "meal_plans", ["user_id"])

    op.create_table(
        "meals",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("meal_plan_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("day", sa.String(length=10), nullable=False),
        sa.Column("meal_type", sa.String(length=20), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column(
            "ingredients_json",
            postgresql.JSONB(astext_type=sa.Text()),
            nullable=True,
        ),
        sa.ForeignKeyConstraint(["meal_plan_id"], ["meal_plans.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_meals_meal_plan_id"), "meals", ["meal_plan_id"])

    op.create_table(
        "grocery_lists",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("meal_plan_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column(
            "items_json",
            postgresql.JSONB(astext_type=sa.Text()),
            nullable=True,
        ),
        sa.ForeignKeyConstraint(
            ["meal_plan_id"], ["meal_plans.id"], ondelete="CASCADE"
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_grocery_lists_meal_plan_id"), "grocery_lists", ["meal_plan_id"])


def downgrade() -> None:
    op.drop_index(op.f("ix_grocery_lists_meal_plan_id"), table_name="grocery_lists")
    op.drop_table("grocery_lists")
    op.drop_index(op.f("ix_meals_meal_plan_id"), table_name="meals")
    op.drop_table("meals")
    op.drop_index(op.f("ix_meal_plans_user_id"), table_name="meal_plans")
    op.drop_table("meal_plans")
    op.drop_table("user_preferences")
    op.drop_table("users")
