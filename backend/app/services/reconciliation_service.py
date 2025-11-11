"""Service for account reconciliation."""

from datetime import date
from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.account import Account
from app.models.category import Category
from app.models.reconciliation import AccountReconciliation
from app.models.scheduled_transaction import ScheduledTransaction
from app.services.forecast_service import ForecastService


class ReconciliationService:
    """Service for account reconciliation operations."""

    @staticmethod
    async def create_reconciliation(
        user_id: int,
        account_id: int,
        reconciliation_date: date,
        actual_balance: Decimal,
        create_adjustment: bool,
        note: str | None,
        db: AsyncSession,
    ) -> AccountReconciliation:
        """
        Create a reconciliation record.

        Args:
            user_id: User ID
            account_id: Account ID to reconcile
            reconciliation_date: Date to reconcile to
            actual_balance: Actual balance from bank/user
            create_adjustment: Whether to create adjustment transaction
            note: Optional note
            db: Database session

        Returns:
            AccountReconciliation record

        Raises:
            ValueError: If account not found or not owned by user
        """
        # Verify account ownership
        account_result = await db.execute(
            select(Account).where(
                Account.id == account_id,
                Account.user_id == user_id,
                Account.is_active,
            )
        )
        account = account_result.scalar_one_or_none()
        if not account:
            raise ValueError("Account not found or not owned by user")

        # Calculate expected balance using forecast
        expected_balance = await ReconciliationService._calculate_expected_balance(
            user_id=user_id,
            account_id=account_id,
            target_date=reconciliation_date,
            db=db,
        )

        # Calculate difference
        difference = actual_balance - expected_balance

        # Create adjustment transaction if needed and requested
        adjustment_transaction_id = None
        if create_adjustment and difference != 0:
            adjustment_transaction_id = await ReconciliationService._create_adjustment_transaction(
                user_id=user_id,
                account_id=account_id,
                reconciliation_date=reconciliation_date,
                difference=difference,
                db=db,
            )

        # Create reconciliation record
        reconciliation = AccountReconciliation(
            user_id=user_id,
            account_id=account_id,
            reconciliation_date=reconciliation_date,
            expected_balance=expected_balance,
            actual_balance=actual_balance,
            difference=difference,
            adjustment_transaction_id=adjustment_transaction_id,
            note=note,
        )

        db.add(reconciliation)
        await db.commit()
        await db.refresh(reconciliation)

        return reconciliation

    @staticmethod
    async def _calculate_expected_balance(
        user_id: int,
        account_id: int,
        target_date: date,
        db: AsyncSession,
    ) -> Decimal:
        """
        Calculate expected balance at target date using forecast.

        Args:
            user_id: User ID
            account_id: Account ID
            target_date: Date to calculate balance for
            db: Database session

        Returns:
            Expected balance at target date
        """
        # Get account to determine initial balance date
        account_result = await db.execute(select(Account).where(Account.id == account_id))
        account = account_result.scalar_one()

        # Calculate forecast from initial balance date to target date
        # This ensures all transactions up to target_date are included
        from_date = min(account.initial_balance_date, target_date)

        forecasts = await ForecastService.calculate_forecast(
            user_id=user_id,
            from_date=from_date,
            to_date=target_date,
            db=db,
            account_ids=[account_id],
        )

        if not forecasts:
            # No forecast data, return initial balance
            return account.initial_balance

        # Get balance for target date (last data point)
        account_forecast = forecasts[0]
        if account_forecast.data_points:
            # Return the balance of the last data point (target_date)
            return account_forecast.data_points[-1].balance

        return account_forecast.starting_balance

    @staticmethod
    async def _create_adjustment_transaction(
        user_id: int,
        account_id: int,
        reconciliation_date: date,
        difference: Decimal,
        db: AsyncSession,
    ) -> int:
        """
        Create adjustment transaction to correct balance difference.

        Args:
            user_id: User ID
            account_id: Account ID
            reconciliation_date: Date of reconciliation
            difference: Balance difference (positive = add money, negative = remove)
            db: Database session

        Returns:
            ID of created adjustment transaction
        """
        # Find or create "Reconciliation Adjustment" category
        category_result = await db.execute(
            select(Category).where(
                Category.name == "Reconciliation Adjustment",
                Category.is_system.is_(True),
            )
        )
        category = category_result.scalar_one_or_none()

        if not category:
            # Create system category for adjustments
            category = Category(
                name="Reconciliation Adjustment",
                type="income" if difference > 0 else "expense",
                icon="adjust",
                color="#FFA500",  # Orange
                is_system=True,
            )
            db.add(category)
            await db.flush()

        # Create one-time scheduled transaction for adjustment
        adjustment_name = f"Reconciliation Adjustment ({'+' if difference > 0 else ''}{difference})"

        adjustment = ScheduledTransaction(
            user_id=user_id,
            account_id=account_id,
            category_id=category.id,
            name=adjustment_name,
            amount=abs(difference),  # Amount is always positive
            currency="USD",  # TODO: Get from account
            is_recurring=False,
            recurrence_start_date=reconciliation_date,
            note="Automatic adjustment from reconciliation",
        )

        db.add(adjustment)
        await db.flush()

        return adjustment.id

    @staticmethod
    async def get_reconciliations(
        user_id: int,
        account_id: int | None,
        db: AsyncSession,
    ) -> list[AccountReconciliation]:
        """
        Get reconciliations for user, optionally filtered by account.

        Args:
            user_id: User ID
            account_id: Optional account ID to filter by
            db: Database session

        Returns:
            List of reconciliations
        """
        query = select(AccountReconciliation).where(AccountReconciliation.user_id == user_id)

        if account_id:
            query = query.where(AccountReconciliation.account_id == account_id)

        query = query.order_by(AccountReconciliation.reconciliation_date.desc())

        result = await db.execute(query)
        return list(result.scalars().all())

    @staticmethod
    async def delete_reconciliation(
        user_id: int,
        reconciliation_id: int,
        db: AsyncSession,
    ) -> bool:
        """
        Delete a reconciliation record.

        Note: This does NOT delete the adjustment transaction if one was created.
        The adjustment transaction should be managed separately via scheduled transactions API.

        Args:
            user_id: User ID
            reconciliation_id: Reconciliation ID
            db: Database session

        Returns:
            True if deleted, False if not found

        Raises:
            ValueError: If reconciliation not owned by user
        """
        result = await db.execute(
            select(AccountReconciliation).where(AccountReconciliation.id == reconciliation_id)
        )
        reconciliation = result.scalar_one_or_none()

        if not reconciliation:
            return False

        if reconciliation.user_id != user_id:
            raise ValueError("Reconciliation not owned by user")

        await db.delete(reconciliation)
        await db.commit()

        return True
