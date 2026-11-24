
from datetime import datetime, timezone

from sqlalchemy import (
    CheckConstraint,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
)
from sqlalchemy.orm import Mapped, mapped_column

from .base import Base


class OrganizationVerification(Base):
    __tablename__ = "organization_verifications"

    __table_args__ = (
        CheckConstraint(
            "status IN ("
            "'pending', 'in_progress', 'needs_review', "
            "'approved', 'rejected', 'expired', 'cancelled'"
            ")",
            name="ck_org_verifications_status",
        ),
        CheckConstraint(
            "verification_method IN "
            "('manual', 'automated', 'hybrid')",
            name="ck_org_verifications_method",
        ),
        CheckConstraint(
            "provider IN ('manual', 'mock', 'persona', 'smile_id', "
            "'sumsub', 'other')",
            name="ck_org_verifications_provider",
        ),
    )

    id: Mapped[int] = mapped_column(
        primary_key=True,
    )

    registration_request_id: Mapped[int] = mapped_column(
        ForeignKey("tenant_registration_requests.id"),
        nullable=False,
        index=True,
    )

    tenant_id: Mapped[int | None] = mapped_column(
        ForeignKey("tenants.id"),
        nullable=True,
        index=True,
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

    status: Mapped[str] = mapped_column(
        String(30),
        nullable=False,
        default="pending",
    )

    business_registration_number: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True,
    )

    review_notes: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    reviewed_by_admin_id: Mapped[int | None] = mapped_column(
        ForeignKey("platform_admins.id", ondelete="SET NULL"),
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

    expires_at: Mapped[datetime | None] = mapped_column(
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
