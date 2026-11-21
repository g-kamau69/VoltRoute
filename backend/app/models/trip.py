
from datetime import datetime, timezone

from sqlalchemy import (
    CheckConstraint,
    DateTime,
    ForeignKeyConstraint,
    Integer,
    String,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import Base


class Trip(Base):
    __tablename__ = "trips"

    __table_args__ = (
        ForeignKeyConstraint(
            ["tenant_id", "vehicle_id"],
            ["vehicles.tenant_id", "vehicles.id"],
            name="fk_trips_tenant_vehicle"
        ),
        ForeignKeyConstraint(
            ["tenant_id", "driver_id"],
            ["users.tenant_id", "users.id"],
            name="fk_trips_tenant_driver"
        ),
        ForeignKeyConstraint(
            ["tenant_id", "route_id"],
            ["routes.tenant_id", "routes.id"],
            name="fk_trips_tenant_route"
        ),
        CheckConstraint(
            "status IN ('planned', 'active', 'completed', 'cancelled')",
            name="ck_trips_status"
        ),
    )

    id: Mapped[int] = mapped_column(
        primary_key=True
    )

    tenant_id: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        index=True
    )

    vehicle_id: Mapped[int] = mapped_column(
        Integer,
        nullable=False
    )

    driver_id: Mapped[int] = mapped_column(
        Integer,
        nullable=False
    )

    route_id: Mapped[int] = mapped_column(
        Integer,
        nullable=False
    )

    status: Mapped[str] = mapped_column(
        String(30),
        nullable=False,
        default="planned"
    )

    started_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True
    )

    completed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False
    )


    vehicle = relationship(
        "Vehicle",
        primaryjoin=(
            "and_(Trip.tenant_id == Vehicle.tenant_id, "
            "foreign(Trip.vehicle_id) == Vehicle.id)"
        ),
    )

    driver = relationship(
        "User",
        primaryjoin=(
            "and_(Trip.tenant_id == User.tenant_id, "
            "foreign(Trip.driver_id) == User.id)"
        ),
    )

    route = relationship(
        "Route",
        primaryjoin=(
            "and_(Trip.tenant_id == Route.tenant_id, "
            "foreign(Trip.route_id) == Route.id)"
        ),
    )
