import {Component, Input, Output, EventEmitter, OnInit, inject, ChangeDetectionStrategy} from '@angular/core';

import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { Account } from '../../../../core/models/account.model';
import { ForecastParams } from '../../services/forecast.service';

@Component({
  selector: 'app-forecast-filters',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    ReactiveFormsModule,
    NzCardModule,
    NzFormModule,
    NzDatePickerModule,
    NzSelectModule,
    NzButtonModule,
    NzIconModule,
    NzGridModule
],
  template: `
    <nz-card nzTitle="Forecast Settings" nzSize="small">
      <form nz-form [formGroup]="filterForm" [nzLayout]="'vertical'">
        <div nz-row [nzGutter]="16">
          <!-- Date Range -->
          <div nz-col [nzXs]="24" [nzMd]="12">
            <nz-form-item>
              <nz-form-label nzRequired>Forecast Period</nz-form-label>
              <nz-form-control nzErrorTip="Please select date range">
                <nz-range-picker
                  formControlName="dateRange"
                  [nzFormat]="'yyyy-MM-dd'"
                  style="width: 100%;"
                  [nzDisabledDate]="disabledDate"
                ></nz-range-picker>
              </nz-form-control>
            </nz-form-item>
          </div>

          <!-- Account Filter -->
          <div nz-col [nzXs]="24" [nzMd]="12">
            <nz-form-item>
              <nz-form-label>Accounts</nz-form-label>
              <nz-form-control>
                <nz-select
                  formControlName="account_ids"
                  nzMode="multiple"
                  nzPlaceHolder="All accounts"
                  nzShowSearch
                  nzAllowClear
                >
                  @for (account of accounts; track account.id) {
                    <nz-option [nzValue]="account.id" [nzLabel]="account.name"></nz-option>
                  }
                </nz-select>
              </nz-form-control>
            </nz-form-item>
          </div>

          <!-- Quick Filters -->
          <div nz-col [nzSpan]="24">
            <nz-form-item>
              <nz-form-label>Quick Periods</nz-form-label>
              <nz-form-control>
                <div class="quick-filters">
                  <button
                    nz-button
                    nzType="default"
                    nzSize="small"
                    (click)="setQuickPeriod(30)"
                    type="button"
                  >
                    Next 30 Days
                  </button>
                  <button
                    nz-button
                    nzType="default"
                    nzSize="small"
                    (click)="setQuickPeriod(90)"
                    type="button"
                  >
                    Next 3 Months
                  </button>
                  <button
                    nz-button
                    nzType="default"
                    nzSize="small"
                    (click)="setQuickPeriod(180)"
                    type="button"
                  >
                    Next 6 Months
                  </button>
                  <button
                    nz-button
                    nzType="default"
                    nzSize="small"
                    (click)="setQuickPeriod(365)"
                    type="button"
                  >
                    Next Year
                  </button>
                </div>
              </nz-form-control>
            </nz-form-item>
          </div>

          <!-- Apply Button -->
          <div nz-col [nzSpan]="24">
            <button
              nz-button
              nzType="primary"
              (click)="applyFilters()"
              [disabled]="!filterForm.valid"
              style="width: 100%;"
            >
              <span nz-icon nzType="line-chart" nzTheme="outline"></span>
              Generate Forecast
            </button>
          </div>
        </div>
      </form>
    </nz-card>
  `,
  styles: [`
    .quick-filters {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }

    :host ::ng-deep .ant-form-item {
      margin-bottom: 16px;
    }

    :host ::ng-deep .ant-form-item-label > label {
      font-size: 13px;
      font-weight: 500;
    }
  `]
})
export class ForecastFiltersComponent implements OnInit {
  private fb = inject(FormBuilder);

  @Input() accounts: Account[] = [];
  @Output() filtersApplied = new EventEmitter<ForecastParams>();

  filterForm!: FormGroup;

  ngOnInit(): void {
    this.initForm();
  }

  initForm(): void {
    const today = new Date();
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);

    this.filterForm = this.fb.group({
      dateRange: [[today, nextMonth], [Validators.required]],
      account_ids: [[]],
    });
  }

  setQuickPeriod(days: number): void {
    const today = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + days);

    this.filterForm.patchValue({
      dateRange: [today, endDate],
    });
  }

  applyFilters(): void {
    if (this.filterForm.valid) {
      const formValue = this.filterForm.value;
      const [startDate, endDate] = formValue.dateRange;

      const params: ForecastParams = {
        from_date: this.formatDate(startDate),
        to_date: this.formatDate(endDate),
        account_ids: formValue.account_ids?.length > 0 ? formValue.account_ids : undefined,
      };

      this.filtersApplied.emit(params);
    }
  }

  formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  disabledDate = (current: Date): boolean => {
    // Disable past dates
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return current.getTime() < today.getTime();
  };
}
