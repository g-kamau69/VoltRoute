from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.auth.tenant_dependencies import get_current_tenant_user
from app.auth.tenant_tokens import create_tenant_access_token
from app.database import get_db
from app.models.tenant import Tenant
from app.models.user import User
from app.security import verify_password


router = APIRouter(
    prefix="/tenant/auth",
    tags=["Tenant Authentication"],
)

class TenantLoginRequest(BaseModel):
    tenant_id: int = Field(gt=0)
    email: EmailStr
    password: str

class TenantTokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"

class TenantProfileResponse(BaseModel):
    id: int
    tenant_id: int
    tenant_name: str
    full_name: str
    email: EmailStr
    role: str
    is_active: bool

    model_config = {"from_attributes": True}

@router.post(
    "/login",
    response_model=TenantTokenResponse,
)
def tenant_login(
    payload: TenantLoginRequest,
    db: Session = Depends(get_db),
):
    normalized_email = str(payload.email).strip().lower()

    user = db.scalar(
        select(User)
        .where(
            User.tenant_id == payload.tenant_id,
            func.lower(User.email) == normalized_email,
        )
    )

    if user is None or not verify_password(
        payload.password,
        user.password_hash,
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid tenant ID, email, or password",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive",
        )

    tenant = db.get(Tenant, user.tenant_id)

    if tenant is None or tenant.status != "active":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Tenant organization is inactive or does not exist",
        )

    if user.role not in (
        "tenant_admin",
        "fleet_manager",
        "driver",
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User tenant user role",
        )

    access_token = create_tenant_access_token(
        user_id=user.id,
        tenant_id=user.tenant_id,
        role=user.role,
    )

    return TenantTokenResponse(
        access_token=access_token,
    )

@router.get(
    "/me",
    response_model=TenantProfileResponse,
)
def get_tenant_profile(
    user: User = Depends(get_current_tenant_user),
    db: Session = Depends(get_db),
):
    tenant = db.get(Tenant, user.tenant_id)

    if tenant is None or tenant.status != "active":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Tenant organization is inactive or does not exist",
        )

    return TenantProfileResponse(
        id=user.id,
        tenant_id=user.tenant_id,
        tenant_name=tenant.name,
        full_name=user.full_name,
        email=user.email,
        role=user.role,
        is_active=user.is_active,
    )