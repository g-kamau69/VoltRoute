
import os
from dataclasses import dataclass
from pathlib import Path

from dotenv import load_dotenv


BACKEND_DIR = Path(__file__).resolve().parents[3]

load_dotenv(BACKEND_DIR / ".env")


@dataclass(frozen=True)
class EmailSettings:
    smtp_host: str
    smtp_port: int
    smtp_username: str
    smtp_password: str
    from_email: str
    frontend_url: str


def get_email_settings() -> EmailSettings:
    return EmailSettings(
        smtp_host=os.getenv("VOLTROUTE_SMTP_HOST", ""),
        smtp_port=int(os.getenv("VOLTROUTE_SMTP_PORT", "587")),
        smtp_username=os.getenv("VOLTROUTE_SMTP_USERNAME", ""),
        smtp_password=os.getenv("VOLTROUTE_SMTP_PASSWORD", ""),
        from_email=os.getenv("VOLTROUTE_FROM_EMAIL", ""),
        frontend_url=os.getenv(
            "VOLTROUTE_FRONTEND_URL",
            "http://localhost:5173",
        ),
    )
