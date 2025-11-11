"""Pytest configuration and fixtures for testing."""

import asyncio
from collections.abc import AsyncGenerator, Generator
from contextlib import suppress
from typing import Any

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.pool import NullPool

from app.core.database import Base, get_db
from app.main import app

# Import all models so SQLAlchemy knows about them
from app.models import Account, Category, RefreshToken, User  # noqa: F401

# Test database URL (use file-based SQLite for tests to ensure persistence within test)
TEST_DATABASE_URL = "sqlite+aiosqlite:///./test.db"


@pytest.fixture(scope="session")
def event_loop() -> Generator[asyncio.AbstractEventLoop, None, None]:
    """Create an instance of the default event loop for the test session."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest_asyncio.fixture(scope="session")
async def test_engine():
    """Create a test database engine for the entire test session."""
    engine = create_async_engine(
        TEST_DATABASE_URL,
        echo=False,
        poolclass=NullPool,
        connect_args={"check_same_thread": False},
    )

    # Create all tables once
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    yield engine

    # Drop all tables at the end of session
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)

    await engine.dispose()


@pytest_asyncio.fixture(scope="session")
async def test_session_factory(test_engine):
    """Create a session factory for the test session."""
    return async_sessionmaker(
        test_engine,
        class_=AsyncSession,
        expire_on_commit=False,
        autocommit=False,
        autoflush=False,
    )


@pytest_asyncio.fixture(scope="function")
async def test_db(test_session_factory) -> AsyncGenerator[AsyncSession, None]:
    """
    Provide a clean database session for each test.

    Tables are truncated after each test to ensure isolation.
    """
    async with test_session_factory() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()

    # Clean up database after test by truncating all tables
    async with test_session_factory() as cleanup_session:
        try:
            # Delete in reverse dependency order to respect foreign keys
            # Children first, then parents
            await cleanup_session.execute(text("DELETE FROM account_reconciliations"))
            await cleanup_session.execute(text("DELETE FROM scheduled_transaction_exceptions"))
            await cleanup_session.execute(text("DELETE FROM scheduled_transactions"))
            await cleanup_session.execute(text("DELETE FROM refresh_tokens"))
            await cleanup_session.execute(text("DELETE FROM accounts"))
            await cleanup_session.execute(text("DELETE FROM categories"))
            await cleanup_session.execute(text("DELETE FROM users"))

            # Reset auto-increment counters for consistent test IDs
            # sqlite_sequence table only exists after first auto-increment insert
            with suppress(Exception):
                await cleanup_session.execute(text("DELETE FROM sqlite_sequence"))

            await cleanup_session.commit()
        except Exception:
            await cleanup_session.rollback()
            raise
        finally:
            await cleanup_session.close()


@pytest_asyncio.fixture(scope="function")
async def client(test_db: AsyncSession) -> AsyncGenerator[AsyncClient, None]:
    """Create a test client with overridden dependencies."""

    async def override_get_db() -> AsyncGenerator[AsyncSession, None]:
        yield test_db

    app.dependency_overrides[get_db] = override_get_db

    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test",
    ) as ac:
        yield ac

    app.dependency_overrides.clear()


@pytest_asyncio.fixture(scope="function")
async def test_user(test_db: AsyncSession) -> User:
    """Create a test user in the database."""
    from app.core.security import get_password_hash

    user = User(
        email="test@example.com",
        hashed_password=get_password_hash("testpass123"),
        full_name="Test User",
        currency="USD",
        is_active=True,
    )
    test_db.add(user)
    await test_db.commit()
    await test_db.refresh(user)
    return user


@pytest.fixture(scope="function")
def test_user_data() -> dict[str, Any]:
    """Return test user data for registration."""
    return {
        "email": "newuser@example.com",
        "password": "securepass123",
        "full_name": "New Test User",
        "currency": "USD",
    }


@pytest.fixture(scope="function")
def test_login_data() -> dict[str, str]:
    """Return test login credentials."""
    return {
        "email": "test@example.com",
        "password": "testpass123",
    }
