
from datetime import datetime, timezone

from sqlalchemy import (
    CheckConstraint,
    DateTime,
    Float,
    ForeignKey,
    ForeignKeyConstraint,
    Integer,
    String,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import Base


class StationBattery(Base):
    __tablename__ = "station_batteries"
    
    __table_args__ = (
        UniqueConstraint(
            "station_id",
            "serial_number",
            name="uq_station_batteries_serial"
        ),
        CheckConstraint(
            "charge_level BETWEEN 0 AND 100",
            name="ck_station_batteries_charge"
        ),
    )


    id: Mapped[int] = mapped_column(
        primary_key=True
    )
   
    
    station_id: Mapped[int] = mapped_column(
        ForeignKey("swap_stations.id"),
        nullable=False,
        index=True
    )



    serial_number: Mapped[str] = mapped_column(
        String(100),
        nullable=False
    )

    battery_type: Mapped[str] = mapped_column(
        String(100),
        nullable=False
    )

    charge_level: Mapped[float] = mapped_column(
        Float,
        nullable=False,
        default=100.0
    )

    status: Mapped[str] = mapped_column(
        String(30),
        nullable=False,
        default="available"
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False
    )

    
    station = relationship("SwapStation")
