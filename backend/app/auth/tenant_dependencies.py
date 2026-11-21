
from fastapi import Depends, HTTPException, status
from fastapi.security import (
    HTTPAuthorizationCredentials,
    HTTPBearer,
)
from sqlalchemy.orm import Session

from app.auth.tokens import decode_access_token
from app.database import get_db
from app.models.tenant import Tenant
from app.models.user import User


tenant_bearer_scheme = HTTPBearer(auto_error=False)


def tenant_authentication_error():
    return HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or expired tenant credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )


def get_current_tenant_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(
        tenant_bearer_scheme
    ),
    db: Session = Depends(get_db),
) -> User:

    if credentials is None:
        raise tenant_authentication_error()

    try:
        payload = decode_access_token(
            credentials.credentials,
            expected_account_type="tenant_user",
        )

        user_id = int(payload["sub"])
        token_tenant_id = payload["tenant_id"]

        if user_id <= 0:
            raise ValueError("Invalid user ID")

    except (ValueError, TypeError, KeyError):
        raise tenant_authentication_error()

    user = db.get(User, user_id)

    if user is None:
        raise tenant_authentication_error()

    if user.tenant_id != token_tenant_id:
        raise tenant_authentication_error()

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive",
        )

    tenant = db.get(Tenant, user.tenant_id)

    if tenant is None or tenant.status != "active":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Tenant organization is not active",
        )

    if user.role not in (
        "tenant_admin",
        "fleet_manager",
        "driver",
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid tenant user role",
        )

    return user


def require_tenant_admin(
    user: User = Depends(get_current_tenant_user),
) -> User:
    if user.role != "tenant_admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Tenant administrator privileges required",
        )

    return user


def require_fleet_manager(
    user: User = Depends(get_current_tenant_user),
) -> User:
    if user.role not in (
        "tenant_admin",
        "fleet_manager",
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Fleet management privileges required",
        )

    return user

def require_fleet_management(
    user: User = Depends(get_current_tenant_user),
) -> User:
    return require_fleet_manager(user)