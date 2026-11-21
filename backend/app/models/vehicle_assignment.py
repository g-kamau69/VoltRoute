
from datetime import datetime, timezone

from sqlalchemy import (
    CheckConstraint,
    DateTime,
    ForeignKeyConstraint,
    Index,
    Integer,
    String,
    text,
)
from sqlalchemy.orm import Mapped, mapped_column

from .base import Base


class VehicleAssignment(Base):
    __tablename__ = "vehicle_assignments"

    __table_args__ = (
        ForeignKeyConstraint(
            ["tenant_id", "vehicle_id"],
            ["vehicles.tenant_id", "vehicles.id"],
            name="fk_assignments_tenant_vehicle",
        ),
        ForeignKeyConstraint(
            ["tenant_id", "driver_id"],
            ["users.tenant_id", "users.id"],
            name="fk_assignments_tenant_driver",
        ),

        ForeignKeyConstraint(
            ["tenant_id", "assigned_by_user_id"],
            ["users.tenant_id", "users.id"],
            name="fk_assignments_tenant_assigner",
        ),


        CheckConstraint(
            "released_at IS NULL OR released_at >= assigned_at",
            name="ck_assignments_valid_period",
        ),
        Index(
            "uq_assignments_active_vehicle",
            "tenant_id",
            "vehicle_id",
            unique=True,
            postgresql_where=text("released_at IS NULL"),
        ),
        Index(
            "uq_assignments_active_driver",
            "tenant_id",
            "driver_id",
            unique=True,
            postgresql_where=text("released_at IS NULL"),
        ),
    )

    id: Mapped[int] = mapped_column(
        primary_key=True
    )

    tenant_id: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        index=True,
    )

    vehicle_id: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )

    driver_id: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )

    assigned_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    released_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    assigned_by_user_id: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True,
    )

    notes: Mapped[str | None] = mapped_column(
        String(500),
        nullable=True,
    )
