
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.auth.tokens import create_access_token
from app.database import get_db
from app.models.platform_admin import PlatformAdmin
from app.security import verify_password
from app.auth.dependencies import get_current_platform_admin

router = APIRouter(
    prefix="/platform/auth",
    tags=["Platform Authentication"]
)


class PlatformLoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class PlatformAdminResponse(BaseModel):
    id: int
    full_name: str
    email: EmailStr
    role: str
    is_active: bool



@router.post(
    "/login",
    response_model=TokenResponse
)
def platform_login(
    credentials: PlatformLoginRequest,
    db: Session = Depends(get_db)
):
    email = credentials.email.strip().lower()

    statement = select(PlatformAdmin).where(
        func.lower(PlatformAdmin.email) == email
    )

    admin = db.scalar(statement)

    # Use the same response for incorrect credentials.
    if admin is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )

    if not verify_password(
        credentials.password,
        admin.password_hash
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )

    if not admin.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Administrator account is inactive"
        )

    access_token = create_access_token(
        subject=str(admin.id),
        role=admin.role,
        account_type="platform_admin"
    )

    return TokenResponse(
        access_token=access_token
    )


@router.get(
    "/me",
    response_model=PlatformAdminResponse
)
def get_platform_admin_profile(
    admin: PlatformAdmin = Depends(
        get_current_platform_admin
    )
): 
    return PlatformAdminResponse(
        id=admin.id,
        full_name=admin.full_name,
        email=admin.email,
        role=admin.role,
        is_active=admin.is_active
    )