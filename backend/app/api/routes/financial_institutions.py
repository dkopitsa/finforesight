"""Financial Institution routes for CRUD operations."""

import logging

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_active_user, get_db
from app.models.financial_institution import FinancialInstitution
from app.models.user import User
from app.schemas.financial_institution import (
    FinancialInstitutionCreate,
    FinancialInstitutionResponse,
    FinancialInstitutionUpdate,
)

router = APIRouter()
logger = logging.getLogger(__name__)


@router.get("/", response_model=list[FinancialInstitutionResponse])
async def list_financial_institutions(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> list[FinancialInstitution]:
    """
    List all financial institutions for the current user.

    Args:
        db: Database session
        current_user: Current authenticated user

    Returns:
        List of user's financial institutions
    """
    result = await db.execute(
        select(FinancialInstitution)
        .where(FinancialInstitution.user_id == current_user.id)
        .order_by(FinancialInstitution.name)
    )
    institutions = result.scalars().all()
    return list(institutions)


@router.post("/", response_model=FinancialInstitutionResponse, status_code=status.HTTP_201_CREATED)
async def create_financial_institution(
    institution_data: FinancialInstitutionCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> FinancialInstitution:
    """
    Create a new financial institution for the current user.

    Args:
        institution_data: Financial institution creation data
        db: Database session
        current_user: Current authenticated user

    Returns:
        Created financial institution

    Raises:
        HTTPException: If institution with same name already exists
    """
    institution = FinancialInstitution(
        user_id=current_user.id,
        name=institution_data.name,
    )

    try:
        db.add(institution)
        await db.commit()
        await db.refresh(institution)
    except IntegrityError as err:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Financial institution with this name already exists",
        ) from err

    logger.info(
        "Financial institution created",
        extra={
            "institution_id": institution.id,
            "user_id": current_user.id,
            "institution_name": institution.name,
        },
    )

    return institution


@router.get("/{institution_id}", response_model=FinancialInstitutionResponse)
async def get_financial_institution(
    institution_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> FinancialInstitution:
    """
    Get a specific financial institution by ID.

    Args:
        institution_id: Financial institution ID
        db: Database session
        current_user: Current authenticated user

    Returns:
        Financial institution data

    Raises:
        HTTPException: If institution not found or user doesn't own it
    """
    result = await db.execute(
        select(FinancialInstitution).where(FinancialInstitution.id == institution_id)
    )
    institution = result.scalar_one_or_none()

    if not institution:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Financial institution not found",
        )

    if institution.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this financial institution",
        )

    return institution


@router.put("/{institution_id}", response_model=FinancialInstitutionResponse)
async def update_financial_institution(
    institution_id: int,
    institution_data: FinancialInstitutionUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> FinancialInstitution:
    """
    Update an existing financial institution.

    Args:
        institution_id: Financial institution ID
        institution_data: Financial institution update data
        db: Database session
        current_user: Current authenticated user

    Returns:
        Updated financial institution

    Raises:
        HTTPException: If institution not found or user doesn't own it
    """
    result = await db.execute(
        select(FinancialInstitution).where(FinancialInstitution.id == institution_id)
    )
    institution = result.scalar_one_or_none()

    if not institution:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Financial institution not found",
        )

    if institution.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this financial institution",
        )

    # Update only provided fields
    update_data = institution_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(institution, field, value)

    try:
        await db.commit()
        await db.refresh(institution)
    except IntegrityError as err:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Financial institution with this name already exists",
        ) from err

    logger.info(
        "Financial institution updated",
        extra={"institution_id": institution.id, "user_id": current_user.id},
    )

    return institution


@router.delete("/{institution_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_financial_institution(
    institution_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> None:
    """
    Delete a financial institution.

    Note: Accounts linked to this institution will have their
    financial_institution_id set to NULL (ON DELETE SET NULL).

    Args:
        institution_id: Financial institution ID
        db: Database session
        current_user: Current authenticated user

    Raises:
        HTTPException: If institution not found or user doesn't own it
    """
    result = await db.execute(
        select(FinancialInstitution).where(FinancialInstitution.id == institution_id)
    )
    institution = result.scalar_one_or_none()

    if not institution:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Financial institution not found",
        )

    if institution.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this financial institution",
        )

    await db.delete(institution)
    await db.commit()

    logger.info(
        "Financial institution deleted",
        extra={"institution_id": institution_id, "user_id": current_user.id},
    )
