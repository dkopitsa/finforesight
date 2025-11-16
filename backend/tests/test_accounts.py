"""Tests for account endpoints."""

from datetime import date
from decimal import Decimal
from typing import Any

import pytest
import pytest_asyncio
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import User
from app.models.account import Account, AccountType

pytestmark = pytest.mark.integration


# Fixtures


@pytest.fixture(scope="function")
def test_account_data() -> dict[str, Any]:
    """Return test account data for creation."""
    return {
        "name": "Test Checking Account",
        "type": "checking",
        "currency": "USD",
        "initial_balance": "1000.00",
        "initial_balance_date": str(date.today()),
    }


@pytest.fixture(scope="function")
def test_credit_account_data() -> dict[str, Any]:
    """Return test credit card account data for creation."""
    return {
        "name": "Test Credit Card",
        "type": "credit_card",
        "currency": "USD",
        "initial_balance": "-500.00",
        "initial_balance_date": str(date.today()),
        "credit_limit": "5000.00",
    }


@pytest_asyncio.fixture(scope="function")
async def test_account(test_db: AsyncSession, test_user: User) -> Account:
    """Create a test account in the database."""
    account = Account(
        user_id=test_user.id,
        name="Existing Account",
        type=AccountType.CHECKING,
        currency="USD",
        initial_balance=Decimal("2000.00"),
        initial_balance_date=date.today(),
    )
    test_db.add(account)
    await test_db.commit()
    await test_db.refresh(account)
    return account


# Helper function


async def get_auth_headers(client: AsyncClient, login_data: dict[str, str]) -> dict[str, str]:
    """Get authentication headers for tests."""
    response = await client.post("/api/v1/auth/login", json=login_data)
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


# Test Classes


class TestListAccounts:
    """Tests for listing accounts endpoint."""

    async def test_list_accounts_empty(
        self, client: AsyncClient, test_user: User, test_login_data: dict[str, str]
    ) -> None:
        """Test listing accounts when user has none."""
        headers = await get_auth_headers(client, test_login_data)
        response = await client.get("/api/v1/accounts/", headers=headers)

        assert response.status_code == 200
        data = response.json()
        assert data == []

    async def test_list_accounts_with_data(
        self,
        client: AsyncClient,
        test_user: User,
        test_account: Account,
        test_login_data: dict[str, str],
    ) -> None:
        """Test listing accounts when user has accounts."""
        headers = await get_auth_headers(client, test_login_data)
        response = await client.get("/api/v1/accounts/", headers=headers)

        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["id"] == test_account.id
        assert data[0]["name"] == test_account.name
        assert data[0]["type"] == test_account.type.value

    async def test_list_accounts_without_auth(self, client: AsyncClient) -> None:
        """Test listing accounts without authentication."""
        response = await client.get("/api/v1/accounts/")
        assert response.status_code == 403


class TestCreateAccount:
    """Tests for creating accounts endpoint."""

    async def test_create_account_success(
        self,
        client: AsyncClient,
        test_user: User,
        test_account_data: dict[str, Any],
        test_login_data: dict[str, str],
    ) -> None:
        """Test successful account creation."""
        headers = await get_auth_headers(client, test_login_data)
        response = await client.post("/api/v1/accounts/", json=test_account_data, headers=headers)

        assert response.status_code == 201
        data = response.json()

        # Check response structure
        assert "id" in data
        assert data["name"] == test_account_data["name"]
        assert data["type"] == test_account_data["type"]
        assert data["currency"] == test_account_data["currency"]
        assert data["initial_balance"] == test_account_data["initial_balance"]
        assert data["user_id"] == test_user.id
        assert data["is_active"] is True
        assert "created_at" in data
        assert "updated_at" in data

    async def test_create_credit_account_with_limit(
        self,
        client: AsyncClient,
        test_user: User,
        test_credit_account_data: dict[str, Any],
        test_login_data: dict[str, str],
    ) -> None:
        """Test creating credit account with credit limit."""
        headers = await get_auth_headers(client, test_login_data)
        response = await client.post(
            "/api/v1/accounts/", json=test_credit_account_data, headers=headers
        )

        assert response.status_code == 201
        data = response.json()
        assert data["credit_limit"] == test_credit_account_data["credit_limit"]

    async def test_create_account_invalid_type(
        self,
        client: AsyncClient,
        test_user: User,
        test_account_data: dict[str, Any],
        test_login_data: dict[str, str],
    ) -> None:
        """Test creating account with invalid type."""
        test_account_data["type"] = "invalid_type"
        headers = await get_auth_headers(client, test_login_data)
        response = await client.post("/api/v1/accounts/", json=test_account_data, headers=headers)

        assert response.status_code == 422  # Validation error

    async def test_create_account_without_auth(
        self, client: AsyncClient, test_account_data: dict[str, Any]
    ) -> None:
        """Test creating account without authentication."""
        response = await client.post("/api/v1/accounts/", json=test_account_data)
        assert response.status_code == 403

    async def test_create_account_missing_fields(
        self, client: AsyncClient, test_user: User, test_login_data: dict[str, str]
    ) -> None:
        """Test creating account with missing required fields."""
        headers = await get_auth_headers(client, test_login_data)
        response = await client.post(
            "/api/v1/accounts/", json={"name": "Incomplete Account"}, headers=headers
        )
        assert response.status_code == 422  # Validation error


class TestGetAccount:
    """Tests for getting a single account endpoint."""

    async def test_get_account_success(
        self,
        client: AsyncClient,
        test_user: User,
        test_account: Account,
        test_login_data: dict[str, str],
    ) -> None:
        """Test getting an account successfully."""
        headers = await get_auth_headers(client, test_login_data)
        response = await client.get(f"/api/v1/accounts/{test_account.id}", headers=headers)

        assert response.status_code == 200
        data = response.json()
        assert data["id"] == test_account.id
        assert data["name"] == test_account.name

    async def test_get_account_not_found(
        self, client: AsyncClient, test_user: User, test_login_data: dict[str, str]
    ) -> None:
        """Test getting a non-existent account."""
        headers = await get_auth_headers(client, test_login_data)
        response = await client.get("/api/v1/accounts/99999", headers=headers)

        assert response.status_code == 404
        data = response.json()
        assert "not found" in data["detail"].lower()

    async def test_get_account_unauthorized(
        self, client: AsyncClient, test_db: AsyncSession, test_account: Account
    ) -> None:
        """Test getting another user's account."""
        # Create a second user
        from app.core.security import get_password_hash

        other_user = User(
            email="other@example.com",
            hashed_password=get_password_hash("otherpass123"),
            full_name="Other User",
            currency="USD",
            is_active=True,
        )
        test_db.add(other_user)
        await test_db.commit()

        # Login as other user
        login_response = await client.post(
            "/api/v1/auth/login",
            json={"email": "other@example.com", "password": "otherpass123"},
        )
        token = login_response.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # Try to access first user's account
        response = await client.get(f"/api/v1/accounts/{test_account.id}", headers=headers)

        assert response.status_code == 403
        data = response.json()
        assert "not authorized" in data["detail"].lower()


class TestUpdateAccount:
    """Tests for updating accounts endpoint."""

    async def test_update_account_success(
        self,
        client: AsyncClient,
        test_user: User,
        test_account: Account,
        test_login_data: dict[str, str],
    ) -> None:
        """Test successfully updating an account."""
        headers = await get_auth_headers(client, test_login_data)
        update_data = {"name": "Updated Account Name"}

        response = await client.put(
            f"/api/v1/accounts/{test_account.id}", json=update_data, headers=headers
        )

        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "Updated Account Name"
        assert data["id"] == test_account.id

    async def test_update_account_partial(
        self,
        client: AsyncClient,
        test_user: User,
        test_account: Account,
        test_login_data: dict[str, str],
    ) -> None:
        """Test partial update of account."""
        headers = await get_auth_headers(client, test_login_data)
        update_data = {"is_active": False}

        response = await client.put(
            f"/api/v1/accounts/{test_account.id}", json=update_data, headers=headers
        )

        assert response.status_code == 200
        data = response.json()
        assert data["is_active"] is False
        # Other fields should remain unchanged
        assert data["name"] == test_account.name

    async def test_update_account_not_found(
        self, client: AsyncClient, test_user: User, test_login_data: dict[str, str]
    ) -> None:
        """Test updating a non-existent account."""
        headers = await get_auth_headers(client, test_login_data)
        response = await client.put(
            "/api/v1/accounts/99999", json={"name": "New Name"}, headers=headers
        )

        assert response.status_code == 404


class TestDeleteAccount:
    """Tests for deleting (soft delete) accounts endpoint."""

    async def test_delete_account_success(
        self,
        client: AsyncClient,
        test_user: User,
        test_account: Account,
        test_login_data: dict[str, str],
        test_db: AsyncSession,
    ) -> None:
        """Test successfully soft-deleting an account."""
        headers = await get_auth_headers(client, test_login_data)

        # First, verify account exists in list
        list_response = await client.get("/api/v1/accounts/", headers=headers)
        assert list_response.status_code == 200
        accounts_before = list_response.json()
        account_ids_before = [acc["id"] for acc in accounts_before]
        assert test_account.id in account_ids_before

        # Delete the account
        response = await client.delete(f"/api/v1/accounts/{test_account.id}", headers=headers)
        assert response.status_code == 204

        # Verify account is soft-deleted in database
        await test_db.refresh(test_account)
        assert test_account.is_active is False

        # Verify account does NOT appear in list anymore
        list_response_after = await client.get("/api/v1/accounts/", headers=headers)
        assert list_response_after.status_code == 200
        accounts_after = list_response_after.json()
        account_ids_after = [acc["id"] for acc in accounts_after]
        assert test_account.id not in account_ids_after

    async def test_delete_account_not_found(
        self, client: AsyncClient, test_user: User, test_login_data: dict[str, str]
    ) -> None:
        """Test deleting a non-existent account."""
        headers = await get_auth_headers(client, test_login_data)
        response = await client.delete("/api/v1/accounts/99999", headers=headers)

        assert response.status_code == 404


class TestAccountSummary:
    """Tests for account summary endpoint."""

    async def test_summary_empty(
        self, client: AsyncClient, test_user: User, test_login_data: dict[str, str]
    ) -> None:
        """Test summary with no accounts."""
        headers = await get_auth_headers(client, test_login_data)
        response = await client.get("/api/v1/accounts/summary/totals", headers=headers)

        assert response.status_code == 200
        data = response.json()
        assert data["liquid_assets"] == "0"
        assert data["investments"] == "0"
        assert data["credit_used"] == "0"
        assert data["loans_receivable"] == "0"
        assert data["net_worth"] == "0"

    async def test_summary_with_accounts(
        self,
        client: AsyncClient,
        test_user: User,
        test_login_data: dict[str, str],
        test_db: AsyncSession,
    ) -> None:
        """Test summary with multiple account types."""
        # Create multiple accounts
        accounts = [
            Account(
                user_id=test_user.id,
                name="Checking",
                type=AccountType.CHECKING,
                currency="USD",
                initial_balance=Decimal("1000"),
                initial_balance_date=date.today(),
            ),
            Account(
                user_id=test_user.id,
                name="Savings",
                type=AccountType.SAVINGS,
                currency="USD",
                initial_balance=Decimal("5000"),
                initial_balance_date=date.today(),
            ),
            Account(
                user_id=test_user.id,
                name="Investment",
                type=AccountType.INVESTMENT,
                currency="USD",
                initial_balance=Decimal("10000"),
                initial_balance_date=date.today(),
            ),
            Account(
                user_id=test_user.id,
                name="Credit Card",
                type=AccountType.CREDIT_CARD,
                currency="USD",
                initial_balance=Decimal("-500"),
                initial_balance_date=date.today(),
            ),
        ]
        for account in accounts:
            test_db.add(account)
        await test_db.commit()

        headers = await get_auth_headers(client, test_login_data)
        response = await client.get("/api/v1/accounts/summary/totals", headers=headers)

        assert response.status_code == 200
        data = response.json()
        assert Decimal(data["liquid_assets"]) == Decimal("6000")  # checking + savings
        assert Decimal(data["investments"]) == Decimal("10000")
        assert Decimal(data["credit_used"]) == Decimal("500")
        assert Decimal(data["net_worth"]) == Decimal("15500")  # 6000 + 10000 - 500
