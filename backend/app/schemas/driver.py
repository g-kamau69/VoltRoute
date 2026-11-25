from datetime import datetime

from pydantic import BaseModel, ConfigDict


class DriverResponse(BaseModel):
    id: int
    tenant_id: int
    full_name: str
    email: str
    role: str
    is_active: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class DriverSummaryResponse(BaseModel):
    total_drivers: int
    active_drivers: int
    inactive_drivers: int