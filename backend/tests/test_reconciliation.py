"""Tests for reconciliation endpoints."""

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
    """Create a test account."""
    # Set initial balance date to a week ago to allow for transactions in the past
    account = Account(
        user_id=test_user.id,
        name="Test Checking",
        type=AccountType.CHECKING,
        currency="USD",
        initial_balance=Decimal("1000.00"),
        initial_balance_date=date.today() - timedelta(days=7),
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


class TestCreateReconciliation:
    """Tests for POST /api/v1/reconciliations/."""

    async def test_create_reconciliation_no_difference(
        self,
        client: AsyncClient,
        test_user: User,
        test_account: Account,
    ):
        """Test reconciliation when actual balance matches expected."""
        # Login
        login_response = await client.post(
            "/api/v1/auth/login",
            json={"email": test_user.email, "password": "testpass123"},
        )
        token = login_response.json()["access_token"]

        # Reconcile with exact balance (should match initial_balance)
        response = await client.post(
            "/api/v1/reconciliations/",
            headers={"Authorization": f"Bearer {token}"},
            json={
                "account_id": test_account.id,
                "reconciliation_date": str(date.today()),
                "actual_balance": "1000.00",
                "create_adjustment": True,
            },
        )

        assert response.status_code == 201
        data = response.json()

        assert data["account_id"] == test_account.id
        assert Decimal(data["expected_balance"]) == Decimal("1000.00")
        assert Decimal(data["actual_balance"]) == Decimal("1000.00")
        assert Decimal(data["difference"]) == Decimal("0.00")
        assert data["adjustment_transaction_id"] is None  # No adjustment needed

    async def test_create_reconciliation_with_difference(
        self,
        client: AsyncClient,
        test_user: User,
        test_account: Account,
    ):
        """Test reconciliation when actual balance differs from expected."""
        # Login
        login_response = await client.post(
            "/api/v1/auth/login",
            json={"email": test_user.email, "password": "testpass123"},
        )
        token = login_response.json()["access_token"]

        # Reconcile with different balance
        response = await client.post(
            "/api/v1/reconciliations/",
            headers={"Authorization": f"Bearer {token}"},
            json={
                "account_id": test_account.id,
                "reconciliation_date": str(date.today()),
                "actual_balance": "1050.00",  # $50 more than expected
                "create_adjustment": True,
            },
        )

        assert response.status_code == 201
        data = response.json()

        assert Decimal(data["expected_balance"]) == Decimal("1000.00")
        assert Decimal(data["actual_balance"]) == Decimal("1050.00")
        assert Decimal(data["difference"]) == Decimal("50.00")
        assert data["adjustment_transaction_id"] is not None  # Adjustment created

    async def test_create_reconciliation_without_adjustment(
        self,
        client: AsyncClient,
        test_user: User,
        test_account: Account,
    ):
        """Test reconciliation without creating adjustment transaction."""
        # Login
        login_response = await client.post(
            "/api/v1/auth/login",
            json={"email": test_user.email, "password": "testpass123"},
        )
        token = login_response.json()["access_token"]

        # Reconcile without adjustment
        response = await client.post(
            "/api/v1/reconciliations/",
            headers={"Authorization": f"Bearer {token}"},
            json={
                "account_id": test_account.id,
                "reconciliation_date": str(date.today()),
                "actual_balance": "950.00",  # $50 less than expected
                "create_adjustment": False,  # Don't create adjustment
            },
        )

        assert response.status_code == 201
        data = response.json()

        assert Decimal(data["difference"]) == Decimal("-50.00")
        assert data["adjustment_transaction_id"] is None  # No adjustment

    async def test_create_reconciliation_with_transactions(
        self,
        client: AsyncClient,
        test_user: User,
        test_account: Account,
        test_category: Category,
        test_db: AsyncSession,
    ):
        """Test reconciliation when scheduled transactions affect balance."""
        # Create a scheduled transaction in the past
        yesterday = date.today() - timedelta(days=1)
        transaction = ScheduledTransaction(
            user_id=test_user.id,
            account_id=test_account.id,
            category_id=test_category.id,
            name="Yesterday Expense",
            amount=Decimal("50.00"),
            currency="USD",
            is_recurring=False,
            recurrence_start_date=yesterday,
        )
        test_db.add(transaction)
        await test_db.commit()

        # Login
        login_response = await client.post(
            "/api/v1/auth/login",
            json={"email": test_user.email, "password": "testpass123"},
        )
        token = login_response.json()["access_token"]

        # Reconcile today (after transaction)
        response = await client.post(
            "/api/v1/reconciliations/",
            headers={"Authorization": f"Bearer {token}"},
            json={
                "account_id": test_account.id,
                "reconciliation_date": str(date.today()),
                "actual_balance": "950.00",  # Matches expected after $50 expense
                "create_adjustment": True,
            },
        )

        assert response.status_code == 201
        data = response.json()

        # Expected balance should be 1000 - 50 = 950
        assert Decimal(data["expected_balance"]) == Decimal("950.00")
        assert Decimal(data["actual_balance"]) == Decimal("950.00")
        assert Decimal(data["difference"]) == Decimal("0.00")

    async def test_create_reconciliation_invalid_account(
        self,
        client: AsyncClient,
        test_user: User,
    ):
        """Test reconciliation with invalid account ID."""
        # Login
        login_response = await client.post(
            "/api/v1/auth/login",
            json={"email": test_user.email, "password": "testpass123"},
        )
        token = login_response.json()["access_token"]

        # Try to reconcile non-existent account
        response = await client.post(
            "/api/v1/reconciliations/",
            headers={"Authorization": f"Bearer {token}"},
            json={
                "account_id": 99999,
                "reconciliation_date": str(date.today()),
                "actual_balance": "1000.00",
            },
        )

        assert response.status_code == 400
        assert "not found" in response.json()["detail"].lower()


class TestListReconciliations:
    """Tests for GET /api/v1/reconciliations/."""

    async def test_list_empty(
        self,
        client: AsyncClient,
        test_user: User,
    ):
        """Test listing reconciliations when none exist."""
        # Login
        login_response = await client.post(
            "/api/v1/auth/login",
            json={"email": test_user.email, "password": "testpass123"},
        )
        token = login_response.json()["access_token"]

        response = await client.get(
            "/api/v1/reconciliations/",
            headers={"Authorization": f"Bearer {token}"},
        )

        assert response.status_code == 200
        assert response.json() == []

    async def test_list_with_data(
        self,
        client: AsyncClient,
        test_user: User,
        test_account: Account,
    ):
        """Test listing reconciliations."""
        # Login
        login_response = await client.post(
            "/api/v1/auth/login",
            json={"email": test_user.email, "password": "testpass123"},
        )
        token = login_response.json()["access_token"]

        # Create reconciliation
        await client.post(
            "/api/v1/reconciliations/",
            headers={"Authorization": f"Bearer {token}"},
            json={
                "account_id": test_account.id,
                "reconciliation_date": str(date.today()),
                "actual_balance": "1000.00",
            },
        )

        # List reconciliations
        response = await client.get(
            "/api/v1/reconciliations/",
            headers={"Authorization": f"Bearer {token}"},
        )

        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["account_name"] == test_account.name
        assert "reconciliation" in data[0]
        assert "has_adjustment" in data[0]


class TestGetReconciliation:
    """Tests for GET /api/v1/reconciliations/{id}."""

    async def test_get_reconciliation(
        self,
        client: AsyncClient,
        test_user: User,
        test_account: Account,
    ):
        """Test getting a specific reconciliation."""
        # Login
        login_response = await client.post(
            "/api/v1/auth/login",
            json={"email": test_user.email, "password": "testpass123"},
        )
        token = login_response.json()["access_token"]

        # Create reconciliation
        create_response = await client.post(
            "/api/v1/reconciliations/",
            headers={"Authorization": f"Bearer {token}"},
            json={
                "account_id": test_account.id,
                "reconciliation_date": str(date.today()),
                "actual_balance": "1000.00",
                "note": "Test reconciliation",
            },
        )
        reconciliation_id = create_response.json()["id"]

        # Get reconciliation
        response = await client.get(
            f"/api/v1/reconciliations/{reconciliation_id}",
            headers={"Authorization": f"Bearer {token}"},
        )

        assert response.status_code == 200
        data = response.json()
        assert data["id"] == reconciliation_id
        assert data["note"] == "Test reconciliation"

    async def test_get_nonexistent_reconciliation(
        self,
        client: AsyncClient,
        test_user: User,
    ):
        """Test getting a non-existent reconciliation."""
        # Login
        login_response = await client.post(
            "/api/v1/auth/login",
            json={"email": test_user.email, "password": "testpass123"},
        )
        token = login_response.json()["access_token"]

        response = await client.get(
            "/api/v1/reconciliations/99999",
            headers={"Authorization": f"Bearer {token}"},
        )

        assert response.status_code == 404


class TestDeleteReconciliation:
    """Tests for DELETE /api/v1/reconciliations/{id}."""

    async def test_delete_reconciliation(
        self,
        client: AsyncClient,
        test_user: User,
        test_account: Account,
    ):
        """Test deleting a reconciliation."""
        # Login
        login_response = await client.post(
            "/api/v1/auth/login",
            json={"email": test_user.email, "password": "testpass123"},
        )
        token = login_response.json()["access_token"]

        # Create reconciliation
        create_response = await client.post(
            "/api/v1/reconciliations/",
            headers={"Authorization": f"Bearer {token}"},
            json={
                "account_id": test_account.id,
                "reconciliation_date": str(date.today()),
                "actual_balance": "1000.00",
            },
        )
        reconciliation_id = create_response.json()["id"]

        # Delete reconciliation
        response = await client.delete(
            f"/api/v1/reconciliations/{reconciliation_id}",
            headers={"Authorization": f"Bearer {token}"},
        )

        assert response.status_code == 204

        # Verify deleted
        get_response = await client.get(
            f"/api/v1/reconciliations/{reconciliation_id}",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert get_response.status_code == 404

    async def test_delete_nonexistent_reconciliation(
        self,
        client: AsyncClient,
        test_user: User,
    ):
        """Test deleting a non-existent reconciliation."""
        # Login
        login_response = await client.post(
            "/api/v1/auth/login",
            json={"email": test_user.email, "password": "testpass123"},
        )
        token = login_response.json()["access_token"]

        response = await client.delete(
            "/api/v1/reconciliations/99999",
            headers={"Authorization": f"Bearer {token}"},
        )

        assert response.status_code == 404
