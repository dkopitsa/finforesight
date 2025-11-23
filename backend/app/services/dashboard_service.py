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


class BalanceTrends:
    """All balance trends by category."""

    def __init__(
        self,
        balance_trend: list[BalanceTrendPoint],
        liquid_trend: list[BalanceTrendPoint],
        investments_trend: list[BalanceTrendPoint],
        credit_trend: list[BalanceTrendPoint],
    ):
        self.balance_trend = balance_trend
        self.liquid_trend = liquid_trend
        self.investments_trend = investments_trend
        self.credit_trend = credit_trend


class DashboardData:
    """Complete dashboard data."""

    def __init__(
        self,
        financial_summary: FinancialSummary,
        upcoming_transactions: list[UpcomingTransaction],
        balance_trend: list[BalanceTrendPoint],
        liquid_trend: list[BalanceTrendPoint],
        investments_trend: list[BalanceTrendPoint],
        credit_trend: list[BalanceTrendPoint],
        scheduled_transaction_count: int,
    ):
        self.financial_summary = financial_summary
        self.upcoming_transactions = upcoming_transactions
        self.balance_trend = balance_trend
        self.liquid_trend = liquid_trend
        self.investments_trend = investments_trend
        self.credit_trend = credit_trend
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

        # Get balance trends (next 30 days) - includes all categories
        balance_trends = await DashboardService._get_balance_trends(user_id, db, days=30)

        # Get scheduled transaction count
        scheduled_tx_count = await DashboardService._get_scheduled_transaction_count(user_id, db)

        return DashboardData(
            financial_summary=financial_summary,
            upcoming_transactions=upcoming_transactions,
            balance_trend=balance_trends.balance_trend,
            liquid_trend=balance_trends.liquid_trend,
            investments_trend=balance_trends.investments_trend,
            credit_trend=balance_trends.credit_trend,
            scheduled_transaction_count=scheduled_tx_count,
        )

    @staticmethod
    async def _get_financial_summary(user_id: int, db: AsyncSession) -> FinancialSummary:
        """Calculate financial summary from accounts (excluding PLANNING)."""
        result = await db.execute(
            select(Account).where(
                Account.user_id == user_id,
                Account.is_active,
                Account.type != AccountType.PLANNING,
            )
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
    async def _get_balance_trends(user_id: int, db: AsyncSession, days: int = 30) -> BalanceTrends:
        """Get balance trends for next N days, separated by account category."""
        from_date = date.today()
        to_date = from_date + timedelta(days=days)

        # Get all accounts to know their types
        result = await db.execute(
            select(Account).where(
                Account.user_id == user_id,
                Account.is_active,
                Account.type != AccountType.PLANNING,
            )
        )
        accounts = {acc.id: acc for acc in result.scalars().all()}

        # Get forecast for all accounts
        forecasts = await ForecastService.calculate_forecast(
            user_id=user_id,
            from_date=from_date,
            to_date=to_date,
            db=db,
        )

        # Initialize dictionaries for each category
        total_by_date: dict[date, Decimal] = {}
        liquid_by_date: dict[date, Decimal] = {}
        investments_by_date: dict[date, Decimal] = {}
        credit_by_date: dict[date, Decimal] = {}

        # Define account type categories
        liquid_types = (AccountType.CHECKING, AccountType.SAVINGS, AccountType.CASH)
        investment_types = (AccountType.INVESTMENT, AccountType.RETIREMENT)
        credit_types = (AccountType.CREDIT_CARD, AccountType.LOAN)

        for forecast in forecasts:
            account = accounts.get(forecast.account_id)
            if not account:
                continue

            for data_point in forecast.data_points:
                d = data_point.date
                balance = data_point.balance

                # Initialize dates if not present
                if d not in total_by_date:
                    total_by_date[d] = Decimal("0")
                    liquid_by_date[d] = Decimal("0")
                    investments_by_date[d] = Decimal("0")
                    credit_by_date[d] = Decimal("0")

                # Add to total
                total_by_date[d] += balance

                # Categorize by account type
                if account.type in liquid_types:
                    liquid_by_date[d] += balance
                elif account.type in investment_types:
                    investments_by_date[d] += balance
                elif account.type in credit_types:
                    # Credit/loans shown as negative values
                    credit_by_date[d] += balance  # Already negative for debts

        # Convert to sorted lists
        sorted_dates = sorted(total_by_date.keys())

        balance_trend = [BalanceTrendPoint(date=d, balance=total_by_date[d]) for d in sorted_dates]
        liquid_trend = [BalanceTrendPoint(date=d, balance=liquid_by_date[d]) for d in sorted_dates]
        investments_trend = [
            BalanceTrendPoint(date=d, balance=investments_by_date[d]) for d in sorted_dates
        ]
        credit_trend = [BalanceTrendPoint(date=d, balance=credit_by_date[d]) for d in sorted_dates]

        return BalanceTrends(
            balance_trend=balance_trend,
            liquid_trend=liquid_trend,
            investments_trend=investments_trend,
            credit_trend=credit_trend,
        )

    @staticmethod
    async def _get_scheduled_transaction_count(user_id: int, db: AsyncSession) -> int:
        """Get total count of scheduled transactions."""
        result = await db.execute(
            select(func.count(ScheduledTransaction.id)).where(
                ScheduledTransaction.user_id == user_id
            )
        )
        return result.scalar() or 0
