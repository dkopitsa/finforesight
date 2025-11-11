"""Service for dashboard data aggregation."""

from datetime import date, timedelta
from decimal import Decimal

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.account import Account, AccountType
from app.models.scheduled_transaction import ScheduledTransaction
from app.services.forecast_service import ForecastService
from app.services.recurrence_service import RecurrenceService


class FinancialSummary:
    """Financial summary with account balances by category."""

    def __init__(
        self,
        liquid_assets: Decimal,
        investments: Decimal,
        credit_used: Decimal,
        loans_receivable: Decimal,
        net_worth: Decimal,
        account_count: int,
    ):
        self.liquid_assets = liquid_assets
        self.investments = investments
        self.credit_used = credit_used
        self.loans_receivable = loans_receivable
        self.net_worth = net_worth
        self.account_count = account_count


class UpcomingTransaction:
    """Upcoming transaction from scheduled transactions."""

    def __init__(
        self,
        scheduled_transaction_id: int,
        date: date,
        name: str,
        amount: Decimal,
        account_name: str,
        category_name: str,
        is_transfer: bool,
    ):
        self.scheduled_transaction_id = scheduled_transaction_id
        self.date = date
        self.name = name
        self.amount = amount
        self.account_name = account_name
        self.category_name = category_name
        self.is_transfer = is_transfer


class BalanceTrendPoint:
    """Single point in balance trend."""

    def __init__(self, date: date, balance: Decimal):
        self.date = date
        self.balance = balance


class DashboardData:
    """Complete dashboard data."""

    def __init__(
        self,
        financial_summary: FinancialSummary,
        upcoming_transactions: list[UpcomingTransaction],
        balance_trend: list[BalanceTrendPoint],
        scheduled_transaction_count: int,
    ):
        self.financial_summary = financial_summary
        self.upcoming_transactions = upcoming_transactions
        self.balance_trend = balance_trend
        self.scheduled_transaction_count = scheduled_transaction_count


class DashboardService:
    """Service for dashboard data aggregation."""

    @staticmethod
    async def get_dashboard(user_id: int, db: AsyncSession) -> DashboardData:
        """
        Get complete dashboard data for user.

        Args:
            user_id: User ID
            db: Database session

        Returns:
            DashboardData with financial summary, upcoming transactions, and trends
        """
        # Get financial summary
        financial_summary = await DashboardService._get_financial_summary(user_id, db)

        # Get upcoming transactions (next 30 days)
        upcoming_transactions = await DashboardService._get_upcoming_transactions(
            user_id, db, days=30
        )

        # Get balance trend (next 30 days)
        balance_trend = await DashboardService._get_balance_trend(user_id, db, days=30)

        # Get scheduled transaction count
        scheduled_tx_count = await DashboardService._get_scheduled_transaction_count(user_id, db)

        return DashboardData(
            financial_summary=financial_summary,
            upcoming_transactions=upcoming_transactions,
            balance_trend=balance_trend,
            scheduled_transaction_count=scheduled_tx_count,
        )

    @staticmethod
    async def _get_financial_summary(user_id: int, db: AsyncSession) -> FinancialSummary:
        """Calculate financial summary from accounts."""
        result = await db.execute(
            select(Account).where(Account.user_id == user_id, Account.is_active)
        )
        accounts = result.scalars().all()

        liquid_assets = Decimal("0")
        investments = Decimal("0")
        credit_used = Decimal("0")
        loans_receivable = Decimal("0")

        for account in accounts:
            balance = account.initial_balance

            if account.type in (
                AccountType.CHECKING,
                AccountType.SAVINGS,
                AccountType.CASH,
            ):
                liquid_assets += balance
            elif account.type in (AccountType.INVESTMENT, AccountType.RETIREMENT):
                investments += balance
            elif account.type in (AccountType.CREDIT_CARD, AccountType.LOAN):
                credit_used += abs(balance)  # Credit/loans are typically negative
            elif account.type == AccountType.LOAN_GIVEN:
                loans_receivable += balance

        net_worth = liquid_assets + investments - credit_used + loans_receivable

        return FinancialSummary(
            liquid_assets=liquid_assets,
            investments=investments,
            credit_used=credit_used,
            loans_receivable=loans_receivable,
            net_worth=net_worth,
            account_count=len(accounts),
        )

    @staticmethod
    async def _get_upcoming_transactions(
        user_id: int, db: AsyncSession, days: int = 30
    ) -> list[UpcomingTransaction]:
        """Get upcoming scheduled transactions for next N days."""
        from datetime import date

        from app.models.category import Category

        from_date = date.today()
        to_date = from_date + timedelta(days=days)

        # Get expanded instances
        instances = await RecurrenceService.expand_recurring_transactions(
            user_id=user_id,
            from_date=from_date,
            to_date=to_date,
            db=db,
        )

        # Fetch accounts and categories for name lookup
        accounts_result = await db.execute(select(Account).where(Account.user_id == user_id))
        accounts = {acc.id: acc for acc in accounts_result.scalars().all()}

        categories_result = await db.execute(select(Category))
        categories = {cat.id: cat for cat in categories_result.scalars().all()}

        # Convert to UpcomingTransaction objects
        upcoming = []
        for instance in instances[:50]:  # Limit to 50 transactions
            account = accounts.get(instance.account_id)
            category = categories.get(instance.category_id)

            upcoming.append(
                UpcomingTransaction(
                    scheduled_transaction_id=instance.scheduled_transaction_id,
                    date=instance.date,
                    name=instance.name,
                    amount=instance.amount,
                    account_name=account.name if account else "Unknown",
                    category_name=category.name if category else "Unknown",
                    is_transfer=instance.to_account_id is not None,
                )
            )

        return upcoming

    @staticmethod
    async def _get_balance_trend(
        user_id: int, db: AsyncSession, days: int = 30
    ) -> list[BalanceTrendPoint]:
        """Get balance trend for next N days (sum of all liquid accounts)."""
        from_date = date.today()
        to_date = from_date + timedelta(days=days)

        # Get forecast for all accounts
        forecasts = await ForecastService.calculate_forecast(
            user_id=user_id,
            from_date=from_date,
            to_date=to_date,
            db=db,
        )

        # Aggregate by date (sum all liquid accounts)
        balance_by_date: dict[date, Decimal] = {}

        for forecast in forecasts:
            for data_point in forecast.data_points:
                if data_point.date not in balance_by_date:
                    balance_by_date[data_point.date] = Decimal("0")
                balance_by_date[data_point.date] += data_point.balance

        # Convert to sorted list
        trend = [
            BalanceTrendPoint(date=d, balance=balance_by_date[d])
            for d in sorted(balance_by_date.keys())
        ]

        return trend

    @staticmethod
    async def _get_scheduled_transaction_count(user_id: int, db: AsyncSession) -> int:
        """Get total count of scheduled transactions."""
        result = await db.execute(
            select(func.count(ScheduledTransaction.id)).where(
                ScheduledTransaction.user_id == user_id
            )
        )
        return result.scalar() or 0
