"""Service for handling recurring transaction expansion and calculation."""

import calendar
from datetime import date, timedelta

from sqlalchemy import and_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.scheduled_transaction import (
    RecurrenceFrequency,
    ScheduledTransaction,
    ScheduledTransactionException,
)
from app.schemas.scheduled_transaction import ScheduledTransactionInstance


class RecurrenceService:
    """Service for expanding recurring transactions into instances."""

    @staticmethod
    def calculate_next_occurrence(
        transaction: ScheduledTransaction,
        after_date: date | None = None,
    ) -> date | None:
        """
        Calculate the next occurrence date for a recurring transaction.

        Args:
            transaction: The scheduled transaction
            after_date: Find occurrence after this date (default: today)

        Returns:
            Next occurrence date, or None if there are no more occurrences
        """
        if not transaction.is_recurring:
            # One-time transaction
            start = transaction.recurrence_start_date
            if after_date is None or start > after_date:
                return start
            return None

        # Start from after_date (caller provides proper offset)
        current_date = after_date if after_date else date.today()
        # Don't reset to start_date - let the monthly/yearly functions handle it
        # This preserves the caller's intentional offset (e.g., start_date - 1 day)

        # Check if we've passed the end date
        if transaction.recurrence_end_date and current_date > transaction.recurrence_end_date:
            return None

        # Calculate next occurrence based on frequency
        if transaction.recurrence_frequency == RecurrenceFrequency.MONTHLY:
            return RecurrenceService._next_monthly_occurrence(
                current_date,
                transaction.recurrence_day_of_month,
                transaction.recurrence_end_date,
            )
        elif transaction.recurrence_frequency == RecurrenceFrequency.YEARLY:
            return RecurrenceService._next_yearly_occurrence(
                current_date,
                transaction.recurrence_day_of_month,
                transaction.recurrence_month_of_year,
                transaction.recurrence_end_date,
            )

        return None

    @staticmethod
    def _next_monthly_occurrence(
        after_date: date,
        day_of_month: int,
        end_date: date | None,
    ) -> date | None:
        """
        Calculate next monthly occurrence.

        Args:
            after_date: Find occurrence after this date
            day_of_month: Target day (1-31) or -1 for last day
            end_date: Optional end date

        Returns:
            Next occurrence date or None
        """
        year = after_date.year
        month = after_date.month

        # Try current month first
        occurrence = RecurrenceService._get_monthly_date(year, month, day_of_month)

        if occurrence <= after_date:
            # Move to next month
            month += 1
            if month > 12:
                month = 1
                year += 1
            occurrence = RecurrenceService._get_monthly_date(year, month, day_of_month)

        # Check end date
        if end_date and occurrence > end_date:
            return None

        return occurrence

    @staticmethod
    def _next_yearly_occurrence(
        after_date: date,
        day_of_month: int,
        month_of_year: int,
        end_date: date | None,
    ) -> date | None:
        """
        Calculate next yearly occurrence.

        Args:
            after_date: Find occurrence after this date
            day_of_month: Target day (1-31) or -1 for last day
            month_of_year: Target month (1-12)
            end_date: Optional end date

        Returns:
            Next occurrence date or None
        """
        year = after_date.year

        # Try current year first
        occurrence = RecurrenceService._get_monthly_date(year, month_of_year, day_of_month)

        if occurrence <= after_date:
            # Move to next year
            year += 1
            occurrence = RecurrenceService._get_monthly_date(year, month_of_year, day_of_month)

        # Check end date
        if end_date and occurrence > end_date:
            return None

        return occurrence

    @staticmethod
    def _get_monthly_date(year: int, month: int, day_of_month: int) -> date:
        """
        Get a date in a specific month, handling edge cases.

        Args:
            year: Year
            month: Month (1-12)
            day_of_month: Day (1-31) or -1 for last day

        Returns:
            Adjusted date (handles month overflow)
        """
        if day_of_month == -1:
            # Last day of month
            last_day = calendar.monthrange(year, month)[1]
            return date(year, month, last_day)

        # Get number of days in this month
        max_day = calendar.monthrange(year, month)[1]

        # If requested day doesn't exist (e.g., Jan 31 → Feb), use last day of month
        actual_day = min(day_of_month, max_day)

        return date(year, month, actual_day)

    @staticmethod
    async def expand_recurring_transactions(
        user_id: int,
        from_date: date,
        to_date: date,
        db: AsyncSession,
    ) -> list[ScheduledTransactionInstance]:
        """
        Expand all recurring transactions for a user into instances within a date range.

        This is the main function for generating the calendar view.

        Args:
            user_id: User ID
            from_date: Start date of range
            to_date: End date of range
            db: Database session

        Returns:
            List of transaction instances (sorted by date)
        """
        # Fetch all scheduled transactions for this user
        result = await db.execute(
            select(ScheduledTransaction).where(ScheduledTransaction.user_id == user_id)
        )
        transactions = result.scalars().all()

        # Fetch all exceptions in the date range for these transactions
        transaction_ids = [t.id for t in transactions]
        exceptions_dict = {}

        if transaction_ids:
            exceptions_result = await db.execute(
                select(ScheduledTransactionException).where(
                    and_(
                        ScheduledTransactionException.scheduled_transaction_id.in_(transaction_ids),
                        ScheduledTransactionException.exception_date >= from_date,
                        ScheduledTransactionException.exception_date <= to_date,
                    )
                )
            )
            exceptions = exceptions_result.scalars().all()

            # Group exceptions by (transaction_id, date)
            for exc in exceptions:
                key = (exc.scheduled_transaction_id, exc.exception_date)
                exceptions_dict[key] = exc

        # Generate instances
        instances = []

        for transaction in transactions:
            transaction_instances = RecurrenceService._expand_single_transaction(
                transaction,
                from_date,
                to_date,
                exceptions_dict,
            )
            instances.extend(transaction_instances)

        # Sort by date
        instances.sort(key=lambda x: x.date)

        return instances

    @staticmethod
    def _expand_single_transaction(
        transaction: ScheduledTransaction,
        from_date: date,
        to_date: date,
        exceptions_dict: dict[tuple[int, date], ScheduledTransactionException],
    ) -> list[ScheduledTransactionInstance]:
        """
        Expand a single transaction into instances.

        Args:
            transaction: The scheduled transaction
            from_date: Start date
            to_date: End date
            exceptions_dict: Pre-fetched exceptions keyed by (transaction_id, date)

        Returns:
            List of instances for this transaction
        """
        instances = []

        # Generate all occurrence dates
        occurrence_dates = RecurrenceService._generate_occurrences(
            transaction,
            from_date,
            to_date,
        )

        for occurrence_date in occurrence_dates:
            # Check for exception
            exception_key = (transaction.id, occurrence_date)
            exception = exceptions_dict.get(exception_key)

            if exception and exception.is_deleted:
                # Skip this occurrence
                continue

            # Determine account_id (exception overrides transaction)
            account_id = (
                exception.account_id
                if (exception and exception.account_id is not None)
                else transaction.account_id
            )

            # Determine to_account_id (exception overrides transaction)
            to_account_id = (
                exception.to_account_id
                if (exception and exception.to_account_id is not None)
                else transaction.to_account_id
            )

            # Calculate status
            status = RecurrenceService._calculate_instance_status(
                occurrence_date, account_id, exception
            )

            # Create instance
            instance = ScheduledTransactionInstance(
                date=occurrence_date,
                scheduled_transaction_id=transaction.id,
                is_exception=exception is not None,
                exception_id=exception.id if exception else None,
                name=transaction.name,
                amount=exception.amount if (exception and exception.amount) else transaction.amount,
                currency=transaction.currency,
                account_id=account_id,
                to_account_id=to_account_id,
                category_id=transaction.category_id,
                note=(
                    exception.note
                    if (exception and exception.note is not None)
                    else transaction.note
                ),
                is_deleted=False,  # Already filtered out deleted ones
                is_recurring=transaction.is_recurring,
                status=status,
            )
            instances.append(instance)

        return instances

    @staticmethod
    def _generate_occurrences(
        transaction: ScheduledTransaction,
        from_date: date,
        to_date: date,
    ) -> list[date]:
        """
        Generate all occurrence dates for a transaction within a range.

        Args:
            transaction: The scheduled transaction
            from_date: Start date
            to_date: End date

        Returns:
            List of occurrence dates (unsorted)
        """
        dates = []

        if not transaction.is_recurring:
            # One-time transaction
            start = transaction.recurrence_start_date
            if from_date <= start <= to_date:
                dates.append(start)
            return dates

        # Recurring transaction - generate all occurrences
        # Start from the later of from_date or transaction start
        current_date = max(
            from_date - timedelta(days=1), transaction.recurrence_start_date - timedelta(days=1)
        )

        # Safety limit to prevent infinite loops
        max_iterations = 10000
        iterations = 0

        while iterations < max_iterations:
            next_date = RecurrenceService.calculate_next_occurrence(transaction, current_date)

            if next_date is None:
                # No more occurrences
                break

            if next_date > to_date:
                # Past our range
                break

            if next_date >= from_date:
                # Within range
                dates.append(next_date)

            current_date = next_date
            iterations += 1

        return dates

    @staticmethod
    def _calculate_instance_status(
        occurrence_date: date,
        account_id: int,
        exception: ScheduledTransactionException | None,
    ) -> str:
        """
        Calculate the status of a transaction instance.

        Args:
            occurrence_date: The date of the instance
            account_id: The account_id (after applying exception override)
            exception: The exception object if exists

        Returns:
            Status string: 'pending', 'completed', or 'confirmed'
        """

        # If exception has explicit status, use it
        if exception and exception.status:
            return exception.status

        # Future instances are always pending
        if occurrence_date > date.today():
            return "pending"

        # Past instances: check if account is PLANNING
        # We need to check the AccountType, but we only have account_id here
        # For now, we'll use a simple heuristic and let the API layer handle proper status
        # In a real implementation, you'd query the account or pass account info

        # If it's a past date, default to 'completed' (needs confirmation)
        # The API layer can update this based on actual account type
        return "completed"
