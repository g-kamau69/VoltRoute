from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field

class OrganizationVerificationCreate(BaseModel):
    registration_request_id: int = Field(gt=0)
    verification_method: str = Field(
        default="manual",
        pattern="^(manual|automated|hybrid)$",
    )

    
    provider: str = Field(
        default="manual",
        pattern="^(manual|mock|persona|smile_id|sumsub|other)$",
    )


class OrganizationVerificationReview(BaseModel):
    decision: str = Field(
        pattern="^(approved|rejected|needs_review)$",
    )

    review_notes: str | None = Field(
        default=None,
        max_length=2000,
    )

class OrganizationVerificationResponse(BaseModel):  
    model_config = ConfigDict(from_attributes=True)

    id: int
    registration_request_id: int
    tenant_id: int | None

    verification_method: str
    provider: str
    status: str

    reviewed_by_admin_id: int | None
    reviewed_at: datetime | None
    verified_at: datetime | None
    expires_at: datetime | None

    created_at: datetime
    updated_at: datetime

class OrganizationVerificationSimulation(BaseModel):
    outcome: str = Field(
        default="needs_review",
        pattern="^(approved|rejected|needs_review)$",
    )