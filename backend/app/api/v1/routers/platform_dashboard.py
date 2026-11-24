from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_platform_admin
from app.database import get_db
from app.models.platform_admin import PlatformAdmin
from app.models.user import User
from app.models.vehicle import Vehicle
from app.models.swap_station import SwapStation

router = APIRouter(
    prefix="/platform/dashboard",
    tags=["Platform Dashboard"],
)

class PlatformDashboardStats(BaseModel):
    total_vehicles: int
    total_users: int
    total_swap_stations: int
    active_alerts: int | None = None  # Placeholder for future implementation

@router.get("/stats", response_model=PlatformDashboardStats)
def get_platform_dashboard_stats(
    db: Session = Depends(get_db),
    admin: PlatformAdmin = Depends(get_current_platform_admin),
):
    total_vehicles = db.scalar(
        select(func.count()).select_from(Vehicle)
    )
    tenant_users = db.scalar(
        select(func.count()).select_from(User)
    )
    platform_admins = db.scalar(
        select(func.count()).select_from(PlatformAdmin)
    )
    total_swap_stations = db.scalar(
        select(func.count()).select_from(SwapStation)
    )

    return PlatformDashboardStats(
        total_vehicles=total_vehicles,
        total_users=tenant_users + platform_admins,
        total_swap_stations=total_swap_stations,
        active_alerts=None,  # Placeholder for future implementation
    )