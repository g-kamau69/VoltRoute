
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.auth.dependencies import require_super_admin
from app.database import get_db
from app.models.platform_admin import PlatformAdmin
from app.models.tenant_registration_request import (
    TenantRegistrationRequest,
)
from app.services.verification.registration_checks import (
    verify_registration_from_db,
)


router = APIRouter(
    prefix="/platform/tenant-requests",
    tags=["Platform Registration Checks"],
)


class RuleCheckResponse(BaseModel):
    rule: str
    passed: bool
    message: str


class RegistrationChecksResponse(BaseModel):
    registration_request_id: int
    application_status: str
    verification_status: str
    total_checks: int
    total_issues: int
    checks: list[RuleCheckResponse]


@router.get(
    "/{request_id}/checks",
    response_model=RegistrationChecksResponse,
)
def get_registration_checks(
    request_id: int,
    db: Session = Depends(get_db),
    admin: PlatformAdmin = Depends(require_super_admin),
):
    registration = db.scalar(
        select(TenantRegistrationRequest).where(
            TenantRegistrationRequest.id == request_id
        )
    )

    if registration is None:
        raise HTTPException(
            status_code=404,
            detail="Registration request not found",
        )

    result = verify_registration_from_db(
        db,
        registration,
    )

    return RegistrationChecksResponse(
        registration_request_id=registration.id,
        application_status=registration.status,
        verification_status=result["status"],
        total_checks=result["total_checks"],
        total_issues=result["total_issues"],
        checks=result["checks"],
    )
