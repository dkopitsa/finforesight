"""Scheduled transaction schemas for API requests and responses."""

from datetime import date as date_type
from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, Field, field_validator, model_validator

from app.models.scheduled_transaction import RecurrenceFrequency


class ScheduledTransactionBase(BaseModel):
    """Base scheduled transaction schema with common attributes."""

    name: str = Field(..., min_length=1, max_length=255, description="Transaction name")
    amount: Decimal = Field(..., gt=0, description="Transaction amount (must be positive)")
    currency: str = Field(..., min_length=3, max_length=3, description="Currency code (ISO 4217)")
    account_id: int = Field(..., description="Source account ID")
    to_account_id: int | None = Field(None, description="Destination account ID (for transfers)")
    category_id: int = Field(..., description="Category ID")
    note: str | None = Field(None, description="Optional note")

    # Recurrence fields
    is_recurring: bool = Field(False, description="Whether this is a recurring transaction")
    recurrence_frequency: RecurrenceFrequency | None = Field(
        None, description="Recurrence pattern (MONTHLY or YEARLY)"
    )
    recurrence_day_of_month: int | None = Field(
        None,
        ge=-1,
        le=31,
        description="Day of month (1-31) or -1 for last day",
    )
    recurrence_month_of_year: int | None = Field(
        None,
        ge=1,
        le=12,
        description="Month of year (1-12), only for YEARLY recurrence",
    )
    recurrence_start_date: date_type = Field(
        ..., description="Start date (for both one-time and recurring)"
    )
    recurrence_end_date: date_type | None = Field(
        None, description="End date (NULL = infinite, only for recurring)"
    )

    @field_validator("currency")
    @classmethod
    def validate_currency(cls, v: str) -> str:
        """Ensure currency is uppercase."""
        return v.upper()

    @model_validator(mode="after")
    def validate_recurrence_fields(self):
        """Validate recurrence field consistency."""
        if self.is_recurring:
            # If recurring, must have frequency and start date
            if not self.recurrence_frequency:
                raise ValueError("recurrence_frequency is required when is_recurring=True")

            # MONTHLY requires day_of_month
            if self.recurrence_frequency == RecurrenceFrequency.MONTHLY:
                if self.recurrence_day_of_month is None:
                    raise ValueError("recurrence_day_of_month is required for MONTHLY recurrence")
                # month_of_year should not be set for MONTHLY
                if self.recurrence_month_of_year is not None:
                    raise ValueError(
                        "recurrence_month_of_year should only be set for YEARLY recurrence"
                    )

            # YEARLY requires both day_of_month and month_of_year
            elif self.recurrence_frequency == RecurrenceFrequency.YEARLY:
                if self.recurrence_day_of_month is None:
                    raise ValueError("recurrence_day_of_month is required for YEARLY recurrence")
                if self.recurrence_month_of_year is None:
                    raise ValueError("recurrence_month_of_year is required for YEARLY recurrence")

        else:
            # If not recurring, these fields should not be set
            if self.recurrence_frequency is not None:
                raise ValueError("recurrence_frequency should only be set when is_recurring=True")
            if self.recurrence_day_of_month is not None:
                raise ValueError(
                    "recurrence_day_of_month should only be set when is_recurring=True"
                )
            if self.recurrence_month_of_year is not None:
                raise ValueError(
                    "recurrence_month_of_year should only be set when is_recurring=True"
                )
            if self.recurrence_end_date is not None:
                raise ValueError("recurrence_end_date should only be set when is_recurring=True")

        # Validate end_date is after start_date
        if self.recurrence_end_date and self.recurrence_end_date < self.recurrence_start_date:
            raise ValueError("recurrence_end_date must be on or after recurrence_start_date")

        return self


class ScheduledTransactionCreate(ScheduledTransactionBase):
    """Schema for creating a new scheduled transaction."""

    pass


class ScheduledTransactionUpdate(BaseModel):
    """Schema for updating a scheduled transaction."""

    name: str | None = Field(None, min_length=1, max_length=255)
    amount: Decimal | None = Field(None, gt=0)
    currency: str | None = Field(None, min_length=3, max_length=3)
    account_id: int | None = None
    to_account_id: int | None = None
    category_id: int | None = None
    note: str | None = None

    # Recurrence fields (for full series updates)
    is_recurring: bool | None = None
    recurrence_frequency: RecurrenceFrequency | None = None
    recurrence_day_of_month: int | None = Field(None, ge=-1, le=31)
    recurrence_month_of_year: int | None = Field(None, ge=1, le=12)
    recurrence_start_date: date_type | None = None
    recurrence_end_date: date_type | None = None

    @field_validator("currency")
    @classmethod
    def validate_currency(cls, v: str | None) -> str | None:
        """Ensure currency is uppercase."""
        return v.upper() if v else v


class ScheduledTransactionResponse(ScheduledTransactionBase):
    """Schema for scheduled transaction response."""

    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class ScheduledTransactionInstance(BaseModel):
    """
    Schema for an expanded transaction instance (for calendar view).

    Represents a single occurrence from a recurring transaction or a one-time transaction.
    """

    # Instance-specific
    date: date_type = Field(..., description="The specific date of this occurrence")
    is_exception: bool = Field(False, description="Whether this instance has been modified")
    exception_id: int | None = Field(None, description="ID of the exception if modified")

    # Transaction details (from scheduled transaction or exception)
    scheduled_transaction_id: int
    name: str
    amount: Decimal
    currency: str
    account_id: int
    to_account_id: int | None
    category_id: int
    note: str | None
    is_deleted: bool = Field(False, description="Whether this occurrence is skipped")

    model_config = {"from_attributes": True}


class ScheduledTransactionExceptionCreate(BaseModel):
    """Schema for creating a transaction exception (modifying a single instance)."""

    exception_date: date_type = Field(..., description="The date of the occurrence to modify")
    amount: Decimal | None = Field(None, gt=0, description="Override amount (NULL = use original)")
    note: str | None = Field(None, description="Override note (NULL = use original)")
    is_deleted: bool = Field(False, description="Skip this occurrence")

    @model_validator(mode="after")
    def validate_exception(self):
        """Ensure exception has at least one override or is_deleted."""
        if not self.is_deleted and self.amount is None and self.note is None:
            raise ValueError(
                "Exception must either set is_deleted=True or provide at least one override (amount or note)"
            )
        return self


class ScheduledTransactionExceptionResponse(BaseModel):
    """Schema for scheduled transaction exception response."""

    id: int
    scheduled_transaction_id: int
    exception_date: date_type
    amount: Decimal | None
    note: str | None
    is_deleted: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
