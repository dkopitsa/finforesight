from sqlalchemy import Column, String

from app.models.base import BaseModel


class User(BaseModel):
    """User model for authentication and user preferences."""

    __tablename__ = "users"

    email = Column(String(255), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    name = Column(String(255), nullable=True)
    base_currency = Column(String(3), nullable=False, default="USD")
    date_format = Column(String(20), nullable=False, default="DD.MM.YYYY")

    def __repr__(self):
        return f"<User(id={self.id}, email={self.email})>"
