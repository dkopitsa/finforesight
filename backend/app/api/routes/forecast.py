"""Forecast routes for balance projection."""

import logging
from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_active_user, get_db
from app.models.user import User
from app.schemas.forecast import (
    AccountForecastResponse,
    ForecastDataPointResponse,
    ForecastResponse,
)
from app.services.forecast_service import ForecastService

router = APIRouter()
logger = logging.getLogger(__name__)


@router.get("/", response_model=ForecastResponse)
async def get_forecast(
    from_date: date = Query(..., description="Start date of forecast"),
    to_date: date = Query(..., description="End date of forecast"),
    account_ids: str | None = Query(None, description="Comma-separated account IDs to filter"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> ForecastResponse:
    """
    Get balance forecast for user's accounts.

    Projects future account balances based on scheduled transactions.
    Returns time-series data showing daily balance changes.
    """
    # Validate date range
    if to_date < from_date:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="to_date must be on or after from_date",
        )

    # Limit range to prevent performance issues
    max_days = 365 * 3  # 3 years
    if (to_date - from_date).days > max_days:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Date range too large (max {max_days} days)",
        )

    # Parse account IDs if provided
    account_id_list = None
    if account_ids:
        try:
            account_id_list = [int(id.strip()) for id in account_ids.split(",")]
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid account_ids format (must be comma-separated integers)",
            ) from None

    # Calculate forecast
    forecasts = await ForecastService.calculate_forecast(
        user_id=current_user.id,
        from_date=from_date,
        to_date=to_date,
        db=db,
        account_ids=account_id_list,
    )

    # Convert to response format
    account_forecasts = []
    for forecast in forecasts:
        data_points = [
            ForecastDataPointResponse(date=dp.date, balance=dp.balance)
            for dp in forecast.data_points
        ]

        account_forecast = AccountForecastResponse(
            account_id=forecast.account_id,
            account_name=forecast.account_name,
            currency=forecast.currency,
            starting_balance=forecast.starting_balance,
            data_points=data_points,
        )
        account_forecasts.append(account_forecast)

    logger.info(
        "Forecast calculated",
        extra={
            "user_id": current_user.id,
            "from_date": str(from_date),
            "to_date": str(to_date),
            "account_count": len(account_forecasts),
        },
    )

    return ForecastResponse(
        from_date=from_date,
        to_date=to_date,
        accounts=account_forecasts,
    )
