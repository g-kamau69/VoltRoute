from datetime import datetime, timedelta, timezone
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.auth.invitation_tokens import (
    generate_invitation_token,
    hash_invitation_token,
)
from app.auth.tenant_dependencies import require_tenant_admin
from app.database import get_db
from app.models.tenant import Tenant
from app.models.tenant_invitation import TenantInvitation
from app.models.user import User
from app.schemas.tenant_invitation import (
    TenantInvitationCreatedResponse,
)

router  =APIRouter(
    prefix="/tenant/invitations",
    tags=["Tenant Staff Invitations"],
)

class TenantStaffInvitationCreate(BaseModel):
    full_name: str = Field(min_length=2, max_length=150)
    email: EmailStr
    role: Literal["driver", "fleet_manager"]

@router.post(
    "/",
    response_model=TenantInvitationCreatedResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_tenant_staff_invitation(
    payload: TenantStaffInvitationCreate,
    admin: User = Depends(require_tenant_admin),
    db: Session = Depends(get_db),
):
    now = datetime.now(timezone.utc)

    normalized_email = str(payload.email).strip().lower()
    normalized_name = payload.full_name.strip()

    if len(normalized_name) < 2:
        raise HTTPException(
            status_code=422,
            detail="Full name must contain at least two characters",
        )

    tenant = db.scalar(
        select(Tenant)
        .where(Tenant.id == admin.tenant_id)
        .with_for_update()
    )

    if tenant is None or tenant.status != "active":
        raise HTTPException(
            status_code=409,
            detail="Tenant is not active or does not exist",
        )

    existing_user = db.scalar(
        select(User.id).where(
            User.tenant_id == admin.tenant_id,
            func.lower(User.email) == normalized_email
        )
    )

    if existing_user is not None:
        raise HTTPException(
            status_code=409,
            detail="A user with this email already exists in the tenant",
        )

    existing_invitation = db.scalar(
        select(TenantInvitation.id).where(
            TenantInvitation.tenant_id == admin.tenant_id,
            func.lower(TenantInvitation.email) == normalized_email,
            TenantInvitation.status == "pending",
            TenantInvitation.expires_at > now
        )
    )

    if existing_invitation is not None:
        raise HTTPException(
            status_code=409,
            detail="A pending invitation for this email already exists",
        )

    raw_token = generate_invitation_token()

    invitation = TenantInvitation(
        tenant_id=admin.tenant_id,
        email=normalized_email,
        full_name=normalized_name,
        role=payload.role,
        token_hash=hash_invitation_token(raw_token),
        status="pending",
        created_by_admin_id=None,
        created_by_tenant_user_id=admin.id,
        expires_at=now + timedelta(hours=24),
    )

    db.add(invitation)

    try:
        db.commit()
        db.refresh(invitation)
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=409,
            detail="Could not create staff Invitation",
        )

    return TenantInvitationCreatedResponse(
        id=invitation.id,
        tenant_id=invitation.tenant_id,
        email=invitation.email,
        full_name=invitation.full_name,
        role=invitation.role,
        status=invitation.status,
        expires_at=invitation.expires_at,
        created_at=invitation.created_at,
        invitation_token=raw_token
    )