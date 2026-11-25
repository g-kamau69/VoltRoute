from datetime import datetime, timezone

from fastapi import HTTPException, status
from sqlalchemy import func, or_, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.order import Order
from app.models.user import User
from app.schemas.order import OrderCreate, OrderUpdate


def get_order(
    db: Session,
    tenant_id: int,
    order_id: int,
    lock: bool = False,
) -> Order:

    statement = select(Order).where(
        Order.id == order_id,
        Order.tenant_id == tenant_id,
    )

    if lock:
        statement = statement.with_for_update()

    order = db.scalar(statement)

    if order is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found",
        )

    return order


def create_order(
    db: Session,
    user: User,
    payload: OrderCreate,
) -> Order:

    existing_order = db.scalar(
        select(Order.id).where(
            Order.tenant_id == user.tenant_id,
            Order.order_number == payload.order_number,
        )
    )

    if existing_order is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Order number already exists",
        )

    order = Order(
        **payload.model_dump(),
        tenant_id=user.tenant_id,
        created_by_user_id=user.id,
        status="pending",
    )

    db.add(order)

    try:
        db.commit()
        db.refresh(order)

    except IntegrityError as exc:
        db.rollback()

        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Order creation conflict",
        ) from exc

    return order


def list_orders(
    db: Session,
    tenant_id: int,
    order_status: str | None = None,
    priority: str | None = None,
    search: str | None = None,
    limit: int = 50,
    offset: int = 0,
) -> list[Order]:

    statement = select(Order).where(
        Order.tenant_id == tenant_id
    )

    if order_status is not None:
        statement = statement.where(
            Order.status == order_status
        )

    if priority is not None:
        statement = statement.where(
            Order.priority == priority
        )

    if search and search.strip():
        term = search.strip()

        statement = statement.where(
            or_(
                Order.order_number.icontains(
                    term, autoescape=True
                ),
                Order.customer_name.icontains(
                    term, autoescape=True
                ),
                Order.pickup_address.icontains(
                    term, autoescape=True
                ),
                Order.delivery_address.icontains(
                    term, autoescape=True
                ),
            )
        )

    statement = (
        statement
        .order_by(
            Order.created_at.desc(),
            Order.id.desc(),
        )
        .limit(limit)
        .offset(offset)
    )

    return list(db.scalars(statement).all())


def update_order(
    db: Session,
    tenant_id: int,
    order_id: int,
    payload: OrderUpdate,
) -> Order:

    order = get_order(
        db=db,
        tenant_id=tenant_id,
        order_id=order_id,
        lock=True,
    )

    if order.status != "pending":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Only pending orders can be modified",
        )

    updates = payload.model_dump(
        exclude_unset=True
    )

    for field, value in updates.items():
        setattr(order, field, value)

    if updates:
        order.updated_at = datetime.now(timezone.utc)

    try:
        db.commit()
        db.refresh(order)

    except IntegrityError as exc:
        db.rollback()

        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Order update conflict",
        ) from exc

    return order


def cancel_order(
    db: Session,
    tenant_id: int,
    order_id: int,
) -> Order:

    order = get_order(
        db=db,
        tenant_id=tenant_id,
        order_id=order_id,
        lock=True,
    )

    if order.status != "pending":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Only pending orders can currently be cancelled",
        )

    order.status = "cancelled"
    order.updated_at = datetime.now(timezone.utc)

    try:
        db.commit()
        db.refresh(order)

    except IntegrityError as exc:
        db.rollback()

        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Order cancellation conflict",
        ) from exc

    return order


def get_order_summary(
    db: Session,
    tenant_id: int,
) -> dict:

    statement = (
        select(
            Order.status,
            func.count(Order.id),
        )
        .where(
            Order.tenant_id == tenant_id
        )
        .group_by(Order.status)
    )

    rows = db.execute(statement).all()

    counts = {
        "pending": 0,
        "assigned": 0,
        "picked_up": 0,
        "in_transit": 0,
        "delivered": 0,
        "failed": 0,
        "cancelled": 0,
    }

    for order_status, count in rows:
        counts[order_status] = count

    total = sum(counts.values())

    active = (
        counts["assigned"]
        + counts["picked_up"]
        + counts["in_transit"]
    )

    return {
        "total_orders": total,
        "active_orders": active,
        **counts,
    }