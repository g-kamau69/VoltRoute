
from datetime import datetime, timezone

from sqlalchemy import DateTime, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from .base import Base


class TenantRegistrationRequest(Base):
    __tablename__ = "tenant_registration_requests"

    id: Mapped[int] = mapped_column(
        primary_key=True
    )

    organization_name: Mapped[str] = mapped_column(
        String(150),
        nullable=False
    )

    contact_name: Mapped[str] = mapped_column(
        String(150),
        nullable=False
    )

    contact_email: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
        index=True
    )

    contact_phone: Mapped[str | None] = mapped_column(
        String(30),
        nullable=True
    )

    status: Mapped[str] = mapped_column(
        String(30),
        nullable=False,
        default="pending"
    )

    review_notes: Mapped[str | None] = mapped_column(
        Text,
        nullable=True
    )

    reviewed_by: Mapped[int | None] = mapped_column(
        ForeignKey("platform_admins.id"),
        nullable=True
    )

    reviewed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False
    )
