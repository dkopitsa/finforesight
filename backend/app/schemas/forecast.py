"""Forecast schemas for API requests and responses."""

from datetime import date as date_type
from decimal import Decimal

from pydantic import BaseModel, Field


class ForecastDataPointResponse(BaseModel):
    """A single data point in the forecast time series."""

    date: date_type = Field(..., description="Date of the data point")
    balance: Decimal = Field(..., description="Projected balance on this date")

    model_config = {"from_attributes": True}


class AccountForecastResponse(BaseModel):
    """Forecast data for a single account."""

    account_id: int = Field(..., description="Account ID")
    account_name: str = Field(..., description="Account name")
    currency: str = Field(..., description="Currency code (ISO 4217)")
    starting_balance: Decimal = Field(..., description="Current balance (starting point)")
    data_points: list[ForecastDataPointResponse] = Field(
        ..., description="Time-series forecast data"
    )

    model_config = {"from_attributes": True}


class ForecastResponse(BaseModel):
    """Response containing forecast for multiple accounts."""

    from_date: date_type = Field(..., description="Start date of forecast")
    to_date: date_type = Field(..., description="End date of forecast")
    accounts: list[AccountForecastResponse] = Field(..., description="Forecast data per account")

    model_config = {"from_attributes": True}
