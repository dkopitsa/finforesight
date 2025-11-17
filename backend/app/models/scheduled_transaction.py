"""Scheduled transaction models for recurring and one-time transactions."""

import enum

from sqlalchemy import (
    Boolean,
    CheckConstraint,
    Column,
    Date,
    DateTime,
    Enum,
    ForeignKey,
    Integer,
    Numeric,
    String,
    Text,
)
from sqlalchemy.orm import relationship

from app.models.base import BaseModel


class RecurrenceFrequency(str, enum.Enum):
    """Recurrence frequency enumeration."""

    MONTHLY = "MONTHLY"
    YEARLY = "YEARLY"


class ScheduledTransaction(BaseModel):
    """
    Scheduled transaction model for both one-time and recurring transactions.

    This is the core model for the "Google Calendar for money" feature,
    representing transaction rules that can be expanded into actual occurrences.
    """

    __tablename__ = "scheduled_transactions"

    # Ownership
    user_id = Column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )

    # Transaction details
    account_id = Column(
        Integer, ForeignKey("accounts.id", ondelete="RESTRICT"), nullable=False, index=True
    )
    to_account_id = Column(Integer, ForeignKey("accounts.id", ondelete="RESTRICT"), nullable=True)
    category_id = Column(Integer, ForeignKey("categories.id", ondelete="RESTRICT"), nullable=False)

    name = Column(String(255), nullable=False)
    amount = Column(Numeric(15, 2), nullable=False)
    currency = Column(String(3), nullable=False)
    note = Column(Text, nullable=True)

    # Recurrence settings
    is_recurring = Column(Boolean, nullable=False, default=False)
    recurrence_frequency = Column(Enum(RecurrenceFrequency), nullable=True)
    recurrence_day_of_month = Column(Integer, nullable=True)  # 1-31 or -1 for last day
    recurrence_month_of_year = Column(Integer, nullable=True)  # 1-12, only for YEARLY
    recurrence_start_date = Column(
        Date, nullable=False
    )  # Start date for both one-time and recurring
    recurrence_end_date = Column(Date, nullable=True)  # NULL = infinite, only for recurring

    # Relationships
    user = relationship("User", backref="scheduled_transactions")
    account = relationship(
        "Account", foreign_keys=[account_id], backref="scheduled_transactions_from"
    )
    to_account = relationship(
        "Account", foreign_keys=[to_account_id], backref="scheduled_transactions_to"
    )
    category = relationship("Category", backref="scheduled_transactions")
    exceptions = relationship(
        "ScheduledTransactionException",
        back_populates="scheduled_transaction",
        cascade="all, delete-orphan",
    )

    # Constraints
    __table_args__ = (
        CheckConstraint("amount > 0", name="check_amount_positive"),
        CheckConstraint(
            "recurrence_day_of_month IS NULL OR (recurrence_day_of_month BETWEEN -1 AND 31)",
            name="check_day_of_month_range",
        ),
        CheckConstraint(
            "recurrence_month_of_year IS NULL OR (recurrence_month_of_year BETWEEN 1 AND 12)",
            name="check_month_of_year_range",
        ),
        CheckConstraint(
            "recurrence_end_date IS NULL OR recurrence_end_date >= recurrence_start_date",
            name="check_end_date_after_start",
        ),
    )

    def __repr__(self):
        return f"<ScheduledTransaction(id={self.id}, name={self.name}, is_recurring={self.is_recurring})>"


class ScheduledTransactionException(BaseModel):
    """
    Exception model for instance-specific modifications to recurring transactions.

    Allows editing a single occurrence without affecting the entire series.
    Examples: "December salary has bonus", "Skip this month", "Increase this one"
    """

    __tablename__ = "scheduled_transaction_exceptions"

    scheduled_transaction_id = Column(
        Integer,
        ForeignKey("scheduled_transactions.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    exception_date = Column(Date, nullable=False)

    # Override fields (NULL means use original value)
    amount = Column(Numeric(15, 2), nullable=True)  # Override amount
    note = Column(Text, nullable=True)  # Override note
    account_id = Column(
        Integer, ForeignKey("accounts.id", ondelete="CASCADE"), nullable=True
    )  # Override account
    to_account_id = Column(
        Integer, ForeignKey("accounts.id", ondelete="CASCADE"), nullable=True
    )  # Override to_account
    is_deleted = Column(Boolean, nullable=False, default=False)  # Skip this occurrence

    # Status tracking
    status = Column(String(20), nullable=True, comment="Status: pending, completed, confirmed")
    completed_at = Column(DateTime(timezone=True), nullable=True)
    confirmed_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    scheduled_transaction = relationship("ScheduledTransaction", back_populates="exceptions")
    account = relationship("Account", foreign_keys=[account_id])
    to_account = relationship("Account", foreign_keys=[to_account_id])

    # Constraints
    __table_args__ = (
        CheckConstraint("amount IS NULL OR amount > 0", name="check_exception_amount_positive"),
        # Unique constraint: one exception per (transaction, date) pair
        # This prevents multiple modifications for the same occurrence
    )

    def __repr__(self):
        status = "deleted" if self.is_deleted else "modified"
        return f"<ScheduledTransactionException(id={self.id}, date={self.exception_date}, status={status})>"
