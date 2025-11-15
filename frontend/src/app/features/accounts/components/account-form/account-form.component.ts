import { Component, Input, Output, EventEmitter, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { Account, AccountType, AccountCreate, AccountUpdate } from '../../../../core/models/account.model';

@Component({
  selector: 'app-account-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    NzFormModule,
    NzInputModule,
    NzSelectModule,
    NzButtonModule,
    NzDatePickerModule,
    NzInputNumberModule,
  ],
  template: `
    <form nz-form [formGroup]="accountForm" (ngSubmit)="onSubmit()" [nzLayout]="'vertical'">
      <nz-form-item>
        <nz-form-label nzRequired>Account Name</nz-form-label>
        <nz-form-control nzErrorTip="Please enter account name (1-255 characters)">
          <input nz-input formControlName="name" placeholder="e.g., Main Checking Account" />
        </nz-form-control>
      </nz-form-item>

      <nz-form-item>
        <nz-form-label nzRequired>Account Type</nz-form-label>
        <nz-form-control nzErrorTip="Please select account type">
          <nz-select formControlName="type" nzPlaceHolder="Select account type">
            <nz-option-group nzLabel="Liquid Assets">
              <nz-option [nzValue]="AccountType.CHECKING" nzLabel="Checking"></nz-option>
              <nz-option [nzValue]="AccountType.SAVINGS" nzLabel="Savings"></nz-option>
              <nz-option [nzValue]="AccountType.CASH" nzLabel="Cash"></nz-option>
            </nz-option-group>
            <nz-option-group nzLabel="Investments">
              <nz-option [nzValue]="AccountType.INVESTMENT" nzLabel="Investment"></nz-option>
              <nz-option [nzValue]="AccountType.RETIREMENT" nzLabel="Retirement"></nz-option>
            </nz-option-group>
            <nz-option-group nzLabel="Credit">
              <nz-option [nzValue]="AccountType.CREDIT_CARD" nzLabel="Credit Card"></nz-option>
              <nz-option [nzValue]="AccountType.LOAN" nzLabel="Loan"></nz-option>
            </nz-option-group>
            <nz-option-group nzLabel="Receivables">
              <nz-option [nzValue]="AccountType.LOAN_GIVEN" nzLabel="Loan Given"></nz-option>
            </nz-option-group>
          </nz-select>
        </nz-form-control>
      </nz-form-item>

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

      <nz-form-item>
        <nz-form-label nzRequired>Initial Balance</nz-form-label>
        <nz-form-control nzErrorTip="Please enter initial balance">
          <nz-input-number
            formControlName="initial_balance"
            [nzMin]="0"
            [nzStep]="0.01"
            [nzPrecision]="2"
            nzPlaceHolder="0.00"
            style="width: 100%;"
          ></nz-input-number>
        </nz-form-control>
      </nz-form-item>

      <nz-form-item>
        <nz-form-label nzRequired>Initial Balance Date</nz-form-label>
        <nz-form-control nzErrorTip="Please select initial balance date">
          <nz-date-picker
            formControlName="initial_balance_date"
            nzPlaceHolder="Select date"
            style="width: 100%;"
          ></nz-date-picker>
        </nz-form-control>
      </nz-form-item>

      @if (showCreditLimit()) {
        <nz-form-item>
          <nz-form-label>Credit Limit</nz-form-label>
          <nz-form-control nzErrorTip="Credit limit must be non-negative">
            <nz-input-number
              formControlName="credit_limit"
              [nzMin]="0"
              [nzStep]="0.01"
              [nzPrecision]="2"
              nzPlaceHolder="0.00"
              style="width: 100%;"
            ></nz-input-number>
          </nz-form-control>
        </nz-form-item>
      }

      <nz-form-item>
        <nz-form-control>
          <button nz-button nzType="primary" type="submit" [nzLoading]="loading" [disabled]="!accountForm.valid">
            {{ editMode ? 'Update' : 'Create' }} Account
          </button>
          <button nz-button type="button" (click)="onCancel()" style="margin-left: 8px;">
            Cancel
          </button>
        </nz-form-control>
      </nz-form-item>
    </form>
  `,
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class AccountFormComponent implements OnInit {
  private fb = inject(FormBuilder);

  @Input() account: Account | null = null;
  @Input() loading = false;

  @Output() submitForm = new EventEmitter<AccountCreate | AccountUpdate>();
  @Output() cancel = new EventEmitter<void>();

  accountForm!: FormGroup;
  editMode = false;
  AccountType = AccountType;

  ngOnInit(): void {
    this.editMode = !!this.account;
    this.initForm();

    if (this.account) {
      this.populateForm();
    }
  }

  private initForm(): void {
    this.accountForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(1), Validators.maxLength(255)]],
      type: [null, [Validators.required]],
      currency: ['USD', [Validators.required, Validators.pattern(/^[A-Z]{3}$/)]],
      initial_balance: [0, [Validators.required, Validators.min(0)]],
      initial_balance_date: [new Date(), [Validators.required]],
      credit_limit: [null, [Validators.min(0)]],
    });
  }

  private populateForm(): void {
    if (!this.account) return;

    this.accountForm.patchValue({
      name: this.account.name,
      type: this.account.type,
      currency: this.account.currency,
      initial_balance: parseFloat(this.account.initial_balance),
      initial_balance_date: new Date(this.account.initial_balance_date),
      credit_limit: this.account.credit_limit ? parseFloat(this.account.credit_limit) : null,
    });
  }

  showCreditLimit(): boolean {
    const type = this.accountForm.get('type')?.value;
    return type === AccountType.CREDIT_CARD || type === AccountType.LOAN;
  }

  onSubmit(): void {
    if (this.accountForm.invalid) return;

    const formValue = this.accountForm.value;
    const data: AccountCreate | AccountUpdate = {
      name: formValue.name,
      type: formValue.type,
      currency: formValue.currency,
      initial_balance: formValue.initial_balance.toString(),
      initial_balance_date: this.formatDate(formValue.initial_balance_date),
      credit_limit: formValue.credit_limit ? formValue.credit_limit.toString() : undefined,
    };

    this.submitForm.emit(data);
  }

  onCancel(): void {
    this.cancel.emit();
  }

  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
