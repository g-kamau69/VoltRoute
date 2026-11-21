
"""add tenant onboarding foundation

Revision ID: 63a5bcb5e502
Revises: b83d665e23b0
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "63a5bcb5e502"
down_revision: Union[str, Sequence[str], None] = "b83d665e23b0"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Create tenant invitation records.
    op.create_table(
        "tenant_invitations",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("tenant_id", sa.Integer(), nullable=False),
        sa.Column("email", sa.String(255), nullable=False),
        sa.Column("full_name", sa.String(150), nullable=False),
        sa.Column("role", sa.String(30), nullable=False),
        sa.Column("token_hash", sa.String(64), nullable=False),
        sa.Column("status", sa.String(30), nullable=False),
        sa.Column(
            "created_by_admin_id",
            sa.Integer(),
            nullable=True,
        ),
        sa.Column(
            "expires_at",
            sa.DateTime(timezone=True),
            nullable=False,
        ),
        sa.Column(
            "accepted_at",
            sa.DateTime(timezone=True),
            nullable=True,
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
        ),
        sa.CheckConstraint(
            "role IN ('tenant_admin', 'fleet_manager', 'driver')",
            name="ck_tenant_invitations_role",
        ),
        sa.CheckConstraint(
            "status IN ('pending', 'accepted', 'revoked')",
            name="ck_tenant_invitations_status",
        ),
        sa.ForeignKeyConstraint(
            ["tenant_id"],
            ["tenants.id"],
        ),
        sa.ForeignKeyConstraint(
            ["created_by_admin_id"],
            ["platform_admins.id"],
            ondelete="SET NULL",
        ),
        sa.UniqueConstraint("token_hash"),
    )

    op.create_index(
        "ix_tenant_invitations_tenant_id",
        "tenant_invitations",
        ["tenant_id"],
    )

    # 2. Extend users with safe initial values.
    op.add_column(
        "users",
        sa.Column(
            "is_active",
            sa.Boolean(),
            nullable=False,
            server_default=sa.true(),
        ),
    )

    op.add_column(
        "users",
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("CURRENT_TIMESTAMP"),
        ),
    )

    # 3. Enforce supported tenant user roles.
    op.create_check_constraint(
        "ck_users_role",
        "users",
        "role IN ('tenant_admin', 'fleet_manager', 'driver')",
    )

    # 4. Remove migration-only defaults after backfilling.
    op.alter_column(
        "users",
        "is_active",
        server_default=None,
    )

    op.alter_column(
        "users",
        "updated_at",
        server_default=None,
    )

    # IMPORTANT:
    # Preserve ix_swap_stations_location.
    # Do not alter the swap_stations table.


def downgrade() -> None:
    # Reverse user extensions.
    op.drop_constraint(
        "ck_users_role",
        "users",
        type_="check",
    )

    op.drop_column("users", "updated_at")
    op.drop_column("users", "is_active")

    # Remove tenant invitation records.
    op.drop_index(
        "ix_tenant_invitations_tenant_id",
        table_name="tenant_invitations",
    )

    op.drop_table("tenant_invitations")

    # Existing swap-station indexes remain untouched.
