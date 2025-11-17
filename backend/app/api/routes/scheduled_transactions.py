"""Scheduled transaction routes for CRUD operations."""

import logging
from datetime import date, timedelta
from enum import Enum

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_active_user, get_db
from app.models.scheduled_transaction import ScheduledTransaction, ScheduledTransactionException
from app.models.user import User
from app.schemas.scheduled_transaction import (
    ScheduledTransactionCreate,
    ScheduledTransactionInstance,
    ScheduledTransactionResponse,
    ScheduledTransactionUpdate,
)
from app.services.recurrence_service import RecurrenceService

router = APIRouter()
logger = logging.getLogger(__name__)


class UpdateMode(str, Enum):
    """Update mode for recurring transactions."""

    THIS_ONLY = "THIS_ONLY"  # Edit single instance (create exception)
    ALL = "ALL"  # Edit entire series
    THIS_AND_FUTURE = "THIS_AND_FUTURE"  # Split series


class DeleteMode(str, Enum):
    """Delete mode for recurring transactions."""

    THIS_ONLY = "THIS_ONLY"  # Delete single instance (create exception with is_deleted=True)
    ALL = "ALL"  # Delete entire series
    THIS_AND_FUTURE = "THIS_AND_FUTURE"  # End series before instance_date


@router.get("/", response_model=list[ScheduledTransactionResponse])
async def list_scheduled_transactions(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> list[ScheduledTransaction]:
    """
    List all scheduled transactions (transaction rules) for the current user.

    Returns the recurring rules, not the expanded instances.
    Use GET /instances for calendar view.
    """
    result = await db.execute(
        select(ScheduledTransaction)
        .where(ScheduledTransaction.user_id == current_user.id)
        .order_by(ScheduledTransaction.recurrence_start_date.desc())
    )
    transactions = result.scalars().all()
    return list(transactions)


@router.post("/", response_model=ScheduledTransactionResponse, status_code=status.HTTP_201_CREATED)
async def create_scheduled_transaction(
    transaction_data: ScheduledTransactionCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> ScheduledTransaction:
    """Create a new scheduled transaction (one-time or recurring)."""
    # Validate account ownership
    from app.models.account import Account

    account_result = await db.execute(
        select(Account).where(Account.id == transaction_data.account_id)
    )
    account = account_result.scalar_one_or_none()

    if not account or account.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Account not found",
        )

    # Validate to_account if transfer
    if transaction_data.to_account_id:
        to_account_result = await db.execute(
            select(Account).where(Account.id == transaction_data.to_account_id)
        )
        to_account = to_account_result.scalar_one_or_none()

        if not to_account or to_account.user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Destination account not found",
            )

        if transaction_data.to_account_id == transaction_data.account_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Source and destination accounts must be different",
            )

    # Validate category ownership
    from app.models.category import Category

    category_result = await db.execute(
        select(Category).where(Category.id == transaction_data.category_id)
    )
    category = category_result.scalar_one_or_none()

    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Category not found",
        )

    # Category must be system category or user's own category
    if not category.is_system and category.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Category not accessible",
        )

    # Create transaction
    transaction = ScheduledTransaction(
        user_id=current_user.id,
        **transaction_data.model_dump(),
    )

    db.add(transaction)
    await db.commit()
    await db.refresh(transaction)

    logger.info(
        "Scheduled transaction created",
        extra={
            "transaction_id": transaction.id,
            "user_id": current_user.id,
            "is_recurring": transaction.is_recurring,
        },
    )

    return transaction


@router.get("/instances", response_model=list[ScheduledTransactionInstance])
async def get_transaction_instances(
    from_date: date = Query(..., description="Start date of range"),
    to_date: date = Query(..., description="End date of range"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> list[ScheduledTransactionInstance]:
    """
    Get expanded transaction instances for calendar view.

    Expands all recurring transactions and one-time transactions
    within the specified date range, applying any exceptions.
    """
    if to_date < from_date:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="to_date must be on or after from_date",
        )

    # Limit range to prevent performance issues
    max_days = 730  # 2 years
    if (to_date - from_date).days > max_days:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Date range too large (max {max_days} days)",
        )

    instances = await RecurrenceService.expand_recurring_transactions(
        user_id=current_user.id,
        from_date=from_date,
        to_date=to_date,
        db=db,
    )

    return instances


@router.get("/{transaction_id}", response_model=ScheduledTransactionResponse)
async def get_scheduled_transaction(
    transaction_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> ScheduledTransaction:
    """Get a single scheduled transaction by ID."""
    result = await db.execute(
        select(ScheduledTransaction).where(ScheduledTransaction.id == transaction_id)
    )
    transaction = result.scalar_one_or_none()

    if not transaction:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Scheduled transaction not found",
        )

    if transaction.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this transaction",
        )

    return transaction


@router.put("/{transaction_id}", response_model=ScheduledTransactionResponse)
async def update_scheduled_transaction(
    transaction_id: int,
    transaction_data: ScheduledTransactionUpdate,
    update_mode: UpdateMode = Query(UpdateMode.ALL, description="How to apply the update"),
    instance_date: date | None = Query(
        None, description="Required for THIS_ONLY and THIS_AND_FUTURE modes"
    ),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> ScheduledTransaction:
    """
    Update a scheduled transaction.

    Update modes:
    - ALL: Update the entire series (default for one-time transactions)
    - THIS_ONLY: Edit only this instance (creates exception)
    - THIS_AND_FUTURE: Split the series at instance_date
    """
    result = await db.execute(
        select(ScheduledTransaction).where(ScheduledTransaction.id == transaction_id)
    )
    transaction = result.scalar_one_or_none()

    if not transaction:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Scheduled transaction not found",
        )

    if transaction.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this transaction",
        )

    # Validate mode requirements
    if update_mode in (UpdateMode.THIS_ONLY, UpdateMode.THIS_AND_FUTURE):
        if not instance_date:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"instance_date is required for {update_mode} mode",
            )
        if not transaction.is_recurring:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"{update_mode} mode only applies to recurring transactions",
            )

    # Execute update based on mode
    if update_mode == UpdateMode.ALL:
        # Update the series directly
        update_data = transaction_data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(transaction, field, value)

        await db.commit()
        await db.refresh(transaction)

        logger.info(
            "Scheduled transaction updated (ALL)",
            extra={"transaction_id": transaction.id, "user_id": current_user.id},
        )

    elif update_mode == UpdateMode.THIS_ONLY:
        # Create exception for this instance
        exception_data = {}

        if transaction_data.amount is not None:
            exception_data["amount"] = transaction_data.amount
        if transaction_data.note is not None:
            exception_data["note"] = transaction_data.note
        if transaction_data.account_id is not None:
            exception_data["account_id"] = transaction_data.account_id
        if transaction_data.to_account_id is not None:
            exception_data["to_account_id"] = transaction_data.to_account_id

        if not exception_data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No modifiable fields provided for THIS_ONLY mode",
            )

        # Check if exception already exists
        exc_result = await db.execute(
            select(ScheduledTransactionException).where(
                ScheduledTransactionException.scheduled_transaction_id == transaction_id,
                ScheduledTransactionException.exception_date == instance_date,
            )
        )
        existing_exception = exc_result.scalar_one_or_none()

        if existing_exception:
            # Update existing exception
            for field, value in exception_data.items():
                setattr(existing_exception, field, value)
        else:
            # Create new exception
            exception = ScheduledTransactionException(
                scheduled_transaction_id=transaction_id,
                exception_date=instance_date,
                **exception_data,
            )
            db.add(exception)

        await db.commit()
        await db.refresh(transaction)

        logger.info(
            "Scheduled transaction exception created (THIS_ONLY)",
            extra={
                "transaction_id": transaction.id,
                "instance_date": str(instance_date),
                "user_id": current_user.id,
            },
        )

    elif update_mode == UpdateMode.THIS_AND_FUTURE:
        # Split the series
        # 1. Set end_date on current transaction to day before instance_date
        transaction.recurrence_end_date = instance_date - timedelta(days=1)

        # 2. Create new transaction starting from instance_date
        new_transaction_data = ScheduledTransactionCreate(
            name=transaction_data.name if transaction_data.name else transaction.name,
            amount=transaction_data.amount if transaction_data.amount else transaction.amount,
            currency=(
                transaction_data.currency if transaction_data.currency else transaction.currency
            ),
            account_id=(
                transaction_data.account_id
                if transaction_data.account_id
                else transaction.account_id
            ),
            to_account_id=(
                transaction_data.to_account_id
                if transaction_data.to_account_id is not None
                else transaction.to_account_id
            ),
            category_id=(
                transaction_data.category_id
                if transaction_data.category_id
                else transaction.category_id
            ),
            note=transaction_data.note if transaction_data.note is not None else transaction.note,
            is_recurring=True,
            recurrence_frequency=transaction.recurrence_frequency,
            recurrence_day_of_month=transaction.recurrence_day_of_month,
            recurrence_month_of_year=transaction.recurrence_month_of_year,
            recurrence_start_date=instance_date,
            recurrence_end_date=transaction.recurrence_end_date,  # Keep original end date
        )

        new_transaction = ScheduledTransaction(
            user_id=current_user.id,
            **new_transaction_data.model_dump(),
        )

        db.add(new_transaction)
        await db.commit()
        await db.refresh(transaction)

        logger.info(
            "Scheduled transaction split (THIS_AND_FUTURE)",
            extra={
                "original_id": transaction.id,
                "new_id": new_transaction.id,
                "split_date": str(instance_date),
                "user_id": current_user.id,
            },
        )

    return transaction


@router.delete("/{transaction_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_scheduled_transaction(
    transaction_id: int,
    delete_mode: DeleteMode = Query(DeleteMode.ALL, description="How to apply the deletion"),
    instance_date: date | None = Query(
        None, description="Required for THIS_ONLY and THIS_AND_FUTURE modes"
    ),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> None:
    """
    Delete a scheduled transaction.

    Delete modes:
    - ALL: Delete the entire series
    - THIS_ONLY: Skip only this instance (creates exception with is_deleted=True)
    - THIS_AND_FUTURE: End series before instance_date
    """
    result = await db.execute(
        select(ScheduledTransaction).where(ScheduledTransaction.id == transaction_id)
    )
    transaction = result.scalar_one_or_none()

    if not transaction:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Scheduled transaction not found",
        )

    if transaction.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this transaction",
        )

    # Validate mode requirements
    if delete_mode in (DeleteMode.THIS_ONLY, DeleteMode.THIS_AND_FUTURE):
        if not instance_date:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"instance_date is required for {delete_mode} mode",
            )
        if not transaction.is_recurring:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"{delete_mode} mode only applies to recurring transactions",
            )

    # Execute delete based on mode
    if delete_mode == DeleteMode.ALL:
        # Delete the entire transaction (cascade will delete exceptions)
        await db.delete(transaction)
        await db.commit()

        logger.info(
            "Scheduled transaction deleted (ALL)",
            extra={"transaction_id": transaction_id, "user_id": current_user.id},
        )

    elif delete_mode == DeleteMode.THIS_ONLY:
        # Create exception with is_deleted=True
        exc_result = await db.execute(
            select(ScheduledTransactionException).where(
                ScheduledTransactionException.scheduled_transaction_id == transaction_id,
                ScheduledTransactionException.exception_date == instance_date,
            )
        )
        existing_exception = exc_result.scalar_one_or_none()

        if existing_exception:
            existing_exception.is_deleted = True
        else:
            exception = ScheduledTransactionException(
                scheduled_transaction_id=transaction_id,
                exception_date=instance_date,
                is_deleted=True,
            )
            db.add(exception)

        await db.commit()

        logger.info(
            "Scheduled transaction instance deleted (THIS_ONLY)",
            extra={
                "transaction_id": transaction_id,
                "instance_date": str(instance_date),
                "user_id": current_user.id,
            },
        )

    elif delete_mode == DeleteMode.THIS_AND_FUTURE:
        # Set end_date to day before instance_date
        transaction.recurrence_end_date = instance_date - timedelta(days=1)
        await db.commit()

        logger.info(
            "Scheduled transaction ended (THIS_AND_FUTURE)",
            extra={
                "transaction_id": transaction_id,
                "end_date": str(transaction.recurrence_end_date),
                "user_id": current_user.id,
            },
        )


@router.get("/instances/pending-confirmation", response_model=list[ScheduledTransactionInstance])
async def get_pending_confirmations(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> list[ScheduledTransactionInstance]:
    """
    Get all transaction instances that need account confirmation.

    Returns instances where:
    - Date <= today (past or today)
    - Account is PLANNING type
    - Status is 'completed' (not yet confirmed)
    """
    from app.models.account import Account, AccountType

    # Get PLANNING account ID for this user
    planning_account_result = await db.execute(
        select(Account.id).where(
            Account.user_id == current_user.id,
            Account.type == AccountType.PLANNING,
            Account.is_active == True,  # noqa: E712
        )
    )
    planning_account = planning_account_result.scalar_one_or_none()

    if not planning_account:
        # No PLANNING account, return empty list
        return []

    # Expand instances from past to today
    today = date.today()
    from_date = today - timedelta(days=365)  # Look back 1 year

    instances = await RecurrenceService.expand_recurring_transactions(
        user_id=current_user.id,
        from_date=from_date,
        to_date=today,
        db=db,
    )

    # Filter for instances that need confirmation
    pending = [
        inst
        for inst in instances
        if inst.date <= today
        and inst.account_id == planning_account
        and not inst.is_deleted
        and inst.status == "completed"
    ]

    logger.info(
        "Retrieved pending confirmations",
        extra={"user_id": current_user.id, "count": len(pending)},
    )

    return pending


@router.patch("/instances/bulk-confirm")
async def bulk_confirm_instances(
    scheduled_transaction_id: int,
    account_id: int,
    apply_to: str = Query(..., regex="^(past|all|specific_dates)$"),
    specific_dates: list[str] | None = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> dict:
    """
    Bulk confirm account for multiple instances.

    Args:
        scheduled_transaction_id: The transaction to update
        account_id: The confirmed account ID
        apply_to: 'past' (all past instances), 'all' (entire series), 'specific_dates'
        specific_dates: List of dates in YYYY-MM-DD format (required if apply_to='specific_dates')
    """
    from datetime import datetime

    from app.models.account import Account

    # Verify transaction ownership
    result = await db.execute(
        select(ScheduledTransaction).where(
            ScheduledTransaction.id == scheduled_transaction_id,
            ScheduledTransaction.user_id == current_user.id,
        )
    )
    transaction = result.scalar_one_or_none()

    if not transaction:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Scheduled transaction not found",
        )

    # Verify account ownership
    account_result = await db.execute(
        select(Account).where(
            Account.id == account_id,
            Account.user_id == current_user.id,
        )
    )
    account = account_result.scalar_one_or_none()

    if not account:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Account not found",
        )

    if apply_to == "all":
        # Update the entire series
        transaction.account_id = account_id
        await db.commit()

        logger.info(
            "Bulk confirmed all instances",
            extra={
                "transaction_id": scheduled_transaction_id,
                "account_id": account_id,
                "user_id": current_user.id,
            },
        )

        return {"message": "All instances updated", "mode": "all"}

    elif apply_to == "past":
        # Create exceptions for all past instances
        today = date.today()
        from_date = today - timedelta(days=365)

        instances = await RecurrenceService.expand_recurring_transactions(
            user_id=current_user.id,
            from_date=from_date,
            to_date=today,
            db=db,
        )

        # Filter for this transaction and past dates
        past_instances = [
            inst
            for inst in instances
            if inst.scheduled_transaction_id == scheduled_transaction_id and inst.date <= today
        ]

        # Create exceptions for each
        confirmed_count = 0
        for inst in past_instances:
            # Check if exception exists
            exc_result = await db.execute(
                select(ScheduledTransactionException).where(
                    ScheduledTransactionException.scheduled_transaction_id
                    == scheduled_transaction_id,
                    ScheduledTransactionException.exception_date == inst.date,
                )
            )
            existing = exc_result.scalar_one_or_none()

            if existing:
                existing.account_id = account_id
                existing.status = "confirmed"
                existing.confirmed_at = datetime.utcnow()
            else:
                exception = ScheduledTransactionException(
                    scheduled_transaction_id=scheduled_transaction_id,
                    exception_date=inst.date,
                    account_id=account_id,
                    status="confirmed",
                    confirmed_at=datetime.utcnow(),
                )
                db.add(exception)

            confirmed_count += 1

        await db.commit()

        logger.info(
            "Bulk confirmed past instances",
            extra={
                "transaction_id": scheduled_transaction_id,
                "account_id": account_id,
                "count": confirmed_count,
                "user_id": current_user.id,
            },
        )

        return {"message": f"Updated {confirmed_count} past instances", "mode": "past"}

    elif apply_to == "specific_dates":
        if not specific_dates:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="specific_dates is required when apply_to='specific_dates'",
            )

        # Parse dates
        dates_to_update = []
        for date_str in specific_dates:
            try:
                parsed_date = datetime.strptime(date_str, "%Y-%m-%d").date()
                dates_to_update.append(parsed_date)
            except ValueError as e:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Invalid date format: {date_str}. Use YYYY-MM-DD",
                ) from e

        # Create exceptions for specific dates
        confirmed_count = 0
        for target_date in dates_to_update:
            exc_result = await db.execute(
                select(ScheduledTransactionException).where(
                    ScheduledTransactionException.scheduled_transaction_id
                    == scheduled_transaction_id,
                    ScheduledTransactionException.exception_date == target_date,
                )
            )
            existing = exc_result.scalar_one_or_none()

            if existing:
                existing.account_id = account_id
                existing.status = "confirmed"
                existing.confirmed_at = datetime.utcnow()
            else:
                exception = ScheduledTransactionException(
                    scheduled_transaction_id=scheduled_transaction_id,
                    exception_date=target_date,
                    account_id=account_id,
                    status="confirmed",
                    confirmed_at=datetime.utcnow(),
                )
                db.add(exception)

            confirmed_count += 1

        await db.commit()

        logger.info(
            "Bulk confirmed specific instances",
            extra={
                "transaction_id": scheduled_transaction_id,
                "account_id": account_id,
                "count": confirmed_count,
                "user_id": current_user.id,
            },
        )

        return {
            "message": f"Updated {confirmed_count} instances",
            "mode": "specific_dates",
        }
