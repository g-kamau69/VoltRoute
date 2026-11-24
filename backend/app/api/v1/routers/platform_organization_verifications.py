from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.auth.dependencies import require_super_admin
from app.database import get_db
from app.models.organization_verification import OrganizationVerification
from app.models.platform_admin import PlatformAdmin
from app.models.tenant_registration_request import (
    TenantRegistrationRequest,
)
from app.models.verification_audit_log import VerificationAuditLog
from app.schemas.organization_verification import (
    OrganizationVerificationCreate,
    OrganizationVerificationResponse,
    OrganizationVerificationReview,
    OrganizationVerificationSimulation,
)
from app.services.verification.config import mock_verification_enabled
from app.services.verification.mock_provider import MockVerificationProvider

router = APIRouter(
    prefix="/platform/organization-verifications",
    tags=["Platform Organization Verifications"],
)


@router.post(
    "/",
    response_model=OrganizationVerificationResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_organization_verification(
    payload: OrganizationVerificationCreate,
    db: Session = Depends(get_db),
    admin: PlatformAdmin = Depends(require_super_admin),
):
    try:
        if payload.provider == "mock":
            if not mock_verification_enabled():
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Mock verification is disabled",
                )

            if payload.verification_method != "automated":
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                    detail=(
                        "Mock provider requires "
                        "verification_method='automated'"
                    ),
                )

        registration = db.scalar(
            select(TenantRegistrationRequest)
            .where(
                TenantRegistrationRequest.id
                == payload.registration_request_id
            )
            .with_for_update()
        )


    except HTTPException:
        db.rollback()
        raise

    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to create organization verification",
        )


@router.post(
    "/{verification_id}/review",
    response_model=OrganizationVerificationResponse,
)
def review_organization_verification(
    verification_id: int,
    payload: OrganizationVerificationReview,
    db: Session = Depends(get_db),
    admin: PlatformAdmin = Depends(require_super_admin),
):
    try:
        verification = db.scalar(
            select(OrganizationVerification)
            .where(OrganizationVerification.id == verification_id)
            .with_for_update()
        )

        if verification is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Organization verification not found",
            )

        if (
            verification.provider == "mock"
            and payload.decision == "approved"
        ):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=(
                    "Mock verification cannot receive genuine "
                    "KYC approval"
                ),
            )

        if verification.status not in (
            "pending",
            "in_progress",
            "needs_review",
        ):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="This verification has already been finalized",
            )

        notes = (payload.review_notes or "").strip()

        if payload.decision in ("rejected", "needs_review") and not notes:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Review notes are required for this decision",
            )

        if payload.decision == "approved" and not notes:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Approval requires documented review evidence",
            )

        if verification.status == payload.decision:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Verification already has this status",
            )

        now = datetime.now(timezone.utc)
        old_status = verification.status

        verification.status = payload.decision
        verification.review_notes = notes
        verification.reviewed_by_admin_id = admin.id
        verification.reviewed_at = now
        verification.updated_at = now

        if payload.decision == "approved":
            verification.verfied_at = now
        else:
            verification.verified_at = None

        audit_log = VerificationAuditLog(
            verification_type="organization",
            verification_id=verification.id,
            tenant_id=verification.tenant_id,
            actor_type="platform_admin",
            actor_platform_admin_id=admin.id,
            action="organization_verification_reviewed",
            old_status=old_status,
            new_status=payload.decision,
            provider=verification.provider,
            details="Manual review decision recorded",
            created_at=now,
        )

        db.add(audit_log)
        db.commit()
        db.refresh(verification)

        return verification

    except HTTPException:
        db.rollback()
        raise

    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to review organization verification",
        )

@router.post(
    "/{verification_id}/simulate",
    response_model=OrganizationVerificationResponse,
)
def simulate_organization_verification(
    verification_id: int,
    payload: OrganizationVerificationSimulation,
    db: Session = Depends(get_db),
    admin: PlatformAdmin = Depends(require_super_admin),
):
    if not mock_verification_enabled():
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Mock verification is disabled",
        )

    try:
        verification = db.scalar(
            select(OrganizationVerification)
            .where(OrganizationVerification.id == verification_id)
            .with_for_update()
        )

        if verification is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Organization verification not found",
            )

        if verification.provider != "mock":
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="This verification does not use the mock provider",
            )

        if verification.status not in (
            "pending",
            "in_progress",
            "needs_review",
        ):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="This verification has already been finalized",
            )

        result = MockVerificationProvider().verify(
            outcome=payload.outcome,
        )

        now = datetime.now(timezone.utc)
        old_status = verification.status

        new_status = (
            "needs_review"
            if result.outcome == "approved"
            else result.outcome
        )

        verification.status = new_status
        verification.provider_reference = result.reference
        verification.updated_at = now

        verification.verified_at = None

        audit_log = VerificationAuditLog(
            verification_type="organization",
            verification_id=verification.id,
            tenant_id=verification.tenant_id,
            actor_type="system",
            action="mock_organization_verification_simulated",
            old_status=old_status,
            new_status=new_status,
            provider="mock",
            details=f"Simulated outcome: {result.outcome}",
            created_at=now,
        )

        db.add(audit_log)
        db.commit()
        db.refresh(verification)

        return verification

    except HTTPException:
        db.rollback()
        raise

    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to simulate organization verification",
        )