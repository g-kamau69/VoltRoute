from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.auth.tokens import decode_access_token
from app.database import get_db
from app.models.platform_admin import PlatformAdmin

bearer_scheme = HTTPBearer(auto_error=False)

def authentication_error():
    return HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or expired authentication credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

def get_current_platform_admin(
        credentials: HTTPAuthorizationCredentials | None = Depends(
            bearer_scheme
        ),
        db: Session = Depends(get_db),
) -> PlatformAdmin:

    if credentials is None:
        raise authentication_error()

    try:
        payload = decode_access_token(
            credentials.credentials
        )

        admin_id = int(payload["sub"])

        if admin_id <= 0:
            raise ValueError("Invalid administrator ID")

    except (ValueError, TypeError, KeyError):
        raise authentication_error()

    admin = db.get(PlatformAdmin, admin_id)

    if admin is None:
        raise authentication_error()

    if not admin.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Administrator account is inactive",
        )

    if admin.role not in ("super_admin", "platform_admin"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid administrator role",
        )

    return admin

def require_super_admin(
        admin: PlatformAdmin = Depends(
            get_current_platform_admin
        ),
) -> PlatformAdmin:
    if admin.role != "super_admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Administrator does not have super admin privileges",
        )
    return admin