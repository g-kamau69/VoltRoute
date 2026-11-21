
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class VehicleAssignmentCreate(BaseModel):
    driver_id: int = Field(gt=0)
    vehicle_id: int = Field(gt=0)

    notes: str | None = Field(
        default=None,
        max_length=500,
    )

    model_config = ConfigDict(extra="forbid")


class VehicleAssignmentResponse(BaseModel):
    id: int
    tenant_id: int
    driver_id: int
    vehicle_id: int
    assigned_by_user_id: int | None

    assigned_at: datetime
    released_at: datetime | None

    notes: str | None

    model_config = ConfigDict(from_attributes=True)
