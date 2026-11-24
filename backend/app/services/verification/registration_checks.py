
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.tenant import Tenant
from app.models.tenant_registration_request import (
    TenantRegistrationRequest,
)
from app.services.verification.rule_engine import (
    verify_registration,
)


def verify_registration_from_db(
    db: Session,
    registration: TenantRegistrationRequest,
) -> dict:
    """
    Evaluate an existing registration request using
    live database information.

    Excludes the current request from duplicate checks.
    Does not modify the database.
    """

    # Existing registered organization names
    existing_names = set(
        db.scalars(
            select(Tenant.name)
        ).all()
    )

    # Other pending applications with the same name
    pending_names = set(
        db.scalars(
            select(TenantRegistrationRequest.organization_name)
            .where(
                TenantRegistrationRequest.status == "pending",
                TenantRegistrationRequest.id != registration.id,
            )
        ).all()
    )

    application_data = {
        "organization_name": registration.organization_name,
        "contact_name": registration.contact_name,
        "contact_email": registration.contact_email,
        "contact_phone": registration.contact_phone,
    }

    return verify_registration(
        application_data,
        existing_organization_names=existing_names,
        pending_organization_names=pending_names,
    )
