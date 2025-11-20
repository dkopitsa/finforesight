"""Allow negative amounts for expenses and convert existing data

Revision ID: 3f4c9d9a9442
Revises: 3e79c4a05b1d
Create Date: 2025-11-20 09:07:55.406174

"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "3f4c9d9a9442"
down_revision: str | Sequence[str] | None = "3e79c4a05b1d"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """
    Upgrade schema to allow negative amounts and convert existing data.

    Changes:
    1. Remove check_amount_positive constraint from scheduled_transactions
    2. Remove check_exception_amount_positive constraint from scheduled_transaction_exceptions
    3. Convert existing expense transactions to negative amounts
    4. Add linked_transaction_id column for transfer pairs
    """
    # Step 1: Add linked_transaction_id column for transfers
    op.add_column(
        "scheduled_transactions", sa.Column("linked_transaction_id", sa.Integer(), nullable=True)
    )
    op.create_foreign_key(
        "fk_scheduled_transactions_linked",
        "scheduled_transactions",
        "scheduled_transactions",
        ["linked_transaction_id"],
        ["id"],
        ondelete="CASCADE",
    )
    op.create_index(
        "ix_scheduled_transactions_linked_transaction_id",
        "scheduled_transactions",
        ["linked_transaction_id"],
    )

    # Step 2: Drop old amount constraints
    op.drop_constraint("check_amount_positive", "scheduled_transactions", type_="check")
    op.drop_constraint(
        "check_exception_amount_positive", "scheduled_transaction_exceptions", type_="check"
    )

    # Step 3: Convert existing expense transactions to negative amounts
    # We need to use raw SQL to join with categories and check the type
    op.execute(
        """
        UPDATE scheduled_transactions st
        SET amount = -st.amount
        FROM categories c
        WHERE st.category_id = c.id
        AND c.type = 'EXPENSE'
        AND st.amount > 0
    """
    )

    # Step 4: Convert existing transfer transactions into two separate records
    # First, get all transfer transactions (those with to_account_id)
    connection = op.get_bind()

    # Find all transfers and create corresponding income records
    result = connection.execute(
        sa.text(
            """
        SELECT
            st.id,
            st.user_id,
            st.account_id,
            st.to_account_id,
            st.category_id,
            st.name,
            st.amount,
            st.currency,
            st.note,
            st.is_recurring,
            st.recurrence_frequency,
            st.recurrence_day_of_month,
            st.recurrence_month_of_year,
            st.recurrence_start_date,
            st.recurrence_end_date,
            st.created_at,
            st.updated_at,
            c.type as category_type
        FROM scheduled_transactions st
        JOIN categories c ON st.category_id = c.id
        WHERE st.to_account_id IS NOT NULL
    """
        )
    )

    transfers = result.fetchall()

    # For each transfer, create a linked income record for the destination account
    for transfer in transfers:
        # Convert the source transaction to negative (expense)
        if transfer.amount > 0 and transfer.category_type != "EXPENSE":
            connection.execute(
                sa.text(
                    """
                    UPDATE scheduled_transactions
                    SET amount = :negative_amount
                    WHERE id = :id
                """
                ),
                {"negative_amount": -abs(transfer.amount), "id": transfer.id},
            )

        # Find or create an income category for transfers
        income_category_result = connection.execute(
            sa.text(
                """
            SELECT id FROM categories
            WHERE name = 'Transfer'
            AND type = 'INCOME'
            AND (user_id = :user_id OR is_system = true)
            LIMIT 1
        """
            ),
            {"user_id": transfer.user_id},
        )

        income_category_row = income_category_result.fetchone()

        if income_category_row:
            income_category_id = income_category_row[0]
        else:
            # Create a system income transfer category
            result = connection.execute(
                sa.text(
                    """
                INSERT INTO categories (name, type, is_system, created_at, updated_at)
                VALUES ('Transfer In', 'INCOME', true, NOW(), NOW())
                RETURNING id
            """
                )
            )
            income_category_id = result.fetchone()[0]

        # Create the corresponding income record for destination account
        result = connection.execute(
            sa.text(
                """
            INSERT INTO scheduled_transactions (
                user_id,
                account_id,
                category_id,
                name,
                amount,
                currency,
                note,
                is_recurring,
                recurrence_frequency,
                recurrence_day_of_month,
                recurrence_month_of_year,
                recurrence_start_date,
                recurrence_end_date,
                linked_transaction_id,
                created_at,
                updated_at
            ) VALUES (
                :user_id,
                :to_account_id,
                :income_category_id,
                :name,
                :amount,
                :currency,
                :note,
                :is_recurring,
                :recurrence_frequency,
                :recurrence_day_of_month,
                :recurrence_month_of_year,
                :recurrence_start_date,
                :recurrence_end_date,
                :source_id,
                :created_at,
                :updated_at
            ) RETURNING id
        """
            ),
            {
                "user_id": transfer.user_id,
                "to_account_id": transfer.to_account_id,
                "income_category_id": income_category_id,
                "name": transfer.name,
                "amount": abs(transfer.amount),  # Positive for income
                "currency": transfer.currency,
                "note": transfer.note,
                "is_recurring": transfer.is_recurring,
                "recurrence_frequency": transfer.recurrence_frequency,
                "recurrence_day_of_month": transfer.recurrence_day_of_month,
                "recurrence_month_of_year": transfer.recurrence_month_of_year,
                "recurrence_start_date": transfer.recurrence_start_date,
                "recurrence_end_date": transfer.recurrence_end_date,
                "source_id": transfer.id,
                "created_at": transfer.created_at,
                "updated_at": transfer.updated_at,
            },
        )

        linked_id = result.fetchone()[0]

        # Update the source transaction with the linked_transaction_id
        connection.execute(
            sa.text(
                """
            UPDATE scheduled_transactions
            SET linked_transaction_id = :linked_id
            WHERE id = :source_id
        """
            ),
            {"linked_id": linked_id, "source_id": transfer.id},
        )

    # Step 5: Now we can safely remove to_account_id column as it's replaced by linked transactions
    # But let's keep it for backward compatibility and mark it as deprecated in code


def downgrade() -> None:
    """
    Downgrade schema back to positive amounts only.

    WARNING: This is a destructive operation that will:
    1. Convert all negative amounts back to positive
    2. Re-add amount constraints
    3. Remove linked_transaction_id column
    4. Delete linked transfer records
    """
    # Step 1: Delete all linked transfer records (destination accounts)
    op.execute(
        """
        DELETE FROM scheduled_transactions
        WHERE linked_transaction_id IS NOT NULL
        AND amount > 0
    """
    )

    # Step 2: Convert all negative amounts back to positive
    op.execute(
        """
        UPDATE scheduled_transactions
        SET amount = ABS(amount)
        WHERE amount < 0
    """
    )

    # Step 3: Remove linked_transaction_id column
    op.drop_index("ix_scheduled_transactions_linked_transaction_id", "scheduled_transactions")
    op.drop_constraint(
        "fk_scheduled_transactions_linked", "scheduled_transactions", type_="foreignkey"
    )
    op.drop_column("scheduled_transactions", "linked_transaction_id")

    # Step 4: Re-add amount constraints
    op.create_check_constraint("check_amount_positive", "scheduled_transactions", "amount > 0")
    op.create_check_constraint(
        "check_exception_amount_positive",
        "scheduled_transaction_exceptions",
        "amount IS NULL OR amount > 0",
    )
