from fastapi import FastAPI, HTTPException
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError
from .database import engine
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.routers.swap_providers import router as swap_providers_router
from app.api.v1.routers.platform_auth import router as platform_auth_router
from app.api.v1.routers.tenant_registration import router as tenant_registration_router
from app.api.v1.routers.platform_tenants import router as platform_tenants_router
from app.api.v1.routers.platform_tenant_management import router as platform_tenant_management_router
from app.api.v1.routers import platform_invitations
from app.api.v1.routers import tenant_invitation_acceptance
from app.api.v1.routers import tenant_auth
from app.api.v1.routers import tenant_vehicles
from app.api.v1.routers import tenant_staff_invitations
from app.api.v1.routers import tenant_vehicle_assignments
from app.api.v1.routers import tenant_vehicle_telemetry

app = FastAPI(
    title="VoltRoute API",
    description="Smart EV Fleet Management and Route Optimization System",
    version="1.0.0"
)

app.include_router(
    swap_providers_router,
    prefix="/api/v1"
)

app.include_router(
    platform_auth_router,
    prefix="/api/v1"
)
app.include_router(
    tenant_registration_router,
    prefix="/api/v1"
)
app.include_router(
    platform_tenants_router,
    prefix="/api/v1"
)
app.include_router(
    platform_tenant_management_router,
    prefix="/api/v1"
)
app.include_router(
    platform_invitations.router,
    prefix="/api/v1",
)
app.include_router(
    tenant_invitation_acceptance.router,
    prefix="/api/v1",
)
app.include_router(
    tenant_auth.router,
    prefix="/api/v1",
)
app.include_router(
    tenant_vehicles.router,
    prefix="/api/v1",
)
app.include_router(
    tenant_staff_invitations.router,
    prefix="/api/v1",
)
app.include_router(
    tenant_vehicle_assignments.router,
    prefix="/api/v1",
)
app.include_router(
    tenant_vehicle_telemetry.router,
    prefix="/api/v1",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {
        "message": "Welcome to VoltRoute API"
    }

@app.get("/api/v1/health")
def health_check():
    return {
        "status": "healthy",
        "application": "VoltRoute",
        "version": "1.0.0"
    }

@app.get("/api/v1/health/db")
def database_health_check():
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))

        return {
            "status": "healthy",
            "database": "connected",
            "application": "VoltRoute"
        }

    except SQLAlchemyError:
        raise HTTPException(
            status_code=503,
            detail="Database connection unavailable"
        )