"""Reconciliation routes for account balance reconciliation."""

import logging

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_active_user, get_db
from app.models.account import Account
from app.models.user import User
from app.schemas.reconciliation import (
    ReconciliationCreate,
    ReconciliationResponse,
    ReconciliationSummary,
)
from app.services.reconciliation_service import ReconciliationService

router = APIRouter()
logger = logging.getLogger(__name__)


@router.post("/", response_model=ReconciliationResponse, status_code=status.HTTP_201_CREATED)
async def create_reconciliation(
    reconciliation_data: ReconciliationCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> ReconciliationResponse:
    """
    Create a new reconciliation.

    Compares actual balance with expected balance and optionally creates
    an adjustment transaction if there's a difference.
    """
    try:
        reconciliation = await ReconciliationService.create_reconciliation(
            user_id=current_user.id,
            account_id=reconciliation_data.account_id,
            reconciliation_date=reconciliation_data.reconciliation_date,
            actual_balance=reconciliation_data.actual_balance,
            create_adjustment=reconciliation_data.create_adjustment,
            note=reconciliation_data.note,
            db=db,
        )

        logger.info(
            "Reconciliation created",
            extra={
                "user_id": current_user.id,
                "account_id": reconciliation_data.account_id,
                "difference": str(reconciliation.difference),
            },
        )

        return ReconciliationResponse.model_validate(reconciliation)

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        ) from None


@router.get("/", response_model=list[ReconciliationSummary])
async def list_reconciliations(
    account_id: int | None = Query(None, description="Filter by account ID"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> list[ReconciliationSummary]:
    """
    List reconciliations for the current user.

    Optionally filter by account ID.
    """
    reconciliations = await ReconciliationService.get_reconciliations(
        user_id=current_user.id,
        account_id=account_id,
        db=db,
    )

    # Get account names for summary
    account_ids = {r.account_id for r in reconciliations}
    account_result = await db.execute(select(Account).where(Account.id.in_(account_ids)))
    accounts = {acc.id: acc for acc in account_result.scalars().all()}

    # Build summaries
    summaries = []
    for reconciliation in reconciliations:
        account = accounts.get(reconciliation.account_id)
        summaries.append(
            ReconciliationSummary(
                reconciliation=ReconciliationResponse.model_validate(reconciliation),
                account_name=account.name if account else "Unknown",
                has_adjustment=reconciliation.adjustment_transaction_id is not None,
            )
        )

    logger.info(
        "Reconciliations listed",
        extra={
            "user_id": current_user.id,
            "count": len(summaries),
        },
    )

    return summaries


@router.get("/{reconciliation_id}", response_model=ReconciliationResponse)
async def get_reconciliation(
    reconciliation_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> ReconciliationResponse:
    """Get a specific reconciliation by ID."""
    reconciliations = await ReconciliationService.get_reconciliations(
        user_id=current_user.id,
        account_id=None,
        db=db,
    )

    reconciliation = next(
        (r for r in reconciliations if r.id == reconciliation_id),
        None,
    )

    if not reconciliation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Reconciliation not found",
        )

    return ReconciliationResponse.model_validate(reconciliation)


@router.delete("/{reconciliation_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_reconciliation(
    reconciliation_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Delete a reconciliation record.

    Note: This does NOT delete the adjustment transaction if one was created.
    """
    try:
        deleted = await ReconciliationService.delete_reconciliation(
            user_id=current_user.id,
            reconciliation_id=reconciliation_id,
            db=db,
        )

        if not deleted:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Reconciliation not found",
            )

        logger.info(
            "Reconciliation deleted",
            extra={
                "user_id": current_user.id,
                "reconciliation_id": reconciliation_id,
            },
        )

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(e),
        ) from None
