
from datetime import datetime, timezone

from sqlalchemy import DateTime, String, ForeignKey, CheckConstraint
from sqlalchemy.orm import Mapped, mapped_column

from .base import Base


class Tenant(Base):
    __tablename__ = "tenants"

    __table_args__ = (
        CheckConstraint(
            "status IN ('active', 'suspended')",
            name="ck_tenants_status"
        ),
    )

    id: Mapped[int] = mapped_column(
        primary_key=True
    )

    name: Mapped[str] = mapped_column(
        String(150),
        nullable=False,
        unique=True
    )

    status: Mapped[str] = mapped_column(
        String(30),
        nullable=False,
        default="active"
    )

    approved_by: Mapped[int | None] = mapped_column(
        ForeignKey("platform_admins.id", ondelete="SET NULL"),
        nullable=True
    )

    approved_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False
    )
