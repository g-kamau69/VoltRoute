
from datetime import datetime, timezone

from sqlalchemy import (
    Boolean,
    DateTime,
    String,
)
from sqlalchemy.orm import Mapped, mapped_column

from .base import Base


class SwapProvider(Base):
    __tablename__ = "swap_providers"

    id: Mapped[int] = mapped_column(
        primary_key=True
    )

    name: Mapped[str] = mapped_column(
        String(150),
        unique=True,
        nullable=False
    )

    website: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True
    )

    is_active: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=True
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False
    )
