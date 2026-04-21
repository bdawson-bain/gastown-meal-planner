import uuid
from decimal import Decimal
from typing import TYPE_CHECKING, Any, Optional

from sqlalchemy import ForeignKey, Integer, Numeric
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.encryption import EncryptedString
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
    household_size: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    dietary_prefs: Mapped[Optional[Any]] = mapped_column(JSONB, nullable=True)
    allergies: Mapped[Optional[Any]] = mapped_column(JSONB, nullable=True)
    # Weekly grocery budget in USD
    budget: Mapped[Optional[Decimal]] = mapped_column(Numeric(10, 2), nullable=True)
    cook_time_minutes: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    # Stored encrypted; requires ENCRYPTION_KEY env var at runtime
    openai_api_key: Mapped[Optional[str]] = mapped_column(
        EncryptedString, nullable=True
    )

    user: Mapped["User"] = relationship(back_populates="preferences")
