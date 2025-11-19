import {Component, Input, Output, EventEmitter, OnInit, inject, ChangeDetectionStrategy, ChangeDetectorRef, OnChanges, SimpleChanges} from '@angular/core';

import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { Account } from '../../../../core/models/account.model';
import { ReconciliationCreate } from '../../../../core/models/reconciliation.model';
import { CurrencyService } from '../../../../core/services/currency.service';

@Component({
  selector: 'app-reconciliation-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    ReactiveFormsModule,
    NzModalModule,
    NzFormModule,
    NzInputModule,
    NzSelectModule,
    NzButtonModule,
    NzDatePickerModule,
    NzCheckboxModule,
    NzInputNumberModule,
    NzAlertModule
],
  template: `
    <nz-modal
      [(nzVisible)]="visible"
      [nzTitle]="'Reconcile Account'"
      [nzWidth]="600"
      (nzOnCancel)="handleCancel()"
      [nzFooter]="null"
    >
      <ng-container *nzModalContent>
        <nz-alert
          nzType="info"
          nzShowIcon
          nzMessage="Account Reconciliation"
          nzDescription="Enter the actual balance from your bank statement to reconcile with the expected balance."
          style="margin-bottom: 24px;"
        ></nz-alert>

        <form nz-form [formGroup]="reconciliationForm" [nzLayout]="'vertical'">
          <!-- Account Selection -->
          <nz-form-item>
            <nz-form-label nzRequired>Account</nz-form-label>
            <nz-form-control nzErrorTip="Please select an account">
              <nz-select
                formControlName="account_id"
                nzPlaceHolder="Select account to reconcile"
                nzShowSearch
                (ngModelChange)="onAccountChange($event)"
              >
                @for (account of accounts; track account.id) {
                  <nz-option [nzValue]="account.id" [nzLabel]="account.name"></nz-option>
                }
              </nz-select>
            </nz-form-control>
          </nz-form-item>

          <!-- Reconciliation Date -->
          <nz-form-item>
            <nz-form-label nzRequired>Reconciliation Date</nz-form-label>
            <nz-form-control nzErrorTip="Please select a date">
              <nz-date-picker
                formControlName="reconciliation_date"
                [nzFormat]="'yyyy-MM-dd'"
                style="width: 100%;"
              ></nz-date-picker>
            </nz-form-control>
          </nz-form-item>

          <!-- Expected Balance (read-only, calculated) -->
          @if (selectedAccount) {
            <nz-form-item>
              <nz-form-label>Expected Balance</nz-form-label>
              <nz-form-control>
                <div class="balance-display expected">
                  {{ getCurrencySymbol() }}{{ selectedAccount.initial_balance }}
                </div>
                <div class="balance-hint">
                  Based on initial balance (forecast integration pending)
                </div>
              </nz-form-control>
            </nz-form-item>
          }

          <!-- Actual Balance -->
          <nz-form-item>
            <nz-form-label nzRequired>Actual Balance</nz-form-label>
            <nz-form-control nzErrorTip="Please enter the actual balance">
              <nz-input-number
                formControlName="actual_balance"
                [nzMin]="0"
                [nzStep]="0.01"
                [nzPrecision]="2"
                [nzFormatter]="currencyFormatter"
                [nzParser]="currencyParser"
                style="width: 100%;"
                nzPlaceHolder="Enter actual balance from bank"
              ></nz-input-number>
            </nz-form-control>
          </nz-form-item>

          <!-- Difference Display -->
          @if (showDifference()) {
            <nz-alert
              [nzType]="getDifferenceType()"
              nzShowIcon
              [nzMessage]="getDifferenceMessage()"
              style="margin-bottom: 16px;"
            ></nz-alert>
          }

          <!-- Create Adjustment -->
          <nz-form-item>
            <nz-form-control>
              <label nz-checkbox formControlName="create_adjustment">
                <span>Create adjustment transaction if difference exists</span>
              </label>
              <div class="checkbox-hint">
                This will create a transaction to balance your account
              </div>
            </nz-form-control>
          </nz-form-item>

          <!-- Note -->
          <nz-form-item>
            <nz-form-label>Note</nz-form-label>
            <nz-form-control>
              <textarea
                nz-input
                formControlName="note"
                [nzAutosize]="{ minRows: 2, maxRows: 4 }"
                placeholder="Optional note (e.g., bank statement reference)"
              ></textarea>
            </nz-form-control>
          </nz-form-item>

          <!-- Action Buttons -->
          <nz-form-item>
            <nz-form-control>
              <div class="form-actions">
                <button nz-button nzType="default" (click)="handleCancel()" type="button">
                  Cancel
                </button>
                <button
                  nz-button
                  nzType="primary"
                  (click)="handleSubmit()"
                  [nzLoading]="loading"
                  [disabled]="!reconciliationForm.valid"
                  type="button"
                >
                  Reconcile Account
                </button>
              </div>
            </nz-form-control>
          </nz-form-item>
        </form>
      </ng-container>
    </nz-modal>
  `,
  styles: [`
    .balance-display {
      font-size: 24px;
      font-weight: 600;
      padding: 12px 16px;
      background: #f5f5f5;
      border-radius: 4px;
      text-align: center;
    }

    .balance-display.expected {
      color: #1890ff;
    }

    .balance-hint {
      font-size: 12px;
      color: #8c8c8c;
      margin-top: 8px;
    }

    .checkbox-hint {
      font-size: 12px;
      color: #8c8c8c;
      margin-top: 4px;
    }

    .form-actions {
      display: flex;
      justify-content: flex-end;
      gap: 8px;
    }

    :host ::ng-deep .ant-form-item {
      margin-bottom: 16px;
    }
  `]
})
export class ReconciliationFormComponent implements OnInit, OnChanges {
  private fb = inject(FormBuilder);
  private cdr = inject(ChangeDetectorRef);
  private currencyService = inject(CurrencyService);

  @Input() visible = false;
  @Input() accounts: Account[] = [];
  @Input() loading = false;

  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() submitForm = new EventEmitter<ReconciliationCreate>();
  @Output() cancel = new EventEmitter<void>();

  reconciliationForm!: FormGroup;
  selectedAccount: Account | null = null;

  ngOnInit(): void {
    this.initForm();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['visible'] || changes['accounts'] || changes['loading']) {
      this.cdr.markForCheck();
    }
  }

  initForm(): void {
    this.reconciliationForm = this.fb.group({
      account_id: [null, [Validators.required]],
      reconciliation_date: [new Date(), [Validators.required]],
      actual_balance: [null, [Validators.required, Validators.min(0)]],
      note: [''],
      create_adjustment: [true],
    });
  }

  onAccountChange(accountId: number): void {
    this.selectedAccount = this.accounts.find(a => a.id === accountId) || null;
    this.cdr.markForCheck();
  }

  showDifference(): boolean {
    const actualBalance = this.reconciliationForm.get('actual_balance')?.value;
    return this.selectedAccount !== null && actualBalance !== null;
  }

  getDifference(): number {
    if (!this.selectedAccount) return 0;
    const actual = this.reconciliationForm.get('actual_balance')?.value || 0;
    const expected = parseFloat(this.selectedAccount.initial_balance);
    return actual - expected;
  }

  getDifferenceType(): 'success' | 'warning' | 'error' {
    const diff = this.getDifference();
    if (Math.abs(diff) < 0.01) return 'success';
    return 'warning';
  }

  getDifferenceMessage(): string {
    const diff = this.getDifference();
    if (Math.abs(diff) < 0.01) {
      return 'Perfect match! No adjustment needed.';
    }
    const absDiff = Math.abs(diff);
    if (diff > 0) {
      return `Actual balance is ${this.getCurrencySymbol()}${absDiff.toFixed(2)} higher than expected`;
    } else {
      return `Actual balance is ${this.getCurrencySymbol()}${absDiff.toFixed(2)} lower than expected`;
    }
  }

  getCurrencySymbol(): string {
    if (!this.selectedAccount) return '$';
    return this.currencyService.getCurrencySymbol(this.selectedAccount.currency);
  }

  currencyFormatter = (value: number): string => {
    return `${this.getCurrencySymbol()}${value}`;
  };

  currencyParser = (value: string): number => {
    const parsed = value.replace(/[^\d.]/g, '');
    return parseFloat(parsed) || 0;
  };

  handleSubmit(): void {
    if (this.reconciliationForm.valid) {
      const formValue = this.reconciliationForm.value;
      const data: ReconciliationCreate = {
        account_id: formValue.account_id,
        reconciliation_date: this.formatDate(formValue.reconciliation_date),
        actual_balance: formValue.actual_balance.toString(),
        note: formValue.note || undefined,
        create_adjustment: formValue.create_adjustment,
      };
      this.submitForm.emit(data);
    }
  }

  handleCancel(): void {
    this.visible = false;
    this.visibleChange.emit(false);
    this.cancel.emit();
    this.reconciliationForm.reset({
      reconciliation_date: new Date(),
      create_adjustment: true,
    });
    this.selectedAccount = null;
    this.cdr.markForCheck();
  }

  formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }
}
