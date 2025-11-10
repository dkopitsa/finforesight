"""Category routes for CRUD operations."""

import logging

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_active_user, get_db
from app.models.category import Category
from app.models.user import User
from app.schemas.category import CategoryCreate, CategoryResponse, CategoryUpdate

router = APIRouter()
logger = logging.getLogger(__name__)


@router.get("/", response_model=list[CategoryResponse])
async def list_categories(
    type: str | None = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> list[Category]:
    """
    List all categories (system + user's custom).

    Args:
        type: Optional filter by category type (income, expense, transfer)
        db: Database session
        current_user: Current authenticated user

    Returns:
        List of categories (system categories + user's custom categories)
    """
    query = select(Category).where(
        or_(
            Category.is_system == True,  # noqa: E712
            Category.user_id == current_user.id,
        )
    )

    # Apply type filter if provided
    if type:
        query = query.where(Category.type == type)

    query = query.order_by(Category.is_system.desc(), Category.name)

    result = await db.execute(query)
    categories = result.scalars().all()
    return list(categories)


@router.post("/", response_model=CategoryResponse, status_code=status.HTTP_201_CREATED)
async def create_category(
    category_data: CategoryCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> Category:
    """
    Create a new custom category for the current user.

    Args:
        category_data: Category creation data
        db: Database session
        current_user: Current authenticated user

    Returns:
        Created category
    """
    # Check if category with same name and type already exists for this user
    existing = await db.execute(
        select(Category).where(
            Category.user_id == current_user.id,
            Category.name == category_data.name,
            Category.type == category_data.type,
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Category '{category_data.name}' of type '{category_data.type.value}' already exists",
        )

    category = Category(
        user_id=current_user.id,
        name=category_data.name,
        type=category_data.type,
        icon=category_data.icon,
        color=category_data.color,
        is_system=False,  # User categories are never system categories
    )

    db.add(category)
    await db.commit()
    await db.refresh(category)

    logger.info(
        "Category created",
        extra={
            "category_id": category.id,
            "user_id": current_user.id,
            "category_type": category.type.value,
        },
    )

    return category


@router.get("/{category_id}", response_model=CategoryResponse)
async def get_category(
    category_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> Category:
    """
    Get a specific category by ID.

    Args:
        category_id: Category ID
        db: Database session
        current_user: Current authenticated user

    Returns:
        Category data

    Raises:
        HTTPException: If category not found or user doesn't have access
    """
    result = await db.execute(select(Category).where(Category.id == category_id))
    category = result.scalar_one_or_none()

    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Category not found",
        )

    # Check access: either system category or user's own category
    if not category.is_system and category.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this category",
        )

    return category


@router.put("/{category_id}", response_model=CategoryResponse)
async def update_category(
    category_id: int,
    category_data: CategoryUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> Category:
    """
    Update a custom category.

    System categories cannot be updated.

    Args:
        category_id: Category ID
        category_data: Category update data
        db: Database session
        current_user: Current authenticated user

    Returns:
        Updated category

    Raises:
        HTTPException: If category not found, is system category, or user doesn't own it
    """
    result = await db.execute(select(Category).where(Category.id == category_id))
    category = result.scalar_one_or_none()

    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Category not found",
        )

    if category.is_system:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="System categories cannot be modified",
        )

    if category.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this category",
        )

    # Update only provided fields
    update_data = category_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(category, field, value)

    await db.commit()
    await db.refresh(category)

    logger.info(
        "Category updated",
        extra={"category_id": category.id, "user_id": current_user.id},
    )

    return category


@router.delete("/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_category(
    category_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> None:
    """
    Delete a custom category.

    System categories cannot be deleted.

    Args:
        category_id: Category ID
        db: Database session
        current_user: Current authenticated user

    Raises:
        HTTPException: If category not found, is system category, or user doesn't own it
    """
    result = await db.execute(select(Category).where(Category.id == category_id))
    category = result.scalar_one_or_none()

    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Category not found",
        )

    if category.is_system:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="System categories cannot be deleted",
        )

    if category.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this category",
        )

    await db.delete(category)
    await db.commit()

    logger.info(
        "Category deleted",
        extra={"category_id": category.id, "user_id": current_user.id},
    )
