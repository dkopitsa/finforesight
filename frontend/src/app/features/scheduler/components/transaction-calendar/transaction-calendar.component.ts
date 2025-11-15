import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges } from '@angular/core';

import { FormsModule } from '@angular/forms';
import { NzCalendarModule } from 'ng-zorro-antd/calendar';
import { NzBadgeModule } from 'ng-zorro-antd/badge';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzPopoverModule } from 'ng-zorro-antd/popover';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { TransactionInstance } from '../../../../core/models/transaction.model';
import { Account } from '../../../../core/models/account.model';
import { Category, CategoryType } from '../../../../core/models/category.model';

@Component({
  selector: 'app-transaction-calendar',
  standalone: true,
  imports: [
    FormsModule,
    NzCalendarModule,
    NzBadgeModule,
    NzTagModule,
    NzCardModule,
    NzButtonModule,
    NzIconModule,
    NzPopoverModule,
    NzEmptyModule
],
  template: `
    <nz-card>
      <nz-calendar
        [nzFullscreen]="true"
        [(ngModel)]="selectedDate"
        (ngModelChange)="onDateChange($event)"
        (nzPanelChange)="onPanelChange($event)"
      >
        <ng-container *nzDateCell="let date">
          <div class="calendar-cell" (click)="onDateClick(date)">
            <div class="cell-content">
              @if (getInstancesForDate(date).length > 0) {
                <div class="instances-container">
                  @for (instance of getInstancesForDate(date); track instance.id) {
                    <div
                      class="instance-item"
                      [style.border-left-color]="getInstanceColor(instance)"
                      (click)="onInstanceClick($event, instance)"
                      nz-popover
                      [nzPopoverContent]="instanceDetails"
                      nzPopoverPlacement="right"
                    >
                      <div class="instance-name">{{ instance.name }}</div>
                      <div class="instance-amount" [style.color]="getInstanceColor(instance)">
                        {{ formatAmount(instance.amount, instance.currency) }}
                      </div>
                    </div>

                    <ng-template #instanceDetails>
                      <div style="max-width: 250px;">
                        <div style="margin-bottom: 8px;">
                          <strong>{{ instance.name }}</strong>
                        </div>
                        <div style="margin-bottom: 4px;">
                          <nz-tag [nzColor]="getCategoryTypeColor(instance.category_id)">
                            {{ getCategoryName(instance.category_id) }}
                          </nz-tag>
                        </div>
                        <div style="margin-bottom: 4px;">
                          Amount: <strong [style.color]="getInstanceColor(instance)">
                            {{ formatAmount(instance.amount, instance.currency) }}
                          </strong>
                        </div>
                        <div style="margin-bottom: 4px;">
                          Account: {{ getAccountName(instance.account_id) }}
                        </div>
                        @if (instance.to_account_id) {
                          <div style="margin-bottom: 4px;">
                            To: {{ getAccountName(instance.to_account_id) }}
                          </div>
                        }
                        @if (instance.is_exception) {
                          <div>
                            <nz-tag nzColor="orange">Modified</nz-tag>
                          </div>
                        }
                      </div>
                    </ng-template>
                  }
                </div>
              } @else {
                <div class="empty-day">
                  <span class="add-hint">+</span>
                </div>
              }
            </div>
          </div>
        </ng-container>

        <ng-container *nzMonthCell="let month">
          <div class="month-cell">
            {{ getMonthLabel(month) }}
            <div class="month-stats">
              {{ getMonthInstanceCount(month) }} transactions
            </div>
          </div>
        </ng-container>
      </nz-calendar>

      @if (instances.length === 0) {
        <nz-empty
          nzNotFoundContent="No transactions for this period"
          [nzNotFoundFooter]="emptyFooter"
        >
          <ng-template #emptyFooter>
            <p style="color: #8c8c8c;">Create transactions to see them on the calendar</p>
          </ng-template>
        </nz-empty>
      }
    </nz-card>
  `,
  styles: [`
    .calendar-cell {
      min-height: 80px;
      padding: 4px;
      cursor: pointer;
      transition: background-color 0.2s;
    }

    .calendar-cell:hover {
      background-color: #f5f5f5;
    }

    .cell-content {
      height: 100%;
    }

    .instances-container {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .instance-item {
      padding: 4px 6px;
      background: white;
      border-left: 3px solid #1890ff;
      border-radius: 2px;
      font-size: 12px;
      cursor: pointer;
      transition: all 0.2s;
      box-shadow: 0 1px 2px rgba(0,0,0,0.05);
    }

    .instance-item:hover {
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      transform: translateX(2px);
    }

    .instance-name {
      font-weight: 500;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      margin-bottom: 2px;
    }

    .instance-amount {
      font-weight: 600;
      font-size: 11px;
    }

    .empty-day {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100%;
      min-height: 80px;
      opacity: 0;
      transition: opacity 0.2s;
    }

    .calendar-cell:hover .empty-day {
      opacity: 0.3;
    }

    .add-hint {
      font-size: 24px;
      color: #d9d9d9;
    }

    .month-cell {
      text-align: center;
      padding: 16px;
    }

    .month-stats {
      font-size: 12px;
      color: #8c8c8c;
      margin-top: 4px;
    }

    :host ::ng-deep .ant-picker-calendar-full .ant-picker-panel .ant-picker-calendar-date {
      border-top: 2px solid #f0f0f0;
    }

    :host ::ng-deep .ant-picker-calendar-full .ant-picker-panel .ant-picker-calendar-date-today {
      border-top-color: #1890ff;
    }

    :host ::ng-deep .ant-picker-calendar-full .ant-picker-panel .ant-picker-cell-selected .ant-picker-calendar-date {
      background: #e6f7ff;
    }
  `]
})
export class TransactionCalendarComponent implements OnInit, OnChanges {
  @Input() instances: TransactionInstance[] = [];
  @Input() accounts: Account[] = [];
  @Input() categories: Category[] = [];
  @Input() currencySymbol = '$';

  @Output() dateClick = new EventEmitter<Date>();
  @Output() instanceClick = new EventEmitter<TransactionInstance>();
  @Output() monthChange = new EventEmitter<{ year: number; month: number }>();

  selectedDate: Date = new Date();
  instancesByDate = new Map<string, TransactionInstance[]>();

  ngOnInit(): void {
    this.buildInstancesMap();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['instances']) {
      this.buildInstancesMap();
    }
  }

  buildInstancesMap(): void {
    this.instancesByDate.clear();

    this.instances.forEach(instance => {
      const dateKey = this.getDateKey(new Date(instance.date));
      if (!this.instancesByDate.has(dateKey)) {
        this.instancesByDate.set(dateKey, []);
      }
      this.instancesByDate.get(dateKey)?.push(instance);
    });
  }

  getDateKey(date: Date): string {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  }

  getInstancesForDate(date: Date): TransactionInstance[] {
    const dateKey = this.getDateKey(date);
    return this.instancesByDate.get(dateKey) || [];
  }

  onDateClick(date: Date): void {
    this.dateClick.emit(date);
  }

  onInstanceClick(event: Event, instance: TransactionInstance): void {
    event.stopPropagation();
    this.instanceClick.emit(instance);
  }

  onDateChange(date: Date): void {
    this.selectedDate = date;
  }

  onPanelChange(change: { date: Date; mode: string }): void {
    const year = change.date.getFullYear();
    const month = change.date.getMonth() + 1;
    this.monthChange.emit({ year, month });
  }

  formatAmount(amount: string, currency: string): string {
    const num = parseFloat(amount);
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
    const symbol = currencySymbols[currency] || currency;
    return `${symbol}${num.toFixed(2)}`;
  }

  getAccountName(accountId: number): string {
    const account = this.accounts.find(a => a.id === accountId);
    return account?.name || `Account #${accountId}`;
  }

  getCategoryName(categoryId: number): string {
    const category = this.categories.find(c => c.id === categoryId);
    return category?.name || 'Unknown';
  }

  getCategoryType(categoryId: number): CategoryType | null {
    const category = this.categories.find(c => c.id === categoryId);
    return category?.type || null;
  }

  getCategoryTypeColor(categoryId: number): string {
    const type = this.getCategoryType(categoryId);
    switch (type) {
      case CategoryType.INCOME:
        return 'green';
      case CategoryType.EXPENSE:
        return 'red';
      case CategoryType.TRANSFER:
        return 'blue';
      default:
        return 'default';
    }
  }

  getInstanceColor(instance: TransactionInstance): string {
    const type = this.getCategoryType(instance.category_id);
    switch (type) {
      case CategoryType.INCOME:
        return '#52c41a';
      case CategoryType.EXPENSE:
        return '#f5222d';
      case CategoryType.TRANSFER:
        return '#1890ff';
      default:
        return '#8c8c8c';
    }
  }

  getMonthLabel(date: Date): string {
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }

  getMonthInstanceCount(date: Date): number {
    const year = date.getFullYear();
    const month = date.getMonth();

    return this.instances.filter(instance => {
      const instDate = new Date(instance.date);
      return instDate.getFullYear() === year && instDate.getMonth() === month;
    }).length;
  }
}
