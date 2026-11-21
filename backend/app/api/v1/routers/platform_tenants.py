
from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy import select, func
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from datetime import datetime, timezone

from app.auth.dependencies import (
    get_current_platform_admin,
    require_super_admin
)
from app.database import get_db
from app.models.platform_admin import PlatformAdmin
from app.models.tenant_registration_request import (
    TenantRegistrationRequest,
)
from app.schemas.tenant_registration import (
    TenantRegistrationAdminResponse,
)
from app.models.tenant import Tenant    
from app.models.admin_audit_log import AdminAuditLog
from app.schemas.tenant_registration import TenantRegistrationReview


router = APIRouter(
    prefix="/platform/tenant-requests",
    tags=["Platform Tenant Management"],
)


@router.get(
    "/",
    response_model=list[TenantRegistrationAdminResponse],
)
def list_tenant_registration_requests(
    status_filter: str | None = Query(
        default=None,
        pattern="^(pending|approved|rejected)$",
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
    statement = select(TenantRegistrationRequest)

    if status_filter is not None:
        statement = statement.where(
            TenantRegistrationRequest.status == status_filter
        )

    statement = (
        statement
        .order_by(
            TenantRegistrationRequest.created_at.desc(),
            TenantRegistrationRequest.id.desc(),
        )
        .limit(limit)
        .offset(offset)
    )

    return db.scalars(statement).all()


@router.post(
    "/{request_id}/approve",
    response_model=TenantRegistrationAdminResponse,
)
def approve_tenant_registration(
    request_id: int,
    payload: TenantRegistrationReview,
    db: Session = Depends(get_db),
    admin: PlatformAdmin = Depends(require_super_admin),
):
    try:
        # Lock the application to prevent concurrent reviews.
        registration = db.scalar(
            select(TenantRegistrationRequest)
            .where(TenantRegistrationRequest.id == request_id)
            .with_for_update()
        )

        if registration is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Registration request not found",
            )

        if registration.status != "pending":
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="This registration request has already been reviewed",
            )

        # Prevent creation of a duplicate organization.
        existing_tenant = db.scalar(
            select(Tenant.id).where(
                func.lower(Tenant.name)
                == registration.organization_name.lower()
            )
        )

        if existing_tenant is not None:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="An organization with this name already exists",
            )

        now = datetime.now(timezone.utc)

        tenant = Tenant(
            name=registration.organization_name,
            status="active",
            approved_by=admin.id,
            approved_at=now,
        )

        db.add(tenant)
        db.flush()

        registration.status = "approved"
        registration.reviewed_by = admin.id
        registration.reviewed_at = now
        registration.review_notes = payload.review_notes

        audit_log = AdminAuditLog(
            admin_id=admin.id,
            action="tenant_request_approved",
            target_type="tenant_registration_request",
            target_id=registration.id,
            details=(
                f"Approved organization: "
                f"{registration.organization_name}; "
                f"Tenant ID: {tenant.id}"
            ),
        )

        db.add(audit_log)
        db.commit()
        db.refresh(registration)

        return registration

    except HTTPException:
        db.rollback()
        raise

    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Tenant approval failed due to a database conflict",
        )


@router.post(
    "/{request_id}/reject",
    response_model=TenantRegistrationAdminResponse,
)
def reject_tenant_registration(
    request_id: int,
    payload: TenantRegistrationReview,
    db: Session = Depends(get_db),
    admin: PlatformAdmin = Depends(require_super_admin),
):
    review_notes = (payload.review_notes or "").strip()

    if not review_notes:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="A rejection reason is required",
        )

    try:
        # Lock the request to prevent concurrent reviews.
        registration = db.scalar(
            select(TenantRegistrationRequest)
            .where(TenantRegistrationRequest.id == request_id)
            .with_for_update()
        )

        if registration is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Registration request not found",
            )

        if registration.status != "pending":
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="This registration request has already been reviewed",
            )

        now = datetime.now(timezone.utc)

        registration.status = "rejected"
        registration.review_notes = review_notes
        registration.reviewed_by = admin.id
        registration.reviewed_at = now

        audit_log = AdminAuditLog(
            admin_id=admin.id,
            action="tenant_request_rejected",
            target_type="tenant_registration_request",
            target_id=registration.id,
            details=(
                f"Rejected organization: "
                f"{registration.organization_name}; "
                f"Rejection reason: {review_notes}"
            ),
        )

        db.add(audit_log)
        db.commit()
        db.refresh(registration)

        return registration

    except HTTPException:
        db.rollback()
        raise

    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Tenant rejection failed due to a database conflict",
        )