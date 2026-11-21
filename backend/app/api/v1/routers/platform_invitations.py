
from datetime import datetime, timedelta, timezone

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    status,
)
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.auth.dependencies import require_super_admin
from app.auth.invitation_tokens import (
    generate_invitation_token,
    hash_invitation_token,
)
from app.database import get_db
from app.models.admin_audit_log import AdminAuditLog
from app.models.platform_admin import PlatformAdmin
from app.models.tenant import Tenant
from app.models.tenant_invitation import TenantInvitation
from app.models.user import User
from app.schemas.tenant_invitation import (
    TenantInvitationCreate,
    TenantInvitationCreatedResponse,
)


router = APIRouter(
    prefix="/platform/tenants",
    tags=["Platform Tenant Invitations"],
)


@router.post(
    "/{tenant_id}/invitations",
    response_model=TenantInvitationCreatedResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_tenant_invitation(
    tenant_id: int,
    payload: TenantInvitationCreate,
    admin: PlatformAdmin = Depends(require_super_admin),
    db: Session = Depends(get_db),
):
    now = datetime.now(timezone.utc)
    normalized_email = str(payload.email).strip().lower()

    # Lock the tenant row to serialize invitation creation
    # for this tenant through this endpoint.
    tenant = db.scalar(
        select(Tenant)
        .where(Tenant.id == tenant_id)
        .with_for_update()
    )

    if tenant is None:
        raise HTTPException(
            status_code=404,
            detail="Tenant not found",
        )

    if tenant.status != "active":
        raise HTTPException(
            status_code=409,
            detail="Cannot invite users to a suspended tenant",
        )

    existing_user = db.scalar(
        select(User.id).where(
            User.tenant_id == tenant_id,
            func.lower(User.email) == normalized_email,
        )
    )

    if existing_user is not None:
        raise HTTPException(
            status_code=409,
            detail="A user with this email already exists",
        )

    existing_invitation = db.scalar(
        select(TenantInvitation.id).where(
            TenantInvitation.tenant_id == tenant_id,
            func.lower(TenantInvitation.email) == normalized_email,
            TenantInvitation.status == "pending",
            TenantInvitation.expires_at > now,
        )
    )

    if existing_invitation is not None:
        raise HTTPException(
            status_code=409,
            detail="An active invitation already exists",
        )

    raw_token = generate_invitation_token()

    invitation = TenantInvitation(
        tenant_id=tenant_id,
        email=normalized_email,
        full_name=payload.full_name.strip(),
        role=payload.role,
        token_hash=hash_invitation_token(raw_token),
        status="pending",
        created_by_admin_id=admin.id,
        expires_at=now + timedelta(hours=24),
    )

    db.add(invitation)
    db.flush()

    db.add(
        AdminAuditLog(
            admin_id=admin.id,
            action="tenant_invitation_created",
            target_type="tenant_invitation",
            target_id=invitation.id,
            details=(
                f"Invitation created for tenant {tenant_id}"
            ),
        )
    )

    db.commit()
    db.refresh(invitation)

    return TenantInvitationCreatedResponse(
        id=invitation.id,
        tenant_id=invitation.tenant_id,
        full_name=invitation.full_name,
        email=invitation.email,
        role=invitation.role,
        status=invitation.status,
        expires_at=invitation.expires_at,
        created_at=invitation.created_at,
        invitation_token=raw_token,
    )
