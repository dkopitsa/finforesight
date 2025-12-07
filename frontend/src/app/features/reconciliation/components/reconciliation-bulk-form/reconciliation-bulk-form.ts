import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  inject,
  OnInit,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { forkJoin, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

import { NzCardModule } from 'ng-zorro-antd/card';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzStatisticModule } from 'ng-zorro-antd/statistic';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzCollapseModule } from 'ng-zorro-antd/collapse';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { NzMessageService } from 'ng-zorro-antd/message';

import { AccountService } from '../../../accounts/services/account.service';
import { FinancialInstitutionService } from '../../../../core/services/financial-institution.service';
import { ReconciliationService } from '../../services/reconciliation.service';
import { CurrencyService } from '../../../../core/services/currency.service';

import { Account } from '../../../../core/models/account.model';
import { FinancialInstitution } from '../../../../core/models/financial-institution.model';
import {
  BulkReconciliationItem,
  InstitutionGroup,
  ReconciliationCreate,
} from '../../../../core/models/reconciliation.model';

@Component({
  selector: 'app-reconciliation-bulk-form',
  imports: [
    FormsModule,
    NzCardModule,
    NzDatePickerModule,
    NzStatisticModule,
    NzSpinModule,
    NzAlertModule,
    NzCollapseModule,
    NzTableModule,
    NzTagModule,
    NzInputNumberModule,
    NzCheckboxModule,
    NzInputModule,
    NzButtonModule,
    NzIconModule,
    NzEmptyModule,
    NzToolTipModule,
  ],
  templateUrl: './reconciliation-bulk-form.html',
  styleUrl: './reconciliation-bulk-form.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReconciliationBulkForm implements OnInit {
  private accountService = inject(AccountService);
  private institutionService = inject(FinancialInstitutionService);
  private reconciliationService = inject(ReconciliationService);
  private currencyService = inject(CurrencyService);
  private messageService = inject(NzMessageService);
  private cdr = inject(ChangeDetectorRef);

  reconciliationDate: Date = new Date();
  institutionGroups: InstitutionGroup[] = [];

  loading = false;
  submitting = false;
  error: string | null = null;

  private accounts: Account[] = [];
  private institutions: FinancialInstitution[] = [];

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading = true;
    this.error = null;
    this.cdr.markForCheck();

    forkJoin({
      accounts: this.accountService.listAccounts(),
      institutions: this.institutionService.list(),
    }).subscribe({
      next: ({ accounts, institutions }) => {
        this.accounts = accounts;
        this.institutions = institutions;
        this.loadExpectedBalances();
      },
      error: (err) => {
        this.error = 'Failed to load accounts and institutions';
        this.loading = false;
        this.cdr.markForCheck();
      },
    });
  }

  loadExpectedBalances(): void {
    const accountIds = this.accounts.map((a) => a.id);
    const reconciliationDate = this.formatDate(this.reconciliationDate);

    this.reconciliationService
      .getExpectedBalancesForDate(accountIds, reconciliationDate)
      .subscribe({
        next: (expectedBalances) => {
          this.institutionGroups = this.groupAndSortAccounts(
            this.accounts,
            this.institutions,
            expectedBalances
          );
          this.loading = false;
          this.cdr.markForCheck();
        },
        error: (err) => {
          console.warn('Failed to load expected balances, using initial balances', err);
          this.institutionGroups = this.groupAndSortAccounts(
            this.accounts,
            this.institutions,
            new Map()
          );
          this.loading = false;
          this.cdr.markForCheck();
        },
      });
  }

  onDateChange(date: Date): void {
    this.reconciliationDate = date;
    this.loadExpectedBalances();
  }

  groupAndSortAccounts(
    accounts: Account[],
    institutions: FinancialInstitution[],
    expectedBalances: Map<number, string>
  ): InstitutionGroup[] {
    const institutionMap = new Map(institutions.map((i) => [i.id, i.name]));
    const groups = new Map<number | null, InstitutionGroup>();

    accounts.forEach((account) => {
      const instId = account.financial_institution_id ?? null;

      if (!groups.has(instId)) {
        groups.set(instId, {
          institution_id: instId,
          institution_name: instId
            ? institutionMap.get(instId) || 'Unknown'
            : 'Other Accounts',
          accounts: [],
        });
      }

      const item: BulkReconciliationItem = {
        account_id: account.id,
        account_name: account.name,
        account_type: account.type,
        currency: account.currency,
        financial_institution_id: account.financial_institution_id ?? null,
        financial_institution_name: null,
        expected_balance:
          expectedBalances.get(account.id) || account.initial_balance,
        actual_balance: null,
        difference: null,
        create_adjustment: true,
        note: '',
        loading: false,
        error: null,
        success: false,
      };

      groups.get(instId)!.accounts.push(item);
    });

    const sortedGroups = Array.from(groups.values()).sort((a, b) => {
      if (a.institution_id === null) return 1;
      if (b.institution_id === null) return -1;
      return a.institution_name.localeCompare(b.institution_name);
    });

    sortedGroups.forEach((group) => {
      group.accounts.sort((a, b) => {
        const typeCompare = a.account_type.localeCompare(b.account_type);
        if (typeCompare !== 0) return typeCompare;
        return a.account_name.localeCompare(b.account_name);
      });
    });

    return sortedGroups;
  }

  onActualBalanceChange(item: BulkReconciliationItem): void {
    if (item.actual_balance === null || item.actual_balance === '') {
      item.difference = null;
      item.create_adjustment = true;
      this.cdr.markForCheck();
      return;
    }

    const expected = parseFloat(item.expected_balance);
    const actual = parseFloat(item.actual_balance.toString());
    item.difference = (actual - expected).toFixed(2);

    const hasDifference = Math.abs(parseFloat(item.difference)) >= 0.01;
    item.create_adjustment = hasDifference;

    this.cdr.markForCheck();
  }

  isModified(item: BulkReconciliationItem): boolean {
    return item.actual_balance !== null && item.actual_balance !== '';
  }

  hasDifference(item: BulkReconciliationItem): boolean {
    return (
      item.difference !== null && Math.abs(parseFloat(item.difference)) >= 0.01
    );
  }

  getModifiedCount(): number {
    return this.institutionGroups
      .flatMap((g) => g.accounts)
      .filter((a) => this.isModified(a)).length;
  }

  getAdjustmentCount(): number {
    return this.institutionGroups
      .flatMap((g) => g.accounts)
      .filter((a) => this.isModified(a) && a.create_adjustment && this.hasDifference(a))
      .length;
  }

  getDifferenceColor(difference: string): string {
    const diff = parseFloat(difference);
    if (Math.abs(diff) < 0.01) return '#52c41a';
    if (diff > 0) return '#faad14';
    return '#f5222d';
  }

  formatDifference(difference: string, currency: string): string {
    const diff = parseFloat(difference);
    if (Math.abs(diff) < 0.01) return '✓ Perfect';

    const symbol = this.currencyService.getCurrencySymbol(currency);
    const sign = diff > 0 ? '+' : '';
    return `${sign}${symbol}${Math.abs(diff).toFixed(2)}`;
  }

  formatBalance(balance: string, currency: string): string {
    const symbol = this.currencyService.getCurrencySymbol(currency);
    const amount = parseFloat(balance);
    return `${symbol}${amount.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }

  getAccountTypeColor(type: string): string {
    const colorMap: { [key: string]: string } = {
      Checking: 'blue',
      Savings: 'green',
      Cash: 'orange',
      Investment: 'purple',
      Retirement: 'cyan',
      'Credit Card': 'red',
      Loan: 'magenta',
      'Loan Given': 'gold',
    };
    return colorMap[type] || 'default';
  }

  submitBulkReconciliation(): void {
    const modifiedAccounts = this.getModifiedAccounts();
    if (modifiedAccounts.length === 0) return;

    this.submitting = true;
    this.cdr.markForCheck();

    const requests = modifiedAccounts.map((item) => {
      item.loading = true;
      item.success = false;
      item.error = null;

      const request: ReconciliationCreate = {
        account_id: item.account_id,
        reconciliation_date: this.formatDate(this.reconciliationDate),
        actual_balance: item.actual_balance!.toString(),
        note: item.note || undefined,
        create_adjustment: item.create_adjustment,
      };

      return this.reconciliationService.createReconciliation(request).pipe(
        map(() => ({
          account_id: item.account_id,
          success: true,
          error: null,
        })),
        catchError((err) =>
          of({
            account_id: item.account_id,
            success: false,
            error: err.error?.detail || 'Failed to reconcile',
          })
        )
      );
    });

    forkJoin(requests).subscribe((results) => {
      results.forEach((result) => {
        const item = this.findAccountItem(result.account_id);
        if (item) {
          item.loading = false;
          item.success = result.success;
          item.error = result.error;
        }
      });

      const successCount = results.filter((r) => r.success).length;
      const failCount = results.filter((r) => !r.success).length;

      if (failCount === 0) {
        this.messageService.success(
          `Successfully reconciled ${successCount} account${successCount > 1 ? 's' : ''}`
        );
      } else {
        this.messageService.warning(
          `${successCount} succeeded, ${failCount} failed. Check error indicators.`
        );
      }

      this.submitting = false;
      this.cdr.markForCheck();
    });
  }

  resetForm(): void {
    this.institutionGroups.forEach((group) => {
      group.accounts.forEach((item) => {
        item.actual_balance = null;
        item.difference = null;
        item.create_adjustment = true;
        item.note = '';
        item.loading = false;
        item.error = null;
        item.success = false;
      });
    });
    this.cdr.markForCheck();
  }

  private getModifiedAccounts(): BulkReconciliationItem[] {
    return this.institutionGroups
      .flatMap((g) => g.accounts)
      .filter((a) => this.isModified(a));
  }

  private findAccountItem(accountId: number): BulkReconciliationItem | null {
    for (const group of this.institutionGroups) {
      const item = group.accounts.find((a) => a.account_id === accountId);
      if (item) return item;
    }
    return null;
  }

  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  trackByInstitutionId(index: number, group: InstitutionGroup): number | string {
    return group.institution_id ?? 'other';
  }

  trackByAccountId(index: number, item: BulkReconciliationItem): number {
    return item.account_id;
  }
}
