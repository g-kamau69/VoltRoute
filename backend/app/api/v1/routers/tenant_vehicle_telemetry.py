
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.auth.tenant_dependencies import require_fleet_management
from app.database import get_db
from app.models.user import User
from app.models.vehicle import Vehicle
from app.models.vehicle_location import VehicleLocation
from app.schemas.vehicle_telemetry import (
    VehicleTelemetryCreate,
    VehicleTelemetryResponse,
)


router = APIRouter(
    prefix="/tenant/vehicles",
    tags=["Tenant Vehicle Telemetry"],
)


@router.post(
    "/{vehicle_id}/telemetry",
    response_model=VehicleTelemetryResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_vehicle_telemetry(
    vehicle_id: int,
    payload: VehicleTelemetryCreate,
    current_user: User = Depends(require_fleet_management),
    db: Session = Depends(get_db),
):
    vehicle = db.scalar(
        select(Vehicle)
        .where(
            Vehicle.id == vehicle_id,
            Vehicle.tenant_id == current_user.tenant_id,
        )
        .with_for_update()
    )

    if vehicle is None:
        raise HTTPException(
            status_code=404,
            detail="Vehicle not found",
        )

    if vehicle.status != "active":
        raise HTTPException(
            status_code=409,
            detail="Only active vehicles can receive telemetry",
        )

    if vehicle.telemetry_source != "simulated":
        raise HTTPException(
            status_code=409,
            detail="Vehicle is not configured for simulated telemetry",
        )

    reading = VehicleLocation(
        tenant_id=current_user.tenant_id,
        vehicle_id=vehicle.id,
        latitude=payload.latitude,
        longitude=payload.longitude,
        speed_kmh=payload.speed_kmh,
        battery_level=payload.battery_level,
        recorded_at=datetime.now(timezone.utc),
    )

    vehicle.battery_level = payload.battery_level

    db.add(reading)

    db.commit()
    db.refresh(reading)

    return reading
