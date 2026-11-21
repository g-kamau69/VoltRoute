
from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class TenantRegistrationCreate(BaseModel):
    organization_name: str = Field(
        min_length=2,
        max_length=150
    )

    contact_name: str = Field(
        min_length=2,
        max_length=150
    )

    contact_email: EmailStr

    contact_phone: str | None = Field(
        default=None,
        max_length=30
    )


class TenantRegistrationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    organization_name: str
    contact_name: str
    contact_email: EmailStr
    contact_phone: str | None
    status: str
    created_at: datetime


class TenantRegistrationReview(BaseModel):
    review_notes: str | None = Field(
        default=None,
        max_length=2000
    )


class TenantRegistrationAdminResponse(
    TenantRegistrationResponse
):
    reviewed_by: int | None
    reviewed_at: datetime | None
    review_notes: str | None
