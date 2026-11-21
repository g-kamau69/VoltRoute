from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.auth.invitation_tokens import hash_invitation_token
from app.database import get_db
from app.models.tenant import Tenant
from app.models.tenant_invitation import TenantInvitation
from app.models.user import User
from app.schemas.tenant_invitation import TenantInvitationAccept
from app.security import hash_password


router = APIRouter(
    prefix="/tenant-invitations",
    tags=["Tenant Onboarding"],
)

class TenantInvitationAcceptanceResponse(BaseModel):
    message: str
    user_id: int
    tenant_id: int
    role: str

@router.post(
    "/accept",
    response_model=TenantInvitationAcceptanceResponse,
    status_code=status.HTTP_201_CREATED,
)

def accept_tenant_invitation(
    payload: TenantInvitationAccept,
    db: Session = Depends(get_db),
):
    now = datetime.now(timezone.utc)

    token_hash = hash_invitation_token(
        payload.invitation_token
    )

    invitation = db.scalar(
        select(TenantInvitation)
        .where(TenantInvitation.token_hash == token_hash)
        .with_for_update()
    )

    if invitation is None:
        raise HTTPException(
            status_code=400,
            detail="Invalid or expired invitation",
        )

    if (
        invitation.status != "pending" 
        or invitation.expires_at < now
    ):
        raise HTTPException(
            status_code=400,
            detail="Invalid or expired invitation",
        )

    tenant = db.scalar(
        select(Tenant)
        .where(Tenant.id == invitation.tenant_id)
        .with_for_update()
    )

    if tenant is None or tenant.status != "active":
        raise HTTPException(
            status_code=409,
            detail="Tenant is not active or does not exist",
        )

    existing_user = db.scalar(
        select(User.id).where(
            User.tenant_id == invitation.tenant_id,
            func.lower(User.email) == invitation.email.lower(),
        )
    )

    if existing_user is not None:
        raise HTTPException(
            status_code=409,
            detail="A user with this email already exists",
        )

    user = User(
        tenant_id=invitation.tenant_id,
        full_name=invitation.full_name,
        email=invitation.email.lower(),
        password_hash=hash_password(payload.password),
        role=invitation.role,
        is_active=True,
    )

    db.add(user)

    invitation.status = "accepted"
    invitation.accepted_at = now

    try:
        db.flush()
        user_id = user.id
        tenant_id = user.tenant_id
        role = user.role
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=409,
            detail="Failed to create user account",
        )

    return TenantInvitationAcceptanceResponse(
        message="Tenant invitation accepted successfully",
        user_id=user_id,
        tenant_id=tenant_id,
        role=role
    )