"""Tests for authentication endpoints."""

from typing import Any

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import User

pytestmark = pytest.mark.auth


class TestRegister:
    """Tests for user registration endpoint."""

    async def test_register_success(
        self, client: AsyncClient, test_user_data: dict[str, Any]
    ) -> None:
        """Test successful user registration."""
        response = await client.post("/api/v1/auth/register", json=test_user_data)

        assert response.status_code == 201
        data = response.json()

        # Check response structure
        assert "user" in data
        assert "access_token" in data
        assert "refresh_token" in data
        assert data["token_type"] == "bearer"

        # Check user data
        user = data["user"]
        assert user["email"] == test_user_data["email"]
        assert user["full_name"] == test_user_data["full_name"]
        assert user["currency"] == test_user_data["currency"]
        assert user["is_active"] is True
        assert "id" in user
        assert "hashed_password" not in user  # Should not expose password

    async def test_register_duplicate_email(
        self, client: AsyncClient, test_user: User, test_login_data: dict[str, str]
    ) -> None:
        """Test registration with duplicate email."""
        duplicate_data = {
            "email": test_user.email,
            "password": "newpassword123",
            "full_name": "Another User",
        }

        response = await client.post("/api/v1/auth/register", json=duplicate_data)

        assert response.status_code == 400
        data = response.json()
        assert "detail" in data
        assert "email already registered" in data["detail"].lower()

    async def test_register_invalid_email(
        self, client: AsyncClient, test_user_data: dict[str, Any]
    ) -> None:
        """Test registration with invalid email."""
        test_user_data["email"] = "invalid-email"

        response = await client.post("/api/v1/auth/register", json=test_user_data)

        assert response.status_code == 422  # Validation error

    async def test_register_missing_fields(self, client: AsyncClient) -> None:
        """Test registration with missing required fields."""
        response = await client.post("/api/v1/auth/register", json={"email": "test@example.com"})

        assert response.status_code == 422  # Validation error

    async def test_register_with_default_currency(self, client: AsyncClient) -> None:
        """Test registration without currency defaults to USD."""
        data = {
            "email": "defaultcurrency@example.com",
            "password": "securepass123",
            "full_name": "Default Currency User",
        }

        response = await client.post("/api/v1/auth/register", json=data)

        assert response.status_code == 201
        user_data = response.json()["user"]
        assert user_data["currency"] == "USD"


class TestLogin:
    """Tests for user login endpoint."""

    async def test_login_success(
        self, client: AsyncClient, test_user: User, test_login_data: dict[str, str]
    ) -> None:
        """Test successful login."""
        response = await client.post("/api/v1/auth/login", json=test_login_data)

        assert response.status_code == 200
        data = response.json()

        # Check response structure
        assert "user" in data
        assert "access_token" in data
        assert "refresh_token" in data
        assert data["token_type"] == "bearer"

        # Check user data
        user_data = data["user"]
        assert user_data["email"] == test_user.email
        assert user_data["id"] == test_user.id

    async def test_login_wrong_password(self, client: AsyncClient, test_user: User) -> None:
        """Test login with wrong password."""
        response = await client.post(
            "/api/v1/auth/login",
            json={"email": test_user.email, "password": "wrongpassword"},
        )

        assert response.status_code == 401
        data = response.json()
        assert "detail" in data

    async def test_login_nonexistent_user(self, client: AsyncClient) -> None:
        """Test login with nonexistent user."""
        response = await client.post(
            "/api/v1/auth/login",
            json={"email": "nonexistent@example.com", "password": "somepass123"},
        )

        assert response.status_code == 401
        data = response.json()
        assert "detail" in data

    async def test_login_inactive_user(
        self, client: AsyncClient, test_user: User, test_db: AsyncSession
    ) -> None:
        """Test login with inactive user."""
        # Deactivate user
        test_user.is_active = False
        await test_db.commit()

        response = await client.post(
            "/api/v1/auth/login",
            json={"email": test_user.email, "password": "testpass123"},
        )

        assert response.status_code == 403
        data = response.json()
        assert "inactive" in data["detail"].lower()


class TestRefresh:
    """Tests for token refresh endpoint."""

    async def test_refresh_success(
        self, client: AsyncClient, test_user: User, test_login_data: dict[str, str]
    ) -> None:
        """Test successful token refresh."""
        # First login to get tokens
        login_response = await client.post("/api/v1/auth/login", json=test_login_data)
        refresh_token = login_response.json()["refresh_token"]

        # Refresh the token
        response = await client.post("/api/v1/auth/refresh", json={"refresh_token": refresh_token})

        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"
        # Should return a new access token
        assert data["access_token"] != login_response.json()["access_token"]

    async def test_refresh_invalid_token(self, client: AsyncClient) -> None:
        """Test refresh with invalid token."""
        response = await client.post(
            "/api/v1/auth/refresh", json={"refresh_token": "invalid_token"}
        )

        assert response.status_code == 401
        data = response.json()
        assert "detail" in data

    async def test_refresh_with_access_token(
        self, client: AsyncClient, test_user: User, test_login_data: dict[str, str]
    ) -> None:
        """Test refresh with access token instead of refresh token."""
        # Login to get tokens
        login_response = await client.post("/api/v1/auth/login", json=test_login_data)
        access_token = login_response.json()["access_token"]

        # Try to refresh with access token
        response = await client.post("/api/v1/auth/refresh", json={"refresh_token": access_token})

        assert response.status_code == 401
        data = response.json()
        assert "detail" in data


class TestLogout:
    """Tests for logout endpoint."""

    async def test_logout_success(
        self, client: AsyncClient, test_user: User, test_login_data: dict[str, str]
    ) -> None:
        """Test successful logout."""
        # Login first
        login_response = await client.post("/api/v1/auth/login", json=test_login_data)
        tokens = login_response.json()
        access_token = tokens["access_token"]
        refresh_token = tokens["refresh_token"]

        # Logout
        response = await client.post(
            "/api/v1/auth/logout",
            json={"refresh_token": refresh_token},
            headers={"Authorization": f"Bearer {access_token}"},
        )

        assert response.status_code == 204

        # Try to use the refresh token again (should fail)
        refresh_response = await client.post(
            "/api/v1/auth/refresh", json={"refresh_token": refresh_token}
        )
        assert refresh_response.status_code == 401

    async def test_logout_without_auth(self, client: AsyncClient) -> None:
        """Test logout without authentication."""
        response = await client.post("/api/v1/auth/logout", json={"refresh_token": "some_token"})

        assert response.status_code == 403  # Missing authorization

    async def test_logout_invalid_refresh_token(
        self, client: AsyncClient, test_user: User, test_login_data: dict[str, str]
    ) -> None:
        """Test logout with invalid refresh token."""
        # Login first
        login_response = await client.post("/api/v1/auth/login", json=test_login_data)
        access_token = login_response.json()["access_token"]

        # Try logout with invalid refresh token
        response = await client.post(
            "/api/v1/auth/logout",
            json={"refresh_token": "invalid_token"},
            headers={"Authorization": f"Bearer {access_token}"},
        )

        assert response.status_code == 404


class TestGetCurrentUser:
    """Tests for get current user endpoint."""

    async def test_get_current_user_success(
        self, client: AsyncClient, test_user: User, test_login_data: dict[str, str]
    ) -> None:
        """Test getting current user info."""
        # Login first
        login_response = await client.post("/api/v1/auth/login", json=test_login_data)
        access_token = login_response.json()["access_token"]

        # Get current user
        response = await client.get(
            "/api/v1/auth/me", headers={"Authorization": f"Bearer {access_token}"}
        )

        assert response.status_code == 200
        data = response.json()
        assert data["email"] == test_user.email
        assert data["id"] == test_user.id
        assert data["full_name"] == test_user.full_name
        assert "hashed_password" not in data

    async def test_get_current_user_without_auth(self, client: AsyncClient) -> None:
        """Test getting current user without authentication."""
        response = await client.get("/api/v1/auth/me")

        assert response.status_code == 403  # Missing authorization

    async def test_get_current_user_invalid_token(self, client: AsyncClient) -> None:
        """Test getting current user with invalid token."""
        response = await client.get(
            "/api/v1/auth/me", headers={"Authorization": "Bearer invalid_token"}
        )

        assert response.status_code == 401

    async def test_get_current_user_with_refresh_token(
        self, client: AsyncClient, test_user: User, test_login_data: dict[str, str]
    ) -> None:
        """Test getting current user with refresh token (should fail)."""
        # Login first
        login_response = await client.post("/api/v1/auth/login", json=test_login_data)
        refresh_token = login_response.json()["refresh_token"]

        # Try to get current user with refresh token
        response = await client.get(
            "/api/v1/auth/me", headers={"Authorization": f"Bearer {refresh_token}"}
        )

        assert response.status_code == 401


class TestTokenExpiration:
    """Tests for token expiration behavior."""

    async def test_tokens_are_different(
        self, client: AsyncClient, test_user: User, test_login_data: dict[str, str]
    ) -> None:
        """Test that access and refresh tokens are different."""
        response = await client.post("/api/v1/auth/login", json=test_login_data)
        data = response.json()

        assert data["access_token"] != data["refresh_token"]

    async def test_multiple_logins_create_different_tokens(
        self, client: AsyncClient, test_user: User, test_login_data: dict[str, str]
    ) -> None:
        """Test that multiple logins create different tokens."""
        response1 = await client.post("/api/v1/auth/login", json=test_login_data)
        response2 = await client.post("/api/v1/auth/login", json=test_login_data)

        tokens1 = response1.json()
        tokens2 = response2.json()

        assert tokens1["access_token"] != tokens2["access_token"]
        assert tokens1["refresh_token"] != tokens2["refresh_token"]
