import { Component, Input, Output, EventEmitter, OnInit, inject, OnChanges, SimpleChanges } from '@angular/core';

import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzSwitchModule } from 'ng-zorro-antd/switch';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import {
  ScheduledTransaction,
  ScheduledTransactionCreate,
  RecurrenceFrequency,
} from '../../../../core/models/transaction.model';
import { Account } from '../../../../core/models/account.model';
import { Category, CategoryType } from '../../../../core/models/category.model';

@Component({
  selector: 'app-transaction-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    NzFormModule,
    NzInputModule,
    NzSelectModule,
    NzButtonModule,
    NzDatePickerModule,
    NzInputNumberModule,
    NzSwitchModule,
    NzDividerModule,
    NzCheckboxModule
],
  template: `
    <form nz-form [formGroup]="transactionForm" (ngSubmit)="onSubmit()" [nzLayout]="'vertical'">
      <!-- Name -->
      <nz-form-item>
        <nz-form-label nzRequired>Transaction Name</nz-form-label>
        <nz-form-control nzErrorTip="Please enter transaction name">
          <input nz-input formControlName="name" placeholder="e.g., Monthly Salary" />
        </nz-form-control>
      </nz-form-item>

      <!-- Amount -->
      <nz-form-item>
        <nz-form-label nzRequired>Amount</nz-form-label>
        <nz-form-control nzErrorTip="Please enter amount">
          <nz-input-number
            formControlName="amount"
            [nzMin]="0"
            [nzStep]="0.01"
            [nzPrecision]="2"
            nzPlaceHolder="0.00"
            style="width: 100%;"
          ></nz-input-number>
        </nz-form-control>
      </nz-form-item>

      <!-- Currency -->
      <nz-form-item>
        <nz-form-label nzRequired>Currency</nz-form-label>
        <nz-form-control nzErrorTip="Please select currency">
          <nz-select formControlName="currency" nzPlaceHolder="Select currency" nzShowSearch>
            <nz-option nzValue="USD" nzLabel="USD - US Dollar"></nz-option>
            <nz-option nzValue="EUR" nzLabel="EUR - Euro"></nz-option>
            <nz-option nzValue="GBP" nzLabel="GBP - British Pound"></nz-option>
            <nz-option nzValue="JPY" nzLabel="JPY - Japanese Yen"></nz-option>
            <nz-option nzValue="CAD" nzLabel="CAD - Canadian Dollar"></nz-option>
            <nz-option nzValue="AUD" nzLabel="AUD - Australian Dollar"></nz-option>
            <nz-option nzValue="CHF" nzLabel="CHF - Swiss Franc"></nz-option>
            <nz-option nzValue="CNY" nzLabel="CNY - Chinese Yuan"></nz-option>
          </nz-select>
        </nz-form-control>
      </nz-form-item>

      <!-- Category -->
      <nz-form-item>
        <nz-form-label nzRequired>Category</nz-form-label>
        <nz-form-control nzErrorTip="Please select category">
          <nz-select formControlName="category_id" nzPlaceHolder="Select category" (ngModelChange)="onCategoryChange($event)">
            <nz-option-group nzLabel="Income">
              @for (category of getIncomeCategories(); track category.id) {
                <nz-option [nzValue]="category.id" [nzLabel]="category.name"></nz-option>
              }
            </nz-option-group>
            <nz-option-group nzLabel="Expenses">
              @for (category of getExpenseCategories(); track category.id) {
                <nz-option [nzValue]="category.id" [nzLabel]="category.name"></nz-option>
              }
            </nz-option-group>
            <nz-option-group nzLabel="Transfer">
              @for (category of getTransferCategories(); track category.id) {
                <nz-option [nzValue]="category.id" [nzLabel]="category.name"></nz-option>
              }
            </nz-option-group>
          </nz-select>
        </nz-form-control>
      </nz-form-item>

      <!-- Account (From) -->
      <nz-form-item>
        <nz-form-label nzRequired>Account</nz-form-label>
        <nz-form-control nzErrorTip="Please select account">
          <nz-select formControlName="account_id" nzPlaceHolder="Select account">
            @for (account of accounts; track account.id) {
              <nz-option [nzValue]="account.id" [nzLabel]="account.name"></nz-option>
            }
          </nz-select>
        </nz-form-control>
      </nz-form-item>

      <!-- To Account (for transfers) -->
      @if (showToAccount()) {
        <nz-form-item>
          <nz-form-label nzRequired>To Account</nz-form-label>
          <nz-form-control nzErrorTip="Please select destination account">
            <nz-select formControlName="to_account_id" nzPlaceHolder="Select destination account">
              @for (account of accounts; track account.id) {
                <nz-option [nzValue]="account.id" [nzLabel]="account.name"></nz-option>
              }
            </nz-select>
          </nz-form-control>
        </nz-form-item>
      }

      <!-- Note -->
      <nz-form-item>
        <nz-form-label>Note</nz-form-label>
        <nz-form-control>
          <textarea nz-input formControlName="note" placeholder="Optional note" [nzAutosize]="{ minRows: 2, maxRows: 4 }"></textarea>
        </nz-form-control>
      </nz-form-item>

      <nz-divider></nz-divider>

      <!-- Recurring toggle -->
      <nz-form-item>
        <nz-form-label>Recurring Transaction</nz-form-label>
        <nz-form-control>
          <label nz-checkbox formControlName="is_recurring" (ngModelChange)="onRecurringChange($event)">
            This is a recurring transaction
          </label>
        </nz-form-control>
      </nz-form-item>

      <!-- Recurrence fields (shown when is_recurring is true) -->
      @if (transactionForm.get('is_recurring')?.value) {
        <div class="recurrence-section">
          <!-- Frequency -->
          <nz-form-item>
            <nz-form-label nzRequired>Frequency</nz-form-label>
            <nz-form-control nzErrorTip="Please select frequency">
              <nz-select formControlName="recurrence_frequency" nzPlaceHolder="Select frequency">
                <nz-option [nzValue]="RecurrenceFrequency.MONTHLY" nzLabel="Monthly"></nz-option>
                <nz-option [nzValue]="RecurrenceFrequency.YEARLY" nzLabel="Yearly"></nz-option>
              </nz-select>
            </nz-form-control>
          </nz-form-item>

          <!-- Day of month -->
          <nz-form-item>
            <nz-form-label nzRequired>Day of Month</nz-form-label>
            <nz-form-control nzErrorTip="Please enter day (1-31 or -1 for last day)">
              <nz-input-number
                formControlName="recurrence_day"
                [nzMin]="-1"
                [nzMax]="31"
                [nzStep]="1"
                nzPlaceHolder="1-31 or -1 for last day"
                style="width: 100%;"
              ></nz-input-number>
            </nz-form-control>
          </nz-form-item>

          <!-- Month of year (for yearly recurrence) -->
          @if (transactionForm.get('recurrence_frequency')?.value === RecurrenceFrequency.YEARLY) {
            <nz-form-item>
              <nz-form-label nzRequired>Month</nz-form-label>
              <nz-form-control nzErrorTip="Please select month">
                <nz-select formControlName="recurrence_month" nzPlaceHolder="Select month">
                  <nz-option [nzValue]="1" nzLabel="January"></nz-option>
                  <nz-option [nzValue]="2" nzLabel="February"></nz-option>
                  <nz-option [nzValue]="3" nzLabel="March"></nz-option>
                  <nz-option [nzValue]="4" nzLabel="April"></nz-option>
                  <nz-option [nzValue]="5" nzLabel="May"></nz-option>
                  <nz-option [nzValue]="6" nzLabel="June"></nz-option>
                  <nz-option [nzValue]="7" nzLabel="July"></nz-option>
                  <nz-option [nzValue]="8" nzLabel="August"></nz-option>
                  <nz-option [nzValue]="9" nzLabel="September"></nz-option>
                  <nz-option [nzValue]="10" nzLabel="October"></nz-option>
                  <nz-option [nzValue]="11" nzLabel="November"></nz-option>
                  <nz-option [nzValue]="12" nzLabel="December"></nz-option>
                </nz-select>
              </nz-form-control>
            </nz-form-item>
          }

          <!-- Start date -->
          <nz-form-item>
            <nz-form-label nzRequired>Start Date</nz-form-label>
            <nz-form-control nzErrorTip="Please select start date">
              <nz-date-picker
                formControlName="recurrence_start_date"
                nzPlaceHolder="Select start date"
                style="width: 100%;"
              ></nz-date-picker>
            </nz-form-control>
          </nz-form-item>

          <!-- End date (optional) -->
          <nz-form-item>
            <nz-form-label>End Date (Optional)</nz-form-label>
            <nz-form-control>
              <nz-date-picker
                formControlName="recurrence_end_date"
                nzPlaceHolder="Leave empty for no end date"
                style="width: 100%;"
              ></nz-date-picker>
            </nz-form-control>
          </nz-form-item>
        </div>
      } @else {
        <!-- One-time date -->
        <nz-form-item>
          <nz-form-label nzRequired>Transaction Date</nz-form-label>
          <nz-form-control nzErrorTip="Please select transaction date">
            <nz-date-picker
              formControlName="recurrence_start_date"
              nzPlaceHolder="Select date"
              style="width: 100%;"
            ></nz-date-picker>
          </nz-form-control>
        </nz-form-item>
      }

      <!-- Form Actions -->
      <nz-form-item>
        <nz-form-control>
          <button nz-button nzType="default" type="button" (click)="onCancel()" style="margin-right: 8px;">
            Cancel
          </button>
          <button nz-button nzType="primary" type="submit" [nzLoading]="loading" [disabled]="!transactionForm.valid">
            {{ transaction ? 'Update' : 'Create' }} Transaction
          </button>
        </nz-form-control>
      </nz-form-item>
    </form>
  `,
  styles: [`
    .recurrence-section {
      padding: 16px;
      background: #fafafa;
      border-radius: 4px;
      margin-bottom: 16px;
    }
  `]
})
export class TransactionFormComponent implements OnInit, OnChanges {
  private fb = inject(FormBuilder);

  @Input() transaction: ScheduledTransaction | null = null;
  @Input() accounts: Account[] = [];
  @Input() categories: Category[] = [];
  @Input() loading = false;

  @Output() submitForm = new EventEmitter<ScheduledTransactionCreate>();
  @Output() cancel = new EventEmitter<void>();

  transactionForm!: FormGroup;
  RecurrenceFrequency = RecurrenceFrequency;
  selectedCategoryType: CategoryType | null = null;

  ngOnInit(): void {
    this.initForm();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['transaction'] && this.transactionForm) {
      this.initForm();
    }
  }

  initForm(): void {
    const isRecurring = this.transaction?.is_recurring || false;

    this.transactionForm = this.fb.group({
      name: [this.transaction?.name || '', [Validators.required, Validators.maxLength(255)]],
      amount: [this.transaction?.amount ? parseFloat(this.transaction.amount) : null, [Validators.required, Validators.min(0)]],
      currency: [this.transaction?.currency || 'USD', Validators.required],
      category_id: [this.transaction?.category_id || null, Validators.required],
      account_id: [this.transaction?.account_id || null, Validators.required],
      to_account_id: [this.transaction?.to_account_id || null],
      note: [this.transaction?.note || ''],
      is_recurring: [isRecurring],
      recurrence_frequency: [this.transaction?.recurrence_frequency || null],
      recurrence_day: [this.transaction?.recurrence_day || null],
      recurrence_month: [this.transaction?.recurrence_month || null],
      recurrence_start_date: [this.transaction?.recurrence_start_date ? new Date(this.transaction.recurrence_start_date) : null, Validators.required],
      recurrence_end_date: [this.transaction?.recurrence_end_date ? new Date(this.transaction.recurrence_end_date) : null],
    });

    // Set selected category type if editing
    if (this.transaction?.category_id) {
      const category = this.categories.find(c => c.id === this.transaction?.category_id);
      this.selectedCategoryType = category?.type || null;
    }

    this.updateRecurrenceValidators();
  }

  onCategoryChange(categoryId: number): void {
    const category = this.categories.find(c => c.id === categoryId);
    this.selectedCategoryType = category?.type || null;

    // Set or clear to_account_id based on category type
    if (this.selectedCategoryType === CategoryType.TRANSFER) {
      this.transactionForm.get('to_account_id')?.setValidators([Validators.required]);
    } else {
      this.transactionForm.get('to_account_id')?.clearValidators();
      this.transactionForm.get('to_account_id')?.setValue(null);
    }
    this.transactionForm.get('to_account_id')?.updateValueAndValidity();
  }

  onRecurringChange(_isRecurring: boolean): void {
    this.updateRecurrenceValidators();
  }

  updateRecurrenceValidators(): void {
    const isRecurring = this.transactionForm.get('is_recurring')?.value;

    if (isRecurring) {
      this.transactionForm.get('recurrence_frequency')?.setValidators([Validators.required]);
      this.transactionForm.get('recurrence_day')?.setValidators([Validators.required, Validators.min(-1), Validators.max(31)]);
    } else {
      this.transactionForm.get('recurrence_frequency')?.clearValidators();
      this.transactionForm.get('recurrence_day')?.clearValidators();
      this.transactionForm.get('recurrence_month')?.clearValidators();
      this.transactionForm.get('recurrence_end_date')?.clearValidators();
    }

    // Update validity
    this.transactionForm.get('recurrence_frequency')?.updateValueAndValidity();
    this.transactionForm.get('recurrence_day')?.updateValueAndValidity();
    this.transactionForm.get('recurrence_month')?.updateValueAndValidity();
    this.transactionForm.get('recurrence_end_date')?.updateValueAndValidity();
  }

  showToAccount(): boolean {
    return this.selectedCategoryType === CategoryType.TRANSFER;
  }

  getIncomeCategories(): Category[] {
    return this.categories.filter(c => c.type === CategoryType.INCOME);
  }

  getExpenseCategories(): Category[] {
    return this.categories.filter(c => c.type === CategoryType.EXPENSE);
  }

  getTransferCategories(): Category[] {
    return this.categories.filter(c => c.type === CategoryType.TRANSFER);
  }

  onSubmit(): void {
    if (this.transactionForm.valid) {
      const formValue = this.transactionForm.value;

      // Format dates to ISO string (YYYY-MM-DD)
      const formatDate = (date: Date | null): string | undefined => {
        return date ? new Date(date).toISOString().split('T')[0] : undefined;
      };

      const data: ScheduledTransactionCreate = {
        name: formValue.name,
        amount: formValue.amount.toString(),
        currency: formValue.currency,
        category_id: formValue.category_id,
        account_id: formValue.account_id,
        to_account_id: formValue.to_account_id || undefined,
        note: formValue.note || undefined,
        is_recurring: formValue.is_recurring,
        recurrence_frequency: formValue.is_recurring ? formValue.recurrence_frequency : undefined,
        recurrence_day: formValue.is_recurring ? formValue.recurrence_day : undefined,
        recurrence_month: formValue.is_recurring && formValue.recurrence_frequency === RecurrenceFrequency.YEARLY ? formValue.recurrence_month : undefined,
        recurrence_start_date: formatDate(formValue.recurrence_start_date),
        recurrence_end_date: formValue.is_recurring ? formatDate(formValue.recurrence_end_date) : undefined,
      };

      this.submitForm.emit(data);
    }
  }

  onCancel(): void {
    this.cancel.emit();
  }
}
