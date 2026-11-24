
from datetime import date, datetime, timezone

from sqlalchemy import (
    CheckConstraint,
    Date,
    DateTime,
    ForeignKeyConstraint,
    Integer,
    String,
    Text,
)
from sqlalchemy.orm import Mapped, mapped_column

from .base import Base


class DriverQualification(Base):
    __tablename__ = "driver_qualifications"

    __table_args__ = (
        ForeignKeyConstraint(
            ["tenant_id", "driver_id"],
            ["users.tenant_id", "users.id"],
            name="fk_driver_qualifications_tenant_driver",
        ),
        CheckConstraint(
            "status IN ("
            "'pending', 'in_progress', 'needs_review', "
            "'approved', 'rejected', 'expired', 'cancelled'"
            ")",
            name="ck_driver_qualifications_status",
        ),
        CheckConstraint(
            "verification_method IN "
            "('manual', 'automated', 'hybrid')",
            name="ck_driver_qualifications_method",
        ),
        CheckConstraint(
            "provider IN ('manual', 'mock', 'persona', 'smile_id', "
            "'sumsub', 'other')",
            name="ck_identity_verifications_provider",
        ),
        CheckConstraint(
            "licence_expires_at IS NULL "
            "OR licence_issued_at IS NULL "
            "OR licence_expires_at >= licence_issued_at",
            name="ck_driver_qualifications_licence_dates",
        ),
    )

    id: Mapped[int] = mapped_column(
        primary_key=True,
    )

    tenant_id: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        index=True,
    )

    driver_id: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        index=True,
    )

    status: Mapped[str] = mapped_column(
        String(30),
        nullable=False,
        default="pending",
    )

    verification_method: Mapped[str] = mapped_column(
        String(30),
        nullable=False,
        default="manual",
    )

    provider: Mapped[str] = mapped_column(
        String(30),
        nullable=False,
        default="manual",
    )

    provider_reference: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
    )

    licence_country: Mapped[str | None] = mapped_column(
        String(2),
        nullable=True,
    )

    licence_class: Mapped[str | None] = mapped_column(
        String(30),
        nullable=True,
    )

    licence_issued_at: Mapped[date | None] = mapped_column(
    Date,
    nullable=True,
)

    licence_expires_at: Mapped[date | None] = mapped_column(
        Date,
        nullable=True,
    )

    review_notes: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    reviewed_by_admin_id: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True,
    )

    reviewed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    verified_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
