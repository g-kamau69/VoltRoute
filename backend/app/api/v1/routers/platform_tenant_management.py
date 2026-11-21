from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.orm import Session
from pydantic import BaseModel, ConfigDict

from app.auth.dependencies import require_super_admin, get_current_platform_admin
from app.database import get_db
from app.models.platform_admin import PlatformAdmin
from app.models.tenant import Tenant
from app.models.admin_audit_log import AdminAuditLog

router = APIRouter(
    prefix="/platform/tenants",
    tags=["Platform Tenant Management"],
)

class TenantResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    status: str
    approved_by: int | None
    approved_at: datetime | None    
    created_at: datetime
    updated_at: datetime

def change_tenant_status(
    tenant_id: int,
    new_status: str,
    admin: PlatformAdmin,
    db: Session,
):
    tenant = db.scalar(
        select(Tenant)
        .where(Tenant.id == tenant_id)
        .with_for_update()
    )

    if tenant is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tenant not found",
        )

    if tenant.status == new_status:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Tenant is already {new_status}",
        )

    previous_status = tenant.status

    tenant.status = new_status
    tenant.updated_at = datetime.now(timezone.utc)

    audit_log = AdminAuditLog(
        admin_id=admin.id,
        action=(
            "tenant_suspended"
            if new_status == "suspended"
            else "tenant_reactivated"
        ),
        target_type="tenant",
        target_id=tenant.id,
        details=(
            f"Tenant '{tenant.name}' changed "
            f"from {previous_status} to {new_status}"
        ),
    )

    db.add(audit_log)
    db.commit()
    db.refresh(tenant)

    return tenant


@router.post(
    "/{tenant_id}/suspend",
    response_model=TenantResponse,
)

def suspend_tenant(
    tenant_id: int,
    db: Session = Depends(get_db),
    admin: PlatformAdmin = Depends(require_super_admin),
):
    return change_tenant_status(
        tenant_id,
        "suspended",
        admin,
        db,
    )

@router.post(
    "/{tenant_id}/reactivate",
    response_model=TenantResponse,
)   
def reactivate_tenant(
    tenant_id: int,
    db: Session = Depends(get_db),
    admin: PlatformAdmin = Depends(require_super_admin),
):
    return change_tenant_status(
        tenant_id,
        "active",
        admin,
        db,
)

@router.get(
    "/",
    response_model=list[TenantResponse],
)
def list_platform_tenants(
    status_filter: str | None = Query(
        default=None,
        pattern="^(active|suspended)$",
    ),
    limit: int = Query(
        default=50,
        ge=1,
        le=100,
    ),
    offset: int = Query(
        default=0,
        ge=0,
    ),
    db: Session = Depends(get_db),
    admin: PlatformAdmin = Depends(
        get_current_platform_admin
    ),
):
    statement = select(Tenant)

    if status_filter is not None:
        statement = statement.where(
            Tenant.status == status_filter
        )

    statement = (
        statement
        .order_by(Tenant.id.asc())
        .limit(limit)
        .offset(offset)
    )

    return db.scalars(statement).all()