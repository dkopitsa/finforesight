import {ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, OnInit} from '@angular/core';

import { FormsModule } from '@angular/forms';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { ReconciliationService } from './services/reconciliation.service';
import { ReconciliationFormComponent } from './components/reconciliation-form/reconciliation-form.component';
import { ReconciliationListComponent } from './components/reconciliation-list/reconciliation-list.component';
import { ReconciliationBulkForm } from './components/reconciliation-bulk-form/reconciliation-bulk-form';
import { AccountService } from '../accounts/services/account.service';
import { AuthService } from '../../core/services/auth.service';
import { CurrencyService } from '../../core/services/currency.service';
import { Account } from '../../core/models/account.model';
import { ReconciliationSummary, ReconciliationCreate } from '../../core/models/reconciliation.model';

@Component({
  selector: 'app-reconciliation',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    FormsModule,
    NzCardModule,
    NzButtonModule,
    NzIconModule,
    NzSpinModule,
    NzAlertModule,
    NzSelectModule,
    NzEmptyModule,
    NzTabsModule,
    ReconciliationFormComponent,
    ReconciliationListComponent,
    ReconciliationBulkForm
],
  template: `
    <div class="reconciliation-container">
      <div class="reconciliation-header">
        <div>
          <h2>Account Reconciliation</h2>
          <p class="subtitle">Compare actual account balances with expected balances</p>
        </div>
      </div>

      <nz-tabset [nzType]="'card'" [(nzSelectedIndex)]="activeTabIndex">

        <!-- Tab 1: Bulk Reconciliation (DEFAULT) -->
        <nz-tab nzTitle="Bulk Reconciliation">
          <ng-template nz-tab>
            <app-reconciliation-bulk-form></app-reconciliation-bulk-form>
          </ng-template>
        </nz-tab>

        <!-- Tab 2: History & Quick Reconcile -->
        <nz-tab nzTitle="History">
          <ng-template nz-tab>

            <!-- Quick Reconcile Button -->
            <div style="margin-bottom: 16px;">
              <button
                nz-button
                nzType="default"
                (click)="showCreateModal()"
                [disabled]="accounts.length === 0"
              >
                <span nz-icon nzType="plus-circle" nzTheme="outline"></span>
                Quick Reconcile Single Account
              </button>
            </div>

            <!-- Account Filter -->
            <div class="filter-section" style="margin-bottom: 24px;">
              <nz-card nzSize="small" nzTitle="Filter">
                <div style="max-width: 400px;">
                  <label style="display: block; margin-bottom: 8px; font-weight: 500;">
                    Filter by Account
                  </label>
                  <nz-select
                    [(ngModel)]="selectedAccountId"
                    (ngModelChange)="loadReconciliations()"
                    nzPlaceHolder="All accounts"
                    nzAllowClear
                    nzShowSearch
                    style="width: 100%;"
                  >
                    @for (account of accounts; track account.id) {
                      <nz-option [nzValue]="account.id" [nzLabel]="account.name"></nz-option>
                    }
                  </nz-select>
                </div>
              </nz-card>
            </div>

            <!-- Reconciliation List -->
            <nz-spin [nzSpinning]="loading" nzTip="Loading reconciliations...">
              @if (error) {
                <nz-alert
                  nzType="error"
                  [nzMessage]="error"
                  nzShowIcon
                  nzCloseable
                  (nzOnClose)="error = null"
                  style="margin-bottom: 24px;"
                ></nz-alert>
              }

              <div class="list-section">
                <nz-card>
                  <app-reconciliation-list
                    [reconciliations]="reconciliations"
                    [currencySymbol]="getCurrencySymbol()"
                    (deleteReconciliation)="handleDelete($event)"
                  ></app-reconciliation-list>
                </nz-card>
              </div>
            </nz-spin>

            <!-- Modal Form -->
            <app-reconciliation-form
              [(visible)]="isModalVisible"
              [accounts]="accounts"
              [loading]="formLoading"
              (submitForm)="handleSubmit($event)"
              (cancel)="handleModalCancel()"
            ></app-reconciliation-form>

          </ng-template>
        </nz-tab>
      </nz-tabset>
    </div>
  `,
  styles: [`
    .reconciliation-container {
      padding: 0;
    }

    .reconciliation-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
    }

    .reconciliation-header h2 {
      margin: 0 0 8px 0;
      font-size: 24px;
      color: #262626;
    }

    .subtitle {
      margin: 0;
      color: #8c8c8c;
      font-size: 14px;
    }

    @media (max-width: 768px) {
      .reconciliation-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 16px;
      }
    }
  `]
})
export class ReconciliationComponent implements OnInit {
  private reconciliationService = inject(ReconciliationService);
  private accountService = inject(AccountService);
  private authService = inject(AuthService);
  private messageService = inject(NzMessageService);
  private cdr = inject(ChangeDetectorRef);
  private currencyService = inject(CurrencyService);

  currentUser = this.authService.getCurrentUser();
  accounts: Account[] = [];
  reconciliations: ReconciliationSummary[] = [];
  selectedAccountId: number | null = null;

  loading = false;
  error: string | null = null;
  isModalVisible = false;
  formLoading = false;
  activeTabIndex = 0; // Default to Bulk Reconciliation tab

  ngOnInit(): void {
    this.loadAccounts();
    this.loadReconciliations();
  }

  loadAccounts(): void {
    this.accountService.listAccounts().subscribe({
      next: (accounts) => {
        this.accounts = accounts;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Failed to load accounts:', err);
        this.messageService.error('Failed to load accounts');
        this.cdr.markForCheck();
      },
    });
  }

  loadReconciliations(): void {
    this.loading = true;
    this.error = null;
    this.cdr.markForCheck();

    this.reconciliationService.listReconciliations(this.selectedAccountId || undefined).subscribe({
      next: (reconciliations) => {
        this.reconciliations = reconciliations;
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.error = err.error?.detail || 'Failed to load reconciliations';
        this.loading = false;
        this.cdr.markForCheck();
      },
    });
  }

  showCreateModal(): void {
    this.isModalVisible = true;
    this.cdr.markForCheck();
  }

  handleModalCancel(): void {
    this.isModalVisible = false;
    this.cdr.markForCheck();
  }

  handleSubmit(data: ReconciliationCreate): void {
    this.formLoading = true;
    this.cdr.markForCheck();

    this.reconciliationService.createReconciliation(data).subscribe({
      next: () => {
        this.messageService.success('Account reconciled successfully');
        this.formLoading = false;
        this.isModalVisible = false;
        this.cdr.markForCheck();
        this.loadReconciliations();
      },
      error: (err) => {
        this.messageService.error(err.error?.detail || 'Failed to reconcile account');
        this.formLoading = false;
        this.cdr.markForCheck();
      },
    });
  }

  handleDelete(id: number): void {
    this.reconciliationService.deleteReconciliation(id).subscribe({
      next: () => {
        this.messageService.success('Reconciliation deleted successfully');
        this.loadReconciliations();
      },
      error: (err) => {
        this.messageService.error(err.error?.detail || 'Failed to delete reconciliation');
        this.cdr.markForCheck();
      },
    });
  }

  getCurrencySymbol(): string {
    return this.currencyService.getCurrencySymbol(
      this.currentUser?.currency || 'USD'
    );
  }
}
