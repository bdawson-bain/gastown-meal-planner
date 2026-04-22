import uuid
from decimal import Decimal
from typing import TYPE_CHECKING, Any, Optional

from sqlalchemy import ForeignKey, Integer, Numeric, String
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base

if TYPE_CHECKING:
    from app.models.user import User


class UserPreferences(Base):
    __tablename__ = "user_preferences"

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        primary_key=True,
    )
    email: Mapped[Optional[str]] = mapped_column(String, nullable=True, index=True)
    household_size: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    dietary_prefs: Mapped[Optional[Any]] = mapped_column(JSONB, nullable=True)
    allergies: Mapped[Optional[Any]] = mapped_column(JSONB, nullable=True)
    budget: Mapped[Optional[Decimal]] = mapped_column(Numeric(10, 2), nullable=True)
    cook_time_minutes: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    openai_api_key: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    height_cm: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    weight_kg: Mapped[Optional[Decimal]] = mapped_column(Numeric(5, 2), nullable=True)
    age: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    sex: Mapped[Optional[str]] = mapped_column(String(10), nullable=True)
    activity_level: Mapped[Optional[str]] = mapped_column(String(30), nullable=True)
    fitness_goal: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    tdee_override: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)

    user: Mapped["User"] = relationship(back_populates="preferences")
