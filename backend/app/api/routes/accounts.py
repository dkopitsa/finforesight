"""Account routes for CRUD operations."""

import logging
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_active_user, get_db
from app.models.account import Account, AccountType
from app.models.user import User
from app.schemas.account import (
    AccountCreate,
    AccountResponse,
    AccountSummary,
    AccountUpdate,
)

router = APIRouter()
logger = logging.getLogger(__name__)


@router.get("/", response_model=list[AccountResponse])
async def list_accounts(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> list[Account]:
    """
    List all active accounts for the current user.

    Args:
        db: Database session
        current_user: Current authenticated user

    Returns:
        List of user's active accounts
    """
    result = await db.execute(
        select(Account)
        .where(
            Account.user_id == current_user.id,
            Account.is_active == True,  # noqa: E712
        )
        .order_by(Account.created_at.desc())
    )
    accounts = result.scalars().all()
    return list(accounts)


@router.post("/", response_model=AccountResponse, status_code=status.HTTP_201_CREATED)
async def create_account(
    account_data: AccountCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> Account:
    """
    Create a new account for the current user.

    Args:
        account_data: Account creation data
        db: Database session
        current_user: Current authenticated user

    Returns:
        Created account
    """
    account = Account(
        user_id=current_user.id,
        name=account_data.name,
        type=account_data.type,
        currency=account_data.currency,
        initial_balance=account_data.initial_balance,
        initial_balance_date=account_data.initial_balance_date,
        credit_limit=account_data.credit_limit,
        financial_institution_id=account_data.financial_institution_id,
    )

    db.add(account)
    await db.commit()
    await db.refresh(account)

    logger.info(
        "Account created",
        extra={
            "account_id": account.id,
            "user_id": current_user.id,
            "account_type": account.type.value,
        },
    )

    return account


@router.get("/{account_id}", response_model=AccountResponse)
async def get_account(
    account_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> Account:
    """
    Get a specific account by ID.

    Args:
        account_id: Account ID
        db: Database session
        current_user: Current authenticated user

    Returns:
        Account data

    Raises:
        HTTPException: If account not found or user doesn't own it
    """
    result = await db.execute(select(Account).where(Account.id == account_id))
    account = result.scalar_one_or_none()

    if not account:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Account not found",
        )

    if account.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this account",
        )

    return account


@router.put("/{account_id}", response_model=AccountResponse)
async def update_account(
    account_id: int,
    account_data: AccountUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> Account:
    """
    Update an existing account.

    Args:
        account_id: Account ID
        account_data: Account update data
        db: Database session
        current_user: Current authenticated user

    Returns:
        Updated account

    Raises:
        HTTPException: If account not found or user doesn't own it
    """
    result = await db.execute(select(Account).where(Account.id == account_id))
    account = result.scalar_one_or_none()

    if not account:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Account not found",
        )

    if account.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this account",
        )

    # Update only provided fields
    update_data = account_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(account, field, value)

    await db.commit()
    await db.refresh(account)

    logger.info(
        "Account updated",
        extra={"account_id": account.id, "user_id": current_user.id},
    )

    return account


@router.delete("/{account_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_account(
    account_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> None:
    """
    Soft delete an account (set is_active=False).

    Args:
        account_id: Account ID
        db: Database session
        current_user: Current authenticated user

    Raises:
        HTTPException: If account not found or user doesn't own it
    """
    result = await db.execute(select(Account).where(Account.id == account_id))
    account = result.scalar_one_or_none()

    if not account:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Account not found",
        )

    if account.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this account",
        )

    account.is_active = False
    await db.commit()

    logger.info(
        "Account deleted",
        extra={"account_id": account.id, "user_id": current_user.id},
    )


@router.get("/summary/totals", response_model=AccountSummary)
async def get_account_summary(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> AccountSummary:
    """
    Get account summary with totals by category.

    Args:
        db: Database session
        current_user: Current authenticated user

    Returns:
        Account summary with totals
    """
    result = await db.execute(
        select(Account).where(
            Account.user_id == current_user.id,
            Account.is_active == True,  # noqa: E712
        )
    )
    accounts = result.scalars().all()

    # Calculate totals by category
    liquid_assets = Decimal("0")
    investments = Decimal("0")
    credit_used = Decimal("0")
    loans_receivable = Decimal("0")

    for account in accounts:
        balance = account.initial_balance

        if account.type in (AccountType.CHECKING, AccountType.SAVINGS, AccountType.CASH):
            liquid_assets += balance
        elif account.type in (AccountType.INVESTMENT, AccountType.RETIREMENT):
            investments += balance
        elif account.type in (AccountType.CREDIT_CARD, AccountType.LOAN):
            # Credit accounts have negative balances
            credit_used += abs(balance)
        elif account.type == AccountType.LOAN_GIVEN:
            loans_receivable += balance

    net_worth = liquid_assets + investments + loans_receivable - credit_used

    return AccountSummary(
        liquid_assets=liquid_assets,
        investments=investments,
        credit_used=credit_used,
        loans_receivable=loans_receivable,
        net_worth=net_worth,
    )
