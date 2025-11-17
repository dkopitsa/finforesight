import { Component, inject, OnInit, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NzModalModule, NzModalRef } from 'ng-zorro-antd/modal';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { TransactionInstance } from '../../../../core/models/transaction.model';
import { Account } from '../../../../core/models/account.model';
import { ConfirmationService } from '../../services/confirmation.service';

interface GroupedTransaction {
  scheduled_transaction_id: number;
  name: string;
  instances: TransactionInstance[];
  selectedAccountId: number | null;
}

@Component({
  selector: 'app-pending-confirmations-modal',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    NzModalModule,
    NzTableModule,
    NzButtonModule,
    NzSelectModule,
    NzTagModule,
    NzIconModule,
    NzSpinModule,
    NzEmptyModule
  ],
  template: `
    <nz-spin [nzSpinning]="loading" nzTip="Loading...">
      @if (!loading && groupedTransactions.length === 0) {
        <nz-empty nzNotFoundContent="No transactions need confirmation">
          <p nz-typography>All your transactions are confirmed!</p>
        </nz-empty>
      }

      @if (!loading && groupedTransactions.length > 0) {
        <div style="margin-bottom: 16px;">
          <p style="color: #8c8c8c;">
            You have {{ totalPendingCount }} transaction(s) that need account confirmation.
          </p>
        </div>

        <nz-table
          #groupedTable
          [nzData]="groupedTransactions"
          [nzShowPagination]="false"
          [nzSize]="'small'"
        >
          <thead>
            <tr>
              <th>Transaction</th>
              <th>Instances</th>
              <th>Select Account</th>
              <th nzWidth="180px">Action</th>
            </tr>
          </thead>
          <tbody>
            @for (group of groupedTable.data; track group.scheduled_transaction_id) {
              <tr>
                <td>
                  <strong>{{ group.name }}</strong>
                  <br />
                  <small style="color: #8c8c8c;">
                    {{ group.instances[0].amount }} {{ group.instances[0].currency }}
                  </small>
                </td>
                <td>
                  <nz-tag nzColor="orange">
                    {{ group.instances.length }} pending
                  </nz-tag>
                  <br />
                  <small style="color: #8c8c8c;">
                    {{ formatDateRange(group.instances) }}
                  </small>
                </td>
                <td>
                  <nz-select
                    [(ngModel)]="group.selectedAccountId"
                    nzPlaceHolder="Select account"
                    nzShowSearch
                    style="width: 100%;"
                  >
                    @for (account of accounts; track account.id) {
                      <nz-option
                        [nzValue]="account.id"
                        [nzLabel]="account.name"
                      ></nz-option>
                    }
                  </nz-select>
                </td>
                <td>
                  <button
                    nz-button
                    nzType="primary"
                    nzSize="small"
                    [disabled]="!group.selectedAccountId"
                    (click)="confirmPastInstances(group)"
                    style="margin-right: 4px;"
                  >
                    <span nz-icon nzType="check"></span>
                    Confirm Past
                  </button>
                  <button
                    nz-button
                    nzType="default"
                    nzSize="small"
                    [disabled]="!group.selectedAccountId"
                    (click)="confirmAllInstances(group)"
                  >
                    <span nz-icon nzType="check-circle"></span>
                    All
                  </button>
                </td>
              </tr>
            }
          </tbody>
        </nz-table>
      }
    </nz-spin>
  `,
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class PendingConfirmationsModalComponent implements OnInit {
  private confirmationService = inject(ConfirmationService);
  private messageService = inject(NzMessageService);
  private cdr = inject(ChangeDetectorRef);
  private modalRef = inject(NzModalRef);

  accounts: Account[] = [];
  groupedTransactions: GroupedTransaction[] = [];
  loading = false;
  totalPendingCount = 0;

  ngOnInit(): void {
    this.loadPendingConfirmations();
  }

  loadPendingConfirmations(): void {
    this.loading = true;
    this.confirmationService.getPendingConfirmations().subscribe({
      next: (instances) => {
        this.groupTransactions(instances);
        this.totalPendingCount = instances.length;
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.messageService.error('Failed to load pending confirmations');
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  groupTransactions(instances: TransactionInstance[]): void {
    const grouped = new Map<number, TransactionInstance[]>();

    for (const instance of instances) {
      const id = instance.scheduled_transaction_id!;
      if (!grouped.has(id)) {
        grouped.set(id, []);
      }
      grouped.get(id)!.push(instance);
    }

    this.groupedTransactions = Array.from(grouped.entries()).map(([id, insts]) => ({
      scheduled_transaction_id: id,
      name: insts[0].name,
      instances: insts.sort((a, b) => a.date.localeCompare(b.date)),
      selectedAccountId: null
    }));
  }

  formatDateRange(instances: TransactionInstance[]): string {
    if (instances.length === 1) {
      return this.formatDate(instances[0].date);
    }
    const sorted = [...instances].sort((a, b) => a.date.localeCompare(b.date));
    return `${this.formatDate(sorted[0].date)} - ${this.formatDate(sorted[sorted.length - 1].date)}`;
  }

  formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  confirmPastInstances(group: GroupedTransaction): void {
    if (!group.selectedAccountId) return;

    this.loading = true;
    this.confirmationService.bulkConfirm(
      group.scheduled_transaction_id,
      group.selectedAccountId,
      'past'
    ).subscribe({
      next: (result) => {
        this.messageService.success(result.message);
        this.loadPendingConfirmations(); // Reload
      },
      error: (err) => {
        this.messageService.error(err.error?.detail || 'Failed to confirm instances');
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  confirmAllInstances(group: GroupedTransaction): void {
    if (!group.selectedAccountId) return;

    this.loading = true;
    this.confirmationService.bulkConfirm(
      group.scheduled_transaction_id,
      group.selectedAccountId,
      'all'
    ).subscribe({
      next: (result) => {
        this.messageService.success(result.message);
        this.loadPendingConfirmations(); // Reload
      },
      error: (err) => {
        this.messageService.error(err.error?.detail || 'Failed to confirm instances');
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }
}
