import uuid
from typing import TYPE_CHECKING, Any, Optional

from sqlalchemy import ForeignKey
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base

if TYPE_CHECKING:
    from app.models.meal_plan import MealPlan


class GroceryList(Base):
    __tablename__ = "grocery_lists"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    meal_plan_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("meal_plans.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    # Consolidated list of {name, quantity, unit, category} objects
    items_json: Mapped[Optional[Any]] = mapped_column(JSONB, nullable=True)

    meal_plan: Mapped["MealPlan"] = relationship(back_populates="grocery_lists")
