
"""extend vehicle onboarding

Revision ID: 57ee193111b5
Revises: 63a5bcb5e502
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "57ee193111b5"
down_revision: Union[str, Sequence[str], None] = "63a5bcb5e502"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Extend existing vehicles.
    # Temporary server defaults protect existing records.
    op.add_column(
        "vehicles",
        sa.Column(
            "fleet_id",
            sa.String(50),
            nullable=True,
        ),
    )

    op.add_column(
        "vehicles",
        sa.Column(
            "vin",
            sa.String(100),
            nullable=True,
        ),
    )

    op.add_column(
        "vehicles",
        sa.Column(
            "manufacturer",
            sa.String(100),
            nullable=False,
            server_default="Unknown",
        ),
    )

    op.add_column(
        "vehicles",
        sa.Column(
            "battery_configuration",
            sa.String(20),
            nullable=False,
            server_default="swappable",
        ),
    )

    op.add_column(
        "vehicles",
        sa.Column(
            "energy_consumption_wh_per_km",
            sa.Float(),
            nullable=True,
        ),
    )

    op.add_column(
        "vehicles",
        sa.Column(
            "telemetry_source",
            sa.String(20),
            nullable=False,
            server_default="none",
        ),
    )

    op.add_column(
        "vehicles",
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("CURRENT_TIMESTAMP"),
        ),
    )

    # 2. Backfill values for any existing vehicles.
    # The current VoltRoute database has zero vehicles,
    # but these updates make the migration more robust.
    op.execute(
        """
        UPDATE vehicles
        SET fleet_id = 'EV-' || id::text
        WHERE fleet_id IS NULL
        """
    )

    op.execute(
        """
        UPDATE vehicles
        SET energy_consumption_wh_per_km = 35.0
        WHERE energy_consumption_wh_per_km IS NULL
        """
    )

    # 3. Enforce required columns.
    op.alter_column(
        "vehicles",
        "fleet_id",
        nullable=False,
    )

    op.alter_column(
        "vehicles",
        "energy_consumption_wh_per_km",
        nullable=False,
    )

    # 4. Apply the new vehicle lifecycle.
    # Legacy 'available' vehicles become 'active'.
    op.execute(
        """
        UPDATE vehicles
        SET status = CASE
            WHEN status = 'available' THEN 'active'
            WHEN status IN ('in_use', 'charging') THEN 'active'
            ELSE status
        END
        """
    )

    # 5. Tenant-scoped Fleet ID uniqueness.
    op.create_unique_constraint(
        "uq_vehicles_tenant_fleet_id",
        "vehicles",
        ["tenant_id", "fleet_id"],
    )

    # 6. Add EV configuration constraints.
    op.create_check_constraint(
        "ck_vehicles_energy_consumption",
        "vehicles",
        "energy_consumption_wh_per_km > 0",
    )

    op.create_check_constraint(
        "ck_vehicles_battery_configuration",
        "vehicles",
        "battery_configuration IN ('swappable', 'fixed')",
    )

    op.create_check_constraint(
        "ck_vehicles_telemetry_source",
        "vehicles",
        "telemetry_source IN ('none', 'simulated', 'physical')",
    )

    op.create_check_constraint(
        "ck_vehicles_status",
        "vehicles",
        "status IN ('draft', 'active', 'maintenance', 'archived')",
    )

    # 7. Remove temporary database defaults.
    op.alter_column(
        "vehicles",
        "manufacturer",
        server_default=None,
    )

    op.alter_column(
        "vehicles",
        "battery_configuration",
        server_default=None,
    )

    op.alter_column(
        "vehicles",
        "telemetry_source",
        server_default=None,
    )

    op.alter_column(
        "vehicles",
        "updated_at",
        server_default=None,
    )

    # Preserve existing composite vehicle constraints,
    # trip relationships, telemetry relationships,
    # and ix_swap_stations_location PostGIS index.


def downgrade() -> None:
    # Remove the new constraints.
    op.drop_constraint(
        "ck_vehicles_status",
        "vehicles",
        type_="check",
    )

    op.drop_constraint(
        "ck_vehicles_telemetry_source",
        "vehicles",
        type_="check",
    )

    op.drop_constraint(
        "ck_vehicles_battery_configuration",
        "vehicles",
        type_="check",
    )

    op.drop_constraint(
        "ck_vehicles_energy_consumption",
        "vehicles",
        type_="check",
    )

    op.drop_constraint(
        "uq_vehicles_tenant_fleet_id",
        "vehicles",
        type_="unique",
    )

    # Restore legacy status values where required.
    op.execute(
        """
        UPDATE vehicles
        SET status = 'available'
        WHERE status IN ('draft', 'active', 'archived')
        """
    )

    # Remove vehicle onboarding columns.
    op.drop_column("vehicles", "updated_at")
    op.drop_column("vehicles", "telemetry_source")
    op.drop_column(
        "vehicles",
        "energy_consumption_wh_per_km",
    )
    op.drop_column("vehicles", "battery_configuration")
    op.drop_column("vehicles", "manufacturer")
    op.drop_column("vehicles", "vin")
    op.drop_column("vehicles", "fleet_id")

    # Leave PostGIS spatial indexes untouched.
