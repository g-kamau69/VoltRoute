
from datetime import datetime, timezone

from sqlalchemy import (
    CheckConstraint,
    DateTime,
    ForeignKeyConstraint,
    Integer,
    String,
    Text,
)
from sqlalchemy.orm import Mapped, mapped_column

from .base import Base


class IdentityVerification(Base):
    __tablename__ = "identity_verifications"

    __table_args__ = (
        ForeignKeyConstraint(
            ["tenant_id", "user_id"],
            ["users.tenant_id", "users.id"],
            name="fk_identity_verifications_tenant_user",
        ),
        CheckConstraint(
            "status IN ("
            "'pending', 'in_progress', 'needs_review', "
            "'approved', 'rejected', 'expired', 'cancelled'"
            ")",
            name="ck_identity_verifications_status",
        ),
        CheckConstraint(
            "verification_method IN "
            "('manual', 'automated', 'hybrid')",
            name="ck_identity_verifications_method",
        ),
        CheckConstraint(
            "provider IN ('manual', 'mock', 'persona', 'smile_id', "
            "'sumsub', 'other')",
            name="ck_identity_verifications_provider",
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

    user_id: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
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

    document_type: Mapped[str | None] = mapped_column(
        String(50),
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
