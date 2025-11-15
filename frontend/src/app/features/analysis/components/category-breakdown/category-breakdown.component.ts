import { Component, Input } from '@angular/core';

import { NzTableModule } from 'ng-zorro-antd/table';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { CategoryAnalysis } from '../../../../core/models/analysis.model';

@Component({
  selector: 'app-category-breakdown',
  standalone: true,
  imports: [
    NzTableModule,
    NzTagModule,
    NzEmptyModule
],
  template: `
    <nz-table
      #categoryTable
      [nzData]="categories"
      [nzPageSize]="10"
      [nzShowPagination]="categories.length > 10"
      [nzSize]="'middle'"
    >
      <thead>
        <tr>
          <th>Category</th>
          <th>Type</th>
          <th>Planned Amount</th>
          <th>% of Total</th>
          @if (hasActualData) {
            <th>Actual Amount</th>
            <th>Variance</th>
          }
        </tr>
      </thead>
      <tbody>
        @if (categories.length === 0) {
          <tr>
            <td [attr.colspan]="hasActualData ? 6 : 4">
              <nz-empty
                nzNotFoundContent="No category data available"
                [nzNotFoundFooter]="emptyFooter"
              >
                <ng-template #emptyFooter>
                  <p style="color: #8c8c8c;">
                    Add scheduled transactions to see category breakdown
                  </p>
                </ng-template>
              </nz-empty>
            </td>
          </tr>
        }
        @for (category of categoryTable.data; track category.category_name) {
          <tr>
            <td>
              <strong>{{ category.category_name }}</strong>
            </td>
            <td>
              <nz-tag [nzColor]="getCategoryTypeColor(category.category_type)">
                {{ category.category_type }}
              </nz-tag>
            </td>
            <td>
              <span class="amount">
                {{ currencySymbol }}{{ category.planned_amount.toFixed(2) }}
              </span>
            </td>
            <td>
              <span class="percentage">
                {{ getPercentageOfTotal(category) }}%
              </span>
            </td>
            @if (hasActualData) {
              <td>
                <span class="amount">
                  {{ currencySymbol }}{{ category.actual_amount.toFixed(2) }}
                </span>
              </td>
              <td>
                <span
                  class="variance"
                  [class.positive]="isPositiveVariance(category)"
                  [class.negative]="isNegativeVariance(category)"
                >
                  {{ formatVariance(category) }}
                </span>
              </td>
            }
          </tr>
        }
      </tbody>
    </nz-table>
  `,
  styles: [`
    .amount {
      font-weight: 500;
      font-family: 'Courier New', monospace;
    }

    .percentage {
      color: #8c8c8c;
      font-size: 12px;
    }

    .variance {
      font-weight: 600;
      font-family: 'Courier New', monospace;
    }

    .variance.positive {
      color: #3f8600;
    }

    .variance.negative {
      color: #cf1322;
    }

    :host ::ng-deep .ant-table-tbody > tr > td {
      vertical-align: middle;
    }
  `]
})
export class CategoryBreakdownComponent {
  @Input() categories: CategoryAnalysis[] = [];
  @Input() currencySymbol = '$';

  get hasActualData(): boolean {
    return this.categories.some(cat => cat.actual_amount > 0);
  }

  getCategoryTypeColor(type: string): string {
    switch (type) {
      case 'INCOME':
        return 'green';
      case 'EXPENSE':
        return 'red';
      case 'TRANSFER':
        return 'blue';
      default:
        return 'default';
    }
  }

  getPercentageOfTotal(category: CategoryAnalysis): string {
    const total = this.getTotalByType(category.category_type);
    if (total === 0) return '0.0';
    return ((category.planned_amount / total) * 100).toFixed(1);
  }

  private getTotalByType(type: string): number {
    return this.categories
      .filter(cat => cat.category_type === type)
      .reduce((sum, cat) => sum + cat.planned_amount, 0);
  }

  isPositiveVariance(category: CategoryAnalysis): boolean {
    if (category.category_type === 'INCOME') {
      return category.difference > 0;
    } else if (category.category_type === 'EXPENSE') {
      return category.difference < 0; // Less expenses is good
    }
    return false;
  }

  isNegativeVariance(category: CategoryAnalysis): boolean {
    if (category.category_type === 'INCOME') {
      return category.difference < 0;
    } else if (category.category_type === 'EXPENSE') {
      return category.difference > 0; // More expenses is bad
    }
    return false;
  }

  formatVariance(category: CategoryAnalysis): string {
    if (Math.abs(category.difference) < 0.01) {
      return 'Perfect';
    }
    const sign = category.difference > 0 ? '+' : '';
    return `${sign}${this.currencySymbol}${category.difference.toFixed(2)} (${category.difference_percentage.toFixed(1)}%)`;
  }
}
