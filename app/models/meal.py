import uuid
from typing import TYPE_CHECKING, Any, Optional

from sqlalchemy import ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base

if TYPE_CHECKING:
    from app.models.meal_plan import MealPlan


class Meal(Base):
    __tablename__ = "meals"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    meal_plan_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("meal_plans.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    # Day of the week: "monday" through "sunday"
    day: Mapped[str] = mapped_column(String(10), nullable=False)
    # Slot: "breakfast", "lunch", "dinner", or "snack"
    meal_type: Mapped[str] = mapped_column(String(20), nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    # List of {name, quantity, unit} objects
    ingredients_json: Mapped[Optional[Any]] = mapped_column(JSONB, nullable=True)

    meal_plan: Mapped["MealPlan"] = relationship(back_populates="meals")
