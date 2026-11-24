
from datetime import datetime, timezone

from sqlalchemy import (
    CheckConstraint,
    DateTime,
    Float,
    ForeignKey,
    Index,
    Integer,
    String,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from geoalchemy2 import Geography
from .base import Base


class SwapStation(Base):
    __tablename__ = "swap_stations"

    __table_args__ = (
        Index(
            "ix_swap_stations_location",
            "location",
            postgresql_using="gist",
        ),
        CheckConstraint(
            "total_batteries >= 0",
            name="ck_swap_stations_total_batteries"
        ),
        CheckConstraint(
            "available_batteries >= 0 "
            "AND available_batteries <= total_batteries",
            name="ck_swap_stations_available_batteries"
        ),
        CheckConstraint(
            "latitude BETWEEN -90 AND 90",
            name="ck_swap_stations_latitude"
        ),
        CheckConstraint(
            "longitude BETWEEN -180 AND 180",
            name="ck_swap_stations_longitude"
        ),
        CheckConstraint(
            "inventory_source = 'simulated'",
            name="ck_swap_stations_inventory_source"
        ),

    )

    id: Mapped[int] = mapped_column(
        primary_key=True
    )

    
    provider_id: Mapped[int] = mapped_column(
        ForeignKey("swap_providers.id"),
        nullable=False,
        index=True
    )


    name: Mapped[str] = mapped_column(
        String(150),
        nullable=False
    )

    address: Mapped[str] = mapped_column(
        String(255),
        nullable=False
    )

    latitude: Mapped[float] = mapped_column(
        Float,
        nullable=False
    )

    longitude: Mapped[float] = mapped_column(
        Float,
        nullable=False
    )


    location: Mapped[object | None] = mapped_column(
        Geography(
            geometry_type="POINT",
            srid=4326,
            spatial_index=False
        ),
        nullable=True
    )


    location_source: Mapped[str | None] = mapped_column(
        String(500),
        nullable=True
    )

    location_verified_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True
    )

    total_batteries: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0
    )

    available_batteries: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0
    )


    inventory_source: Mapped[str] = mapped_column(
        String(30),
        nullable=False,
        default="simulated",
        server_default="simulated"
    )


    status: Mapped[str] = mapped_column(
        String(30),
        nullable=False,
        default="active"
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False
    )

    provider = relationship("SwapProvider")
