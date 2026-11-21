"""synchronize swap station coordinates

Revision ID: b8595ff6b0c4
Revises: 93d7f52f1311
Create Date: 2026-11-10 07:44:46.859458

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b8595ff6b0c4'
down_revision: Union[str, Sequence[str], None] = '93d7f52f1311'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None



def upgrade() -> None:
    op.execute("""
        CREATE OR REPLACE FUNCTION
        sync_swap_station_location()
        RETURNS trigger AS $$
        BEGIN
            NEW.location := ST_SetSRID(
                ST_MakePoint(NEW.longitude, NEW.latitude),
                4326
            )::geography;

            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
    """)

    op.execute("""
        CREATE TRIGGER trg_sync_swap_station_location
        BEFORE INSERT OR UPDATE OF latitude, longitude
        ON swap_stations
        FOR EACH ROW
        EXECUTE FUNCTION sync_swap_station_location();
    """)

    # Synchronize existing station records.
    op.execute("""
        UPDATE swap_stations
        SET location = ST_SetSRID(
            ST_MakePoint(longitude, latitude),
            4326
        )::geography;
    """)


def downgrade() -> None:
    op.execute("""
        DROP TRIGGER IF EXISTS
        trg_sync_swap_station_location
        ON swap_stations;
    """)

    op.execute("""
        DROP FUNCTION IF EXISTS
        sync_swap_station_location();
    """)
