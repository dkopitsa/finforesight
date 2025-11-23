"""Dashboard routes for financial overview."""

import logging

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_active_user, get_db
from app.models.user import User
from app.schemas.dashboard import (
    BalanceTrendPointResponse,
    DashboardResponse,
    FinancialSummaryResponse,
    UpcomingTransactionResponse,
)
from app.services.dashboard_service import DashboardService

router = APIRouter()
logger = logging.getLogger(__name__)


@router.get("/", response_model=DashboardResponse)
async def get_dashboard(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> DashboardResponse:
    """
    Get dashboard overview.

    Returns comprehensive financial overview including:
    - Financial summary (liquid assets, investments, credit, net worth)
    - Upcoming transactions (next 30 days)
    - Balance trend (next 30 days)
    - Quick stats (account count, scheduled transaction count)
    """
    # Get dashboard data
    dashboard = await DashboardService.get_dashboard(
        user_id=current_user.id,
        db=db,
    )

    # Convert to response format
    financial_summary = FinancialSummaryResponse(
        liquid_assets=dashboard.financial_summary.liquid_assets,
        investments=dashboard.financial_summary.investments,
        credit_used=dashboard.financial_summary.credit_used,
        loans_receivable=dashboard.financial_summary.loans_receivable,
        net_worth=dashboard.financial_summary.net_worth,
        account_count=dashboard.financial_summary.account_count,
    )

    upcoming_transactions = [
        UpcomingTransactionResponse(
            scheduled_transaction_id=tx.scheduled_transaction_id,
            date=tx.date,
            name=tx.name,
            amount=tx.amount,
            account_name=tx.account_name,
            category_name=tx.category_name,
            is_transfer=tx.is_transfer,
        )
        for tx in dashboard.upcoming_transactions
    ]

    balance_trend = [
        BalanceTrendPointResponse(date=point.date, balance=point.balance)
        for point in dashboard.balance_trend
    ]

    liquid_trend = [
        BalanceTrendPointResponse(date=point.date, balance=point.balance)
        for point in dashboard.liquid_trend
    ]

    investments_trend = [
        BalanceTrendPointResponse(date=point.date, balance=point.balance)
        for point in dashboard.investments_trend
    ]

    credit_trend = [
        BalanceTrendPointResponse(date=point.date, balance=point.balance)
        for point in dashboard.credit_trend
    ]

    logger.info(
        "Dashboard data retrieved",
        extra={
            "user_id": current_user.id,
            "account_count": dashboard.financial_summary.account_count,
            "upcoming_tx_count": len(upcoming_transactions),
            "trend_points": len(balance_trend),
        },
    )

    return DashboardResponse(
        financial_summary=financial_summary,
        upcoming_transactions=upcoming_transactions,
        balance_trend=balance_trend,
        liquid_trend=liquid_trend,
        investments_trend=investments_trend,
        credit_trend=credit_trend,
        scheduled_transaction_count=dashboard.scheduled_transaction_count,
    )
