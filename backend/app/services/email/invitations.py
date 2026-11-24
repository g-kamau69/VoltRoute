
from datetime import datetime
from urllib.parse import quote

from app.services.email.config import get_email_settings
from app.services.email.sender import send_invitation_email


def build_invitation_url(invitation_token: str) -> str:
    settings = get_email_settings()

    frontend_url = settings.frontend_url.rstrip("/")
    encoded_token = quote(invitation_token, safe="")

    return (
        f"{frontend_url}/accept-invitation"
        f"#token={encoded_token}"
    )


def send_tenant_invitation_email(
    *,
    recipient_email: str,
    recipient_name: str,
    organization_name: str,
    tenant_id: int,
    role: str,
    invitation_token: str,
    expires_at: datetime,
) -> None:
    invitation_url = build_invitation_url(invitation_token)

    send_invitation_email(
        recipient_email=recipient_email,
        recipient_name=recipient_name,
        organization_name=organization_name,
        tenant_id=tenant_id,
        role=role,
        invitation_url=invitation_url,
        expires_at=expires_at,
    )
