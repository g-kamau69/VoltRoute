from fastapi import (
    APIRouter,
    Depends,
    Query,
    status,
)
from sqlalchemy.orm import Session

from app.auth.tenant_dependencies import (
    require_fleet_management,
)
from app.database import get_db
from app.models.user import User

from app.schemas.order import (
    OrderCreate,
    OrderPriority,
    OrderResponse,
    OrderStatus,
    OrderSummary,
    OrderUpdate,
)

from app.services import order_service


router = APIRouter(
    prefix="/tenant/orders",
    tags=["Tenant Orders"],
)

@router.post(
    "/",
    response_model=OrderResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_tenant_order(
    payload: OrderCreate,
    user: User = Depends(require_fleet_management),
    db: Session = Depends(get_db),
):

    return order_service.create_order(
        db=db,
        user=user,
        payload=payload,
    )

@router.get(
    "/",
    response_model=list[OrderResponse],
)
def list_tenant_orders(
    order_status: OrderStatus | None = Query(
        default=None,
        alias="status",
    ),
    priority: OrderPriority | None = Query(
        default=None,
    ),
    search: str | None = Query(
        default=None,
        max_length=255,
    ),
    limit: int = Query(
        default=50,
        ge=1,
        le=100,
    ),
    offset: int = Query(
        default=0,
        ge=0,
    ),
    user: User = Depends(require_fleet_management),
    db: Session = Depends(get_db),
):
    return order_service.list_orders(
        db=db,
        tenant_id=user.tenant_id,
        order_status=order_status,
        priority=priority,
        search=search,
        limit=limit,
        offset=offset,
    )

@router.get(
    "/summary",
    response_model=OrderSummary,
)
def get_tenant_order_summary(
    user: User = Depends(require_fleet_management),
    db: Session = Depends(get_db),
):
    return order_service.get_order_summary(
        db=db,
        tenant_id=user.tenant_id,
    )

@router.get(
    "/{order_id}",
    response_model=OrderResponse,
)
def get_tenant_order(
    order_id: int,
    user: User = Depends(require_fleet_management),
    db: Session = Depends(get_db),
):
    return order_service.get_order(
        db=db,
        tenant_id=user.tenant_id,
        order_id=order_id,
    )

@router.patch(
    "/{order_id}",
    response_model=OrderResponse,
)
def update_tenant_order(
    order_id: int,
    payload: OrderUpdate,
    user: User = Depends(require_fleet_management),
    db: Session = Depends(get_db),
):
    return order_service.update_order(
        db=db,
        tenant_id=user.tenant_id,
        order_id=order_id,
        payload=payload,
    )

@router.post(
    "/{order_id}/cancel",
    response_model=OrderResponse,
)
def cancel_tenant_order(
    order_id: int,
    user: User = Depends(require_fleet_management),
    db: Session = Depends(get_db),
):
    return order_service.cancel_order(
        db=db,
        tenant_id=user.tenant_id,
        order_id=order_id,
    )