
import os
from datetime import datetime, timedelta, timezone
from pathlib import Path

import jwt
from dotenv import load_dotenv
from jwt.exceptions import InvalidTokenError



BASE_DIR = Path(__file__).resolve().parents[3]
load_dotenv(BASE_DIR / ".env")


JWT_SECRET_KEY = os.environ["JWT_SECRET_KEY"]
JWT_ALGORITHM = "HS256"

if len(JWT_SECRET_KEY) < 32:
    raise RuntimeError(
        "JWT_SECRET_KEY must contain at least 32 characters."
    )

ACCESS_TOKEN_EXPIRE_MINUTES = int(
    os.getenv("JWT_ACCESS_TOKEN_EXPIRE_MINUTES", "30")
)

if ACCESS_TOKEN_EXPIRE_MINUTES <= 0:
    raise RuntimeError(
        "JWT_ACCESS_TOKEN_EXPIRE_MINUTES must be positive."
    )

def create_access_token(
        subject: str,
        role: str,
        account_type: str = "platform_admin",
        tenant_id: int | None = None,
)-> str:
    if account_type not in ("platform_admin", "tenant_user"):
        raise ValueError("Unsupported account type")

    if account_type == "tenant_user":
        if (
            not isinstance(tenant_id, int)
            or isinstance(tenant_id, bool)
            or tenant_id <= 0
        ):
            raise ValueError(
                "A valid tenant_id is required for tenant users"
            )
    elif tenant_id is not None:
        raise ValueError(
            "Platform administrator tokens cannot contain tenant_id"
        )

    now = datetime.now(timezone.utc)

    payload = {
        "sub": subject,
        "role": role,
        "account_type": account_type,
        "type": "access",
        "iat": now,
        "nbf": now,
        "exp": now + timedelta(
            minutes=ACCESS_TOKEN_EXPIRE_MINUTES
        ),
    }

    if account_type == "tenant_user":
        payload["tenant_id"] = tenant_id

    return jwt.encode(
        payload,
        JWT_SECRET_KEY,
        algorithm=JWT_ALGORITHM,
    )

def decode_access_token(
    token: str,
    expected_account_type: str = "platform_admin",
) -> dict:
    if expected_account_type not in (
        "platform_admin",
        "tenant_user",
    ):
        raise ValueError("Unsupported expected account type")

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
                ]
            },
            leeway=5,
        )

        if payload.get("type") != "access":
            raise ValueError("Invalid token type")

        if (
            not isinstance(payload.get("sub"), str)
            or not payload["sub"].isdigit()
            or int(payload["sub"]) <= 0
        ):
            raise ValueError("Invalid token subject")

        if payload.get("account_type") != expected_account_type:
            raise ValueError("Invalid account type")

        if expected_account_type == "tenant_user":
            tenant_id = payload.get("tenant_id")

            if (
                not isinstance(tenant_id, int)
                or isinstance(tenant_id, bool)
                or tenant_id <= 0
            ):
                raise ValueError("Invalid tenant ID")
        elif "tenant_id" in payload:
            raise ValueError(
                "Platform token cannot contain tenant ID"
            )

        return payload

    except (InvalidTokenError, ValueError) as exc:
        raise ValueError(
            "Invalid or expired access token"
        ) from exc
