"""Account reconciliation model."""

from sqlalchemy import Column, Date, ForeignKey, Integer, Numeric, Text
from sqlalchemy.orm import relationship

from app.models.base import BaseModel


class AccountReconciliation(BaseModel):
    """
    Account reconciliation model for tracking actual vs expected balances.

    Reconciliation is the process of comparing the system's calculated balance
    with the actual balance (from bank statements, etc.) and creating adjustments
    if needed.
    """

    __tablename__ = "account_reconciliations"

    user_id = Column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    account_id = Column(
        Integer, ForeignKey("accounts.id", ondelete="CASCADE"), nullable=False, index=True
    )

    # Reconciliation details
    reconciliation_date = Column(Date, nullable=False)
    expected_balance = Column(
        Numeric(15, 2), nullable=False, comment="Balance calculated by system"
    )
    actual_balance = Column(Numeric(15, 2), nullable=False, comment="Actual balance from bank/user")
    difference = Column(Numeric(15, 2), nullable=False, comment="actual_balance - expected_balance")

    # Optional adjustment
    adjustment_transaction_id = Column(
        Integer,
        ForeignKey("scheduled_transactions.id", ondelete="SET NULL"),
        nullable=True,
        comment="Adjustment transaction created to fix difference",
    )

    note = Column(Text, nullable=True)

    # Relationships
    user = relationship("User", backref="reconciliations")
    account = relationship("Account", backref="reconciliations")
    adjustment_transaction = relationship(
        "ScheduledTransaction", foreign_keys=[adjustment_transaction_id]
    )

    def __repr__(self):
        return f"<AccountReconciliation(id={self.id}, account_id={self.account_id}, date={self.reconciliation_date}, diff={self.difference})>"
