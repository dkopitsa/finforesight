"""Account schemas for API requests and responses."""

from datetime import date, datetime
from decimal import Decimal

from pydantic import BaseModel, Field, field_validator

from app.models.account import AccountType


class AccountBase(BaseModel):
    """Base account schema with common attributes."""

    name: str = Field(..., min_length=1, max_length=255, description="Account name")
    type: AccountType = Field(..., description="Account type")
    currency: str = Field(..., min_length=3, max_length=3, description="Currency code (ISO 4217)")
    initial_balance: Decimal = Field(..., description="Initial balance")
    initial_balance_date: date = Field(..., description="Date of initial balance")
    credit_limit: Decimal | None = Field(None, description="Credit limit (for credit cards/loans)")

    @field_validator("currency")
    @classmethod
    def validate_currency(cls, v: str) -> str:
        """Validate currency code is uppercase."""
        return v.upper()

    @field_validator("credit_limit")
    @classmethod
    def validate_credit_limit(cls, v: Decimal | None, info) -> Decimal | None:
        """Validate credit_limit is non-negative if provided."""
        if v is not None and v < 0:
            raise ValueError("credit_limit must be non-negative")
        return v


class AccountCreate(AccountBase):
    """Schema for creating a new account."""

    pass


class AccountUpdate(BaseModel):
    """Schema for updating an account."""

    name: str | None = Field(None, min_length=1, max_length=255)
    type: AccountType | None = None
    currency: str | None = Field(None, min_length=3, max_length=3)
    initial_balance: Decimal | None = None
    initial_balance_date: date | None = None
    credit_limit: Decimal | None = None
    is_active: bool | None = None

    @field_validator("currency")
    @classmethod
    def validate_currency(cls, v: str | None) -> str | None:
        """Validate currency code is uppercase."""
        return v.upper() if v is not None else None

    @field_validator("credit_limit")
    @classmethod
    def validate_credit_limit(cls, v: Decimal | None) -> Decimal | None:
        """Validate credit_limit is non-negative if provided."""
        if v is not None and v < 0:
            raise ValueError("credit_limit must be non-negative")
        return v


class AccountResponse(AccountBase):
    """Schema for account response."""

    id: int
    user_id: int
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class AccountSummary(BaseModel):
    """Schema for account summary by type."""

    liquid_assets: Decimal = Field(..., description="Total in checking, savings, and cash accounts")
    investments: Decimal = Field(..., description="Total in investment and retirement accounts")
    credit_used: Decimal = Field(..., description="Total credit used (negative balance)")
    loans_receivable: Decimal = Field(..., description="Total loans given to others")
    net_worth: Decimal = Field(..., description="Total net worth")
