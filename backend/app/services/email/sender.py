import smtplib
import ssl
from datetime import datetime
from email.message import EmailMessage

from app.services.email.config import get_email_settings, EmailSettings

class EmailDeliveryError(Exception):
    """Raised when an email cannot be delivered."""

def send_invitation_email(
        *,
        recipient_email: str,
        recipient_name: str,
        organization_name: str,
        tenant_id: int,
        role: str,
        invitation_url: str,
        expires_at: datetime,
) -> None:
    settings = get_email_settings()

    if not all(
        [
            settings.smtp_host,
            settings.smtp_username,
            settings.smtp_password,
            settings.from_email,
        ]
    ):
        raise EmailDeliveryError(
            "SMTP email delivery is not configured."
        )

    message = EmailMessage()
    message["subject"] = (
        f"You're invited to join {organization_name} on VoltRoute"
    )
    message["From"] = settings.from_email
    message["To"] = recipient_email

    message.set_content(
        f"""Hello {recipient_name},
        
You've been invited to join {organization_name} on VoltRoute.

Organization ID: {tenant_id}
Assigned role: {role}

When signing in, select Organization Login and enter:
- Organization ID: {tenant_id}
- Your email address
- The password you created during activation

To activate your account, open this link:

{invitation_url}

This invitation expires on:
{expires_at.strftime('%Y-%m-%d %H:%M:%S UTC')}

If you were not expecting this invitation, you can ignore this email.

VoltRoute
Fleet Intelligence
"""
    )
    try:
        context = ssl.create_default_context()

        with smtplib.SMTP(
            settings.smtp_host,
            settings.smtp_port,
            timeout=15,
        ) as smtp:
            smtp.ehlo()
            smtp.starttls(context=context)
            smtp.ehlo()

            smtp.login(
                settings.smtp_username, settings.smtp_password
            )

            smtp.send_message(message)

    except (smtplib.SMTPException, OSError) as exc:
        raise EmailDeliveryError(
            "Unable to send invitation email."
        ) from exc