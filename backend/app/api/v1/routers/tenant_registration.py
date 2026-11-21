from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.tenant import Tenant
from app.models.tenant_registration_request import (
    TenantRegistrationRequest,
)
from app.schemas.tenant_registration import (
    TenantRegistrationCreate,
    TenantRegistrationResponse,
)

router = APIRouter(
    prefix="/tenant-registration",
    tags=["Tenant Registration"]
)

@router.post(
    "/requests",
    response_model=TenantRegistrationResponse,
    status_code=status.HTTP_201_CREATED,
)
def submit_tenant_registration(
    payload:  TenantRegistrationCreate,
    db: Session = Depends(get_db),
): 
    organization_name = payload.organization_name.strip()
    contact_name = payload.contact_name.strip()
    contact_email = str(payload.contact_email).strip().lower()

    if len(organization_name) < 2 or len(contact_name) < 2:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Organization and contact names must contain at least two characters.",
        )

    existing_tenant = db.scalar(
        select(Tenant.id).where(
            func.lower(Tenant.name) == organization_name.lower()
        )
    )

    if existing_tenant is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An organization with this name is already registered.",
        )
    
    existing_request = db.scalar(
        select(TenantRegistrationRequest.id).where(
            func.lower(
                TenantRegistrationRequest.organization_name
            ) == organization_name.lower(),
            TenantRegistrationRequest.status == "pending",
        )
    )

    if existing_request is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A pending registration request for this organization already exists.",
        )

    registration = TenantRegistrationRequest(
        organization_name=organization_name,
        contact_name=contact_name,
        contact_email=contact_email,
        contact_phone=payload.contact_phone,
        status="pending"
    )

    try:
        db.add(registration)
        db.commit()
        db.refresh(registration)

    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while processing the registration request.",
        )

    return registration