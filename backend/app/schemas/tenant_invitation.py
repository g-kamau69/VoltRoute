from datetime import datetime, timezone
from typing import Literal
from pydantic import BaseModel, EmailStr, Field

TenantRole = Literal[
    "tenant_admin",
    "fleet_manager",
    "driver",
]

class TenantInvitationCreate(BaseModel):
    full_name: str = Field(
        min_length=2,
        max_length=150,
    )

    email: EmailStr

    role: TenantRole = "tenant_admin"

class TenantInvitationResponse(BaseModel):
    id: int
    tenant_id: int
    full_name: str
    email: EmailStr
    role: TenantRole
    status: str
    expires_at: datetime
    created_at: datetime

    model_config = {
        "from_attributes": True
    }

class TenantInvitationCreatedResponse(
    TenantInvitationResponse
):
    invitation_token: str

class TenantInvitationAccept(BaseModel):
    invitation_token: str = Field(
        min_length=32,
        max_length=256,
    )

    password: str = Field(
        min_length=12,
        max_length=128,
    )