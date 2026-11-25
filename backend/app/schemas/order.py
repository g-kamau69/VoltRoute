from datetime import datetime, timezone
from typing import Literal

from pydantic import (
    BaseModel,
    ConfigDict,
    Field,
    field_validator,
    model_validator,
)

OrderPriority = Literal[
    "low",
    "normal",
    "high",
    "urgent",
]

OrderStatus = Literal[
    "pending",
    "assigned",
    "picked_up",
    "in_transit",
    "delivered",
    "failed",
    "cancelled",
]

class OrderBase(BaseModel):
    model_config = ConfigDict(
        str_strip_whitespace=True,
        extra="forbid",
        allow_inf_nan=False,
    )

    order_number: str = Field(
        min_length=1,
        max_length=50,
    )

    customer_name: str | None = Field(
        default=None,
        max_length=150,
    )

    customer_phone: str | None = Field(
        default=None,
        max_length=30,
    )

    pickup_address: str = Field(
        min_length=1,
        max_length=255,
    )

    pickup_latitude: float = Field(
        ge=-90,
        le=90,
    )

    pickup_longitude: float = Field(
        ge=-180,
        le=180,
    )

    delivery_address: str = Field(
        min_length=1,   
        max_length=255,
    )

    delivery_latitude: float = Field(
        ge=-90,
        le=90,
    )

    delivery_longitude: float = Field(
        ge=-180,
        le=180,
    )

    payload_weight_kg: float = Field(
        ge=0,
    )

    priority: OrderPriority = "normal"
    
    delivery_deadline: datetime | None = None

    notes: str | None = Field (
        default=None,
        max_length=1000,
    )

    @field_validator("order_number")
    @classmethod
    def normalize_order_number(cls, value: str) -> str:
        return value.strip().upper()

class OrderCreate(OrderBase):

    @field_validator("delivery_deadline")
    @classmethod
    def validate_deadline(
        cls,
        value: datetime | None,
    ) -> datetime | None:

        if value is None:
            return None

        if value.tzinfo is None or value.utcoffset() is None:
            raise ValueError("delivery_deadline must include a timezone")

        if value <= datetime.now(timezone.utc):
            raise ValueError("delivery_deadline must be in the future")

        return value.astimezone(timezone.utc)

class OrderUpdate(BaseModel):
    model_config = ConfigDict(
        str_strip_whitespace=True,
        extra="forbid",
        allow_inf_nan=False,
    )

    customer_name: str | None = Field(
        default=None,
        max_length=150,
    )

    customer_phone: str | None = Field(
        default=None,
        max_length=30,
    )

    pickup_address: str | None = Field(
        default=None,
        min_length=1,
        max_length=255,
    )

    pickup_latitude: float | None = Field(
        default=None,
        ge=-90,
        le=90,
    )

    pickup_longitude: float | None = Field(
        default=None,
        ge=-180,
        le=180,
    )

    delivery_address: str | None = Field(
        default=None,
        min_length=1,
        max_length=255,
    )

    delivery_latitude: float | None = Field(
        default=None,
        ge=-90,
        le=90,
    )

    delivery_longitude: float | None = Field(
        default=None,
        ge=-180,
        le=180,
    )

    payload_weight_kg: float | None = Field(
        default=None,
        ge=0,
    )

    priority: OrderPriority | None = None

    delivery_deadline: datetime | None = None

    notes: str | None = Field(
        default=None,
        max_length=1000,
    )

    @field_validator("delivery_deadline")
    @classmethod
    def validate_deadline(
        cls,
        value: datetime | None,
    ) -> datetime | None:
        return OrderCreate.validate_deadline(value)

    @model_validator(mode="after")
    def reject_invalid_nulls(self):

        required_fields = {
            "pickup_address",
            "pickup_latitude",
            "pickup_longitude",
            "delivery_address",
            "delivery_latitude",
            "delivery_longitude",
            "payload_weight_kg",
            "priority",
        }

        for field in required_fields & self.model_fields_set:
            if getattr(self, field) is None:
                raise ValueError(
                    f"{field} cannot be null"
                )

        coordinate_pairs = (
            ("pickup_latitude", "pickup_longitude"),
            ("delivery_latitude", "delivery_longitude"),
        )

        for latitude, longitude in coordinate_pairs:
            if (
                (latitude in self.model_fields_set)
                != (longitude in self.model_fields_set)
            ):
                raise ValueError(
                    f"{latitude} and {longitude} "
                    "must be updated together"
                )

        return self

class OrderResponse(OrderBase):
    model_config = ConfigDict(
        from_attributes=True,   
    )

    id: int
    tenant_id: int
    status: OrderStatus
    created_by_user_id: int | None
    created_at: datetime
    updated_at: datetime

class OrderStatusUpdate(BaseModel):
    model_config = ConfigDict(
        str_strip_whitespace=True,
        extra="forbid",
        allow_inf_nan=False,
    )

    status: OrderStatus

    reason: str | None = Field(
        default=None,
        max_length=500,
    )

class OrderSummary(BaseModel):
    total_orders: int
    active_orders: int
    pending: int
    assigned: int   
    picked_up: int
    in_transit: int
    delivered: int
    failed: int
    cancelled: int