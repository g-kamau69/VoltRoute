
from datetime import datetime, timezone

from sqlalchemy import (
    CheckConstraint,
    DateTime,
    Float,
    ForeignKeyConstraint,
    Integer,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import Base


class VehicleLocation(Base):
    __tablename__ = "vehicle_locations"

    __table_args__ = (
        ForeignKeyConstraint(
            ["tenant_id", "vehicle_id"],
            ["vehicles.tenant_id", "vehicles.id"],
            name="fk_vehicle_locations_tenant_vehicle"
        ),
        CheckConstraint(
            "latitude BETWEEN -90 AND 90",
            name="ck_vehicle_locations_latitude"
        ),
        CheckConstraint(
            "longitude BETWEEN -180 AND 180",
            name="ck_vehicle_locations_longitude"
        ),
        CheckConstraint(
            "speed_kmh >= 0",
            name="ck_vehicle_locations_speed"
        ),
        CheckConstraint(
            "battery_level BETWEEN 0 AND 100",
            name="ck_vehicle_locations_battery"
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
        nullable=False,
        index=True
    )

    latitude: Mapped[float] = mapped_column(
        Float,
        nullable=False
    )

    longitude: Mapped[float] = mapped_column(
        Float,
        nullable=False
    )

    speed_kmh: Mapped[float] = mapped_column(
        Float,
        nullable=False,
        default=0.0
    )

    battery_level: Mapped[float] = mapped_column(
        Float,
        nullable=False
    )

    recorded_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
        index=True
    )

    vehicle = relationship(
        "Vehicle",
        primaryjoin=(
            "and_(VehicleLocation.tenant_id == Vehicle.tenant_id, "
            "foreign(VehicleLocation.vehicle_id) == Vehicle.id)"
        ),
    )
