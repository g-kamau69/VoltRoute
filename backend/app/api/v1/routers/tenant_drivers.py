from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.auth.tenant_dependencies import require_fleet_management
from app.database import get_db
from app.models.user import User

from app.schemas.driver import (
    DriverResponse,
    DriverSummaryResponse,
)

from app.services.driver_service import (
    list_drivers,
    get_driver,
    get_driver_summary,
)


router = APIRouter(
    prefix="/tenant/drivers",
    tags=["Tenant Driver Management"],
)


@router.get(
    "/",
    response_model=list[DriverResponse],
)
def retrieve_drivers(
    search: str | None = Query(
        default=None,
        max_length=150,
    ),
    is_active: bool | None = Query(default=None),
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
    user: User = Depends(require_fleet_management),
):
    return list_drivers(
        db=db,
        tenant_id=user.tenant_id,
        search=search,
        is_active=is_active,
        limit=limit,
        offset=offset,
    )


@router.get(
    "/summary",
    response_model=DriverSummaryResponse,
)
def retrieve_driver_summary(
    db: Session = Depends(get_db),
    user: User = Depends(require_fleet_management),
):
    return get_driver_summary(
        db=db,
        tenant_id=user.tenant_id,
    )


@router.get(
    "/{driver_id}",
    response_model=DriverResponse,
)
def retrieve_driver(
    driver_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(require_fleet_management),
):
    driver = get_driver(
        db=db,
        tenant_id=user.tenant_id,
        driver_id=driver_id,
    )

    if driver is None:
        raise HTTPException(
            status_code=404,
            detail="Driver not found.",
        )

    return driver