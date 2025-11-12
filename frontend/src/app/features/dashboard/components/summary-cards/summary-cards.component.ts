import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzStatisticModule } from 'ng-zorro-antd/statistic';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { FinancialSummary } from '../../../../core/models/dashboard.model';

@Component({
  selector: 'app-summary-cards',
  standalone: true,
  imports: [CommonModule, NzCardModule, NzStatisticModule, NzGridModule, NzIconModule],
  template: `
    <div nz-row [nzGutter]="16">
      <div nz-col [nzXs]="24" [nzSm]="12" [nzLg]="6">
        <nz-card class="summary-card">
          <nz-statistic
            [nzValue]="summary?.liquid_assets || '0'"
            [nzTitle]="'Liquid Assets'"
            [nzPrefix]="currencySymbol"
            [nzValueStyle]="{ color: '#1890ff' }"
          >
            <ng-template #nzPrefix>
              <span nz-icon nzType="wallet" nzTheme="outline"></span>
            </ng-template>
          </nz-statistic>
          <div class="card-footer">{{ summary?.account_count || 0 }} accounts</div>
        </nz-card>
      </div>

      <div nz-col [nzXs]="24" [nzSm]="12" [nzLg]="6">
        <nz-card class="summary-card">
          <nz-statistic
            [nzValue]="summary?.investments || '0'"
            [nzTitle]="'Investments'"
            [nzPrefix]="currencySymbol"
            [nzValueStyle]="{ color: '#52c41a' }"
          >
            <ng-template #nzPrefix>
              <span nz-icon nzType="rise" nzTheme="outline"></span>
            </ng-template>
          </nz-statistic>
          <div class="card-footer">Long-term assets</div>
        </nz-card>
      </div>

      <div nz-col [nzXs]="24" [nzSm]="12" [nzLg]="6">
        <nz-card class="summary-card">
          <nz-statistic
            [nzValue]="summary?.credit_used || '0'"
            [nzTitle]="'Credit Used'"
            [nzPrefix]="currencySymbol"
            [nzValueStyle]="{ color: '#ff4d4f' }"
          >
            <ng-template #nzPrefix>
              <span nz-icon nzType="credit-card" nzTheme="outline"></span>
            </ng-template>
          </nz-statistic>
          <div class="card-footer">Credit cards & loans</div>
        </nz-card>
      </div>

      <div nz-col [nzXs]="24" [nzSm]="12" [nzLg]="6">
        <nz-card class="summary-card">
          <nz-statistic
            [nzValue]="summary?.net_worth || '0'"
            [nzTitle]="'Net Worth'"
            [nzPrefix]="currencySymbol"
            [nzValueStyle]="{ color: getNetWorthColor() }"
          >
            <ng-template #nzPrefix>
              <span nz-icon [nzType]="getNetWorthIcon()" nzTheme="outline"></span>
            </ng-template>
          </nz-statistic>
          <div class="card-footer">Total assets - liabilities</div>
        </nz-card>
      </div>
    </div>
  `,
  styles: [`
    .summary-card {
      height: 100%;
      margin-bottom: 16px;
    }

    .summary-card :host ::ng-deep .ant-statistic-title {
      font-size: 14px;
      margin-bottom: 8px;
    }

    .summary-card :host ::ng-deep .ant-statistic-content {
      font-size: 20px;
      font-weight: 600;
    }

    .card-footer {
      margin-top: 12px;
      font-size: 12px;
      color: #8c8c8c;
    }

    @media (max-width: 768px) {
      .summary-card {
        margin-bottom: 12px;
      }
    }
  `]
})
export class SummaryCardsComponent {
  @Input() summary: FinancialSummary | null = null;
  @Input() currencySymbol = '$';

  getNetWorthColor(): string {
    if (!this.summary) return '#262626';
    const netWorth = parseFloat(this.summary.net_worth);
    if (netWorth > 0) return '#52c41a';
    if (netWorth < 0) return '#ff4d4f';
    return '#8c8c8c';
  }

  getNetWorthIcon(): string {
    if (!this.summary) return 'bar-chart';
    const netWorth = parseFloat(this.summary.net_worth);
    if (netWorth > 0) return 'arrow-up';
    if (netWorth < 0) return 'arrow-down';
    return 'minus';
  }
}
