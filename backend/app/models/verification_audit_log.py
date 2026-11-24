
from datetime import datetime, timezone

from sqlalchemy import (
    CheckConstraint,
    DateTime,
    ForeignKey,
    ForeignKeyConstraint,
    Integer,
    String,
    Text,
)
from sqlalchemy.orm import Mapped, mapped_column

from .base import Base


class VerificationAuditLog(Base):
    __tablename__ = "verification_audit_logs"

    __table_args__ = (
        CheckConstraint(
            "verification_type IN "
            "('organization', 'identity', 'driver_qualification')",
            name="ck_verification_audit_logs_type",
        ),
        CheckConstraint(
            "actor_type IN "
            "('platform_admin', 'tenant_user', 'provider', 'system')",
            name="ck_verification_audit_logs_actor_type",
        ),
        ForeignKeyConstraint(
            ["tenant_id", "actor_tenant_user_id"],
            ["users.tenant_id", "users.id"],
            name="fk_verification_audit_logs_actor_tenant_user",
        ),
    )

    id: Mapped[int] = mapped_column(
        primary_key=True,
    )

    verification_type: Mapped[str] = mapped_column(
        String(30),
        nullable=False,
    )

    verification_id: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )

    tenant_id: Mapped[int | None] = mapped_column(
        ForeignKey("tenants.id"),
        nullable=True,
        index=True,
    )

    actor_type: Mapped[str] = mapped_column(
        String(30),
        nullable=False,
    )

    actor_platform_admin_id: Mapped[int | None] = mapped_column(
        ForeignKey(
            "platform_admins.id",
            ondelete="SET NULL",
        ),
        nullable=True,
    )

    actor_tenant_user_id: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True,
    )

    action: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
    )

    old_status: Mapped[str | None] = mapped_column(
        String(30),
        nullable=True,
    )

    new_status: Mapped[str | None] = mapped_column(
        String(30),
        nullable=True,
    )

    provider: Mapped[str | None] = mapped_column(
        String(30),
        nullable=True,
    )

    details: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
