import {ChangeDetectionStrategy, Component, Input, OnChanges, SimpleChanges} from '@angular/core';

import { NzCardModule } from 'ng-zorro-antd/card';
import { NzStatisticModule } from 'ng-zorro-antd/statistic';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzProgressModule } from 'ng-zorro-antd/progress';
import { NzListModule } from 'ng-zorro-antd/list';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { TransactionInstance } from '../../../../core/models/transaction.model';
import { Category, CategoryType } from '../../../../core/models/category.model';

interface CategoryStat {
  category_id: number;
  category_name: string;
  category_type: CategoryType;
  total: number;
  percentage: number;
}

interface Stats {
  total_income: number;
  total_expense: number;
  net_balance: number;
  top_expense_categories: CategoryStat[];
  top_income_categories: CategoryStat[];
  transaction_count: number;
}

@Component({
  selector: 'app-transaction-stats',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    NzCardModule,
    NzStatisticModule,
    NzGridModule,
    NzIconModule,
    NzProgressModule,
    NzListModule,
    NzTagModule
],
  template: `
    <nz-card nzTitle="Statistics" [nzExtra]="extraTemplate">
      <div nz-row [nzGutter]="16">
        <!-- Total Income -->
        <div nz-col [nzXs]="24" [nzSm]="12" [nzMd]="6">
          <nz-card class="stat-card income-card">
            <nz-statistic
              [nzValue]="stats.total_income"
              [nzTitle]="'Total Income'"
              [nzPrefix]="incomeIcon"
              [nzValueStyle]="{ color: '#3f8600' }"
              [nzSuffix]="currencySymbol"
            ></nz-statistic>
          </nz-card>
        </div>

        <!-- Total Expenses -->
        <div nz-col [nzXs]="24" [nzSm]="12" [nzMd]="6">
          <nz-card class="stat-card expense-card">
            <nz-statistic
              [nzValue]="stats.total_expense"
              [nzTitle]="'Total Expenses'"
              [nzPrefix]="expenseIcon"
              [nzValueStyle]="{ color: '#cf1322' }"
              [nzSuffix]="currencySymbol"
            ></nz-statistic>
          </nz-card>
        </div>

        <!-- Net Balance -->
        <div nz-col [nzXs]="24" [nzSm]="12" [nzMd]="6">
          <nz-card class="stat-card balance-card">
            <nz-statistic
              [nzValue]="stats.net_balance"
              [nzTitle]="'Net Balance'"
              [nzPrefix]="balanceIcon"
              [nzValueStyle]="{ color: getBalanceColor() }"
              [nzSuffix]="currencySymbol"
            ></nz-statistic>
          </nz-card>
        </div>

        <!-- Transaction Count -->
        <div nz-col [nzXs]="24" [nzSm]="12" [nzMd]="6">
          <nz-card class="stat-card count-card">
            <nz-statistic
              [nzValue]="stats.transaction_count"
              [nzTitle]="'Transactions'"
              [nzPrefix]="countIcon"
              [nzValueStyle]="{ color: '#1890ff' }"
            ></nz-statistic>
          </nz-card>
        </div>
      </div>

      <!-- Top Categories Section -->
      <div nz-row [nzGutter]="16" style="margin-top: 16px;">
        <!-- Top Expense Categories -->
        @if (stats.top_expense_categories.length > 0) {
          <div nz-col [nzXs]="24" [nzMd]="12">
            <nz-card nzTitle="Top Expense Categories" nzSize="small">
              <nz-list [nzDataSource]="stats.top_expense_categories" [nzRenderItem]="expenseCategoryItem">
                <ng-template #expenseCategoryItem let-item>
                  <nz-list-item>
                    <div class="category-item">
                      <div class="category-info">
                        <span class="category-name">{{ item.category_name }}</span>
                        <span class="category-amount" style="color: #cf1322;">
                          {{ currencySymbol }}{{ item.total.toFixed(2) }}
                        </span>
                      </div>
                      <nz-progress
                        [nzPercent]="item.percentage"
                        [nzShowInfo]="false"
                        nzStrokeColor="#cf1322"
                        [nzSize]="'small'"
                      ></nz-progress>
                      <div class="category-percentage">
                        {{ item.percentage.toFixed(1) }}% of total expenses
                      </div>
                    </div>
                  </nz-list-item>
                </ng-template>
              </nz-list>
            </nz-card>
          </div>
        }

        <!-- Top Income Categories -->
        @if (stats.top_income_categories.length > 0) {
          <div nz-col [nzXs]="24" [nzMd]="12">
            <nz-card nzTitle="Top Income Categories" nzSize="small">
              <nz-list [nzDataSource]="stats.top_income_categories" [nzRenderItem]="incomeCategoryItem">
                <ng-template #incomeCategoryItem let-item>
                  <nz-list-item>
                    <div class="category-item">
                      <div class="category-info">
                        <span class="category-name">{{ item.category_name }}</span>
                        <span class="category-amount" style="color: #3f8600;">
                          {{ currencySymbol }}{{ item.total.toFixed(2) }}
                        </span>
                      </div>
                      <nz-progress
                        [nzPercent]="item.percentage"
                        [nzShowInfo]="false"
                        nzStrokeColor="#3f8600"
                        [nzSize]="'small'"
                      ></nz-progress>
                      <div class="category-percentage">
                        {{ item.percentage.toFixed(1) }}% of total income
                      </div>
                    </div>
                  </nz-list-item>
                </ng-template>
              </nz-list>
            </nz-card>
          </div>
        }

        <!-- Empty state when no categories -->
        @if (stats.top_expense_categories.length === 0 && stats.top_income_categories.length === 0) {
          <div nz-col [nzSpan]="24">
            <nz-card nzSize="small">
              <div style="text-align: center; padding: 24px; color: #8c8c8c;">
                No category data available
              </div>
            </nz-card>
          </div>
        }
      </div>

      <ng-template #extraTemplate>
        <span style="color: #8c8c8c; font-size: 12px;">
          {{ getPeriodLabel() }}
        </span>
      </ng-template>

      <ng-template #incomeIcon>
        <span nz-icon nzType="arrow-down" nzTheme="outline"></span>
      </ng-template>

      <ng-template #expenseIcon>
        <span nz-icon nzType="arrow-up" nzTheme="outline"></span>
      </ng-template>

      <ng-template #balanceIcon>
        <span nz-icon nzType="wallet" nzTheme="outline"></span>
      </ng-template>

      <ng-template #countIcon>
        <span nz-icon nzType="transaction" nzTheme="outline"></span>
      </ng-template>
    </nz-card>
  `,
  styles: [`
    .stat-card {
      text-align: center;
      border-radius: 8px;
      transition: all 0.3s;
    }

    .stat-card:hover {
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
      transform: translateY(-2px);
    }

    .income-card {
      border-left: 4px solid #3f8600;
    }

    .expense-card {
      border-left: 4px solid #cf1322;
    }

    .balance-card {
      border-left: 4px solid #1890ff;
    }

    .count-card {
      border-left: 4px solid #722ed1;
    }

    .category-item {
      width: 100%;
    }

    .category-info {
      display: flex;
      justify-content: space-between;
      margin-bottom: 8px;
    }

    .category-name {
      font-weight: 500;
      color: #262626;
    }

    .category-amount {
      font-weight: 600;
    }

    .category-percentage {
      font-size: 12px;
      color: #8c8c8c;
      margin-top: 4px;
    }

    :host ::ng-deep .ant-statistic-title {
      font-size: 14px;
      margin-bottom: 4px;
    }

    :host ::ng-deep .ant-statistic-content {
      font-size: 20px;
      font-weight: 600;
    }

    @media (max-width: 768px) {
      :host ::ng-deep .ant-statistic-content {
        font-size: 18px;
      }
    }
  `]
})
export class TransactionStatsComponent implements OnChanges {
  @Input() instances: TransactionInstance[] = [];
  @Input() categories: Category[] = [];
  @Input() currencySymbol = '$';
  @Input() periodStart?: Date;
  @Input() periodEnd?: Date;

  stats: Stats = {
    total_income: 0,
    total_expense: 0,
    net_balance: 0,
    top_expense_categories: [],
    top_income_categories: [],
    transaction_count: 0,
  };

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['instances'] || changes['categories']) {
      this.calculateStats();
    }
  }

  calculateStats(): void {
    let totalIncome = 0;
    let totalExpense = 0;

    const categoryTotals = new Map<number, { name: string; type: CategoryType; total: number }>();

    // Calculate totals
    this.instances.forEach(instance => {
      const amount = parseFloat(instance.amount);
      const category = this.categories.find(c => c.id === instance.category_id);

      if (!category) return;

      // Track by category
      if (!categoryTotals.has(instance.category_id)) {
        categoryTotals.set(instance.category_id, {
          name: category.name,
          type: category.type,
          total: 0,
        });
      }
      const categoryData = categoryTotals.get(instance.category_id);
      if (categoryData) {
        categoryData.total += amount;
      }

      // Calculate income/expense
      if (category.type === CategoryType.INCOME) {
        totalIncome += amount;
      } else if (category.type === CategoryType.EXPENSE) {
        totalExpense += amount;
      }
    });

    // Build top categories lists
    const expenseCategories: CategoryStat[] = [];
    const incomeCategories: CategoryStat[] = [];

    categoryTotals.forEach((data, categoryId) => {
      const stat: CategoryStat = {
        category_id: categoryId,
        category_name: data.name,
        category_type: data.type,
        total: data.total,
        percentage: 0,
      };

      if (data.type === CategoryType.EXPENSE && totalExpense > 0) {
        stat.percentage = (data.total / totalExpense) * 100;
        expenseCategories.push(stat);
      } else if (data.type === CategoryType.INCOME && totalIncome > 0) {
        stat.percentage = (data.total / totalIncome) * 100;
        incomeCategories.push(stat);
      }
    });

    // Sort and take top 5
    const topExpenses = expenseCategories
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);

    const topIncomes = incomeCategories
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);

    this.stats = {
      total_income: totalIncome,
      total_expense: totalExpense,
      net_balance: totalIncome - totalExpense,
      top_expense_categories: topExpenses,
      top_income_categories: topIncomes,
      transaction_count: this.instances.length,
    };
  }

  getBalanceColor(): string {
    if (this.stats.net_balance > 0) return '#3f8600';
    if (this.stats.net_balance < 0) return '#cf1322';
    return '#8c8c8c';
  }

  getPeriodLabel(): string {
    if (this.periodStart && this.periodEnd) {
      const start = this.periodStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const end = this.periodEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      return `${start} - ${end}`;
    }
    return 'Current Period';
  }
}
