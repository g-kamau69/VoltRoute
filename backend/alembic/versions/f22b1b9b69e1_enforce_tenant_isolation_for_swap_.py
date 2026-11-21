
"""enforce tenant isolation for swap stations

Revision ID: f22b1b9b69e1
Revises: b8595ff6b0c4
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "f22b1b9b69e1"
down_revision: Union[str, Sequence[str], None] = "b8595ff6b0c4"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Add the composite unique constraint first.
    op.create_unique_constraint(
        "uq_swap_stations_tenant_id",
        "swap_stations",
        ["tenant_id", "id"],
    )

    # 2. Secure routes -> swap stations.
    op.drop_constraint(
        "routes_recommended_swap_station_id_fkey",
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

    # 3. Add tenant ownership to station batteries.
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

    # 4. Replace the old station foreign key.
    op.drop_constraint(
        "station_batteries_station_id_fkey",
        "station_batteries",
        type_="foreignkey",
    )

    op.create_foreign_key(
        "fk_station_batteries_tenant_station",
        "station_batteries",
        "swap_stations",
        ["tenant_id", "station_id"],
        ["tenant_id", "id"],
    )

    # 5. Ensure the tenant exists.
    op.create_foreign_key(
        "fk_station_batteries_tenant",
        "station_batteries",
        "tenants",
        ["tenant_id"],
        ["id"],
    )

    # Preserve ix_swap_stations_location.
    # The existing PostGIS GiST index is not modified.


def downgrade() -> None:
    # 1. Remove the tenant foreign keys.
    op.drop_constraint(
        "fk_station_batteries_tenant",
        "station_batteries",
        type_="foreignkey",
    )

    op.drop_constraint(
        "fk_station_batteries_tenant_station",
        "station_batteries",
        type_="foreignkey",
    )

    # 2. Restore the original station relationship.
    op.create_foreign_key(
        "station_batteries_station_id_fkey",
        "station_batteries",
        "swap_stations",
        ["station_id"],
        ["id"],
    )

    op.drop_index(
        "ix_station_batteries_tenant_id",
        table_name="station_batteries",
    )

    op.drop_column(
        "station_batteries",
        "tenant_id",
    )

    # 3. Restore the original route relationship.
    op.drop_constraint(
        "fk_routes_tenant_swap_station",
        "routes",
        type_="foreignkey",
    )

    op.create_foreign_key(
        "routes_recommended_swap_station_id_fkey",
        "routes",
        "swap_stations",
        ["recommended_swap_station_id"],
        ["id"],
    )

    # 4. Remove the composite unique constraint.
    op.drop_constraint(
        "uq_swap_stations_tenant_id",
        "swap_stations",
        type_="unique",
    )

    # Preserve the existing PostGIS spatial index.
