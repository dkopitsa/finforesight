"""Add PLANNING value to accounttype enum

Revision ID: cf0154ea9556
Revises: 15e6716ad693
Create Date: 2025-11-17 07:46:59.251767

"""

from collections.abc import Sequence

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "cf0154ea9556"
down_revision: str | Sequence[str] | None = "15e6716ad693"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """Upgrade schema."""
    # Add PLANNING value to accounttype enum
    op.execute("ALTER TYPE accounttype ADD VALUE IF NOT EXISTS 'PLANNING'")


def downgrade() -> None:
    """Downgrade schema."""
    # Note: PostgreSQL doesn't support removing enum values directly
    # This would require recreating the enum type and all dependent columns
    pass
