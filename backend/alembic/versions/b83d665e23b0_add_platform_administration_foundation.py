
"""add platform administration foundation

Revision ID: b83d665e23b0
Revises: f5572aeb175f
Create Date: 2026-11-12
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "b83d665e23b0"
down_revision: Union[str, Sequence[str], None] = "f5572aeb175f"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:

    # 1. Platform administrator accounts
    op.create_table(
        "platform_admins",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("full_name", sa.String(150), nullable=False),
        sa.Column("email", sa.String(255), nullable=False),
        sa.Column("password_hash", sa.String(255), nullable=False),
        sa.Column("role", sa.String(30), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False
        ),
        sa.CheckConstraint(
            "role IN ('super_admin', 'platform_admin')",
            name="ck_platform_admins_role"
        ),
    )

    op.create_index(
        "ix_platform_admins_email",
        "platform_admins",
        ["email"],
        unique=True
    )

    # 2. Administrative audit logs
    op.create_table(
        "admin_audit_logs",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("admin_id", sa.Integer(), nullable=True),
        sa.Column("action", sa.String(100), nullable=False),
        sa.Column("target_type", sa.String(50), nullable=False),
        sa.Column("target_id", sa.Integer(), nullable=True),
        sa.Column("details", sa.Text(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False
        ),
        sa.ForeignKeyConstraint(
            ["admin_id"],
            ["platform_admins.id"],
            name="fk_admin_audit_logs_admin",
            ondelete="SET NULL"
        ),
    )

    op.create_index(
        "ix_admin_audit_logs_admin_id",
        "admin_audit_logs",
        ["admin_id"]
    )

    # 3. Tenant registration requests
    op.create_table(
        "tenant_registration_requests",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column(
            "organization_name",
            sa.String(150),
            nullable=False
        ),
        sa.Column("contact_name", sa.String(150), nullable=False),
        sa.Column("contact_email", sa.String(255), nullable=False),
        sa.Column("contact_phone", sa.String(30), nullable=True),
        sa.Column(
            "status",
            sa.String(30),
            nullable=False
        ),
        sa.Column("review_notes", sa.Text(), nullable=True),
        sa.Column("reviewed_by", sa.Integer(), nullable=True),
        sa.Column(
            "reviewed_at",
            sa.DateTime(timezone=True),
            nullable=True
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False
        ),
        sa.ForeignKeyConstraint(
            ["reviewed_by"],
            ["platform_admins.id"],
            name="fk_tenant_requests_reviewer"
        ),
        sa.CheckConstraint(
            "status IN ('pending', 'approved', 'rejected')",
            name="ck_tenant_requests_status"
        ),
    )

    op.create_index(
        "ix_tenant_registration_requests_contact_email",
        "tenant_registration_requests",
        ["contact_email"]
    )

    # 4. Extend existing tenants safely
    # Existing tenants remain active.
    op.add_column(
        "tenants",
        sa.Column(
            "status",
            sa.String(30),
            nullable=False,
            server_default="active"
        )
    )

    op.add_column(
        "tenants",
        sa.Column(
            "approved_by",
            sa.Integer(),
            nullable=True
        )
    )

    op.add_column(
        "tenants",
        sa.Column(
            "approved_at",
            sa.DateTime(timezone=True),
            nullable=True
        )
    )

    op.add_column(
        "tenants",
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("CURRENT_TIMESTAMP")
        )
    )

    op.create_foreign_key(
        "fk_tenants_approved_by",
        "tenants",
        "platform_admins",
        ["approved_by"],
        ["id"],
        ondelete="SET NULL"
    )

    op.create_check_constraint(
        "ck_tenants_status",
        "tenants",
        "status IN ('active', 'suspended')"
    )

    # Remove temporary defaults after initializing existing rows.
    op.alter_column(
        "tenants",
        "status",
        server_default=None
    )

    op.alter_column(
        "tenants",
        "updated_at",
        server_default=None
    )

    # Preserve the existing PostGIS spatial index.
    # No changes to swap_stations.


def downgrade() -> None:

    # Reverse tenant extensions
    op.drop_constraint(
        "ck_tenants_status",
        "tenants",
        type_="check"
    )

    op.drop_constraint(
        "fk_tenants_approved_by",
        "tenants",
        type_="foreignkey"
    )

    op.drop_column("tenants", "updated_at")
    op.drop_column("tenants", "approved_at")
    op.drop_column("tenants", "approved_by")
    op.drop_column("tenants", "status")

    # Remove registration requests
    op.drop_index(
        "ix_tenant_registration_requests_contact_email",
        table_name="tenant_registration_requests"
    )
    op.drop_table("tenant_registration_requests")

    # Remove audit logs
    op.drop_index(
        "ix_admin_audit_logs_admin_id",
        table_name="admin_audit_logs"
    )
    op.drop_table("admin_audit_logs")

    # Remove platform administrators
    op.drop_index(
        "ix_platform_admins_email",
        table_name="platform_admins"
    )
    op.drop_table("platform_admins")
