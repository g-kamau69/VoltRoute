
from datetime import datetime, timedelta, timezone

import jwt
from jwt.exceptions import InvalidTokenError

from app.auth.tokens import (
    JWT_ALGORITHM,
    JWT_SECRET_KEY,
    ACCESS_TOKEN_EXPIRE_MINUTES,
)


def create_tenant_access_token(
    user_id: int,
    tenant_id: int,
    role: str,
) -> str:
    if user_id <= 0 or tenant_id <= 0:
        raise ValueError("Invalid user or tenant ID")

    if role not in (
        "tenant_admin",
        "fleet_manager",
        "driver",
    ):
        raise ValueError("Invalid tenant role")

    now = datetime.now(timezone.utc)

    payload = {
        "sub": str(user_id),
        "tenant_id": tenant_id,
        "role": role,
        "account_type": "tenant_user",
        "type": "access",
        "iat": now,
        "nbf": now,
        "exp": now + timedelta(
            minutes=ACCESS_TOKEN_EXPIRE_MINUTES
        ),
    }

    return jwt.encode(
        payload,
        JWT_SECRET_KEY,
        algorithm=JWT_ALGORITHM,
    )


def decode_tenant_access_token(token: str) -> dict:
    try:
        payload = jwt.decode(
            token,
            JWT_SECRET_KEY,
            algorithms=[JWT_ALGORITHM],
            options={
                "require": [
                    "sub",
                    "exp",
                    "iat",
                    "nbf",
                    "type",
                    "account_type",
                    "tenant_id",
                    "role",
                ]
            },
            leeway=5,
        )

        if payload.get("type") != "access":
            raise ValueError("Invalid token type")

        if payload.get("account_type") != "tenant_user":
            raise ValueError("Invalid account type")

        user_id = int(payload["sub"])
        tenant_id = payload["tenant_id"]

        if user_id <= 0:
            raise ValueError("Invalid user ID")

        if type(tenant_id) is not int or tenant_id <= 0:
            raise ValueError("Invalid tenant ID")

        if payload.get("role") not in (
            "tenant_admin",
            "fleet_manager",
            "driver",
        ):
            raise ValueError("Invalid tenant role")

        return payload

    except (
        InvalidTokenError,
        ValueError,
        TypeError,
        KeyError,
    ) as exc:
        raise ValueError(
            "Invalid or expired tenant access token"
        ) from exc
