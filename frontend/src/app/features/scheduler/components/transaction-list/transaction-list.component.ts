import {Component, Input, Output, EventEmitter, ChangeDetectionStrategy} from '@angular/core';

import { NzTableModule } from 'ng-zorro-antd/table';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzPopconfirmModule } from 'ng-zorro-antd/popconfirm';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { NzBadgeModule } from 'ng-zorro-antd/badge';
import { ScheduledTransaction, RecurrenceFrequency } from '../../../../core/models/transaction.model';
import { Account } from '../../../../core/models/account.model';
import { Category, CategoryType } from '../../../../core/models/category.model';
import { CurrencyFormatPipe } from '../../../../shared/pipes/currency-format.pipe';

@Component({
  selector: 'app-transaction-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    NzTableModule,
    NzButtonModule,
    NzIconModule,
    NzTagModule,
    NzPopconfirmModule,
    NzEmptyModule,
    NzToolTipModule,
    NzBadgeModule,
    CurrencyFormatPipe
],
  template: `
    <nz-table
      #transactionsTable
      [nzData]="transactions"
      [nzPageSize]="15"
      [nzShowPagination]="transactions.length > 15"
      [nzSize]="'middle'"
    >
      <thead>
        <tr>
          <th>Name</th>
          <th>Type</th>
          <th nzAlign="right">Amount</th>
          <th>Account</th>
          <th>Recurrence</th>
          <th>Period</th>
          <th nzWidth="150px" nzAlign="center">Actions</th>
        </tr>
      </thead>
      <tbody>
        @for (transaction of transactionsTable.data; track transaction.id) {
          <tr>
            <td>
              <strong>{{ transaction.name }}</strong>
              @if (transaction.note) {
                <br />
                <small style="color: #8c8c8c;">{{ transaction.note }}</small>
              }
            </td>
            <td>
              <nz-tag [nzColor]="getCategoryTypeColor(transaction.category_id)">
                <span nz-icon [nzType]="getCategoryTypeIcon(transaction.category_id)" nzTheme="outline"></span>
                {{ getCategoryName(transaction.category_id) }}
              </nz-tag>
            </td>
            <td nzAlign="right">
              <span [style.color]="getAmountColor(transaction.category_id)">
                {{ transaction.amount | currencyFormat: transaction.currency }}
              </span>
            </td>
            <td>
              {{ getAccountName(transaction.account_id) }}
              @if (transaction.to_account_id) {
                <br />
                <small style="color: #8c8c8c;">
                  → {{ getAccountName(transaction.to_account_id) }}
                </small>
              }
            </td>
            <td>
              @if (transaction.is_recurring) {
                <nz-tag nzColor="purple">
                  <span nz-icon nzType="reload" nzTheme="outline"></span>
                  {{ getRecurrenceLabel(transaction.recurrence_frequency) }}
                </nz-tag>
              } @else {
                <nz-tag nzColor="default">
                  <span nz-icon nzType="check-circle" nzTheme="outline"></span>
                  One-time
                </nz-tag>
              }
            </td>
            <td>
              @if (transaction.is_recurring) {
                <div>
                  <small>
                    From: {{ formatDate(transaction.recurrence_start_date) }}
                  </small>
                  @if (transaction.recurrence_end_date) {
                    <br />
                    <small>
                      To: {{ formatDate(transaction.recurrence_end_date) }}
                    </small>
                  } @else {
                    <br />
                    <small style="color: #8c8c8c;">No end date</small>
                  }
                </div>
              } @else {
                <small>
                  {{ formatDate(transaction.recurrence_start_date) }}
                </small>
              }
            </td>
            <td nzAlign="center">
              <button
                nz-button
                nzType="default"
                nzSize="small"
                nz-tooltip
                nzTooltipTitle="Edit transaction"
                (click)="onEdit(transaction)"
                style="margin-right: 8px;"
              >
                <span nz-icon nzType="edit" nzTheme="outline"></span>
              </button>
              <button
                nz-button
                nzType="default"
                nzDanger
                nzSize="small"
                nz-tooltip
                nzTooltipTitle="Delete transaction"
                nz-popconfirm
                nzPopconfirmTitle="Are you sure you want to delete this transaction?"
                nzPopconfirmPlacement="left"
                (nzOnConfirm)="onDelete(transaction.id)"
              >
                <span nz-icon nzType="delete" nzTheme="outline"></span>
              </button>
            </td>
          </tr>
        }
      </tbody>
    </nz-table>

    @if (transactions.length === 0) {
      <nz-empty
        nzNotFoundContent="No scheduled transactions"
        [nzNotFoundFooter]="emptyFooter"
      >
        <ng-template #emptyFooter>
          <p style="color: #8c8c8c;">Create your first transaction to get started</p>
        </ng-template>
      </nz-empty>
    }
  `,
  styles: [`
    :host ::ng-deep .ant-table {
      background: white;
      border-radius: 8px;
    }

    :host ::ng-deep .ant-tag {
      display: inline-flex;
      align-items: center;
      gap: 4px;
    }

    @media (max-width: 768px) {
      :host ::ng-deep .ant-table {
        font-size: 12px;
      }

      :host ::ng-deep .ant-table-thead > tr > th,
      :host ::ng-deep .ant-table-tbody > tr > td {
        padding: 8px;
      }
    }
  `]
})
export class TransactionListComponent {
  @Input() transactions: ScheduledTransaction[] = [];
  @Input() accounts: Account[] = [];
  @Input() categories: Category[] = [];
  @Input() currencySymbol = '$';

  @Output() editTransaction = new EventEmitter<ScheduledTransaction>();
  @Output() deleteTransaction = new EventEmitter<number>();

  onEdit(transaction: ScheduledTransaction): void {
    this.editTransaction.emit(transaction);
  }

  onDelete(transactionId: number): void {
    this.deleteTransaction.emit(transactionId);
  }


  formatDate(date: string | undefined): string {
    if (!date) return '—';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  getAccountName(accountId: number): string {
    const account = this.accounts.find(a => a.id === accountId);
    return account?.name || `Account #${accountId}`;
  }

  getCategoryName(categoryId: number): string {
    const category = this.categories.find(c => c.id === categoryId);
    return category?.name || 'Unknown';
  }

  getCategoryType(categoryId: number): CategoryType | null {
    const category = this.categories.find(c => c.id === categoryId);
    return category?.type || null;
  }

  getCategoryTypeColor(categoryId: number): string {
    const type = this.getCategoryType(categoryId);
    switch (type) {
      case CategoryType.INCOME:
        return 'green';
      case CategoryType.EXPENSE:
        return 'red';
      case CategoryType.TRANSFER:
        return 'blue';
      default:
        return 'default';
    }
  }

  getCategoryTypeIcon(categoryId: number): string {
    const type = this.getCategoryType(categoryId);
    switch (type) {
      case CategoryType.INCOME:
        return 'arrow-down';
      case CategoryType.EXPENSE:
        return 'arrow-up';
      case CategoryType.TRANSFER:
        return 'swap';
      default:
        return 'question-circle';
    }
  }

  getAmountColor(categoryId: number): string {
    const type = this.getCategoryType(categoryId);
    switch (type) {
      case CategoryType.INCOME:
        return '#52c41a';
      case CategoryType.EXPENSE:
        return '#f5222d';
      case CategoryType.TRANSFER:
        return '#1890ff';
      default:
        return '#262626';
    }
  }

  getRecurrenceLabel(frequency: RecurrenceFrequency | undefined): string {
    if (!frequency) return 'N/A';
    switch (frequency) {
      case RecurrenceFrequency.MONTHLY:
        return 'Monthly';
      case RecurrenceFrequency.YEARLY:
        return 'Yearly';
      default:
        return frequency;
    }
  }
}
