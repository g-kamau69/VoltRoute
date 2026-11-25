from sqlalchemy import select, func
from sqlalchemy.orm import Session

from app.models.user import User
from app.schemas.driver import DriverSummaryResponse


def list_drivers(
    db: Session,
    tenant_id: int,
    search: str | None = None,
    is_active: bool | None = None,
    limit: int = 20,
    offset: int = 0,
):
    statement = select(User).where(
        User.tenant_id == tenant_id,
        User.role == "driver",
    )

    if is_active is not None:
        statement = statement.where(
            User.is_active == is_active
        )

    if search and search.strip():
        search_term = search.strip()

        statement = statement.where(
            User.full_name.icontains(
                search_term,
                autoescape=True,
            )
            |
            User.email.icontains(
                search_term,
                autoescape=True,
            )
        )

    statement = (
        statement
        .order_by(User.full_name.asc(), User.id.asc())
        .limit(limit)
        .offset(offset)
    )

    return list(db.scalars(statement).all())


def get_driver(
    db: Session,
    tenant_id: int,
    driver_id: int,
):
    statement = select(User).where(
        User.id == driver_id,
        User.tenant_id == tenant_id,
        User.role == "driver",
    )

    return db.scalar(statement)


def get_driver_summary(
    db: Session,
    tenant_id: int,
):
    statement = (
        select(
            User.is_active,
            func.count(User.id),
        )
        .where(
            User.tenant_id == tenant_id,
            User.role == "driver",
        )
        .group_by(User.is_active)
    )

    counts = {
        is_active: count
        for is_active, count in db.execute(statement)
    }

    active_drivers = counts.get(True, 0)
    inactive_drivers = counts.get(False, 0)

    return DriverSummaryResponse(
        total_drivers=active_drivers + inactive_drivers,
        active_drivers=active_drivers,
        inactive_drivers=inactive_drivers,
    )