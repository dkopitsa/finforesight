import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { UpcomingTransaction } from '../../../../core/models/dashboard.model';

@Component({
  selector: 'app-upcoming-transactions',
  standalone: true,
  imports: [CommonModule, NzTableModule, NzTagModule, NzEmptyModule],
  template: `
    <div class="transactions-container">
      <div class="transactions-header">
        <h3>Upcoming Transactions</h3>
        <p>Next 30 days</p>
      </div>

      <nz-table
        #transactionsTable
        [nzData]="transactions"
        [nzPageSize]="10"
        [nzShowPagination]="transactions.length > 10"
        [nzSize]="'middle'"
      >
        <thead>
          <tr>
            <th>Date</th>
            <th>Name</th>
            <th>Account</th>
            <th>Category</th>
            <th nzAlign="right">Amount</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let tx of transactionsTable.data">
            <td>{{ formatDate(tx.date) }}</td>
            <td>
              {{ tx.name }}
              <nz-tag *ngIf="tx.is_transfer" nzColor="blue" style="margin-left: 8px;">
                Transfer
              </nz-tag>
            </td>
            <td>{{ tx.account_name }}</td>
            <td>{{ tx.category_name }}</td>
            <td nzAlign="right">
              <span [class]="getAmountClass(tx.amount)">
                {{ currencySymbol }}{{ formatAmount(tx.amount) }}
              </span>
            </td>
          </tr>
        </tbody>
      </nz-table>

      <nz-empty
        *ngIf="transactions.length === 0"
        nzNotFoundContent="No upcoming transactions"
      ></nz-empty>
    </div>
  `,
  styles: [`
    .transactions-container {
      background: white;
      border-radius: 8px;
      padding: 24px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
    }

    .transactions-header {
      margin-bottom: 24px;
    }

    .transactions-header h3 {
      margin: 0 0 8px 0;
      color: #262626;
      font-size: 18px;
      font-weight: 600;
    }

    .transactions-header p {
      margin: 0;
      color: #8c8c8c;
      font-size: 14px;
    }

    .amount-positive {
      color: #52c41a;
      font-weight: 600;
    }

    .amount-negative {
      color: #ff4d4f;
      font-weight: 600;
    }

    .amount-neutral {
      color: #262626;
      font-weight: 600;
    }

    @media (max-width: 768px) {
      .transactions-container {
        padding: 16px;
      }

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
export class UpcomingTransactionsComponent {
  @Input() transactions: UpcomingTransaction[] = [];
  @Input() currencySymbol = '$';

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const isToday = date.toDateString() === today.toDateString();
    const isTomorrow = date.toDateString() === tomorrow.toDateString();

    if (isToday) return 'Today';
    if (isTomorrow) return 'Tomorrow';

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  formatAmount(amount: string): string {
    return Math.abs(parseFloat(amount)).toFixed(2);
  }

  getAmountClass(amount: string): string {
    const value = parseFloat(amount);
    if (value > 0) return 'amount-positive';
    if (value < 0) return 'amount-negative';
    return 'amount-neutral';
  }
}
