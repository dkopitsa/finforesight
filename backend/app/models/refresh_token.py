"""RefreshToken model for managing JWT refresh tokens."""

from datetime import UTC, datetime, timedelta

from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String

from app.core.config import settings
from app.models.base import BaseModel


class RefreshToken(BaseModel):
    """RefreshToken model for storing and validating refresh tokens."""

    __tablename__ = "refresh_tokens"

    token = Column(String(500), unique=True, nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    is_revoked = Column(Boolean, default=False, nullable=False)

    def __repr__(self) -> str:
        return f"<RefreshToken(id={self.id}, user_id={self.user_id}, revoked={self.is_revoked})>"

    @property
    def is_expired(self) -> bool:
        """Check if the refresh token has expired."""
        # Handle both timezone-aware and timezone-naive datetimes
        now = datetime.now(UTC)
        expires_at = self.expires_at

        # If expires_at is naive, make it aware (assume UTC)
        if expires_at.tzinfo is None:
            expires_at = expires_at.replace(tzinfo=UTC)

        return now > expires_at

    @property
    def is_valid(self) -> bool:
        """Check if the refresh token is valid (not expired and not revoked)."""
        return not self.is_expired and not self.is_revoked

    @classmethod
    def create_expiry(cls) -> datetime:
        """Create an expiry datetime for a new refresh token."""
        return datetime.now(UTC) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
