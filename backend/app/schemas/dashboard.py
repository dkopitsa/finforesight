"""Dashboard schemas for API responses."""

from datetime import date as date_type
from decimal import Decimal

from pydantic import BaseModel, Field


class FinancialSummaryResponse(BaseModel):
    """Financial summary response."""

    liquid_assets: Decimal = Field(
        ..., description="Total liquid assets (checking + savings + cash)"
    )
    investments: Decimal = Field(..., description="Total investments (investment + retirement)")
    credit_used: Decimal = Field(..., description="Total credit used (credit cards + loans)")
    loans_receivable: Decimal = Field(..., description="Total loans given to others")
    net_worth: Decimal = Field(..., description="Net worth (assets - liabilities)")
    account_count: int = Field(..., description="Total number of active accounts")

    model_config = {"from_attributes": True}


class UpcomingTransactionResponse(BaseModel):
    """Upcoming transaction response."""

    scheduled_transaction_id: int = Field(..., description="Scheduled transaction ID")
    date: date_type = Field(..., description="Transaction date")
    name: str = Field(..., description="Transaction name")
    amount: Decimal = Field(..., description="Transaction amount")
    account_name: str = Field(..., description="Account name")
    category_name: str = Field(..., description="Category name")
    is_transfer: bool = Field(..., description="Whether this is a transfer between accounts")

    model_config = {"from_attributes": True}


class BalanceTrendPointResponse(BaseModel):
    """Balance trend point response."""

    date: date_type = Field(..., description="Date")
    balance: Decimal = Field(..., description="Total balance across all accounts")

    model_config = {"from_attributes": True}


class DashboardResponse(BaseModel):
    """Complete dashboard response."""

    financial_summary: FinancialSummaryResponse = Field(..., description="Financial summary")
    upcoming_transactions: list[UpcomingTransactionResponse] = Field(
        ..., description="Upcoming transactions (next 30 days)"
    )
    balance_trend: list[BalanceTrendPointResponse] = Field(
        ..., description="Balance trend (next 30 days)"
    )
    scheduled_transaction_count: int = Field(..., description="Total scheduled transaction count")

    model_config = {"from_attributes": True}
