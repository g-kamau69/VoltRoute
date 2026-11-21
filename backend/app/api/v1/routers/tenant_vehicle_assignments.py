from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.auth.tenant_dependencies import require_fleet_management
from app.database import get_db
from app.models.tenant import Tenant
from app.models.user import User
from app.models.vehicle import Vehicle
from app.models.vehicle_assignment import VehicleAssignment
from app.schemas.vehicle_assignment import (
    VehicleAssignmentCreate,
    VehicleAssignmentResponse,
)
from datetime import datetime, timezone

router = APIRouter(
    prefix="/tenant/vehicle-assignments",
    tags=["Tenant Vehicle Assignments"],
)

@router.post(
    "/",
    response_model=VehicleAssignmentResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_vehicle_assignment(
    payload: VehicleAssignmentCreate,
    current_user: User = Depends(require_fleet_management),
    db: Session = Depends(get_db),
):
    tenant = db.scalar(
        select(Tenant)
        .where(
            Tenant.id == current_user.tenant_id,
        )
        .with_for_update()
    )

    if tenant is None or tenant.status != "active":
        raise HTTPException(
            status_code=409,
            detail="Tenant is not active",
        )

    driver = db.scalar(
        select(User)
        .where(
            User.id == payload.driver_id,
            User.tenant_id == current_user.tenant_id,
        )
    )

    if driver is None:
        raise HTTPException(
            status_code=404,
            detail="Driver not found",
        )

    if driver.role != "driver" or not driver.is_active:
        raise HTTPException(
            status_code=409,
            detail="Driver is not eligible for vehicle assignment",
        )

    vehicle = db.scalar(
        select(Vehicle)
        .where(
            Vehicle.id == payload.vehicle_id,
            Vehicle.tenant_id == current_user.tenant_id,
        )
    )

    if vehicle is None:
        raise HTTPException(
            status_code=404,
            detail="Vehicle not found",
        )

    if vehicle.status != "active":
        raise HTTPException(
            status_code=409,
            detail="Only active vehicles can be assigned to drivers",
        )

    existing_driver_assignment = db.scalar(
        select(VehicleAssignment.id)
        .where(
            VehicleAssignment.tenant_id
            == current_user.tenant_id,
            VehicleAssignment.driver_id
            == payload.driver_id,
            VehicleAssignment.released_at.is_(None),
        )
    )

    if existing_driver_assignment is not None:
        raise HTTPException(
            status_code=409,
            detail="Driver already has an active vehicle assignment",
        )

    existing_vehicle_assignment = db.scalar(
        select(VehicleAssignment.id)
        .where(
            VehicleAssignment.tenant_id
            == current_user.tenant_id,
            VehicleAssignment.vehicle_id
            == payload.vehicle_id,
            VehicleAssignment.released_at.is_(None),
        )
    )

    if existing_vehicle_assignment is not None:
        raise HTTPException(
            status_code=409,
            detail="Vehicle is already assigned to another driver",
        )

    assignment = VehicleAssignment(
        tenant_id=current_user.tenant_id,
        driver_id=payload.driver_id,
        vehicle_id=payload.vehicle_id,
        assigned_by_user_id=current_user.id,
        notes=payload.notes,
    )

    db.add(assignment)  

    try:
        db.commit()
        db.refresh(assignment)
    except IntegrityError:
        raise HTTPException(
            status_code=409,
            detail="Vehicle assignment conflict",
        )

    return assignment

@router.post(
    "/{assignment_id}/release",
    response_model=VehicleAssignmentResponse,
)
def release_vehicle_assignment(
    assignment_id: int,
    current_user: User = Depends(require_fleet_management),
    db: Session = Depends(get_db),
):
    tenant = db.scalar(
        select(Tenant)
        .where(Tenant.id == current_user.tenant_id)
        .with_for_update()
    )

    if tenant is None or tenant.status != "active":
        raise HTTPException(
            status_code = 409,
            detail="Tenant is not active",
        )

    assignment = db.scalar(
        select(VehicleAssignment)
        .where(
            VehicleAssignment.id == assignment_id,
            VehicleAssignment.tenant_id == current_user.tenant_id,
        )
        .with_for_update()
    )

    if assignment is None:
        raise HTTPException(
            status_code=404,
            detail="Vehicle assignment not found",
        )

    if assignment.released_at is not None:
        raise HTTPException(
            status_code=409,
            detail="Vehicle assignment has already been released",
        )

    now = datetime.now(timezone.utc)

    assigned_at = assignment.assigned_at

    if assigned_at.tzinfo is None:
        assigned_at = assigned_at.replace(tzinfo=timezone.utc)

    if now < assigned_at:
        raise HTTPException(
            status_code=409,
            detail="Assignment start time is in the future",
        )

    assignment.released_at = now

    db.commit()
    db.refresh(assignment)

    return assignment

@router.get(
    "/",
    response_model=list[VehicleAssignmentResponse],
)
def list_active_vehicle_assignments(
    current_user: User = Depends(require_fleet_management),
    db: Session = Depends(get_db),
):
    assignments = db.scalars(
        select(VehicleAssignment)
        .where(
            VehicleAssignment.tenant_id
            == current_user.tenant_id,
            VehicleAssignment.released_at.is_(None),
        )
        .order_by(VehicleAssignment.assigned_at.desc())
    ).all()

    return assignments

@router.get(
    "/history",
    response_model=list[VehicleAssignmentResponse],
)
def list_vehicle_assignment_history(
    current_user: User = Depends(require_fleet_management),
    db: Session = Depends(get_db),
):
    assignments = db.scalars(
        select(VehicleAssignment)
        .where(
            VehicleAssignment.tenant_id
            == current_user.tenant_id,
        )
        .order_by(VehicleAssignment.assigned_at.desc())
    ).all()

    return assignments