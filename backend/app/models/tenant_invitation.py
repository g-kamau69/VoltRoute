from datetime import datetime, timezone

from sqlalchemy import (
    DateTime,
    ForeignKey,
    ForeignKeyConstraint,
    Integer,
    String,
    CheckConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column

from .base import Base

class TenantInvitation(Base):
    __tablename__ = "tenant_invitations"

    __table_args__ = (
        CheckConstraint(
            "role IN ('tenant_admin', 'fleet_manager', 'driver')",
            name="ck_tenant_invitations_role"
        ),
        CheckConstraint(
            "status IN ('pending', 'accepted', 'revoked')",
            name="ck_tenant_invitations_status"
        ),
        ForeignKeyConstraint(
            ["tenant_id", "created_by_tenant_user_id"],
            ["users.tenant_id", "users.id"],
            name="fk_tenant_invitations_tenant_creator",
        ),

    )

    id: Mapped[int] = mapped_column(
        primary_key=True
    )
    tenant_id: Mapped[int] = mapped_column(
        ForeignKey("tenants.id"),
        nullable=False,
        index=True
    )

    email: Mapped[str] = mapped_column(
        String(255),
        nullable=False
    )

    full_name: Mapped[str] = mapped_column(
        String(150),
        nullable=False
    )

    role: Mapped[str] = mapped_column(
        String(30),
        nullable=False,
        default="tenant_admin"
    )

    token_hash: Mapped[str] = mapped_column(
        String(64),
        nullable=False,
        unique=True
    )

    status: Mapped[str] = mapped_column(
        String(30),
        nullable=False,
        default="pending"
    )
 
    created_by_admin_id: Mapped[int | None] = mapped_column(
        ForeignKey(
            "platform_admins.id",
            ondelete="SET NULL"
        ),
        nullable=True
    )

    created_by_tenant_user_id: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True,
    )


    expires_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False
    )

    accepted_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False
    )