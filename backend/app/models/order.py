from datetime import datetime, timezone

from sqlalchemy import (
    CheckConstraint,
    DateTime,
    Float,
    ForeignKey,
    ForeignKeyConstraint,
    Index,
    Integer,
    String,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import Base


class Order(Base):
    __tablename__ = "orders"

    __table_args__ = (
        UniqueConstraint(
            "tenant_id",
            "order_number",
            name="uq_orders_tenant_order_number",
        ),
        UniqueConstraint(
            "tenant_id",
            "id",
            name="uq_orders_tenant_id",
        ),
        ForeignKeyConstraint(
            ["tenant_id", "created_by_user_id"],
            ["users.tenant_id", "users.id"],
            name="fk_orders_tenant_creator",
        ),
        CheckConstraint(
            "payload_weight_kg >= 0",
            name="ck_orders_payload_weight",
        ),
        CheckConstraint(
            "pickup_latitude BETWEEN -90 AND 90",
            name="ck_orders_pickup_latitude",
        ),
        CheckConstraint(
            "pickup_longitude BETWEEN -180 AND 180",
            name="ck_orders_pickup_longitude",
        ),
        CheckConstraint(
            "delivery_latitude BETWEEN -90 AND 90",
            name="ck_orders_delivery_latitude",
        ),
        CheckConstraint(
            "delivery_longitude BETWEEN -180 AND 180",
            name="ck_orders_delivery_longitude",
        ),
        CheckConstraint(
            "priority IN ('low', 'normal', 'high', 'urgent')",
            name="ck_orders_priority",
        ),
        CheckConstraint(
            "status IN ("
            "'pending', 'assigned', 'picked_up', "
            "'in_transit', 'delivered', 'failed', 'cancelled'"
            ")",
            name="ck_orders_status",
        ),
        Index(
            "ix_orders_tenant_status",
            "tenant_id",
            "status",
        ),
        Index(
            "ix_orders_tenant_deadline",
            "tenant_id",
            "delivery_deadline",
        ),
    )

    id: Mapped[int] = mapped_column(
        primary_key=True
    )

    tenant_id: Mapped[int] = mapped_column(
        ForeignKey("tenants.id"),
        nullable=False,
        index=True,
    )

    order_number: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
    )

    customer_name: Mapped[str | None] = mapped_column(
        String(150),
        nullable=True,
    )

    customer_phone: Mapped[str | None] = mapped_column(
        String(30),
        nullable=True,
    )

    pickup_address: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )

    pickup_latitude: Mapped[float] = mapped_column(
        Float,
        nullable=False,
    )

    pickup_longitude: Mapped[float] = mapped_column(
        Float,
        nullable=False,
    )

    delivery_address: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )

    delivery_latitude: Mapped[float] = mapped_column(
        Float,
        nullable=False,
    )

    delivery_longitude: Mapped[float] = mapped_column(
        Float,
        nullable=False,
    )

    payload_weight_kg: Mapped[float] = mapped_column(
        Float,
        nullable=False,
    )

    priority: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        default="normal",
    )

    status: Mapped[str] = mapped_column(
        String(30),
        nullable=False,
        default="pending",
    )

    delivery_deadline: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    created_by_user_id: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True,
    )

    notes: Mapped[str | None] = mapped_column(
        String(1000),
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    tenant = relationship("Tenant")