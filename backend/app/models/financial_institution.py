from sqlalchemy import Column, ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.orm import relationship

from app.models.base import BaseModel


class FinancialInstitution(BaseModel):
    """Financial institution model."""

    __tablename__ = "financial_institutions"

    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(255), nullable=False)

    # Relationships
    user = relationship("User", back_populates="financial_institutions")

    __table_args__ = (UniqueConstraint("user_id", "name", name="uq_user_institution_name"),)

    def __repr__(self):
        return f"<FinancialInstitution(id={self.id}, name='{self.name}', user_id={self.user_id})>"
