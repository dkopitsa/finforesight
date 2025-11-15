import { Component, Input, Output, EventEmitter, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzBadgeModule } from 'ng-zorro-antd/badge';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { TransactionFilter } from '../../../../core/models/transaction.model';
import { Account } from '../../../../core/models/account.model';
import { Category, CategoryType } from '../../../../core/models/category.model';

@Component({
  selector: 'app-transaction-filters',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    NzCardModule,
    NzFormModule,
    NzInputModule,
    NzSelectModule,
    NzButtonModule,
    NzIconModule,
    NzDatePickerModule,
    NzGridModule,
    NzBadgeModule,
  ],
  template: `
    <nz-card nzTitle="Filters" [nzExtra]="extraTemplate" nzSize="small">
      <form nz-form [formGroup]="filterForm" [nzLayout]="'vertical'">
        <div nz-row [nzGutter]="16">
          <!-- Search -->
          <div nz-col [nzXs]="24" [nzMd]="12" [nzLg]="6">
            <nz-form-item>
              <nz-form-label>Search</nz-form-label>
              <nz-form-control>
                <nz-input-group [nzPrefix]="searchIcon">
                  <input
                    nz-input
                    formControlName="search"
                    placeholder="Search transactions..."
                  />
                </nz-input-group>
              </nz-form-control>
            </nz-form-item>
          </div>

          <!-- Category -->
          <div nz-col [nzXs]="24" [nzMd]="12" [nzLg]="6">
            <nz-form-item>
              <nz-form-label>Category</nz-form-label>
              <nz-form-control>
                <nz-select
                  formControlName="category_id"
                  nzPlaceHolder="All categories"
                  nzAllowClear
                  nzShowSearch
                >
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
          </div>

          <!-- Account -->
          <div nz-col [nzXs]="24" [nzMd]="12" [nzLg]="6">
            <nz-form-item>
              <nz-form-label>Account</nz-form-label>
              <nz-form-control>
                <nz-select
                  formControlName="account_id"
                  nzPlaceHolder="All accounts"
                  nzAllowClear
                  nzShowSearch
                >
                  @for (account of accounts; track account.id) {
                    <nz-option [nzValue]="account.id" [nzLabel]="account.name"></nz-option>
                  }
                </nz-select>
              </nz-form-control>
            </nz-form-item>
          </div>

          <!-- Recurrence Type -->
          <div nz-col [nzXs]="24" [nzMd]="12" [nzLg]="6">
            <nz-form-item>
              <nz-form-label>Type</nz-form-label>
              <nz-form-control>
                <nz-select
                  formControlName="is_recurring"
                  nzPlaceHolder="All types"
                  nzAllowClear
                >
                  <nz-option [nzValue]="true" nzLabel="Recurring"></nz-option>
                  <nz-option [nzValue]="false" nzLabel="One-time"></nz-option>
                </nz-select>
              </nz-form-control>
            </nz-form-item>
          </div>

          <!-- Date Range -->
          <div nz-col [nzXs]="24" [nzMd]="24" [nzLg]="12">
            <nz-form-item>
              <nz-form-label>Date Range</nz-form-label>
              <nz-form-control>
                <nz-range-picker
                  formControlName="dateRange"
                  [nzFormat]="'yyyy-MM-dd'"
                  style="width: 100%;"
                ></nz-range-picker>
              </nz-form-control>
            </nz-form-item>
          </div>

          <!-- Quick Date Filters -->
          <div nz-col [nzXs]="24" [nzMd]="24" [nzLg]="12">
            <nz-form-item>
              <nz-form-label>Quick Filters</nz-form-label>
              <nz-form-control>
                <div class="quick-filters">
                  <button
                    nz-button
                    nzType="default"
                    nzSize="small"
                    (click)="setDateRange('thisMonth')"
                    type="button"
                  >
                    This Month
                  </button>
                  <button
                    nz-button
                    nzType="default"
                    nzSize="small"
                    (click)="setDateRange('lastMonth')"
                    type="button"
                  >
                    Last Month
                  </button>
                  <button
                    nz-button
                    nzType="default"
                    nzSize="small"
                    (click)="setDateRange('thisYear')"
                    type="button"
                  >
                    This Year
                  </button>
                  <button
                    nz-button
                    nzType="default"
                    nzSize="small"
                    (click)="setDateRange('lastYear')"
                    type="button"
                  >
                    Last Year
                  </button>
                </div>
              </nz-form-control>
            </nz-form-item>
          </div>
        </div>
      </form>

      <ng-template #extraTemplate>
        <nz-badge [nzCount]="activeFilterCount" [nzShowZero]="false">
          <button
            nz-button
            nzType="link"
            nzSize="small"
            (click)="clearFilters()"
            [disabled]="activeFilterCount === 0"
          >
            <span nz-icon nzType="close-circle" nzTheme="outline"></span>
            Clear
          </button>
        </nz-badge>
      </ng-template>

      <ng-template #searchIcon>
        <span nz-icon nzType="search" nzTheme="outline"></span>
      </ng-template>
    </nz-card>
  `,
  styles: [`
    .quick-filters {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }

    :host ::ng-deep .ant-form-item {
      margin-bottom: 8px;
    }

    :host ::ng-deep .ant-form-item-label {
      padding-bottom: 4px;
    }

    :host ::ng-deep .ant-form-item-label > label {
      font-size: 12px;
      font-weight: 500;
    }
  `]
})
export class TransactionFiltersComponent implements OnInit {
  private fb = inject(FormBuilder);

  @Input() accounts: Account[] = [];
  @Input() categories: Category[] = [];
  @Input() initialFilters?: TransactionFilter;

  @Output() filtersChange = new EventEmitter<TransactionFilter>();

  filterForm!: FormGroup;
  activeFilterCount = 0;

  ngOnInit(): void {
    this.initForm();
    this.setupFormSubscription();
  }

  initForm(): void {
    this.filterForm = this.fb.group({
      search: [this.initialFilters?.search || ''],
      category_id: [this.initialFilters?.category_id || null],
      account_id: [this.initialFilters?.account_id || null],
      is_recurring: [this.initialFilters?.is_recurring ?? null],
      dateRange: [this.getInitialDateRange()],
    });
  }

  getInitialDateRange(): [Date, Date] | null {
    if (this.initialFilters?.date_from && this.initialFilters?.date_to) {
      return [
        new Date(this.initialFilters.date_from),
        new Date(this.initialFilters.date_to),
      ];
    }
    return null;
  }

  setupFormSubscription(): void {
    this.filterForm.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged()
      )
      .subscribe(() => {
        this.emitFilters();
      });

    // Initial emit if there are initial filters
    if (this.initialFilters && Object.keys(this.initialFilters).length > 0) {
      this.emitFilters();
    }
  }

  emitFilters(): void {
    const formValue = this.filterForm.value;
    const filters: TransactionFilter = {};

    if (formValue.search && formValue.search.trim()) {
      filters.search = formValue.search.trim();
    }

    if (formValue.category_id !== null && formValue.category_id !== undefined) {
      filters.category_id = formValue.category_id;
    }

    if (formValue.account_id !== null && formValue.account_id !== undefined) {
      filters.account_id = formValue.account_id;
    }

    if (formValue.is_recurring !== null && formValue.is_recurring !== undefined) {
      filters.is_recurring = formValue.is_recurring;
    }

    if (formValue.dateRange && formValue.dateRange.length === 2) {
      const [start, end] = formValue.dateRange;
      filters.date_from = this.formatDate(start);
      filters.date_to = this.formatDate(end);
    }

    this.updateActiveFilterCount(filters);
    this.filtersChange.emit(filters);
  }

  updateActiveFilterCount(filters: TransactionFilter): void {
    this.activeFilterCount = Object.keys(filters).length;
  }

  clearFilters(): void {
    this.filterForm.reset({
      search: '',
      category_id: null,
      account_id: null,
      is_recurring: null,
      dateRange: null,
    });
  }

  setDateRange(period: 'thisMonth' | 'lastMonth' | 'thisYear' | 'lastYear'): void {
    const now = new Date();
    let start: Date;
    let end: Date;

    switch (period) {
      case 'thisMonth':
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        break;
      case 'lastMonth':
        start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        end = new Date(now.getFullYear(), now.getMonth(), 0);
        break;
      case 'thisYear':
        start = new Date(now.getFullYear(), 0, 1);
        end = new Date(now.getFullYear(), 11, 31);
        break;
      case 'lastYear':
        start = new Date(now.getFullYear() - 1, 0, 1);
        end = new Date(now.getFullYear() - 1, 11, 31);
        break;
    }

    this.filterForm.patchValue({
      dateRange: [start, end],
    });
  }

  formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
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
}
