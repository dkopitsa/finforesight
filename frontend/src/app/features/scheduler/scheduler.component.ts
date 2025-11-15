import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { NzCardModule } from 'ng-zorro-antd/card';
import { SchedulerService } from './services/scheduler.service';
import { AuthService } from '../../core/services/auth.service';
import { CategoryService } from '../../core/services/category.service';
import { TransactionListComponent } from './components/transaction-list/transaction-list.component';
import { TransactionFormComponent } from './components/transaction-form/transaction-form.component';
import { TransactionCalendarComponent } from './components/transaction-calendar/transaction-calendar.component';
import { TransactionStatsComponent } from './components/transaction-stats/transaction-stats.component';
import { TransactionFiltersComponent } from './components/transaction-filters/transaction-filters.component';
import { EditRecurringModalComponent } from './components/edit-recurring-modal/edit-recurring-modal.component';
import {
  ScheduledTransaction,
  ScheduledTransactionCreate,
  ScheduledTransactionUpdate,
  TransactionInstance,
  TransactionFilter,
  ViewMode,
  UpdateMode,
} from '../../core/models/transaction.model';
import { Account } from '../../core/models/account.model';
import { Category } from '../../core/models/category.model';
import { AccountService } from '../accounts/services/account.service';

@Component({
  selector: 'app-scheduler',
  standalone: true,
  imports: [
    CommonModule,
    NzButtonModule,
    NzModalModule,
    NzSpinModule,
    NzAlertModule,
    NzIconModule,
    NzTabsModule,
    NzCardModule,
    TransactionListComponent,
    TransactionFormComponent,
    TransactionCalendarComponent,
    TransactionStatsComponent,
    TransactionFiltersComponent,
    EditRecurringModalComponent,
  ],
  template: `
    <div class="scheduler-container">
      <!-- Header with view toggle and action buttons -->
      <div class="scheduler-header">
        <h2>Transaction Scheduler</h2>
        <div class="header-actions">
          <nz-button-group>
            <button
              nz-button
              [nzType]="viewMode === 'list' ? 'primary' : 'default'"
              (click)="setViewMode('list')"
            >
              <span nz-icon nzType="unordered-list" nzTheme="outline"></span>
              List
            </button>
            <button
              nz-button
              [nzType]="viewMode === 'calendar' ? 'primary' : 'default'"
              (click)="setViewMode('calendar')"
            >
              <span nz-icon nzType="calendar" nzTheme="outline"></span>
              Calendar
            </button>
          </nz-button-group>

          <button nz-button nzType="primary" (click)="showCreateModal()" style="margin-left: 16px;">
            <span nz-icon nzType="plus" nzTheme="outline"></span>
            Add Transaction
          </button>
        </div>
      </div>

      <nz-spin [nzSpinning]="loading" nzTip="Loading transactions...">
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

        @if (!loading && !error) {
          <div>
            <!-- Filters -->
            <div class="filters-section" style="margin-bottom: 24px;">
              <app-transaction-filters
                [accounts]="accounts"
                [categories]="categories"
                [initialFilters]="filter"
                (filtersChange)="handleFiltersChange($event)"
              ></app-transaction-filters>
            </div>

            <!-- Statistics -->
            @if (filteredInstances.length > 0) {
              <div class="stats-section" style="margin-bottom: 24px;">
                <app-transaction-stats
                  [instances]="filteredInstances"
                  [categories]="categories"
                  [currencySymbol]="getCurrencySymbol()"
                  [periodStart]="getPeriodStart()"
                  [periodEnd]="getPeriodEnd()"
                ></app-transaction-stats>
              </div>
            }

            <!-- Content area based on view mode -->
            @if (viewMode === 'list') {
              <div class="list-view">
                <app-transaction-list
                  [transactions]="filteredTransactions"
                  [accounts]="accounts"
                  [categories]="categories"
                  [currencySymbol]="getCurrencySymbol()"
                  (editTransaction)="showEditModal($event)"
                  (deleteTransaction)="handleDelete($event)"
                ></app-transaction-list>
              </div>
            } @else {
              <div class="calendar-view">
                <app-transaction-calendar
                  [instances]="filteredInstances"
                  [accounts]="accounts"
                  [categories]="categories"
                  [currencySymbol]="getCurrencySymbol()"
                  (dateClick)="handleDateClick($event)"
                  (instanceClick)="handleInstanceClick($event)"
                  (monthChange)="handleMonthChange($event)"
                ></app-transaction-calendar>
              </div>
            }
          </div>
        }

        @if (!loading && !error && transactions.length === 0) {
          <div class="empty-state">
            <p><span nz-icon nzType="calendar" nzTheme="outline" style="font-size: 48px; color: #d9d9d9;"></span></p>
            <p>No scheduled transactions yet</p>
            <button nz-button nzType="primary" (click)="showCreateModal()">
              <span nz-icon nzType="plus" nzTheme="outline"></span>
              Create Your First Transaction
            </button>
          </div>
        }
      </nz-spin>

      <!-- Transaction Form Modal -->
      <nz-modal
        [(nzVisible)]="isModalVisible"
        [nzTitle]="modalTitle"
        [nzFooter]="null"
        (nzOnCancel)="handleModalCancel()"
        [nzWidth]="700"
      >
        <ng-container *nzModalContent>
          <app-transaction-form
            [transaction]="selectedTransaction"
            [accounts]="accounts"
            [categories]="categories"
            [loading]="formLoading"
            (submitForm)="handleSubmit($event)"
            (cancel)="handleModalCancel()"
          ></app-transaction-form>
        </ng-container>
      </nz-modal>

      <!-- Edit Recurring Modal -->
      <app-edit-recurring-modal
        [(visible)]="isRecurringModalVisible"
        [transactionName]="selectedTransaction?.name || ''"
        [instanceDate]="selectedInstanceDate"
        (modeSelected)="handleUpdateModeSelected($event)"
        (cancel)="handleRecurringModalCancel()"
      ></app-edit-recurring-modal>
    </div>
  `,
  styles: [`
    .scheduler-container {
      padding: 0;
    }

    .scheduler-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
    }

    .scheduler-header h2 {
      margin: 0;
      font-size: 24px;
      color: #262626;
    }

    .header-actions {
      display: flex;
      align-items: center;
    }

    .empty-state {
      padding: 64px 24px;
      text-align: center;
      color: #8c8c8c;
    }

    .empty-state p:last-child {
      margin-top: 16px;
    }

    .filters-section, .stats-section {
      margin-bottom: 24px;
    }
  `]
})
export class SchedulerComponent implements OnInit {
  private authService = inject(AuthService);
  private schedulerService = inject(SchedulerService);
  private accountService = inject(AccountService);
  private categoryService = inject(CategoryService);
  private messageService = inject(NzMessageService);

  currentUser = this.authService.getCurrentUser();
  viewMode: ViewMode = ViewMode.LIST;

  transactions: ScheduledTransaction[] = [];
  instances: TransactionInstance[] = [];
  accounts: Account[] = [];
  categories: Category[] = [];

  filteredTransactions: ScheduledTransaction[] = [];
  filteredInstances: TransactionInstance[] = [];

  loading = false;
  error: string | null = null;

  filter: TransactionFilter = {};

  isModalVisible = false;
  modalTitle = 'Create Transaction';
  selectedTransaction: ScheduledTransaction | null = null;
  formLoading = false;

  isRecurringModalVisible = false;
  selectedInstanceDate?: string;
  selectedUpdateMode?: UpdateMode;

  ngOnInit(): void {
    this.loadData();
    this.loadAccounts();
    this.loadCategories();
    this.loadInstances(); // Load instances for statistics
  }

  setViewMode(mode: 'list' | 'calendar'): void {
    this.viewMode = mode === 'list' ? ViewMode.LIST : ViewMode.CALENDAR;

    if (mode === 'calendar') {
      this.loadInstances();
    }
  }

  loadData(): void {
    this.loading = true;
    this.error = null;

    this.schedulerService.listTransactions().subscribe({
      next: (transactions) => {
        this.transactions = transactions;
        this.applyFilters();
        this.loading = false;
      },
      error: (err) => {
        this.error = err.error?.detail || 'Failed to load transactions';
        this.loading = false;
      },
    });
  }

  loadInstances(): void {
    // Load instances for current month
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const fromDate = firstDay.toISOString().split('T')[0];
    const toDate = lastDay.toISOString().split('T')[0];

    this.schedulerService.getInstances(fromDate, toDate).subscribe({
      next: (instances) => {
        this.instances = instances;
        this.applyFilters();
      },
      error: (err) => {
        console.error('Failed to load instances:', err);
      },
    });
  }

  loadAccounts(): void {
    this.accountService.listAccounts().subscribe({
      next: (accounts) => {
        this.accounts = accounts;
      },
      error: (err) => {
        console.error('Failed to load accounts:', err);
      },
    });
  }

  loadCategories(): void {
    this.categoryService.listCategories().subscribe({
      next: (categories) => {
        this.categories = categories;
      },
      error: (err) => {
        console.error('Failed to load categories:', err);
      },
    });
  }

  showCreateModal(): void {
    this.modalTitle = 'Create Transaction';
    this.selectedTransaction = null;
    this.isModalVisible = true;
  }

  showEditModal(transaction: ScheduledTransaction): void {
    this.selectedTransaction = transaction;

    // If the transaction is recurring, show the update mode selection modal first
    if (transaction.is_recurring) {
      this.selectedInstanceDate = transaction.recurrence_start_date;
      this.isRecurringModalVisible = true;
    } else {
      // For non-recurring transactions, directly show the edit form
      this.modalTitle = 'Edit Transaction';
      this.isModalVisible = true;
    }
  }

  handleModalCancel(): void {
    this.isModalVisible = false;
    this.selectedTransaction = null;
    this.selectedUpdateMode = undefined;
    this.selectedInstanceDate = undefined;
  }

  handleUpdateModeSelected(mode: UpdateMode): void {
    this.selectedUpdateMode = mode;
    this.isRecurringModalVisible = false;
    // Now show the edit form with the selected update mode
    this.modalTitle = 'Edit Transaction';
    this.isModalVisible = true;
  }

  handleRecurringModalCancel(): void {
    this.isRecurringModalVisible = false;
    this.selectedTransaction = null;
    this.selectedInstanceDate = undefined;
    this.selectedUpdateMode = undefined;
  }

  handleSubmit(data: ScheduledTransactionCreate | ScheduledTransactionUpdate): void {
    this.formLoading = true;

    if (this.selectedTransaction) {
      // Update existing transaction
      const updateData = data as ScheduledTransactionUpdate;

      // Add update mode and instance date if editing a recurring transaction
      if (this.selectedTransaction.is_recurring && this.selectedUpdateMode) {
        updateData.edit_mode = this.selectedUpdateMode;
        if (this.selectedInstanceDate) {
          updateData.instance_date = this.selectedInstanceDate;
        }
      }

      this.schedulerService.updateTransaction(this.selectedTransaction.id, updateData).subscribe({
        next: () => {
          this.messageService.success('Transaction updated successfully');
          this.formLoading = false;
          this.isModalVisible = false;
          this.selectedTransaction = null;
          this.selectedUpdateMode = undefined;
          this.selectedInstanceDate = undefined;
          this.loadData();
          if (this.viewMode === ViewMode.CALENDAR) {
            this.loadInstances();
          }
        },
        error: (err) => {
          this.messageService.error(err.error?.detail || 'Failed to update transaction');
          this.formLoading = false;
        },
      });
    } else {
      // Create new transaction
      this.schedulerService.createTransaction(data as ScheduledTransactionCreate).subscribe({
        next: () => {
          this.messageService.success('Transaction created successfully');
          this.formLoading = false;
          this.isModalVisible = false;
          this.loadData();
          if (this.viewMode === ViewMode.CALENDAR) {
            this.loadInstances();
          }
        },
        error: (err) => {
          this.messageService.error(err.error?.detail || 'Failed to create transaction');
          this.formLoading = false;
        },
      });
    }
  }

  handleDelete(transactionId: number): void {
    this.schedulerService.deleteTransaction(transactionId).subscribe({
      next: () => {
        this.messageService.success('Transaction deleted successfully');
        this.loadData();
        if (this.viewMode === ViewMode.CALENDAR) {
          this.loadInstances();
        }
      },
      error: (err) => {
        this.messageService.error(err.error?.detail || 'Failed to delete transaction');
      },
    });
  }

  handleDateClick(_date: Date): void {
    // Pre-fill form with selected date when creating new transaction
    this.showCreateModal();
    // TODO: Could pass the date to the form to pre-fill recurrence_start_date
  }

  handleInstanceClick(instance: TransactionInstance): void {
    // Find the original transaction and edit it
    const transaction = this.transactions.find(t => t.id === instance.id);
    if (transaction) {
      // Set the instance date from the clicked instance
      this.selectedInstanceDate = instance.date;
      this.showEditModal(transaction);
    } else {
      this.messageService.warning('Unable to edit this transaction instance');
    }
  }

  handleMonthChange(change: { year: number; month: number }): void {
    // Load instances for the new month
    const firstDay = new Date(change.year, change.month - 1, 1);
    const lastDay = new Date(change.year, change.month, 0);

    const fromDate = firstDay.toISOString().split('T')[0];
    const toDate = lastDay.toISOString().split('T')[0];

    this.schedulerService.getInstances(fromDate, toDate).subscribe({
      next: (instances) => {
        this.instances = instances;
        this.applyFilters();
      },
      error: (err) => {
        console.error('Failed to load instances for new month:', err);
      },
    });
  }

  handleFiltersChange(filters: TransactionFilter): void {
    this.filter = filters;
    this.applyFilters();
  }

  applyFilters(): void {
    // Filter transactions
    this.filteredTransactions = this.transactions.filter(transaction => {
      // Search filter
      if (this.filter.search) {
        const searchLower = this.filter.search.toLowerCase();
        const matchesName = transaction.name.toLowerCase().includes(searchLower);
        const matchesNote = transaction.note?.toLowerCase().includes(searchLower);
        if (!matchesName && !matchesNote) {
          return false;
        }
      }

      // Category filter
      if (this.filter.category_id !== undefined && this.filter.category_id !== null) {
        if (transaction.category_id !== this.filter.category_id) {
          return false;
        }
      }

      // Account filter
      if (this.filter.account_id !== undefined && this.filter.account_id !== null) {
        if (transaction.account_id !== this.filter.account_id &&
            transaction.to_account_id !== this.filter.account_id) {
          return false;
        }
      }

      // Recurring filter
      if (this.filter.is_recurring !== undefined && this.filter.is_recurring !== null) {
        if (transaction.is_recurring !== this.filter.is_recurring) {
          return false;
        }
      }

      // Date range filter (for start date)
      if (this.filter.date_from && transaction.recurrence_start_date) {
        if (transaction.recurrence_start_date < this.filter.date_from) {
          return false;
        }
      }

      if (this.filter.date_to && transaction.recurrence_start_date) {
        if (transaction.recurrence_start_date > this.filter.date_to) {
          return false;
        }
      }

      return true;
    });

    // Filter instances
    this.filteredInstances = this.instances.filter(instance => {
      // Search filter
      if (this.filter.search) {
        const searchLower = this.filter.search.toLowerCase();
        if (!instance.name.toLowerCase().includes(searchLower)) {
          return false;
        }
      }

      // Category filter
      if (this.filter.category_id !== undefined && this.filter.category_id !== null) {
        if (instance.category_id !== this.filter.category_id) {
          return false;
        }
      }

      // Account filter
      if (this.filter.account_id !== undefined && this.filter.account_id !== null) {
        if (instance.account_id !== this.filter.account_id &&
            instance.to_account_id !== this.filter.account_id) {
          return false;
        }
      }

      // Date range filter
      if (this.filter.date_from && instance.date < this.filter.date_from) {
        return false;
      }

      if (this.filter.date_to && instance.date > this.filter.date_to) {
        return false;
      }

      return true;
    });
  }

  getCurrencySymbol(): string {
    const currencySymbols: Record<string, string> = {
      USD: '$',
      EUR: '€',
      GBP: '£',
      JPY: '¥',
      CAD: 'C$',
      AUD: 'A$',
      CHF: 'CHF',
      CNY: '¥',
    };
    return currencySymbols[this.currentUser?.currency || 'USD'] || '$';
  }

  getPeriodStart(): Date {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  }

  getPeriodEnd(): Date {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth() + 1, 0);
  }
}
