import uuid
from datetime import datetime
from typing import TYPE_CHECKING, List, Optional

from sqlalchemy import DateTime, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base

if TYPE_CHECKING:
    from app.models.meal_feedback import MealFeedback
    from app.models.meal_plan import MealPlan
    from app.models.user_preferences import UserPreferences


class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    preferences: Mapped[Optional["UserPreferences"]] = relationship(
        back_populates="user", uselist=False, cascade="all, delete-orphan"
    )
    meal_plans: Mapped[List["MealPlan"]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )
    meal_feedback: Mapped[List["MealFeedback"]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )
