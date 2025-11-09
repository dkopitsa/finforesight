import enum

from sqlalchemy import Boolean, Column, Date, Enum, ForeignKey, Integer, Numeric, String
from sqlalchemy.orm import relationship

from app.models.base import BaseModel


class AccountType(str, enum.Enum):
    """Account type enumeration."""

    # Liquid assets
    CHECKING = "checking"
    SAVINGS = "savings"
    CASH = "cash"

    # Long-term investments
    INVESTMENT = "investment"
    RETIREMENT = "retirement"

    # Credit
    CREDIT_CARD = "credit_card"
    LOAN = "loan"

    # Receivables
    LOAN_GIVEN = "loan_given"


class Account(BaseModel):
    """Financial account model."""

    __tablename__ = "accounts"

    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(255), nullable=False)
    type = Column(Enum(AccountType), nullable=False)
    currency = Column(String(3), nullable=False)
    initial_balance = Column(Numeric(15, 2), nullable=False)
    initial_balance_date = Column(Date, nullable=False)
    credit_limit = Column(Numeric(15, 2), nullable=True)
    is_active = Column(Boolean, nullable=False, default=True)

    # Relationships
    user = relationship("User", backref="accounts")

    def __repr__(self):
        return f"<Account(id={self.id}, name={self.name}, type={self.type})>"
