from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field

class VehicleTelemetryCreate(BaseModel):
    latitude: float = Field(
        ge=-90,
        le=90,
        allow_inf_nan=False,
    )

    longitude: float = Field(
        ge=-180,
        le=180,
        allow_inf_nan=False,
    )

    speed_kmh: float = Field(
        default=0.0,
        ge=0,
        allow_inf_nan=False,
    )

    battery_level: float = Field(
        ge=0,
        le=100,
        allow_inf_nan=False,
    )

    model_config = ConfigDict(extra="forbid")

class VehicleTelemetryResponse(BaseModel):
    id: int
    tenant_id: int
    vehicle_id: int

    latitude: float
    longitude: float
    speed_kmh: float
    battery_level: float

    recorded_at: datetime

    model_config = ConfigDict(from_attributes=True)