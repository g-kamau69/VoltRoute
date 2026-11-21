
from datetime import datetime, timezone

from sqlalchemy import Boolean, DateTime, String, CheckConstraint   
from sqlalchemy.orm import Mapped, mapped_column

from .base import Base


class PlatformAdmin(Base):
    __tablename__ = "platform_admins"

    __table_args__ = (
        CheckConstraint(
            "role IN ('super_admin', 'platform_admin')",
            name="ck_platform_admins_role"
        ),
    )


    id: Mapped[int] = mapped_column(
        primary_key=True
    )

    full_name: Mapped[str] = mapped_column(
        String(150),
        nullable=False
    )

    email: Mapped[str] = mapped_column(
        String(255),
        unique=True,
        nullable=False,
        index=True
    )

    password_hash: Mapped[str] = mapped_column(
        String(255),
        nullable=False
    )

    role: Mapped[str] = mapped_column(
        String(30),
        nullable=False,
        default="platform_admin"
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

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False
    )
