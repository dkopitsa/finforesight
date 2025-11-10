from sqlalchemy import Boolean, Column, String

from app.models.base import BaseModel


class User(BaseModel):
    """User model for authentication and user preferences."""

    __tablename__ = "users"

    email = Column(String(255), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=True)
    currency = Column(String(3), nullable=False, default="USD")
    is_active = Column(Boolean, default=True, nullable=False)

    def __repr__(self) -> str:
        return f"<User(id={self.id}, email={self.email})>"
