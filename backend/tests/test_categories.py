"""Tests for category endpoints."""

import pytest_asyncio
from httpx import AsyncClient
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.category import Category, CategoryType
from app.models.user import User


@pytest_asyncio.fixture
async def test_category(test_db: AsyncSession, test_user: User) -> Category:
    """Create a test category for the test user."""
    category = Category(
        user_id=test_user.id,
        name="Test Category",
        type=CategoryType.EXPENSE,
        icon="🧪",
        color="#FF0000",
        is_system=False,
    )
    test_db.add(category)
    await test_db.commit()
    await test_db.refresh(category)
    return category


@pytest_asyncio.fixture
async def other_user(test_db: AsyncSession) -> User:
    """Create another test user."""
    from app.core.security import get_password_hash

    user = User(
        email="other@example.com",
        hashed_password=get_password_hash("testpass123"),
        full_name="Other User",
        currency="USD",
        is_active=True,
    )
    test_db.add(user)
    await test_db.commit()
    await test_db.refresh(user)
    return user


@pytest_asyncio.fixture
async def other_user_category(test_db: AsyncSession, other_user: User) -> Category:
    """Create a category for the other user."""
    category = Category(
        user_id=other_user.id,
        name="Other User Category",
        type=CategoryType.INCOME,
        icon="💰",
        color="#00FF00",
        is_system=False,
    )
    test_db.add(category)
    await test_db.commit()
    await test_db.refresh(category)
    return category


@pytest_asyncio.fixture
async def system_category(test_db: AsyncSession) -> Category:
    """Create a system category."""
    category = Category(
        user_id=None,
        name="System Category",
        type=CategoryType.EXPENSE,
        icon="⚙️",
        color="#0000FF",
        is_system=True,
    )
    test_db.add(category)
    await test_db.commit()
    await test_db.refresh(category)
    return category


class TestListCategories:
    """Tests for listing categories."""

    async def test_list_categories_empty(
        self, client: AsyncClient, test_user: User, test_db: AsyncSession
    ):
        """Test listing categories when user has no custom categories."""
        # Login
        login_response = await client.post(
            "/api/v1/auth/login",
            json={"email": test_user.email, "password": "testpass123"},
        )
        token = login_response.json()["access_token"]

        # List categories
        response = await client.get(
            "/api/v1/categories/",
            headers={"Authorization": f"Bearer {token}"},
        )

        assert response.status_code == 200
        categories = response.json()
        # Should only see system categories (none created yet in this test)
        assert isinstance(categories, list)

    async def test_list_categories_with_system(
        self, client: AsyncClient, test_user: User, system_category: Category
    ):
        """Test listing categories includes system categories."""
        # Login
        login_response = await client.post(
            "/api/v1/auth/login",
            json={"email": test_user.email, "password": "testpass123"},
        )
        token = login_response.json()["access_token"]

        # List categories
        response = await client.get(
            "/api/v1/categories/",
            headers={"Authorization": f"Bearer {token}"},
        )

        assert response.status_code == 200
        categories = response.json()
        assert len(categories) >= 1

        # Check system category is included
        system_cats = [c for c in categories if c["is_system"]]
        assert len(system_cats) >= 1
        assert any(c["name"] == "System Category" for c in system_cats)

    async def test_list_categories_with_custom(
        self,
        client: AsyncClient,
        test_user: User,
        test_category: Category,
        system_category: Category,
    ):
        """Test listing categories includes user's custom categories."""
        # Login
        login_response = await client.post(
            "/api/v1/auth/login",
            json={"email": test_user.email, "password": "testpass123"},
        )
        token = login_response.json()["access_token"]

        # List categories
        response = await client.get(
            "/api/v1/categories/",
            headers={"Authorization": f"Bearer {token}"},
        )

        assert response.status_code == 200
        categories = response.json()
        assert len(categories) >= 2

        # Check both system and custom categories are included
        custom_cats = [c for c in categories if not c["is_system"]]
        assert len(custom_cats) >= 1
        assert any(c["name"] == "Test Category" for c in custom_cats)

    async def test_list_categories_filter_by_type(
        self,
        client: AsyncClient,
        test_user: User,
        test_category: Category,
        system_category: Category,
    ):
        """Test filtering categories by type."""
        # Login
        login_response = await client.post(
            "/api/v1/auth/login",
            json={"email": test_user.email, "password": "testpass123"},
        )
        token = login_response.json()["access_token"]

        # List only expense categories
        response = await client.get(
            "/api/v1/categories/?type=expense",
            headers={"Authorization": f"Bearer {token}"},
        )

        assert response.status_code == 200
        categories = response.json()
        # All returned categories should be expense type
        assert all(c["type"] == "expense" for c in categories)

    async def test_list_categories_excludes_other_users(
        self,
        client: AsyncClient,
        test_user: User,
        test_category: Category,
        other_user_category: Category,
    ):
        """Test that user only sees their own custom categories (not other users')."""
        # Login as test_user
        login_response = await client.post(
            "/api/v1/auth/login",
            json={"email": test_user.email, "password": "testpass123"},
        )
        token = login_response.json()["access_token"]

        # List categories
        response = await client.get(
            "/api/v1/categories/",
            headers={"Authorization": f"Bearer {token}"},
        )

        assert response.status_code == 200
        categories = response.json()

        # Should see test_category but not other_user_category
        category_names = [c["name"] for c in categories]
        assert "Test Category" in category_names
        assert "Other User Category" not in category_names

    async def test_list_categories_without_auth(self, client: AsyncClient):
        """Test listing categories without authentication fails."""
        response = await client.get("/api/v1/categories/")
        assert response.status_code == 403


class TestCreateCategory:
    """Tests for creating categories."""

    async def test_create_category_success(
        self, client: AsyncClient, test_user: User, test_db: AsyncSession
    ):
        """Test successfully creating a custom category."""
        # Login
        login_response = await client.post(
            "/api/v1/auth/login",
            json={"email": test_user.email, "password": "testpass123"},
        )
        token = login_response.json()["access_token"]

        # Create category
        category_data = {
            "name": "New Category",
            "type": "income",
            "icon": "💸",
            "color": "#FF5733",
        }
        response = await client.post(
            "/api/v1/categories/",
            headers={"Authorization": f"Bearer {token}"},
            json=category_data,
        )

        assert response.status_code == 201
        data = response.json()
        assert data["name"] == "New Category"
        assert data["type"] == "income"
        assert data["icon"] == "💸"
        assert data["color"] == "#FF5733"
        assert data["user_id"] == test_user.id
        assert data["is_system"] is False
        assert "id" in data
        assert "created_at" in data

        # Verify in database
        result = await test_db.execute(select(Category).where(Category.id == data["id"]))
        category = result.scalar_one()
        assert category.name == "New Category"
        assert category.user_id == test_user.id

    async def test_create_category_duplicate(
        self, client: AsyncClient, test_user: User, test_category: Category
    ):
        """Test creating a duplicate category fails."""
        # Login
        login_response = await client.post(
            "/api/v1/auth/login",
            json={"email": test_user.email, "password": "testpass123"},
        )
        token = login_response.json()["access_token"]

        # Try to create duplicate
        category_data = {
            "name": test_category.name,
            "type": test_category.type.value,
            "icon": "🔄",
            "color": "#000000",
        }
        response = await client.post(
            "/api/v1/categories/",
            headers={"Authorization": f"Bearer {token}"},
            json=category_data,
        )

        assert response.status_code == 400
        assert "already exists" in response.json()["detail"].lower()

    async def test_create_category_invalid_color(self, client: AsyncClient, test_user: User):
        """Test creating category with invalid color format fails."""
        # Login
        login_response = await client.post(
            "/api/v1/auth/login",
            json={"email": test_user.email, "password": "testpass123"},
        )
        token = login_response.json()["access_token"]

        # Invalid color (not hex)
        category_data = {
            "name": "Bad Color",
            "type": "expense",
            "color": "red",
        }
        response = await client.post(
            "/api/v1/categories/",
            headers={"Authorization": f"Bearer {token}"},
            json=category_data,
        )

        assert response.status_code == 422

    async def test_create_category_without_auth(self, client: AsyncClient):
        """Test creating category without authentication fails."""
        category_data = {
            "name": "Unauthorized Category",
            "type": "expense",
        }
        response = await client.post("/api/v1/categories/", json=category_data)
        assert response.status_code == 403

    async def test_create_category_missing_fields(self, client: AsyncClient, test_user: User):
        """Test creating category with missing required fields fails."""
        # Login
        login_response = await client.post(
            "/api/v1/auth/login",
            json={"email": test_user.email, "password": "testpass123"},
        )
        token = login_response.json()["access_token"]

        # Missing type field
        category_data = {
            "name": "Incomplete Category",
        }
        response = await client.post(
            "/api/v1/categories/",
            headers={"Authorization": f"Bearer {token}"},
            json=category_data,
        )

        assert response.status_code == 422


class TestGetCategory:
    """Tests for getting a single category."""

    async def test_get_category_success_custom(
        self, client: AsyncClient, test_user: User, test_category: Category
    ):
        """Test getting user's custom category."""
        # Login
        login_response = await client.post(
            "/api/v1/auth/login",
            json={"email": test_user.email, "password": "testpass123"},
        )
        token = login_response.json()["access_token"]

        # Get category
        response = await client.get(
            f"/api/v1/categories/{test_category.id}",
            headers={"Authorization": f"Bearer {token}"},
        )

        assert response.status_code == 200
        data = response.json()
        assert data["id"] == test_category.id
        assert data["name"] == test_category.name
        assert data["type"] == test_category.type.value

    async def test_get_category_success_system(
        self, client: AsyncClient, test_user: User, system_category: Category
    ):
        """Test getting system category."""
        # Login
        login_response = await client.post(
            "/api/v1/auth/login",
            json={"email": test_user.email, "password": "testpass123"},
        )
        token = login_response.json()["access_token"]

        # Get system category
        response = await client.get(
            f"/api/v1/categories/{system_category.id}",
            headers={"Authorization": f"Bearer {token}"},
        )

        assert response.status_code == 200
        data = response.json()
        assert data["id"] == system_category.id
        assert data["is_system"] is True

    async def test_get_category_not_found(self, client: AsyncClient, test_user: User):
        """Test getting non-existent category."""
        # Login
        login_response = await client.post(
            "/api/v1/auth/login",
            json={"email": test_user.email, "password": "testpass123"},
        )
        token = login_response.json()["access_token"]

        # Try to get non-existent category
        response = await client.get(
            "/api/v1/categories/99999",
            headers={"Authorization": f"Bearer {token}"},
        )

        assert response.status_code == 404

    async def test_get_category_unauthorized(
        self, client: AsyncClient, test_user: User, other_user_category: Category
    ):
        """Test getting another user's category fails."""
        # Login as test_user
        login_response = await client.post(
            "/api/v1/auth/login",
            json={"email": test_user.email, "password": "testpass123"},
        )
        token = login_response.json()["access_token"]

        # Try to get other user's category
        response = await client.get(
            f"/api/v1/categories/{other_user_category.id}",
            headers={"Authorization": f"Bearer {token}"},
        )

        assert response.status_code == 403


class TestUpdateCategory:
    """Tests for updating categories."""

    async def test_update_category_success(
        self, client: AsyncClient, test_user: User, test_category: Category, test_db: AsyncSession
    ):
        """Test successfully updating a custom category."""
        # Login
        login_response = await client.post(
            "/api/v1/auth/login",
            json={"email": test_user.email, "password": "testpass123"},
        )
        token = login_response.json()["access_token"]

        # Update category
        update_data = {
            "name": "Updated Category",
            "color": "#00FF00",
        }
        response = await client.put(
            f"/api/v1/categories/{test_category.id}",
            headers={"Authorization": f"Bearer {token}"},
            json=update_data,
        )

        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "Updated Category"
        assert data["color"] == "#00FF00"

        # Verify in database
        await test_db.refresh(test_category)
        assert test_category.name == "Updated Category"
        assert test_category.color == "#00FF00"

    async def test_update_category_system_protected(
        self, client: AsyncClient, test_user: User, system_category: Category
    ):
        """Test that system categories cannot be updated."""
        # Login
        login_response = await client.post(
            "/api/v1/auth/login",
            json={"email": test_user.email, "password": "testpass123"},
        )
        token = login_response.json()["access_token"]

        # Try to update system category
        update_data = {
            "name": "Modified System Category",
        }
        response = await client.put(
            f"/api/v1/categories/{system_category.id}",
            headers={"Authorization": f"Bearer {token}"},
            json=update_data,
        )

        assert response.status_code == 403
        assert "system categories cannot be modified" in response.json()["detail"].lower()

    async def test_update_category_not_found(self, client: AsyncClient, test_user: User):
        """Test updating non-existent category."""
        # Login
        login_response = await client.post(
            "/api/v1/auth/login",
            json={"email": test_user.email, "password": "testpass123"},
        )
        token = login_response.json()["access_token"]

        # Try to update non-existent category
        update_data = {"name": "New Name"}
        response = await client.put(
            "/api/v1/categories/99999",
            headers={"Authorization": f"Bearer {token}"},
            json=update_data,
        )

        assert response.status_code == 404

    async def test_update_category_unauthorized(
        self, client: AsyncClient, test_user: User, other_user_category: Category
    ):
        """Test updating another user's category fails."""
        # Login as test_user
        login_response = await client.post(
            "/api/v1/auth/login",
            json={"email": test_user.email, "password": "testpass123"},
        )
        token = login_response.json()["access_token"]

        # Try to update other user's category
        update_data = {"name": "Hacked Name"}
        response = await client.put(
            f"/api/v1/categories/{other_user_category.id}",
            headers={"Authorization": f"Bearer {token}"},
            json=update_data,
        )

        assert response.status_code == 403


class TestDeleteCategory:
    """Tests for deleting categories."""

    async def test_delete_category_success(
        self, client: AsyncClient, test_user: User, test_category: Category, test_db: AsyncSession
    ):
        """Test successfully deleting a custom category."""
        # Login
        login_response = await client.post(
            "/api/v1/auth/login",
            json={"email": test_user.email, "password": "testpass123"},
        )
        token = login_response.json()["access_token"]

        # Delete category
        response = await client.delete(
            f"/api/v1/categories/{test_category.id}",
            headers={"Authorization": f"Bearer {token}"},
        )

        assert response.status_code == 204

        # Verify deletion in database
        result = await test_db.execute(select(Category).where(Category.id == test_category.id))
        deleted_category = result.scalar_one_or_none()
        assert deleted_category is None

    async def test_delete_category_system_protected(
        self, client: AsyncClient, test_user: User, system_category: Category, test_db: AsyncSession
    ):
        """Test that system categories cannot be deleted."""
        # Login
        login_response = await client.post(
            "/api/v1/auth/login",
            json={"email": test_user.email, "password": "testpass123"},
        )
        token = login_response.json()["access_token"]

        # Try to delete system category
        response = await client.delete(
            f"/api/v1/categories/{system_category.id}",
            headers={"Authorization": f"Bearer {token}"},
        )

        assert response.status_code == 403
        assert "system categories cannot be deleted" in response.json()["detail"].lower()

        # Verify it still exists in database
        result = await test_db.execute(select(Category).where(Category.id == system_category.id))
        category = result.scalar_one_or_none()
        assert category is not None

    async def test_delete_category_not_found(self, client: AsyncClient, test_user: User):
        """Test deleting non-existent category."""
        # Login
        login_response = await client.post(
            "/api/v1/auth/login",
            json={"email": test_user.email, "password": "testpass123"},
        )
        token = login_response.json()["access_token"]

        # Try to delete non-existent category
        response = await client.delete(
            "/api/v1/categories/99999",
            headers={"Authorization": f"Bearer {token}"},
        )

        assert response.status_code == 404

    async def test_delete_category_unauthorized(
        self,
        client: AsyncClient,
        test_user: User,
        other_user_category: Category,
        test_db: AsyncSession,
    ):
        """Test deleting another user's category fails."""
        # Login as test_user
        login_response = await client.post(
            "/api/v1/auth/login",
            json={"email": test_user.email, "password": "testpass123"},
        )
        token = login_response.json()["access_token"]

        # Try to delete other user's category
        response = await client.delete(
            f"/api/v1/categories/{other_user_category.id}",
            headers={"Authorization": f"Bearer {token}"},
        )

        assert response.status_code == 403

        # Verify it still exists in database
        result = await test_db.execute(
            select(Category).where(Category.id == other_user_category.id)
        )
        category = result.scalar_one_or_none()
        assert category is not None
