"""Reconciliation schemas for API requests and responses."""

from datetime import date as date_type
from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, Field, field_validator


class ReconciliationCreate(BaseModel):
    """Schema for creating a reconciliation."""

    account_id: int = Field(..., description="Account ID to reconcile")
    reconciliation_date: date_type = Field(..., description="Date to reconcile to")
    actual_balance: Decimal = Field(..., description="Actual balance from bank/statement")
    note: str | None = Field(None, max_length=500, description="Optional note")
    create_adjustment: bool = Field(
        default=True,
        description="Whether to create adjustment transaction if difference exists",
    )

    @field_validator("actual_balance")
    @classmethod
    def validate_actual_balance(cls, v):
        """Validate actual balance is a valid decimal."""
        if v is None:
            raise ValueError("actual_balance is required")
        return v

    model_config = {"from_attributes": True}


class ReconciliationResponse(BaseModel):
    """Schema for reconciliation response."""

    id: int = Field(..., description="Reconciliation ID")
    user_id: int = Field(..., description="User ID")
    account_id: int = Field(..., description="Account ID")
    reconciliation_date: date_type = Field(..., description="Reconciliation date")
    expected_balance: Decimal = Field(..., description="Expected balance (calculated)")
    actual_balance: Decimal = Field(..., description="Actual balance (from user)")
    difference: Decimal = Field(..., description="Difference (actual - expected)")
    adjustment_transaction_id: int | None = Field(
        None, description="Adjustment transaction ID if created"
    )
    note: str | None = Field(None, description="Note")
    created_at: datetime = Field(..., description="Creation timestamp")

    model_config = {"from_attributes": True}


class ReconciliationSummary(BaseModel):
    """Summary of reconciliation with account details."""

    reconciliation: ReconciliationResponse = Field(..., description="Reconciliation details")
    account_name: str = Field(..., description="Account name")
    has_adjustment: bool = Field(..., description="Whether adjustment was created")

    model_config = {"from_attributes": True}
