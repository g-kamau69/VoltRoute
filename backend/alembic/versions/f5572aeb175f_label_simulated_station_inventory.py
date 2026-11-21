
"""label simulated station inventory

Revision ID: f5572aeb175f
Revises: 859acdec9314
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# Alembic revision identifiers
revision: str = "f5572aeb175f"
down_revision: Union[str, Sequence[str], None] = "859acdec9314"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add an explicit source label for battery inventory.
    op.add_column(
        "swap_stations",
        sa.Column(
            "inventory_source",
            sa.String(length=30),
            server_default="simulated",
            nullable=False,
        ),
    )

    # Enforce the supported inventory source.
    op.create_check_constraint(
        "ck_swap_stations_inventory_source",
        "swap_stations",
        "inventory_source = 'simulated'",
    )

    # Preserve the existing PostGIS spatial index.
    # Do not drop ix_swap_stations_location.


def downgrade() -> None:
    # Remove the constraint before removing its column.
    op.drop_constraint(
        "ck_swap_stations_inventory_source",
        "swap_stations",
        type_="check",
    )

    op.drop_column(
        "swap_stations",
        "inventory_source",
    )

    # Preserve the existing PostGIS spatial index.
