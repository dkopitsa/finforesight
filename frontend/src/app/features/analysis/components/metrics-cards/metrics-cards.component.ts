import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzStatisticModule } from 'ng-zorro-antd/statistic';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { AnalysisSummary } from '../../../../core/models/analysis.model';

@Component({
  selector: 'app-metrics-cards',
  standalone: true,
  imports: [
    CommonModule,
    NzCardModule,
    NzStatisticModule,
    NzIconModule,
    NzGridModule,
  ],
  template: `
    <div nz-row [nzGutter]="[16, 16]">
      <!-- Planned Income -->
      <div nz-col [nzXs]="24" [nzSm]="12" [nzMd]="8">
        <nz-card>
          <nz-statistic
            [nzValue]="summary.total_planned_income"
            [nzTitle]="'Planned Income'"
            [nzPrefix]="currencySymbol"
            [nzValueStyle]="{ color: '#3f8600' }"
          >
            <ng-template #nzSuffix>
              <span nz-icon nzType="arrow-up" nzTheme="outline"></span>
            </ng-template>
          </nz-statistic>
        </nz-card>
      </div>

      <!-- Planned Expenses -->
      <div nz-col [nzXs]="24" [nzSm]="12" [nzMd]="8">
        <nz-card>
          <nz-statistic
            [nzValue]="summary.total_planned_expenses"
            [nzTitle]="'Planned Expenses'"
            [nzPrefix]="currencySymbol"
            [nzValueStyle]="{ color: '#cf1322' }"
          >
            <ng-template #nzSuffix>
              <span nz-icon nzType="arrow-down" nzTheme="outline"></span>
            </ng-template>
          </nz-statistic>
        </nz-card>
      </div>

      <!-- Planned Savings -->
      <div nz-col [nzXs]="24" [nzSm]="12" [nzMd]="8">
        <nz-card>
          <nz-statistic
            [nzValue]="summary.total_planned_savings"
            [nzTitle]="'Planned Savings'"
            [nzPrefix]="currencySymbol"
            [nzValueStyle]="getSavingsColor()"
          >
            <ng-template #nzSuffix>
              <span
                nz-icon
                [nzType]="summary.total_planned_savings >= 0 ? 'rise' : 'fall'"
                nzTheme="outline"
              ></span>
            </ng-template>
          </nz-statistic>
        </nz-card>
      </div>

      <!-- Savings Rate -->
      <div nz-col [nzXs]="24" [nzSm]="12" [nzMd]="8">
        <nz-card>
          <nz-statistic
            [nzValue]="(getSavingsRate() | number)!"
            [nzTitle]="'Savings Rate'"
            [nzSuffix]="'%'"
            [nzValueStyle]="getSavingsRateColor()"
          ></nz-statistic>
        </nz-card>
      </div>

      <!-- Actual Income (if available) -->
      @if (summary.total_actual_income > 0) {
        <div nz-col [nzXs]="24" [nzSm]="12" [nzMd]="8">
          <nz-card>
            <nz-statistic
              [nzValue]="summary.total_actual_income"
              [nzTitle]="'Actual Income'"
              [nzPrefix]="currencySymbol"
              [nzValueStyle]="{ color: '#3f8600' }"
            ></nz-statistic>
            <div class="variance">
              <span [class.positive]="summary.income_variance >= 0" [class.negative]="summary.income_variance < 0">
                {{ summary.income_variance >= 0 ? '+' : '' }}{{ currencySymbol }}{{ Math.abs(summary.income_variance).toFixed(2) }}
                ({{ getVariancePercentage(summary.income_variance, summary.total_planned_income) }}%)
              </span>
            </div>
          </nz-card>
        </div>

        <!-- Actual Expenses -->
        <div nz-col [nzXs]="24" [nzSm]="12" [nzMd]="8">
          <nz-card>
            <nz-statistic
              [nzValue]="summary.total_actual_expenses"
              [nzTitle]="'Actual Expenses'"
              [nzPrefix]="currencySymbol"
              [nzValueStyle]="{ color: '#cf1322' }"
            ></nz-statistic>
            <div class="variance">
              <span [class.positive]="summary.expense_variance <= 0" [class.negative]="summary.expense_variance > 0">
                {{ summary.expense_variance >= 0 ? '+' : '' }}{{ currencySymbol }}{{ Math.abs(summary.expense_variance).toFixed(2) }}
                ({{ getVariancePercentage(summary.expense_variance, summary.total_planned_expenses) }}%)
              </span>
            </div>
          </nz-card>
        </div>
      }
    </div>
  `,
  styles: [`
    .variance {
      margin-top: 8px;
      font-size: 14px;
      font-weight: 500;
    }

    .variance .positive {
      color: #3f8600;
    }

    .variance .negative {
      color: #cf1322;
    }

    :host ::ng-deep .ant-statistic-content {
      font-size: 20px;
    }

    :host ::ng-deep .ant-statistic-title {
      font-size: 14px;
      color: #8c8c8c;
      margin-bottom: 8px;
    }
  `]
})
export class MetricsCardsComponent {
  @Input() summary!: AnalysisSummary;
  @Input() currencySymbol = '$';

  Math = Math;

  getSavingsRate(): number {
    if (this.summary.total_planned_income === 0) return 0;
    return (this.summary.total_planned_savings / this.summary.total_planned_income) * 100;
  }

  getSavingsColor(): { color: string } {
    return { color: this.summary.total_planned_savings >= 0 ? '#3f8600' : '#cf1322' };
  }

  getSavingsRateColor(): { color: string } {
    const rate = this.getSavingsRate();
    if (rate >= 20) return { color: '#3f8600' };
    if (rate >= 10) return { color: '#faad14' };
    return { color: '#cf1322' };
  }

  getVariancePercentage(variance: number, planned: number): string {
    if (planned === 0) return '0.0';
    return ((variance / planned) * 100).toFixed(1);
  }
}
