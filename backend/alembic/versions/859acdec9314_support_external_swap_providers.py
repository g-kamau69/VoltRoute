
"""support external swap providers

Revision ID: 859acdec9314
Revises: f22b1b9b69e1
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "859acdec9314"
down_revision: Union[str, Sequence[str], None] = "f22b1b9b69e1"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Prevent accidental loss of existing station or battery data.
    op.execute("""
        DO $$
        BEGIN
            IF EXISTS (SELECT 1 FROM swap_stations)
               OR EXISTS (SELECT 1 FROM station_batteries)
            THEN
                RAISE EXCEPTION
                    'Migration requires empty swap_stations and station_batteries';
            END IF;
        END
        $$;
    """)

    # 1. Create external battery-swapping providers.
    op.create_table(
        "swap_providers",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("name", sa.String(150), nullable=False),
        sa.Column("website", sa.String(255), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
        ),
        sa.UniqueConstraint("name"),
    )

    # 2. Allow tenant-owned routes to use external stations.
    op.drop_constraint(
        "fk_routes_tenant_swap_station",
        "routes",
        type_="foreignkey",
    )

    op.create_foreign_key(
        "fk_routes_recommended_swap_station",
        "routes",
        "swap_stations",
        ["recommended_swap_station_id"],
        ["id"],
    )

    # 3. Remove tenant ownership from individual station batteries.
    op.drop_constraint(
        "fk_station_batteries_tenant_station",
        "station_batteries",
        type_="foreignkey",
    )

    op.drop_constraint(
        "fk_station_batteries_tenant",
        "station_batteries",
        type_="foreignkey",
    )

    op.drop_index(
        "ix_station_batteries_tenant_id",
        table_name="station_batteries",
    )

    op.drop_column(
        "station_batteries",
        "tenant_id",
    )

    op.create_foreign_key(
        "fk_station_batteries_station",
        "station_batteries",
        "swap_stations",
        ["station_id"],
        ["id"],
    )

    # 4. Replace tenant ownership with provider ownership.
    op.drop_constraint(
        "uq_swap_stations_tenant_id",
        "swap_stations",
        type_="unique",
    )

    op.drop_constraint(
        "swap_stations_tenant_id_fkey",
        "swap_stations",
        type_="foreignkey",
    )

    op.drop_index(
        "ix_swap_stations_tenant_id",
        table_name="swap_stations",
    )

    op.add_column(
        "swap_stations",
        sa.Column(
            "provider_id",
            sa.Integer(),
            nullable=False,
        ),
    )

    op.add_column(
        "swap_stations",
        sa.Column(
            "location_source",
            sa.String(500),
            nullable=True,
        ),
    )

    op.add_column(
        "swap_stations",
        sa.Column(
            "location_verified_at",
            sa.DateTime(timezone=True),
            nullable=True,
        ),
    )

    op.create_index(
        "ix_swap_stations_provider_id",
        "swap_stations",
        ["provider_id"],
    )

    op.create_foreign_key(
        "fk_swap_stations_provider",
        "swap_stations",
        "swap_providers",
        ["provider_id"],
        ["id"],
    )

    op.drop_column(
        "swap_stations",
        "tenant_id",
    )

    # The existing PostGIS location column, GiST index,
    # and coordinate synchronization trigger are preserved.


def downgrade() -> None:
    # Reversing ownership is safe only without station data.
    op.execute("""
        DO $$
        BEGIN
            IF EXISTS (SELECT 1 FROM swap_stations)
               OR EXISTS (SELECT 1 FROM station_batteries)
            THEN
                RAISE EXCEPTION
                    'Downgrade requires empty swap_stations and station_batteries';
            END IF;
        END
        $$;
    """)

    # 1. Restore tenant ownership of swapping stations.
    op.add_column(
        "swap_stations",
        sa.Column(
            "tenant_id",
            sa.Integer(),
            nullable=False,
        ),
    )

    op.drop_constraint(
        "fk_swap_stations_provider",
        "swap_stations",
        type_="foreignkey",
    )

    op.drop_index(
        "ix_swap_stations_provider_id",
        table_name="swap_stations",
    )

    op.drop_column("swap_stations", "provider_id")
    op.drop_column("swap_stations", "location_source")
    op.drop_column("swap_stations", "location_verified_at")

    op.create_foreign_key(
        "swap_stations_tenant_id_fkey",
        "swap_stations",
        "tenants",
        ["tenant_id"],
        ["id"],
    )

    op.create_index(
        "ix_swap_stations_tenant_id",
        "swap_stations",
        ["tenant_id"],
    )

    op.create_unique_constraint(
        "uq_swap_stations_tenant_id",
        "swap_stations",
        ["tenant_id", "id"],
    )

    # 2. Restore tenant ownership of station batteries.
    op.drop_constraint(
        "fk_station_batteries_station",
        "station_batteries",
        type_="foreignkey",
    )

    op.add_column(
        "station_batteries",
        sa.Column(
            "tenant_id",
            sa.Integer(),
            nullable=False,
        ),
    )

    op.create_index(
        "ix_station_batteries_tenant_id",
        "station_batteries",
        ["tenant_id"],
    )

    op.create_foreign_key(
        "fk_station_batteries_tenant",
        "station_batteries",
        "tenants",
        ["tenant_id"],
        ["id"],
    )

    op.create_foreign_key(
        "fk_station_batteries_tenant_station",
        "station_batteries",
        "swap_stations",
        ["tenant_id", "station_id"],
        ["tenant_id", "id"],
    )

    # 3. Restore the tenant-aware route relationship.
    op.drop_constraint(
        "fk_routes_recommended_swap_station",
        "routes",
        type_="foreignkey",
    )

    op.create_foreign_key(
        "fk_routes_tenant_swap_station",
        "routes",
        "swap_stations",
        ["tenant_id", "recommended_swap_station_id"],
        ["tenant_id", "id"],
    )

    op.drop_table("swap_providers")

    # The existing spatial index and trigger remain unchanged.
