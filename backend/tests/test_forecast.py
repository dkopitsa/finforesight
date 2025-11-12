"""Tests for forecast endpoints and service."""

from datetime import date, timedelta
from decimal import Decimal

import pytest_asyncio
from httpx import AsyncClient
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.account import Account
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
        name="Test Account",
        type="checking",
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


class TestGetForecast:
    """Tests for GET /api/v1/forecast endpoint."""

    async def test_basic_forecast_single_account(
        self,
        client: AsyncClient,
        test_user: User,
        test_account: Account,
        test_category: Category,
        test_db: AsyncSession,
    ):
        """Test basic forecast with a single transaction."""
        # Create a scheduled transaction
        transaction = ScheduledTransaction(
            user_id=test_user.id,
            account_id=test_account.id,
            category_id=test_category.id,
            name="Monthly Subscription",
            amount=Decimal("50.00"),
            currency="USD",
            is_recurring=True,
            recurrence_frequency="monthly",
            recurrence_day_of_month=15,
            recurrence_start_date=date(2025, 1, 15),
        )
        test_db.add(transaction)
        await test_db.commit()

        # Login
        login_response = await client.post(
            "/api/v1/auth/login",
            json={"email": test_user.email, "password": "testpass123"},
        )
        token = login_response.json()["access_token"]

        # Get forecast for 2 months
        response = await client.get(
            "/api/v1/forecast/?from_date=2025-01-01&to_date=2025-02-28",
            headers={"Authorization": f"Bearer {token}"},
        )

        assert response.status_code == 200
        data = response.json()

        assert data["from_date"] == "2025-01-01"
        assert data["to_date"] == "2025-02-28"
        assert len(data["accounts"]) == 1

        account_forecast = data["accounts"][0]
        assert account_forecast["account_id"] == test_account.id
        assert account_forecast["account_name"] == test_account.name
        assert account_forecast["currency"] == test_account.currency
        assert Decimal(account_forecast["starting_balance"]) == test_account.initial_balance

        # Check data points
        data_points = account_forecast["data_points"]
        assert len(data_points) == 59  # Jan 1 - Feb 28

        # Balance should stay same until Jan 15
        jan_14 = next(dp for dp in data_points if dp["date"] == "2025-01-14")
        assert Decimal(jan_14["balance"]) == test_account.initial_balance

        # Balance should decrease by 50 on Jan 15
        jan_15 = next(dp for dp in data_points if dp["date"] == "2025-01-15")
        assert Decimal(jan_15["balance"]) == test_account.initial_balance - Decimal("50.00")

        # Balance should decrease by another 50 on Feb 15
        feb_15 = next(dp for dp in data_points if dp["date"] == "2025-02-15")
        assert Decimal(feb_15["balance"]) == test_account.initial_balance - Decimal("100.00")

    async def test_forecast_multiple_accounts(
        self,
        client: AsyncClient,
        test_user: User,
        test_account: Account,
        test_category: Category,
        test_db: AsyncSession,
    ):
        """Test forecast with multiple accounts."""
        # Create second account
        account2 = Account(
            user_id=test_user.id,
            name="Savings Account",
            type="savings",
            currency="USD",
            initial_balance=Decimal("5000.00"),
            initial_balance_date=date.today(),
        )
        test_db.add(account2)
        await test_db.commit()
        await test_db.refresh(account2)

        # Create transactions for both accounts
        transaction1 = ScheduledTransaction(
            user_id=test_user.id,
            account_id=test_account.id,
            category_id=test_category.id,
            name="Expense 1",
            amount=Decimal("100.00"),
            currency="USD",
            is_recurring=False,
            recurrence_start_date=date(2025, 1, 10),
        )
        transaction2 = ScheduledTransaction(
            user_id=test_user.id,
            account_id=account2.id,
            category_id=test_category.id,
            name="Expense 2",
            amount=Decimal("200.00"),
            currency="USD",
            is_recurring=False,
            recurrence_start_date=date(2025, 1, 20),
        )
        test_db.add_all([transaction1, transaction2])
        await test_db.commit()

        # Login
        login_response = await client.post(
            "/api/v1/auth/login",
            json={"email": test_user.email, "password": "testpass123"},
        )
        token = login_response.json()["access_token"]

        # Get forecast
        response = await client.get(
            "/api/v1/forecast/?from_date=2025-01-01&to_date=2025-01-31",
            headers={"Authorization": f"Bearer {token}"},
        )

        assert response.status_code == 200
        data = response.json()

        assert len(data["accounts"]) == 2

        # Check both accounts have forecast data
        account_ids = {acc["account_id"] for acc in data["accounts"]}
        assert test_account.id in account_ids
        assert account2.id in account_ids

    async def test_forecast_with_transfer(
        self,
        client: AsyncClient,
        test_user: User,
        test_account: Account,
        test_category: Category,
        test_db: AsyncSession,
    ):
        """Test forecast with transfer between accounts."""
        # Create second account
        account2 = Account(
            user_id=test_user.id,
            name="Savings Account",
            type="savings",
            currency="USD",
            initial_balance=Decimal("5000.00"),
            initial_balance_date=date.today(),
        )
        test_db.add(account2)
        await test_db.commit()
        await test_db.refresh(account2)

        # Create transfer transaction
        transfer = ScheduledTransaction(
            user_id=test_user.id,
            account_id=test_account.id,
            to_account_id=account2.id,
            category_id=test_category.id,
            name="Monthly Transfer",
            amount=Decimal("500.00"),
            currency="USD",
            is_recurring=False,
            recurrence_start_date=date(2025, 1, 15),
        )
        test_db.add(transfer)
        await test_db.commit()

        # Login
        login_response = await client.post(
            "/api/v1/auth/login",
            json={"email": test_user.email, "password": "testpass123"},
        )
        token = login_response.json()["access_token"]

        # Get forecast
        response = await client.get(
            "/api/v1/forecast/?from_date=2025-01-01&to_date=2025-01-31",
            headers={"Authorization": f"Bearer {token}"},
        )

        assert response.status_code == 200
        data = response.json()

        # Find both accounts in response
        source_account = next(a for a in data["accounts"] if a["account_id"] == test_account.id)
        dest_account = next(a for a in data["accounts"] if a["account_id"] == account2.id)

        # Check balance on Jan 15 for source account (should decrease)
        source_jan_15 = next(
            dp for dp in source_account["data_points"] if dp["date"] == "2025-01-15"
        )
        assert Decimal(source_jan_15["balance"]) == test_account.initial_balance - Decimal("500.00")

        # Check balance on Jan 15 for destination account (should increase)
        dest_jan_15 = next(dp for dp in dest_account["data_points"] if dp["date"] == "2025-01-15")
        assert Decimal(dest_jan_15["balance"]) == account2.initial_balance + Decimal("500.00")

    async def test_forecast_with_account_filter(
        self,
        client: AsyncClient,
        test_user: User,
        test_account: Account,
        test_category: Category,
        test_db: AsyncSession,
    ):
        """Test forecast with account_ids filter."""
        # Create second account
        account2 = Account(
            user_id=test_user.id,
            name="Savings Account",
            type="savings",
            currency="USD",
            initial_balance=Decimal("5000.00"),
            initial_balance_date=date.today(),
        )
        test_db.add(account2)
        await test_db.commit()
        await test_db.refresh(account2)

        # Login
        login_response = await client.post(
            "/api/v1/auth/login",
            json={"email": test_user.email, "password": "testpass123"},
        )
        token = login_response.json()["access_token"]

        # Get forecast for only first account
        response = await client.get(
            f"/api/v1/forecast/?from_date=2025-01-01&to_date=2025-01-31&account_ids={test_account.id}",
            headers={"Authorization": f"Bearer {token}"},
        )

        assert response.status_code == 200
        data = response.json()

        assert len(data["accounts"]) == 1
        assert data["accounts"][0]["account_id"] == test_account.id

    async def test_forecast_invalid_date_range(
        self,
        client: AsyncClient,
        test_user: User,
        test_account: Account,
    ):
        """Test forecast with invalid date range."""
        # Login
        login_response = await client.post(
            "/api/v1/auth/login",
            json={"email": test_user.email, "password": "testpass123"},
        )
        token = login_response.json()["access_token"]

        # to_date before from_date
        response = await client.get(
            "/api/v1/forecast/?from_date=2025-02-01&to_date=2025-01-01",
            headers={"Authorization": f"Bearer {token}"},
        )

        assert response.status_code == 400
        assert "to_date must be on or after from_date" in response.json()["detail"]

    async def test_forecast_date_range_too_large(
        self,
        client: AsyncClient,
        test_user: User,
        test_account: Account,
    ):
        """Test forecast with date range exceeding limit."""
        # Login
        login_response = await client.post(
            "/api/v1/auth/login",
            json={"email": test_user.email, "password": "testpass123"},
        )
        token = login_response.json()["access_token"]

        # 4 years (exceeds 3-year limit)
        from_date = date.today()
        to_date = from_date + timedelta(days=365 * 4)

        response = await client.get(
            f"/api/v1/forecast/?from_date={from_date}&to_date={to_date}",
            headers={"Authorization": f"Bearer {token}"},
        )

        assert response.status_code == 400
        assert "Date range too large" in response.json()["detail"]

    async def test_forecast_without_auth(self, client: AsyncClient):
        """Test forecast without authentication."""
        response = await client.get(
            "/api/v1/forecast/?from_date=2025-01-01&to_date=2025-01-31",
            follow_redirects=False,
        )

        # Should return 401 Unauthorized for missing credentials
        assert response.status_code == 401
