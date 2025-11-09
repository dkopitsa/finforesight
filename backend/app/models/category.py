import enum

from sqlalchemy import Boolean, Column, Enum, ForeignKey, Integer, String
from sqlalchemy.orm import relationship

from app.models.base import BaseModel


class CategoryType(str, enum.Enum):
    """Category type enumeration."""

    INCOME = "income"
    EXPENSE = "expense"
    TRANSFER = "transfer"


class Category(BaseModel):
    """Transaction category model."""

    __tablename__ = "categories"

    user_id = Column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=True
    )  # NULL for system categories
    name = Column(String(255), nullable=False)
    type = Column(Enum(CategoryType), nullable=False)
    icon = Column(String(50), nullable=True)
    color = Column(String(7), nullable=True)
    is_system = Column(Boolean, nullable=False, default=False)

    # Relationships
    user = relationship("User", backref="categories")

    def __repr__(self):
        return f"<Category(id={self.id}, name={self.name}, type={self.type})>"
