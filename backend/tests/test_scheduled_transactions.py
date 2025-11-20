"""Tests for scheduled transaction endpoints."""

from datetime import date

import pytest_asyncio
from httpx import AsyncClient
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.account import Account
from app.models.category import Category
from app.models.scheduled_transaction import ScheduledTransaction, ScheduledTransactionException
from app.models.user import User


@pytest_asyncio.fixture
async def test_account(test_db: AsyncSession, test_user: User) -> Account:
    """Create a test account."""
    account = Account(
        user_id=test_user.id,
        name="Test Account",
        type="checking",
        currency="USD",
        initial_balance=1000.00,
        initial_balance_date=date.today(),
        is_active=True,
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

    # Create one if doesn't exist
    category = Category(
        user_id=None,
        name="Test Category",
        type="expense",
        is_system=True,
    )
    test_db.add(category)
    await test_db.commit()
    await test_db.refresh(category)
    return category


class TestListScheduledTransactions:
    """Tests for listing scheduled transactions."""

    async def test_list_empty(self, client: AsyncClient, test_user: User):
        """Test listing when no transactions exist."""
        login_response = await client.post(
            "/api/v1/auth/login",
            json={"email": test_user.email, "password": "testpass123"},
        )
        token = login_response.json()["access_token"]

        response = await client.get(
            "/api/v1/scheduled-transactions/",
            headers={"Authorization": f"Bearer {token}"},
        )

        assert response.status_code == 200
        assert response.json() == []

    async def test_list_with_data(
        self,
        client: AsyncClient,
        test_user: User,
        test_account: Account,
        test_category: Category,
        test_db: AsyncSession,
    ):
        """Test listing with transactions."""
        # Create a one-time transaction
        transaction = ScheduledTransaction(
            user_id=test_user.id,
            account_id=test_account.id,
            category_id=test_category.id,
            name="Test Transaction",
            amount=100.00,
            currency="USD",
            is_recurring=False,
            recurrence_start_date=date.today(),
        )
        test_db.add(transaction)
        await test_db.commit()

        login_response = await client.post(
            "/api/v1/auth/login",
            json={"email": test_user.email, "password": "testpass123"},
        )
        token = login_response.json()["access_token"]

        response = await client.get(
            "/api/v1/scheduled-transactions/",
            headers={"Authorization": f"Bearer {token}"},
        )

        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["name"] == "Test Transaction"


class TestCreateScheduledTransaction:
    """Tests for creating scheduled transactions."""

    async def test_create_one_time(
        self, client: AsyncClient, test_user: User, test_account: Account, test_category: Category
    ):
        """Test creating a one-time transaction."""
        login_response = await client.post(
            "/api/v1/auth/login",
            json={"email": test_user.email, "password": "testpass123"},
        )
        token = login_response.json()["access_token"]

        transaction_data = {
            "name": "One-time Payment",
            "amount": 150.50,
            "currency": "USD",
            "account_id": test_account.id,
            "category_id": test_category.id,
            "is_recurring": False,
            "recurrence_start_date": str(date.today()),
        }

        response = await client.post(
            "/api/v1/scheduled-transactions/",
            headers={"Authorization": f"Bearer {token}"},
            json=transaction_data,
        )

        assert response.status_code == 201
        data = response.json()
        assert data["name"] == "One-time Payment"
        # Amount should be negative for expense category
        assert data["amount"] == "-150.50"
        assert data["is_recurring"] is False

    async def test_create_monthly_recurring(
        self, client: AsyncClient, test_user: User, test_account: Account, test_category: Category
    ):
        """Test creating a monthly recurring transaction."""
        login_response = await client.post(
            "/api/v1/auth/login",
            json={"email": test_user.email, "password": "testpass123"},
        )
        token = login_response.json()["access_token"]

        transaction_data = {
            "name": "Monthly Rent",
            "amount": 1200.00,
            "currency": "USD",
            "account_id": test_account.id,
            "category_id": test_category.id,
            "is_recurring": True,
            "recurrence_frequency": "MONTHLY",
            "recurrence_day_of_month": 1,
            "recurrence_start_date": "2025-01-01",
        }

        response = await client.post(
            "/api/v1/scheduled-transactions/",
            headers={"Authorization": f"Bearer {token}"},
            json=transaction_data,
        )

        assert response.status_code == 201
        data = response.json()
        assert data["name"] == "Monthly Rent"
        # Amount should be negative for expense category
        assert data["amount"] == "-1200.00"
        assert data["is_recurring"] is True
        assert data["recurrence_frequency"] == "MONTHLY"
        assert data["recurrence_day_of_month"] == 1

    async def test_create_yearly_recurring(
        self, client: AsyncClient, test_user: User, test_account: Account, test_category: Category
    ):
        """Test creating a yearly recurring transaction."""
        login_response = await client.post(
            "/api/v1/auth/login",
            json={"email": test_user.email, "password": "testpass123"},
        )
        token = login_response.json()["access_token"]

        transaction_data = {
            "name": "Annual Insurance",
            "amount": 500.00,
            "currency": "USD",
            "account_id": test_account.id,
            "category_id": test_category.id,
            "is_recurring": True,
            "recurrence_frequency": "YEARLY",
            "recurrence_day_of_month": 15,
            "recurrence_month_of_year": 3,
            "recurrence_start_date": "2025-03-15",
        }

        response = await client.post(
            "/api/v1/scheduled-transactions/",
            headers={"Authorization": f"Bearer {token}"},
            json=transaction_data,
        )

        assert response.status_code == 201
        data = response.json()
        # Amount should be negative for expense category
        assert data["amount"] == "-500.00"
        assert data["name"] == "Annual Insurance"
        assert data["recurrence_frequency"] == "YEARLY"
        assert data["recurrence_month_of_year"] == 3

    async def test_create_invalid_recurrence(
        self, client: AsyncClient, test_user: User, test_account: Account, test_category: Category
    ):
        """Test creating transaction with invalid recurrence parameters."""
        login_response = await client.post(
            "/api/v1/auth/login",
            json={"email": test_user.email, "password": "testpass123"},
        )
        token = login_response.json()["access_token"]

        # Recurring=True but no frequency
        transaction_data = {
            "name": "Invalid Transaction",
            "amount": 100.00,
            "currency": "USD",
            "account_id": test_account.id,
            "category_id": test_category.id,
            "is_recurring": True,
            "recurrence_start_date": "2025-01-01",
        }

        response = await client.post(
            "/api/v1/scheduled-transactions/",
            headers={"Authorization": f"Bearer {token}"},
            json=transaction_data,
        )

        assert response.status_code == 422


class TestGetInstances:
    """Tests for getting transaction instances (calendar expansion)."""

    async def test_expand_monthly_recurring(
        self,
        client: AsyncClient,
        test_user: User,
        test_account: Account,
        test_category: Category,
        test_db: AsyncSession,
    ):
        """Test expanding a monthly recurring transaction."""
        # Create monthly recurring transaction
        transaction = ScheduledTransaction(
            user_id=test_user.id,
            account_id=test_account.id,
            category_id=test_category.id,
            name="Monthly Subscription",
            amount=9.99,
            currency="USD",
            is_recurring=True,
            recurrence_frequency="MONTHLY",
            recurrence_day_of_month=15,
            recurrence_start_date=date(2025, 1, 15),
        )
        test_db.add(transaction)
        await test_db.commit()

        login_response = await client.post(
            "/api/v1/auth/login",
            json={"email": test_user.email, "password": "testpass123"},
        )
        token = login_response.json()["access_token"]

        # Get instances for 3 months
        response = await client.get(
            "/api/v1/scheduled-transactions/instances?from_date=2025-01-01&to_date=2025-03-31",
            headers={"Authorization": f"Bearer {token}"},
        )

        assert response.status_code == 200
        instances = response.json()

        # Filter to just this transaction's instances
        transaction_instances = [
            i for i in instances if i["scheduled_transaction_id"] == transaction.id
        ]
        assert len(transaction_instances) == 3  # Jan 15, Feb 15, Mar 15
        assert transaction_instances[0]["date"] == "2025-01-15"
        assert transaction_instances[1]["date"] == "2025-02-15"
        assert transaction_instances[2]["date"] == "2025-03-15"

    async def test_expand_with_end_date(
        self,
        client: AsyncClient,
        test_user: User,
        test_account: Account,
        test_category: Category,
        test_db: AsyncSession,
    ):
        """Test expansion respects end_date."""
        transaction = ScheduledTransaction(
            user_id=test_user.id,
            account_id=test_account.id,
            category_id=test_category.id,
            name="Limited Subscription",
            amount=10.00,
            currency="USD",
            is_recurring=True,
            recurrence_frequency="MONTHLY",
            recurrence_day_of_month=1,
            recurrence_start_date=date(2025, 1, 1),
            recurrence_end_date=date(2025, 2, 28),  # Ends after 2 months
        )
        test_db.add(transaction)
        await test_db.commit()

        login_response = await client.post(
            "/api/v1/auth/login",
            json={"email": test_user.email, "password": "testpass123"},
        )
        token = login_response.json()["access_token"]

        response = await client.get(
            "/api/v1/scheduled-transactions/instances?from_date=2025-01-01&to_date=2025-12-31",
            headers={"Authorization": f"Bearer {token}"},
        )

        assert response.status_code == 200
        instances = response.json()

        # Filter to just this transaction's instances
        transaction_instances = [
            i for i in instances if i["scheduled_transaction_id"] == transaction.id
        ]
        assert len(transaction_instances) == 2  # Only Jan and Feb


class TestUpdateScheduledTransaction:
    """Tests for updating scheduled transactions with different modes."""

    async def test_update_all_mode(
        self,
        client: AsyncClient,
        test_user: User,
        test_account: Account,
        test_category: Category,
        test_db: AsyncSession,
    ):
        """Test updating entire series with ALL mode."""
        transaction = ScheduledTransaction(
            user_id=test_user.id,
            account_id=test_account.id,
            category_id=test_category.id,
            name="Monthly Payment",
            amount=100.00,
            currency="USD",
            is_recurring=True,
            recurrence_frequency="MONTHLY",
            recurrence_day_of_month=10,
            recurrence_start_date=date(2025, 1, 10),
        )
        test_db.add(transaction)
        await test_db.commit()
        await test_db.refresh(transaction)

        login_response = await client.post(
            "/api/v1/auth/login",
            json={"email": test_user.email, "password": "testpass123"},
        )
        token = login_response.json()["access_token"]

        # Update ALL with new amount
        response = await client.put(
            f"/api/v1/scheduled-transactions/{transaction.id}?update_mode=ALL",
            headers={"Authorization": f"Bearer {token}"},
            json={"amount": 150.00},
        )

        assert response.status_code == 200
        data = response.json()
        assert data["amount"] == "150.00"

    async def test_update_this_only_creates_exception(
        self,
        client: AsyncClient,
        test_user: User,
        test_account: Account,
        test_category: Category,
        test_db: AsyncSession,
    ):
        """Test THIS_ONLY mode creates an exception."""
        transaction = ScheduledTransaction(
            user_id=test_user.id,
            account_id=test_account.id,
            category_id=test_category.id,
            name="Monthly Payment",
            amount=100.00,
            currency="USD",
            is_recurring=True,
            recurrence_frequency="MONTHLY",
            recurrence_day_of_month=15,
            recurrence_start_date=date(2025, 1, 15),
        )
        test_db.add(transaction)
        await test_db.commit()
        await test_db.refresh(transaction)

        login_response = await client.post(
            "/api/v1/auth/login",
            json={"email": test_user.email, "password": "testpass123"},
        )
        token = login_response.json()["access_token"]

        # Update just February instance
        response = await client.put(
            f"/api/v1/scheduled-transactions/{transaction.id}?update_mode=THIS_ONLY&instance_date=2025-02-15",
            headers={"Authorization": f"Bearer {token}"},
            json={"amount": 200.00, "note": "Bonus payment"},
        )

        assert response.status_code == 200

        # Verify exception was created
        result = await test_db.execute(
            select(ScheduledTransactionException).where(
                ScheduledTransactionException.scheduled_transaction_id == transaction.id
            )
        )
        exception = result.scalar_one_or_none()
        assert exception is not None
        assert exception.amount == 200.00
        assert exception.note == "Bonus payment"


class TestDeleteScheduledTransaction:
    """Tests for deleting scheduled transactions."""

    async def test_delete_all_mode(
        self,
        client: AsyncClient,
        test_user: User,
        test_account: Account,
        test_category: Category,
        test_db: AsyncSession,
    ):
        """Test deleting entire series."""
        transaction = ScheduledTransaction(
            user_id=test_user.id,
            account_id=test_account.id,
            category_id=test_category.id,
            name="To Delete",
            amount=50.00,
            currency="USD",
            is_recurring=True,
            recurrence_frequency="MONTHLY",
            recurrence_day_of_month=1,
            recurrence_start_date=date(2025, 1, 1),
        )
        test_db.add(transaction)
        await test_db.commit()
        await test_db.refresh(transaction)
        transaction_id = transaction.id

        login_response = await client.post(
            "/api/v1/auth/login",
            json={"email": test_user.email, "password": "testpass123"},
        )
        token = login_response.json()["access_token"]

        response = await client.delete(
            f"/api/v1/scheduled-transactions/{transaction_id}?delete_mode=ALL",
            headers={"Authorization": f"Bearer {token}"},
        )

        assert response.status_code == 204

        # Verify it's deleted
        result = await test_db.execute(
            select(ScheduledTransaction).where(ScheduledTransaction.id == transaction_id)
        )
        deleted = result.scalar_one_or_none()
        assert deleted is None

    async def test_delete_this_only_creates_exception(
        self,
        client: AsyncClient,
        test_user: User,
        test_account: Account,
        test_category: Category,
        test_db: AsyncSession,
    ):
        """Test THIS_ONLY delete creates exception with is_deleted=True."""
        transaction = ScheduledTransaction(
            user_id=test_user.id,
            account_id=test_account.id,
            category_id=test_category.id,
            name="Monthly Payment",
            amount=100.00,
            currency="USD",
            is_recurring=True,
            recurrence_frequency="MONTHLY",
            recurrence_day_of_month=20,
            recurrence_start_date=date(2025, 1, 20),
        )
        test_db.add(transaction)
        await test_db.commit()
        await test_db.refresh(transaction)

        login_response = await client.post(
            "/api/v1/auth/login",
            json={"email": test_user.email, "password": "testpass123"},
        )
        token = login_response.json()["access_token"]

        # Delete just February instance
        response = await client.delete(
            f"/api/v1/scheduled-transactions/{transaction.id}?delete_mode=THIS_ONLY&instance_date=2025-02-20",
            headers={"Authorization": f"Bearer {token}"},
        )

        assert response.status_code == 204

        # Verify exception was created with is_deleted=True
        result = await test_db.execute(
            select(ScheduledTransactionException).where(
                ScheduledTransactionException.scheduled_transaction_id == transaction.id,
                ScheduledTransactionException.exception_date == date(2025, 2, 20),
            )
        )
        exception = result.scalar_one_or_none()
        assert exception is not None
        assert exception.is_deleted is True

    async def test_delete_this_and_future_sets_end_date(
        self,
        client: AsyncClient,
        test_user: User,
        test_account: Account,
        test_category: Category,
        test_db: AsyncSession,
    ):
        """Test THIS_AND_FUTURE delete sets end_date."""
        transaction = ScheduledTransaction(
            user_id=test_user.id,
            account_id=test_account.id,
            category_id=test_category.id,
            name="Monthly Payment",
            amount=100.00,
            currency="USD",
            is_recurring=True,
            recurrence_frequency="MONTHLY",
            recurrence_day_of_month=5,
            recurrence_start_date=date(2025, 1, 5),
        )
        test_db.add(transaction)
        await test_db.commit()
        await test_db.refresh(transaction)

        login_response = await client.post(
            "/api/v1/auth/login",
            json={"email": test_user.email, "password": "testpass123"},
        )
        token = login_response.json()["access_token"]

        # End series before March
        response = await client.delete(
            f"/api/v1/scheduled-transactions/{transaction.id}?delete_mode=THIS_AND_FUTURE&instance_date=2025-03-05",
            headers={"Authorization": f"Bearer {token}"},
        )

        assert response.status_code == 204

        # Verify end_date was set
        await test_db.refresh(transaction)
        assert transaction.recurrence_end_date == date(2025, 3, 4)  # Day before instance_date
