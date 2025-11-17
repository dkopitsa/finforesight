"""Add account_id, to_account_id, status fields to scheduled_transaction_exceptions

Revision ID: a1b2c3d4e5f6
Revises: 9b289416089d
Create Date: 2025-11-17 12:00:00.000000

"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "a1b2c3d4e5f6"
down_revision: str | Sequence[str] | None = "9b289416089d"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """Upgrade schema."""
    # Add new columns to scheduled_transaction_exceptions table
    op.add_column(
        "scheduled_transaction_exceptions",
        sa.Column("account_id", sa.Integer(), nullable=True),
    )
    op.add_column(
        "scheduled_transaction_exceptions",
        sa.Column("to_account_id", sa.Integer(), nullable=True),
    )
    op.add_column(
        "scheduled_transaction_exceptions",
        sa.Column(
            "status",
            sa.String(length=20),
            nullable=True,
            comment="Status: pending, completed, confirmed",
        ),
    )
    op.add_column(
        "scheduled_transaction_exceptions",
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.add_column(
        "scheduled_transaction_exceptions",
        sa.Column("confirmed_at", sa.DateTime(timezone=True), nullable=True),
    )

    # Create foreign key constraints
    op.create_foreign_key(
        "fk_exception_account",
        "scheduled_transaction_exceptions",
        "accounts",
        ["account_id"],
        ["id"],
        ondelete="CASCADE",
    )
    op.create_foreign_key(
        "fk_exception_to_account",
        "scheduled_transaction_exceptions",
        "accounts",
        ["to_account_id"],
        ["id"],
        ondelete="CASCADE",
    )


def downgrade() -> None:
    """Downgrade schema."""
    # Drop foreign key constraints
    op.drop_constraint(
        "fk_exception_to_account", "scheduled_transaction_exceptions", type_="foreignkey"
    )
    op.drop_constraint(
        "fk_exception_account", "scheduled_transaction_exceptions", type_="foreignkey"
    )

    # Drop columns
    op.drop_column("scheduled_transaction_exceptions", "confirmed_at")
    op.drop_column("scheduled_transaction_exceptions", "completed_at")
    op.drop_column("scheduled_transaction_exceptions", "status")
    op.drop_column("scheduled_transaction_exceptions", "to_account_id")
    op.drop_column("scheduled_transaction_exceptions", "account_id")
