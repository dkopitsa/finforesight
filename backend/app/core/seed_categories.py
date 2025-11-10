"""Seed script for system categories."""

import logging

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.category import Category, CategoryType

logger = logging.getLogger(__name__)

# Default system categories
SYSTEM_CATEGORIES = [
    # Income categories
    {
        "name": "Salary",
        "type": CategoryType.INCOME,
        "icon": "💰",
        "color": "#4CAF50",
        "is_system": True,
    },
    {
        "name": "Freelance",
        "type": CategoryType.INCOME,
        "icon": "💼",
        "color": "#8BC34A",
        "is_system": True,
    },
    {
        "name": "Investment Income",
        "type": CategoryType.INCOME,
        "icon": "📈",
        "color": "#009688",
        "is_system": True,
    },
    {
        "name": "Business Income",
        "type": CategoryType.INCOME,
        "icon": "🏢",
        "color": "#00BCD4",
        "is_system": True,
    },
    {
        "name": "Gift",
        "type": CategoryType.INCOME,
        "icon": "🎁",
        "color": "#03A9F4",
        "is_system": True,
    },
    {
        "name": "Other Income",
        "type": CategoryType.INCOME,
        "icon": "💵",
        "color": "#2196F3",
        "is_system": True,
    },
    # Expense categories
    {
        "name": "Groceries",
        "type": CategoryType.EXPENSE,
        "icon": "🛒",
        "color": "#FF5722",
        "is_system": True,
    },
    {
        "name": "Utilities",
        "type": CategoryType.EXPENSE,
        "icon": "💡",
        "color": "#FF9800",
        "is_system": True,
    },
    {
        "name": "Transport",
        "type": CategoryType.EXPENSE,
        "icon": "🚗",
        "color": "#FFC107",
        "is_system": True,
    },
    {
        "name": "Entertainment",
        "type": CategoryType.EXPENSE,
        "icon": "🎬",
        "color": "#FFEB3B",
        "is_system": True,
    },
    {
        "name": "Healthcare",
        "type": CategoryType.EXPENSE,
        "icon": "⚕️",
        "color": "#E91E63",
        "is_system": True,
    },
    {
        "name": "Rent",
        "type": CategoryType.EXPENSE,
        "icon": "🏠",
        "color": "#9C27B0",
        "is_system": True,
    },
    {
        "name": "Dining Out",
        "type": CategoryType.EXPENSE,
        "icon": "🍽️",
        "color": "#673AB7",
        "is_system": True,
    },
    {
        "name": "Shopping",
        "type": CategoryType.EXPENSE,
        "icon": "🛍️",
        "color": "#3F51B5",
        "is_system": True,
    },
    {
        "name": "Education",
        "type": CategoryType.EXPENSE,
        "icon": "📚",
        "color": "#607D8B",
        "is_system": True,
    },
    {
        "name": "Insurance",
        "type": CategoryType.EXPENSE,
        "icon": "🛡️",
        "color": "#795548",
        "is_system": True,
    },
    {
        "name": "Personal Care",
        "type": CategoryType.EXPENSE,
        "icon": "💆",
        "color": "#F44336",
        "is_system": True,
    },
    {
        "name": "Subscriptions",
        "type": CategoryType.EXPENSE,
        "icon": "📱",
        "color": "#9E9E9E",
        "is_system": True,
    },
    {
        "name": "Other Expense",
        "type": CategoryType.EXPENSE,
        "icon": "💸",
        "color": "#FF5252",
        "is_system": True,
    },
    # Transfer category
    {
        "name": "Transfer",
        "type": CategoryType.TRANSFER,
        "icon": "🔄",
        "color": "#607D8B",
        "is_system": True,
    },
]


async def seed_categories(db: AsyncSession) -> None:
    """
    Seed system categories if they don't exist.

    Args:
        db: Database session
    """
    logger.info("Starting system categories seeding")

    seeded_count = 0
    skipped_count = 0

    for cat_data in SYSTEM_CATEGORIES:
        # Check if category already exists
        result = await db.execute(
            select(Category).where(
                Category.name == cat_data["name"],
                Category.type == cat_data["type"],
                Category.is_system == True,  # noqa: E712
            )
        )
        existing = result.scalar_one_or_none()

        if existing:
            skipped_count += 1
            continue

        # Create category
        category = Category(
            user_id=None,  # System categories don't belong to any user
            name=cat_data["name"],
            type=cat_data["type"],
            icon=cat_data["icon"],
            color=cat_data["color"],
            is_system=True,
        )
        db.add(category)
        seeded_count += 1

    await db.commit()

    logger.info(
        f"System categories seeding completed: {seeded_count} created, {skipped_count} skipped"
    )
