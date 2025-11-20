"""Tests for dashboard endpoint."""

from datetime import date, timedelta
from decimal import Decimal

import pytest_asyncio
from httpx import AsyncClient
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.account import Account, AccountType
from app.models.category import Category
from app.models.scheduled_transaction import ScheduledTransaction
from app.models.user import User


@pytest_asyncio.fixture
async def test_account(test_db: AsyncSession, test_user: User) -> Account:
    """Get or create a test account."""
    result = await test_db.execute(select(Account).where(Account.user_id == test_user.id).limit(1))
    account = result.scalar_one_or_none()

    if account:
        return account

    # Create a test account if none exists
    account = Account(
        user_id=test_user.id,
        name="Test Checking",
        type=AccountType.CHECKING,
        currency="USD",
        initial_balance=Decimal("1000.00"),
        initial_balance_date=date.today(),
    )
    test_db.add(account)
    await test_db.commit()
    await test_db.refresh(account)
    return account


@pytest_asyncio.fixture
async def test_category(test_db: AsyncSession) -> Category:
    """Get or create a system category."""
    result = await test_db.execute(
        select(Category).where(Category.is_system, Category.type == "expense").limit(1)
    )
    category = result.scalar_one_or_none()

    if category:
        return category

    # Create a test category if none exists
    category = Category(
        name="Test Expense",
        type="expense",
        icon="test",
        color="#FF0000",
        is_system=True,
    )
    test_db.add(category)
    await test_db.commit()
    await test_db.refresh(category)
    return category


class TestGetDashboard:
    """Tests for GET /api/v1/dashboard endpoint."""

    async def test_dashboard_empty(
        self,
        client: AsyncClient,
        test_user: User,
    ):
        """Test dashboard with no data."""
        # Login
        login_response = await client.post(
            "/api/v1/auth/login",
            json={"email": test_user.email, "password": "testpass123"},
        )
        token = login_response.json()["access_token"]

        # Get dashboard
        response = await client.get(
            "/api/v1/dashboard/",
            headers={"Authorization": f"Bearer {token}"},
        )

        assert response.status_code == 200
        data = response.json()

        # Check structure
        assert "financial_summary" in data
        assert "upcoming_transactions" in data
        assert "balance_trend" in data
        assert "scheduled_transaction_count" in data

        # Empty data
        assert data["financial_summary"]["account_count"] == 0
        assert data["scheduled_transaction_count"] == 0
        assert len(data["upcoming_transactions"]) == 0

    async def test_dashboard_with_accounts(
        self,
        client: AsyncClient,
        test_user: User,
        test_account: Account,
        test_db: AsyncSession,
    ):
        """Test dashboard with multiple accounts."""
        # Create additional accounts of different types
        savings = Account(
            user_id=test_user.id,
            name="Savings",
            type=AccountType.SAVINGS,
            currency="USD",
            initial_balance=Decimal("5000.00"),
            initial_balance_date=date.today(),
        )
        investment = Account(
            user_id=test_user.id,
            name="Investment",
            type=AccountType.INVESTMENT,
            currency="USD",
            initial_balance=Decimal("10000.00"),
            initial_balance_date=date.today(),
        )
        credit_card = Account(
            user_id=test_user.id,
            name="Credit Card",
            type=AccountType.CREDIT_CARD,
            currency="USD",
            initial_balance=Decimal("-500.00"),  # Negative = debt
            initial_balance_date=date.today(),
        )
        test_db.add_all([savings, investment, credit_card])
        await test_db.commit()

        # Login
        login_response = await client.post(
            "/api/v1/auth/login",
            json={"email": test_user.email, "password": "testpass123"},
        )
        token = login_response.json()["access_token"]

        # Get dashboard
        response = await client.get(
            "/api/v1/dashboard/",
            headers={"Authorization": f"Bearer {token}"},
        )

        assert response.status_code == 200
        data = response.json()

        summary = data["financial_summary"]
        assert summary["account_count"] == 4

        # Liquid assets = checking + savings = 1000 + 5000 = 6000
        assert Decimal(summary["liquid_assets"]) == Decimal("6000.00")

        # Investments = 10000
        assert Decimal(summary["investments"]) == Decimal("10000.00")

        # Credit used = abs(-500) = 500
        assert Decimal(summary["credit_used"]) == Decimal("500.00")

        # Net worth = 6000 + 10000 - 500 = 15500
        assert Decimal(summary["net_worth"]) == Decimal("15500.00")

    async def test_dashboard_with_upcoming_transactions(
        self,
        client: AsyncClient,
        test_user: User,
        test_account: Account,
        test_category: Category,
        test_db: AsyncSession,
    ):
        """Test dashboard with upcoming scheduled transactions."""
        # Create scheduled transactions
        tomorrow = date.today() + timedelta(days=1)
        next_week = date.today() + timedelta(days=7)

        transaction1 = ScheduledTransaction(
            user_id=test_user.id,
            account_id=test_account.id,
            category_id=test_category.id,
            name="Tomorrow Payment",
            amount=Decimal("50.00"),
            currency="USD",
            is_recurring=False,
            recurrence_start_date=tomorrow,
        )
        transaction2 = ScheduledTransaction(
            user_id=test_user.id,
            account_id=test_account.id,
            category_id=test_category.id,
            name="Weekly Subscription",
            amount=Decimal("10.00"),
            currency="USD",
            is_recurring=True,
            recurrence_frequency="MONTHLY",
            recurrence_day_of_month=next_week.day,
            recurrence_start_date=next_week,
        )
        test_db.add_all([transaction1, transaction2])
        await test_db.commit()

        # Login
        login_response = await client.post(
            "/api/v1/auth/login",
            json={"email": test_user.email, "password": "testpass123"},
        )
        token = login_response.json()["access_token"]

        # Get dashboard
        response = await client.get(
            "/api/v1/dashboard/",
            headers={"Authorization": f"Bearer {token}"},
        )

        assert response.status_code == 200
        data = response.json()

        # Check upcoming transactions
        upcoming = data["upcoming_transactions"]
        assert len(upcoming) >= 2  # At least the 2 we created

        # Check scheduled transaction count
        assert data["scheduled_transaction_count"] == 2

        # Verify transaction details
        tx_names = {tx["name"] for tx in upcoming}
        assert "Tomorrow Payment" in tx_names
        assert "Weekly Subscription" in tx_names

    async def test_dashboard_balance_trend(
        self,
        client: AsyncClient,
        test_user: User,
        test_account: Account,
        test_category: Category,
        test_db: AsyncSession,
    ):
        """Test dashboard balance trend calculation."""
        # Create a scheduled transaction
        transaction = ScheduledTransaction(
            user_id=test_user.id,
            account_id=test_account.id,
            category_id=test_category.id,
            name="Monthly Bill",
            amount=Decimal("100.00"),
            currency="USD",
            is_recurring=True,
            recurrence_frequency="MONTHLY",
            recurrence_day_of_month=15,
            recurrence_start_date=date.today(),
        )
        test_db.add(transaction)
        await test_db.commit()

        # Login
        login_response = await client.post(
            "/api/v1/auth/login",
            json={"email": test_user.email, "password": "testpass123"},
        )
        token = login_response.json()["access_token"]

        # Get dashboard
        response = await client.get(
            "/api/v1/dashboard/",
            headers={"Authorization": f"Bearer {token}"},
        )

        assert response.status_code == 200
        data = response.json()

        # Check balance trend
        trend = data["balance_trend"]
        assert len(trend) == 31  # 30 days of data + today

        # Verify trend structure
        assert "date" in trend[0]
        assert "balance" in trend[0]

        # Balance should be decreasing over time due to monthly bill
        first_balance = Decimal(trend[0]["balance"])
        last_balance = Decimal(trend[-1]["balance"])
        assert last_balance <= first_balance  # Balance should not increase (only expenses)

    async def test_dashboard_without_auth(self, client: AsyncClient):
        """Test dashboard without authentication."""
        response = await client.get(
            "/api/v1/dashboard/",
            follow_redirects=False,
        )

        # Should return 401 Unauthorized for missing credentials
        assert response.status_code == 401
