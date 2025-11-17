"""Merge reconciliation and confirmation features

Revision ID: 15e6716ad693
Revises: 988999a9ba36, a1b2c3d4e5f6
Create Date: 2025-11-17 07:41:18.281885

"""

from collections.abc import Sequence

# revision identifiers, used by Alembic.
revision: str = "15e6716ad693"
down_revision: str | Sequence[str] | None = ("988999a9ba36", "a1b2c3d4e5f6")
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
