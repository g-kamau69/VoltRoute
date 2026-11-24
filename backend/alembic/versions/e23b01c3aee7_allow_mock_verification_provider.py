"""allow mock verification provider

Revision ID: e23b01c3aee7
Revises: 4d590fea177a
Create Date: 2026-11-22 03:46:13.337968

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'e23b01c3aee7'
down_revision: Union[str, Sequence[str], None] = '4d590fea177a'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None



def upgrade() -> None:
    """Allow the mock verification provider."""

    constraints = [
        (
            "organization_verifications",
            "ck_org_verifications_provider",
        ),
        (
            "identity_verifications",
            "ck_identity_verifications_provider",
        ),
        (
            "driver_qualifications",
            "ck_driver_qualifications_provider",
        ),
    ]

    for table_name, constraint_name in constraints:
        op.drop_constraint(
            constraint_name,
            table_name,
            type_="check",
        )

        op.create_check_constraint(
            constraint_name,
            table_name,
            "provider IN ("
            "'manual', 'mock', 'persona', "
            "'smile_id', 'sumsub', 'other'"
            ")",
        )


def downgrade() -> None:
    """Restore the original provider constraints."""

    constraints = [
        (
            "organization_verifications",
            "ck_org_verifications_provider",
        ),
        (
            "identity_verifications",
            "ck_identity_verifications_provider",
        ),
        (
            "driver_qualifications",
            "ck_driver_qualifications_provider",
        ),
    ]

    for table_name, constraint_name in constraints:
        op.drop_constraint(
            constraint_name,
            table_name,
            type_="check",
        )

        op.create_check_constraint(
            constraint_name,
            table_name,
            "provider IN ("
            "'manual', 'persona', "
            "'smile_id', 'sumsub', 'other'"
            ")",
        )

