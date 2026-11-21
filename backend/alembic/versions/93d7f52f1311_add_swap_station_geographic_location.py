
"""add swap station geographic location

Revision ID: 93d7f52f1311
Revises: 1f68d77e1131
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from geoalchemy2 import Geography


# Alembic revision identifiers
revision: str = "93d7f52f1311"
down_revision: Union[str, Sequence[str], None] = "1f68d77e1131"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add the geographic point column.
    op.add_column(
        "swap_stations",
        sa.Column(
            "location",
            Geography(
                geometry_type="POINT",
                srid=4326,
                spatial_index=False
            ),
            nullable=True
        )
    )

    # Populate geographic locations using existing coordinates.
    # ST_MakePoint requires longitude first, latitude second.
    op.execute("""
        UPDATE swap_stations
        SET location = ST_SetSRID(
            ST_MakePoint(longitude, latitude),
            4326
        )::geography
        WHERE latitude IS NOT NULL
          AND longitude IS NOT NULL
    """)

    # Create a GiST spatial index for geographic searches.
    op.create_index(
        "ix_swap_stations_location",
        "swap_stations",
        ["location"],
        unique=False,
        postgresql_using="gist"
    )


def downgrade() -> None:
    # Remove the spatial index before removing the column.
    op.drop_index(
        "ix_swap_stations_location",
        table_name="swap_stations"
    )

    op.drop_column(
        "swap_stations",
        "location"
    )
