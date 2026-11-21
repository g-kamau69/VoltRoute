from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, model_validator

VehicleType = Literal[
    "electric_motorcycle",
    "electric_scooter",
    "electric_tuk_tuk",
    "electric_van",
]

VehicleStatus = Literal[
    "draft",
    "active",
    "maintenance",
    "archived",
]

BatteryConfiguration = Literal[
    "swappable",
    "fixed",
]

TelemetrySource = Literal[
    "none",
    "simulated",
    "physical",
]

class VehicleCreate(BaseModel):
    fleet_id: str = Field(
        min_length=2,
        max_length=50,
    )

    registration_number: str = Field(
        min_length=3,
        max_length=50,
    )

    vin: str | None = Field(
        default=None,
        max_length=100,
    )

    manufacturer: str = Field(
        min_length=2,
        max_length=100,
    )

    model: str = Field(
        min_length=2,
        max_length=100,
    )

    vehicle_type: VehicleType = "electric_motorcycle"

    battery_capacity_kwh: float = Field(
        gt=0,
        allow_inf_nan=False,
    )

    battery_level: float = Field(
        default=100.0,
        ge=0,
        le=100,
        allow_inf_nan=False,
    )

    battery_configuration: BatteryConfiguration = "swappable"

    energy_consumption_wh_per_km: float = Field(
        gt=0,
        allow_inf_nan=False,
    )

    telemetry_source: TelemetrySource = "none"

class VehicleResponse(BaseModel):
    id: int
    tenant_id: int
    fleet_id: str
    registration_number: str
    vin: str | None
    manufacturer: str
    model: str
    vehicle_type: VehicleType
    battery_capacity_kwh: float
    battery_level: float
    battery_configuration: BatteryConfiguration
    energy_consumption_wh_per_km: float
    telemetry_source: TelemetrySource
    status: VehicleStatus
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(
        from_attributes=True,)


class VehicleUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    fleet_id: str | None = Field(
        default=None,
        min_length=2,
        max_length=50,
    )

    registration_number: str | None = Field(
        default=None,
        min_length=3,
        max_length=50,
    )

    vin: str | None = Field(
        default=None,
        max_length=100,
    )

    manufacturer: str | None = Field(
        default=None,
        min_length=2,
        max_length=100,
    )

    model: str | None = Field(
        default=None,
        min_length=2,
        max_length=100,
    )

    vehicle_type: VehicleType | None = None

    battery_capacity_kwh: float | None = Field(
        default=None,
        gt=0,
        allow_inf_nan=False,
    )

    battery_configuration: BatteryConfiguration | None = None

    energy_consumption_wh_per_km: float | None = Field(
        default=None,
        gt=0,
        allow_inf_nan=False,    
)

    telemetry_source: TelemetrySource | None = None

    @model_validator(mode="after")
    def validate_update(self):
        for field in self.model_fields_set:
            if field != "vin" and getattr(self, field) is None:
                raise ValueError(
                    f"{field} cannot be null"
                )

        for field in (
            "fleet_id",
            "registration_number",
            "manufacturer",
            "model",
        ):
            value = getattr(self, field)

            if value is not None and not value.strip():
                raise ValueError(
                    f"{field} cannot be empty or whitespace"
                )

        return self