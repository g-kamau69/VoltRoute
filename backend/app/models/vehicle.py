
from datetime import datetime, timezone

from sqlalchemy import (
    CheckConstraint,
    DateTime,
    Float,
    ForeignKey,
    String,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import Base


class Vehicle(Base):
    __tablename__ = "vehicles"

    __table_args__ = (
        UniqueConstraint(
            "tenant_id",
            "registration_number",
            name="uq_vehicles_tenant_registration",
        ),
        UniqueConstraint(
            "tenant_id",
            "fleet_id",
            name="uq_vehicles_tenant_fleet_id",
        ),
        UniqueConstraint(
            "tenant_id",
            "id",
            name="uq_vehicles_tenant_id",
        ),
        CheckConstraint(
            "battery_capacity_kwh > 0",
            name="ck_vehicles_battery_capacity",
        ),
        CheckConstraint(
            "battery_level >= 0 AND battery_level <= 100",
            name="ck_vehicles_battery_level",
        ),
        CheckConstraint(
            "energy_consumption_wh_per_km > 0",
            name="ck_vehicles_energy_consumption",
        ),
        CheckConstraint(
            "battery_configuration IN ('swappable', 'fixed')",
            name="ck_vehicles_battery_configuration",
        ),
        CheckConstraint(
            "status IN ('draft', 'active', 'maintenance', 'archived')",
            name="ck_vehicles_status",
        ),
        CheckConstraint(
            "telemetry_source IN ('simulated', 'physical', 'none')",
            name="ck_vehicles_telemetry_source",
        ),
    )

    id: Mapped[int] = mapped_column(
        primary_key=True
    )

    tenant_id: Mapped[int] = mapped_column(
        ForeignKey("tenants.id"),
        nullable=False,
        index=True,
    )

    fleet_id: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
    )

    registration_number: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
    )

    vin: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True,
    )

    manufacturer: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
    )

    model: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
    )

    vehicle_type: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
    )

    battery_capacity_kwh: Mapped[float] = mapped_column(
        Float,
        nullable=False,
    )

    battery_level: Mapped[float] = mapped_column(
        Float,
        nullable=False,
        default=100.0,
    )

    battery_configuration: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        default="swappable",
    )

    energy_consumption_wh_per_km: Mapped[float] = mapped_column(
        Float,
        nullable=False,
    )

    telemetry_source: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        default="none",
    )

    status: Mapped[str] = mapped_column(
        String(30),
        nullable=False,
        default="draft",
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

    tenant = relationship("Tenant")
