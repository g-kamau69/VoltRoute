
from datetime import datetime, timezone

from sqlalchemy import (
    Boolean,
    CheckConstraint,
    DateTime,
    Float,
    ForeignKey,
    ForeignKeyConstraint,
    String,
    UniqueConstraint
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import Base


class Route(Base):
    __tablename__ = "routes"

    
    __table_args__ = (
    
        UniqueConstraint(
            "tenant_id",
            "id",
            name="uq_routes_tenant_id"
        ),
        CheckConstraint(
            "estimated_distance_km >= 0",
            name="ck_routes_distance"
        ),
        CheckConstraint(
            "estimated_energy_kwh >= 0",
            name="ck_routes_energy"
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

    origin_name: Mapped[str] = mapped_column(
        String(150),
        nullable=False
    )

    destination_name: Mapped[str] = mapped_column(
        String(150),
        nullable=False
    )

    origin_latitude: Mapped[float] = mapped_column(
        Float,
        nullable=False
    )

    origin_longitude: Mapped[float] = mapped_column(
        Float,
        nullable=False
    )

    destination_latitude: Mapped[float] = mapped_column(
        Float,
        nullable=False
    )

    destination_longitude: Mapped[float] = mapped_column(
        Float,
        nullable=False
    )

    estimated_distance_km: Mapped[float] = mapped_column(
        Float,
        nullable=False
    )

    estimated_energy_kwh: Mapped[float] = mapped_column(
        Float,
        nullable=False
    )

    requires_swap: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=False
    )

    
    
    recommended_swap_station_id: Mapped[int | None] = mapped_column(
        ForeignKey("swap_stations.id"),
        nullable=True
    )



    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False
    )

    tenant = relationship("Tenant")
    recommended_swap_station = relationship("SwapStation")


