import { Component, Input, Output, EventEmitter } from '@angular/core';

import { NzTableModule } from 'ng-zorro-antd/table';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzPopconfirmModule } from 'ng-zorro-antd/popconfirm';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { ReconciliationSummary } from '../../../../core/models/reconciliation.model';

@Component({
  selector: 'app-reconciliation-list',
  standalone: true,
  imports: [
    NzTableModule,
    NzButtonModule,
    NzIconModule,
    NzTagModule,
    NzPopconfirmModule,
    NzEmptyModule
],
  template: `
    <nz-table
      #reconciliationTable
      [nzData]="reconciliations"
      [nzPageSize]="10"
      [nzShowPagination]="reconciliations.length > 10"
      [nzSize]="'middle'"
    >
      <thead>
        <tr>
          <th>Account</th>
          <th>Date</th>
          <th>Expected Balance</th>
          <th>Actual Balance</th>
          <th>Difference</th>
          <th>Status</th>
          <th>Note</th>
          <th nzWidth="100px">Actions</th>
        </tr>
      </thead>
      <tbody>
        @if (reconciliations.length === 0) {
          <tr>
            <td colspan="8">
              <nz-empty
                nzNotFoundContent="No reconciliations yet"
                [nzNotFoundFooter]="emptyFooter"
              >
                <ng-template #emptyFooter>
                  <p style="color: #8c8c8c;">
                    Create your first reconciliation to track account balances
                  </p>
                </ng-template>
              </nz-empty>
            </td>
          </tr>
        }
        @for (item of reconciliationTable.data; track item.id) {
          <tr>
            <td>
              <strong>{{ item.account_name }}</strong>
            </td>
            <td>{{ formatDate(item.reconciliation_date) }}</td>
            <td>
              <span class="balance">
                {{ currencySymbol }}{{ parseFloat(item.expected_balance).toFixed(2) }}
              </span>
            </td>
            <td>
              <span class="balance">
                {{ currencySymbol }}{{ parseFloat(item.actual_balance).toFixed(2) }}
              </span>
            </td>
            <td>
              <span
                [class]="'difference ' + getDifferenceClass(item)"
                [style.color]="getDifferenceColor(item)"
              >
                {{ formatDifference(item) }}
              </span>
            </td>
            <td>
              <nz-tag [nzColor]="getStatusColor(item)">
                {{ getStatusText(item) }}
              </nz-tag>
            </td>
            <td>
              <span class="note">{{ item.note || '-' }}</span>
            </td>
            <td>
              <div class="actions">
                <button
                  nz-button
                  nzType="text"
                  nzDanger
                  nz-popconfirm
                  nzPopconfirmTitle="Delete this reconciliation?"
                  (nzOnConfirm)="handleDelete(item.id)"
                  nzSize="small"
                >
                  <span nz-icon nzType="delete" nzTheme="outline"></span>
                </button>
              </div>
            </td>
          </tr>
        }
      </tbody>
    </nz-table>
  `,
  styles: [`
    .balance {
      font-weight: 500;
      font-family: 'Courier New', monospace;
    }

    .difference {
      font-weight: 600;
      font-family: 'Courier New', monospace;
    }

    .note {
      color: #8c8c8c;
      font-size: 12px;
      max-width: 200px;
      display: inline-block;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .actions {
      display: flex;
      gap: 4px;
    }

    :host ::ng-deep .ant-table-tbody > tr > td {
      vertical-align: middle;
    }
  `]
})
export class ReconciliationListComponent {
  @Input() reconciliations: ReconciliationSummary[] = [];
  @Input() currencySymbol = '$';

  @Output() deleteReconciliation = new EventEmitter<number>();

  parseFloat(value: string): number {
    return parseFloat(value);
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  formatDifference(item: ReconciliationSummary): string {
    const diff = parseFloat(item.difference);
    if (Math.abs(diff) < 0.01) {
      return 'Perfect';
    }
    const sign = diff > 0 ? '+' : '';
    return `${sign}${this.currencySymbol}${diff.toFixed(2)}`;
  }

  getDifferenceClass(item: ReconciliationSummary): string {
    const diff = parseFloat(item.difference);
    if (Math.abs(diff) < 0.01) return 'perfect';
    if (diff > 0) return 'positive';
    return 'negative';
  }

  getDifferenceColor(item: ReconciliationSummary): string {
    const diff = parseFloat(item.difference);
    if (Math.abs(diff) < 0.01) return '#52c41a';
    if (diff > 0) return '#faad14';
    return '#f5222d';
  }

  getStatusColor(item: ReconciliationSummary): string {
    const diff = parseFloat(item.difference);
    if (Math.abs(diff) < 0.01) return 'success';
    return 'warning';
  }

  getStatusText(item: ReconciliationSummary): string {
    const diff = parseFloat(item.difference);
    if (Math.abs(diff) < 0.01) return 'Balanced';
    return 'Adjusted';
  }

  handleDelete(id: number): void {
    this.deleteReconciliation.emit(id);
  }
}
