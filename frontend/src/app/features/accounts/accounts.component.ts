import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  inject,
  OnInit,
} from '@angular/core';

import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { AuthService } from '../../core/services/auth.service';
import { AccountService } from './services/account.service';
import {
  Account,
  AccountCreate,
  AccountUpdate,
  AccountSummary,
} from '../../core/models/account.model';
import { AccountSummaryComponent } from './components/account-summary/account-summary.component';
import { AccountListComponent } from './components/account-list/account-list.component';
import { AccountFormComponent } from './components/account-form/account-form.component';
import { currencySymbols } from '../../core/currency';

@Component({
  selector: 'app-accounts',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    NzButtonModule,
    NzModalModule,
    NzSpinModule,
    NzAlertModule,
    NzIconModule,
    AccountSummaryComponent,
    AccountListComponent,
    AccountFormComponent,
  ],
  template: `
    <div class="accounts-container">
      <nz-spin [nzSpinning]="loading" nzTip="Loading accounts...">
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
            <!-- Summary Cards -->
            <app-account-summary
              [summary]="summary"
              [currencySymbol]="getCurrencySymbol()"
            ></app-account-summary>

            <!-- Add Account Button -->
            <div style="margin: 24px 0;">
              <button nz-button nzType="primary" (click)="showCreateModal()">
                <span nz-icon nzType="plus" nzTheme="outline"></span>
                Add Account
              </button>
            </div>

            <!-- Account List -->
            <app-account-list
              [accounts]="accounts"
              [currencySymbol]="getCurrencySymbol()"
              (editAccount)="showEditModal($event)"
              (deleteAccount)="handleDelete($event)"
            ></app-account-list>
          </div>
        }

        @if (!loading && !error && accounts.length === 0 && !summary) {
          <div class="empty-state">
            <p>No accounts found</p>
          </div>
        }
      </nz-spin>

      <!-- Account Form Modal -->
      <nz-modal
        [(nzVisible)]="isModalVisible"
        [nzTitle]="modalTitle"
        [nzFooter]="null"
        (nzOnCancel)="handleModalCancel()"
        [nzWidth]="600"
      >
        <ng-container *nzModalContent>
          <app-account-form
            [account]="selectedAccount"
            [loading]="formLoading"
            (submitForm)="handleSubmit($event)"
            (cancel)="handleModalCancel()"
          ></app-account-form>
        </ng-container>
      </nz-modal>
    </div>
  `,
  styles: [
    `
      .accounts-container {
        padding: 0;
      }

      .empty-state {
        padding: 48px 24px;
        text-align: center;
        color: #8c8c8c;
      }
    `,
  ],
})
export class AccountsComponent implements OnInit {
  private authService = inject(AuthService);
  private accountService = inject(AccountService);
  private cdr = inject(ChangeDetectorRef);
  private modalService = inject(NzModalService);
  private messageService = inject(NzMessageService);

  currentUser = this.authService.getCurrentUser();
  accounts: Account[] = [];
  summary: AccountSummary | null = null;
  loading = false;
  error: string | null = null;

  isModalVisible = false;
  modalTitle = 'Create Account';
  selectedAccount: Account | null = null;
  formLoading = false;

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading = true;
    this.error = null;

    this.accountService.listAccounts().subscribe({
      next: (accounts) => {
        this.accounts = accounts;
        this.loading = false;
        this.loadSummary();
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.error = err.error?.detail || 'Failed to load accounts';
        this.loading = false;
        this.cdr.markForCheck();
      },
    });
  }

  loadSummary(): void {
    this.accountService.getAccountSummary().subscribe({
      next: (summary) => {
        this.summary = summary;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Failed to load summary:', err);
        this.cdr.markForCheck();
      },
    });
  }

  showCreateModal(): void {
    this.modalTitle = 'Create Account';
    this.selectedAccount = null;
    this.isModalVisible = true;
  }

  showEditModal(account: Account): void {
    this.modalTitle = 'Edit Account';
    this.selectedAccount = account;
    this.isModalVisible = true;
  }

  handleModalCancel(): void {
    this.isModalVisible = false;
    this.selectedAccount = null;
  }

  handleSubmit(data: AccountCreate | AccountUpdate): void {
    this.formLoading = true;

    if (this.selectedAccount) {
      // Update existing account
      this.accountService.updateAccount(this.selectedAccount.id, data).subscribe({
        next: () => {
          this.messageService.success('Account updated successfully');
          this.formLoading = false;
          this.isModalVisible = false;
          this.selectedAccount = null;
          this.loadData();
          this.cdr.markForCheck();
        },
        error: (err) => {
          this.messageService.error(err.error?.detail || 'Failed to update account');
          this.formLoading = false;
          this.cdr.markForCheck();
        },
      });
    } else {
      // Create new account
      this.accountService.createAccount(data as AccountCreate).subscribe({
        next: () => {
          this.messageService.success('Account created successfully');
          this.formLoading = false;
          this.isModalVisible = false;
          this.loadData();
          this.cdr.markForCheck();
        },
        error: (err) => {
          this.messageService.error(err.error?.detail || 'Failed to create account');
          this.formLoading = false;
          this.cdr.markForCheck();
        },
      });
    }
  }

  handleDelete(accountId: number): void {
    this.accountService.deleteAccount(accountId).subscribe({
      next: () => {
        this.messageService.success('Account deleted successfully');
        this.loadData();
      },
      error: (err) => {
        this.messageService.error(err.error?.detail || 'Failed to delete account');
        this.cdr.markForCheck();
      },
    });
  }

  getCurrencySymbol(): string {
    return currencySymbols[this.currentUser?.currency || 'USD'] || '$';
  }
}
