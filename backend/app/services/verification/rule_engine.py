
import re
from typing import Any


def verify_registration(
    registration: dict[str, Any],
    existing_organization_names: set[str] | None = None,
    pending_organization_names: set[str] | None = None,
) -> dict[str, Any]:
    """
    Run preliminary rule-based checks on an
    organization registration application.

    These checks do not establish legal verification.
    """

    issues = []
    checks = []

    existing_organization_names = {
        name.strip().casefold()
        for name in (existing_organization_names or set())
    }

    pending_organization_names = {
        name.strip().casefold()
        for name in (pending_organization_names or set())
    }

    organization_name = str(
        registration.get("organization_name") or ""
    ).strip()

    contact_name = str(
        registration.get("contact_name") or ""
    ).strip()

    contact_email = str(
        registration.get("contact_email") or ""
    ).strip()

    contact_phone = str(
        registration.get("contact_phone") or ""
    ).strip()

    # R01: Required information
    missing_fields = [
        field
        for field, value in {
            "organization_name": organization_name,
            "contact_name": contact_name,
            "contact_email": contact_email,
            "contact_phone": contact_phone,
        }.items()
        if not value
    ]

    checks.append({
        "rule": "R01",
        "passed": not missing_fields,
        "message": (
            "All required information is present"
            if not missing_fields
            else "Missing: " + ", ".join(missing_fields)
        ),
    })

    # R02: Email formatting
    valid_email = bool(
        re.fullmatch(
            r"[^@\s]+@[^@\s]+\.[^@\s]+",
            contact_email,
        )
    )

    checks.append({
        "rule": "R02",
        "passed": valid_email,
        "message": (
            "Contact email format is valid"
            if valid_email
            else "Invalid contact email format"
        ),
    })

    # R03: Existing organization name
    normalized_name = organization_name.casefold()

    duplicate_existing = bool(
        normalized_name
        and normalized_name in existing_organization_names
    )

    checks.append({
        "rule": "R03",
        "passed": not duplicate_existing,
        "message": (
            "Possible duplicate registered organization"
            if duplicate_existing
            else "No matching registered organization name"
        ),
    })

    # R04: Duplicate pending application
    duplicate_pending = bool(
        normalized_name
        and normalized_name in pending_organization_names
    )

    checks.append({
        "rule": "R04",
        "passed": not duplicate_pending,
        "message": (
            "Possible duplicate pending application"
            if duplicate_pending
            else "No matching pending application"
        ),
    })

    issues = [
        check
        for check in checks
        if not check["passed"]
    ]

    return {
        "status": (
            "needs_attention"
            if issues
            else "preliminary_checks_passed"
        ),
        "checks": checks,
        "issues": issues,
        "total_checks": len(checks),
        "total_issues": len(issues),
    }
