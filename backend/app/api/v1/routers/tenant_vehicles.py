from fastapi import (
    APIRouter,
    Depends,
    File,
    HTTPException,
    Query,
    UploadFile,
    status,
)
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.auth.tenant_dependencies import (
    get_current_tenant_user,
    require_fleet_management,
    require_tenant_admin,
)
from app.database import get_db
from app.models.user import User
from app.models.vehicle import Vehicle
from app.schemas.vehicle import (
    VehicleCreate,
    VehicleResponse,
    VehicleUpdate,
)
from app.services.vehicle_csv import validate_vehicle_csv
from app.models.tenant import Tenant

router = APIRouter(
    prefix="/tenant/vehicles",
    tags=["Tenant Vehicles"],
)

@router.get(
    "/",
    response_model=list[VehicleResponse],
)

def list_tenant_vehicles(
    limit: int = Query(default=50,ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    user: User = Depends(get_current_tenant_user),
    db: Session = Depends(get_db),
):
    statement = (
        select(Vehicle)
        .where(Vehicle.tenant_id == user.tenant_id)
        .order_by(Vehicle.id.asc())
        .limit(limit)
        .offset(offset)
    )

    return db.scalars(statement).all()

@router.post(
    "/",
    response_model=VehicleResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_tenant_vehicle(
    payload: VehicleCreate,
    user: User = Depends(require_fleet_management),
    db: Session = Depends(get_db),
):
    registration = payload.registration_number.strip().upper()
    fleet_id = payload.fleet_id.strip().upper()

    if not registration or not fleet_id:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Fleet ID and registration number are required",
        )

    existing_vehicle = db.scalar(
        select(Vehicle.id).where(
            Vehicle.tenant_id == user.tenant_id,
            (
                (func.upper(Vehicle.registration_number) == registration)
                | (func.upper(Vehicle.fleet_id) == fleet_id)
            ),
        )
    )

    if existing_vehicle is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Fleet ID or vehicle registration already exists",
        )

    vehicle = Vehicle(
        tenant_id=user.tenant_id,
        fleet_id=fleet_id,
        registration_number=registration,
        vin=(
            payload.vin.strip().upper()
            if payload.vin
            else None
        ),
        manufacturer=payload.manufacturer.strip(),
        model=payload.model.strip(),
        vehicle_type=payload.vehicle_type,
        battery_capacity_kwh=payload.battery_capacity_kwh,
        battery_level=payload.battery_level,
        battery_configuration=payload.battery_configuration,
        energy_consumption_wh_per_km=(
            payload.energy_consumption_wh_per_km
        ),
        telemetry_source=payload.telemetry_source,
        status="draft",
    )

    db.add(vehicle)

    try:
        db.commit()
        db.refresh(vehicle)
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Vehicle registration conflict",
        )

    return vehicle


@router.post(
    "/{vehicle_id}/activate",
    response_model=VehicleResponse,
)
def activate_tenant_vehicle(
    vehicle_id: int,
    user: User = Depends(require_fleet_management),
    db: Session = Depends(get_db),
):
    vehicle = db.scalar(
        select(Vehicle)
        .where(
            Vehicle.id == vehicle_id,
            Vehicle.tenant_id == user.tenant_id,
        )
        .with_for_update()
    )

    if vehicle is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Vehicle not found",
        )

    if vehicle.status != "draft":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Only draft vehicles can be activated",
        )

    if (
        not vehicle.fleet_id.strip()
        or not vehicle.registration_number.strip()
        or not vehicle.manufacturer.strip()
        or not vehicle.model.strip()
        or vehicle.battery_capacity_kwh <= 0
        or vehicle.energy_consumption_wh_per_km <= 0
        or vehicle.battery_configuration not in ("swappable", "fixed")
    ):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Vehicle configuration is incomplete",
        )

    if vehicle.telemetry_source == "none":
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Configure a telemetry source before activation",
        )

    vehicle.status = "active"

    db.commit()
    db.refresh(vehicle)

    return vehicle

@router.post(
    "/{vehicle_id}/enter-maintenance",
    response_model=VehicleResponse,
)
def move_vehicle_to_maintenance(
    vehicle_id: int,
    user: User = Depends(require_fleet_management),
    db: Session = Depends(get_db),
):
    vehicle = db.scalar(
        select(Vehicle)
        .where(
            Vehicle.id == vehicle_id,
            Vehicle.tenant_id == user.tenant_id,
        )
        .with_for_update()
    )

    if vehicle is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Vehicle not found",
        )

    if vehicle.status != "active":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Only active vehicles can enter maintenance",
        )

    vehicle.status = "maintenance"

    db.commit()
    db.refresh(vehicle)

    return vehicle

@router.post(
    "/{vehicle_id}/return-to-service",
    response_model=VehicleResponse,
)
def return_vehicle_to_service(
    vehicle_id: int,
    user: User = Depends(require_fleet_management),
    db: Session = Depends(get_db),
):
    vehicle = db.scalar(
        
        select(Vehicle)
        .where(
            Vehicle.id == vehicle_id,
            Vehicle.tenant_id == user.tenant_id,
        )
        .with_for_update()
    )

    if vehicle is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Vehicle not found",
        )

    if vehicle.status != "maintenance":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Only vehicles in maintenance can return to service",
        )

    if vehicle.telemetry_source == "none":
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Configure a telemetry source before returning to service",
        )

    vehicle.status = "active"

    db.commit()
    db.refresh(vehicle)

    return vehicle

@router.post(
    "/{vehicle_id}/archive",
    response_model=VehicleResponse,
)
def archive_tenant_vehicle(
    vehicle_id: int,
    user: User = Depends(require_fleet_management),
    db: Session = Depends(get_db),
):
    vehicle = db.scalar(
        
        select(Vehicle)
        .where(
            Vehicle.id == vehicle_id,
            Vehicle.tenant_id == user.tenant_id,
        )
        .with_for_update()
    )

    if vehicle is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Vehicle not found",
        )

    if vehicle.status == "archived":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Vehicle is already archived",
        )

    vehicle.status = "archived"

    db.commit()
    db.refresh(vehicle)

    return vehicle

MAX_CSV_BYTES = 2 * 1024 * 1024

@router.post("/import/preview")
async def preview_vehicle_import(
    file: UploadFile = File(...),
    user: User = Depends(require_fleet_management),
    db: Session = Depends(get_db),
):
    if not file.filename or not file.filename.lower().endswith(".csv"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Upload a CSV file",
        )

    try:
        content_bytes = await file.read(MAX_CSV_BYTES + 1)
    finally:
        await file.close()

    if len(content_bytes) > MAX_CSV_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_CONTENT_TOO_LARGE,
            detail="CSV file exceeds 2 MB",
        )

    try:
        text = content_bytes.decode("utf-8-sig")
    except UnicodeDecodeError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="CSV must use UTF-8 encoding",
        )

    try:
        result = validate_vehicle_csv(text)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(exc),
        )

    existing_vehicles = db.scalars(
        select(Vehicle).where(
            Vehicle.tenant_id == user.tenant_id
        )
    ).all()

    existing_fleet_ids = {
        vehicle.fleet_id.upper()
        for vehicle in existing_vehicles
    }

    existing_registrations = {
        vehicle.registration_number.upper()
        for vehicle in existing_vehicles
    }

    confirmed_valid_rows = []

    for row in result["valid_rows"]:
        vehicle = row["vehicle"]

        fleet_id = vehicle["fleet_id"].strip().upper()
        registration = (
            vehicle["registration_number"].strip().upper()
        )

        row_errors = []

        if fleet_id in existing_fleet_ids:
            row_errors.append(
                "Fleet ID already exists in tenant vehicles"
            )

        if registration in existing_registrations:
            row_errors.append(
                "Registration number already exists in tenant vehicles"
            )

        if row_errors:
            result["errors"].append({
                "row": row["row"],
                "errors": row_errors,
            })
        else:
            confirmed_valid_rows.append(row)

    result["valid_rows"] = confirmed_valid_rows
    result["valid_count"] = len(confirmed_valid_rows)
    result["error_count"] = len(result["errors"])

    return result

@router.post(
    "/import/commit",
    status_code=status.HTTP_201_CREATED,
)
async def confirm_vehicle_import(
    file: UploadFile = File(...),
    user: User = Depends(require_fleet_management),
    db: Session = Depends(get_db),
):
    if not file.filename or not file.filename.lower().endswith(".csv"):
        raise HTTPException(
            status_code=400,
            detail="Upload a CSV file",
        )

    try:
        content_bytes = await file.read(MAX_CSV_BYTES + 1)
    finally:
        await file.close()

    if len(content_bytes) > MAX_CSV_BYTES:
        raise HTTPException(
            status_code=413,
            detail="CSV file exceeds 2 MB",
        )

    try:
        text = content_bytes.decode("utf-8-sig")
        result = validate_vehicle_csv(text)
    except UnicodeDecodeError:
        raise HTTPException(
            status_code=400,
            detail="CSV must use UTF-8 encoding",
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=422,
            detail=str(exc),
        )


    if result["total_rows"] == 0:
        raise HTTPException(
            status_code=422,
            detail="CSV contains no vehicle records",
        )

    if result["error_count"] > 0:
        raise HTTPException(
            status_code=422,
            detail={
                "message": "Correct CSV errors before importing",
                "errors": result["errors"],
            },
        )

    

    tenant = db.scalar(
        select(Tenant)
        .where(
            Tenant.id == user.tenant_id,
            Tenant.status == "active",
        )
        .with_for_update()
    )

    if tenant is None:
        raise HTTPException(
            status_code=403,
            detail="Tenant is not active",
        )

    existing_vehicles = db.scalars(
        select(Vehicle).where(
            Vehicle.tenant_id == user.tenant_id
        )
    ).all()

    existing_fleet_ids = {
        v.fleet_id.strip().upper()
        for v in existing_vehicles
    }

    existing_registrations = {
        v.registration_number.strip().upper()
        for v in existing_vehicles
    }

    conflicts = []
    new_vehicles = []

    for row in result["valid_rows"]:
        data = row["vehicle"].copy()

        data["fleet_id"] = data["fleet_id"].strip().upper()
        data["registration_number"] = (
            data["registration_number"].strip().upper()
        )
        data["manufacturer"] = data["manufacturer"].strip()
        data["model"] = data["model"].strip()

        if data.get("vin"):
            data["vin"] = data["vin"].strip().upper() or None

        row_errors =  []

        for field in (
            "fleet_id",
            "registration_number",
            "manufacturer",
            "model",
        ):

            if not data.get(field) or not data[field].strip():
                row_errors.append(f"{field} is required")

        if data["fleet_id"] in existing_fleet_ids:
            row_errors.append("Fleet ID already exists")

        if data['registration_number'] in existing_registrations:
            row_errors.append("Registration number already exists")

        if row_errors:
            conflicts.append({
                "row": row["row"],
                "errors": row_errors,
            })
            continue

        new_vehicles.append(
            Vehicle(
                tenant_id=user.tenant_id,
                **data,
                status="draft",
            )
        )

    if conflicts:
        raise HTTPException(
            status_code=409,
            detail={
                "message": "Import conflicts detected",
                "errors": conflicts,
            },
        )

    try:
        db.add_all(new_vehicles)
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=409,
            detail="Vehicle import conflict; no records imported",
        )

    return {
        "message": "Fleet import successful",
        "tenant_id": user.tenant_id,
        "imported_count": len(new_vehicles),
        "fleet_ids": [v.fleet_id for v in new_vehicles],
    }

@router.patch(
    "/{vehicle_id}",
    response_model=VehicleResponse,
)
def update_tenant_vehicle(
    vehicle_id: int,
    payload: VehicleUpdate,
    user: User = Depends(require_fleet_management),
    db: Session = Depends(get_db),
):
    vehicle = db.scalar(
        select(Vehicle)
        .where(
            Vehicle.id == vehicle_id,
            Vehicle.tenant_id == user.tenant_id,
        )
        .with_for_update()
    )

    if vehicle is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Vehicle not found",
        )

    if vehicle.status not in ("draft", "maintenance"):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                "Only draft or maintenance vehicles "
                "can be reconfigured"
            ),
        )

    updates = payload.model_dump(exclude_unset=True)

    for field in ("fleet_id", "registration_number", "vin"):
        if field in updates and updates[field] is not None:
            updates[field] = updates[field].strip().upper()

    for field in ("manufacturer", "model"):
        if field in updates:
            updates[field] = updates[field].strip()

    conditions = []

    if "fleet_id" in updates:
        conditions.append(
            func.upper(Vehicle.fleet_id) == updates["fleet_id"]
        )

    if "registration_number" in updates:
        conditions.append(
            func.upper(Vehicle.registration_number)
            == updates["registration_number"]
        )

    if conditions:
        from sqlalchemy import or_

        duplicate = db.scalar(
            select(Vehicle.id)
            .where(
                Vehicle.tenant_id == user.tenant_id,
                Vehicle.id != vehicle_id,
                or_(*conditions),
            )
        )

        if duplicate is not None:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Fleet ID or registration number already exists",
            )

    for field, value in updates.items():
        setattr(vehicle, field, value)

    try:
        db.commit()
        db.refresh(vehicle)
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Vehicle update conflict",
        )

    return vehicle