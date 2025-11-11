"""Service for calculating account balance forecasts."""

from datetime import date, timedelta
from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.account import Account
from app.services.recurrence_service import RecurrenceService


class ForecastDataPoint:
    """A single data point in the forecast time series."""

    def __init__(self, date: date, balance: Decimal):
        self.date = date
        self.balance = balance


class AccountForecast:
    """Forecast data for a single account."""

    def __init__(
        self,
        account_id: int,
        account_name: str,
        currency: str,
        starting_balance: Decimal,
        data_points: list[ForecastDataPoint],
    ):
        self.account_id = account_id
        self.account_name = account_name
        self.currency = currency
        self.starting_balance = starting_balance
        self.data_points = data_points


class ForecastService:
    """Service for forecasting future account balances."""

    @staticmethod
    async def calculate_forecast(
        user_id: int,
        from_date: date,
        to_date: date,
        db: AsyncSession,
        account_ids: list[int] | None = None,
    ) -> list[AccountForecast]:
        """
        Calculate balance forecast for user's accounts.

        Args:
            user_id: User ID
            from_date: Start date for forecast
            to_date: End date for forecast
            db: Database session
            account_ids: Optional list of account IDs to filter by

        Returns:
            List of AccountForecast objects with time-series data
        """
        # Fetch accounts
        query = select(Account).where(Account.user_id == user_id, Account.is_active)

        if account_ids:
            query = query.where(Account.id.in_(account_ids))

        result = await db.execute(query)
        accounts = result.scalars().all()

        if not accounts:
            return []

        # Fetch all scheduled transaction instances for the date range
        instances = await RecurrenceService.expand_recurring_transactions(
            user_id=user_id,
            from_date=from_date,
            to_date=to_date,
            db=db,
        )

        # Group transactions by date and account
        # Structure: {account_id: {date: [transactions]}}
        transactions_by_account: dict[int, dict[date, list]] = {}

        for instance in instances:
            # Add to source account (debit)
            if instance.account_id not in transactions_by_account:
                transactions_by_account[instance.account_id] = {}

            if instance.date not in transactions_by_account[instance.account_id]:
                transactions_by_account[instance.account_id][instance.date] = []

            transactions_by_account[instance.account_id][instance.date].append(
                {
                    "amount": -instance.amount,  # Negative for outflow
                    "name": instance.name,
                    "is_transfer": instance.to_account_id is not None,
                }
            )

            # Add to destination account if transfer (credit)
            if instance.to_account_id:
                if instance.to_account_id not in transactions_by_account:
                    transactions_by_account[instance.to_account_id] = {}

                if instance.date not in transactions_by_account[instance.to_account_id]:
                    transactions_by_account[instance.to_account_id][instance.date] = []

                transactions_by_account[instance.to_account_id][instance.date].append(
                    {
                        "amount": instance.amount,  # Positive for inflow
                        "name": f"Transfer from {instance.name}",
                        "is_transfer": True,
                    }
                )

        # Calculate forecast for each account
        forecasts = []

        for account in accounts:
            data_points = ForecastService._calculate_account_forecast(
                account=account,
                from_date=from_date,
                to_date=to_date,
                transactions_by_date=transactions_by_account.get(account.id, {}),
            )

            forecast = AccountForecast(
                account_id=account.id,
                account_name=account.name,
                currency=account.currency,
                starting_balance=account.initial_balance,
                data_points=data_points,
            )

            forecasts.append(forecast)

        return forecasts

    @staticmethod
    def _calculate_account_forecast(
        account: Account,
        from_date: date,
        to_date: date,
        transactions_by_date: dict[date, list],
    ) -> list[ForecastDataPoint]:
        """
        Calculate forecast data points for a single account.

        Args:
            account: Account model
            from_date: Start date
            to_date: End date
            transactions_by_date: Dict of {date: [transactions]}

        Returns:
            List of ForecastDataPoint objects
        """
        data_points = []
        current_balance = account.initial_balance
        current_date = from_date

        # Generate data point for each day
        while current_date <= to_date:
            # Apply transactions on this date
            if current_date in transactions_by_date:
                for transaction in transactions_by_date[current_date]:
                    current_balance += transaction["amount"]

            # Create data point
            data_point = ForecastDataPoint(
                date=current_date,
                balance=current_balance,
            )
            data_points.append(data_point)

            # Move to next day
            current_date += timedelta(days=1)

        return data_points
