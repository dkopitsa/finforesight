import {Component, Input, Output, EventEmitter, ChangeDetectionStrategy} from '@angular/core';

import { NzTableModule } from 'ng-zorro-antd/table';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzPopconfirmModule } from 'ng-zorro-antd/popconfirm';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { Account, AccountType } from '../../../../core/models/account.model';

@Component({
  selector: 'app-account-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    NzTableModule,
    NzButtonModule,
    NzIconModule,
    NzTagModule,
    NzPopconfirmModule,
    NzEmptyModule,
    NzToolTipModule
],
  template: `
    <nz-table
      #accountsTable
      [nzData]="accounts"
      [nzPageSize]="10"
      [nzShowPagination]="accounts.length > 10"
      [nzSize]="'middle'"
    >
      <thead>
        <tr>
          <th>Name</th>
          <th>Type</th>
          <th>Currency</th>
          <th nzAlign="right">Initial Balance</th>
          <th nzAlign="right">Credit Limit</th>
          <th nzWidth="150px" nzAlign="center">Actions</th>
        </tr>
      </thead>
      <tbody>
        @for (account of accountsTable.data; track account.id) {
          <tr>
            <td>
              <strong>{{ account.name }}</strong>
            </td>
            <td>
              <nz-tag [nzColor]="getAccountTypeColor(account.type)">
                <span nz-icon [nzType]="getAccountTypeIcon(account.type)" nzTheme="outline"></span>
                {{ getAccountTypeLabel(account.type) }}
              </nz-tag>
            </td>
            <td>{{ account.currency }}</td>
            <td nzAlign="right">
              {{ formatAmount(account.initial_balance) }}
            </td>
            <td nzAlign="right">
              @if (account.credit_limit) {
                <span>
                  {{ formatAmount(account.credit_limit) }}
                </span>
              } @else {
                <span style="color: #8c8c8c;">
                  —
                </span>
              }
            </td>
            <td nzAlign="center">
              <button
                nz-button
                nzType="default"
                nzSize="small"
                nz-tooltip
                nzTooltipTitle="Edit account"
                (click)="onEdit(account)"
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
                nzTooltipTitle="Delete account"
                nz-popconfirm
                nzPopconfirmTitle="Are you sure you want to delete this account?"
                nzPopconfirmPlacement="left"
                (nzOnConfirm)="onDelete(account.id)"
              >
                <span nz-icon nzType="delete" nzTheme="outline"></span>
              </button>
            </td>
          </tr>
        }
      </tbody>
    </nz-table>

    @if (accounts.length === 0) {
      <nz-empty
        nzNotFoundContent="No accounts yet"
        [nzNotFoundFooter]="emptyFooter"
      >
        <ng-template #emptyFooter>
          <p style="color: #8c8c8c;">Create your first account to get started</p>
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
export class AccountListComponent {
  @Input() accounts: Account[] = [];
  @Input() currencySymbol = '$';

  @Output() editAccount = new EventEmitter<Account>();
  @Output() deleteAccount = new EventEmitter<number>();

  onEdit(account: Account): void {
    this.editAccount.emit(account);
  }

  onDelete(accountId: number): void {
    this.deleteAccount.emit(accountId);
  }

  formatAmount(amount: string): string {
    return parseFloat(amount).toFixed(2);
  }

  getAccountTypeLabel(type: AccountType): string {
    const labels: Record<AccountType, string> = {
      [AccountType.CHECKING]: 'Checking',
      [AccountType.SAVINGS]: 'Savings',
      [AccountType.CASH]: 'Cash',
      [AccountType.INVESTMENT]: 'Investment',
      [AccountType.RETIREMENT]: 'Retirement',
      [AccountType.CREDIT_CARD]: 'Credit Card',
      [AccountType.LOAN]: 'Loan',
      [AccountType.LOAN_GIVEN]: 'Loan Given',
    };
    return labels[type] || type;
  }

  getAccountTypeColor(type: AccountType): string {
    switch (type) {
      case AccountType.CHECKING:
      case AccountType.SAVINGS:
      case AccountType.CASH:
        return 'blue';
      case AccountType.INVESTMENT:
      case AccountType.RETIREMENT:
        return 'green';
      case AccountType.CREDIT_CARD:
      case AccountType.LOAN:
        return 'red';
      case AccountType.LOAN_GIVEN:
        return 'purple';
      default:
        return 'default';
    }
  }

  getAccountTypeIcon(type: AccountType): string {
    switch (type) {
      case AccountType.CHECKING:
      case AccountType.SAVINGS:
      case AccountType.CASH:
        return 'wallet';
      case AccountType.INVESTMENT:
      case AccountType.RETIREMENT:
        return 'rise';
      case AccountType.CREDIT_CARD:
      case AccountType.LOAN:
        return 'credit-card';
      case AccountType.LOAN_GIVEN:
        return 'gift';
      default:
        return 'account-book';
    }
  }
}
