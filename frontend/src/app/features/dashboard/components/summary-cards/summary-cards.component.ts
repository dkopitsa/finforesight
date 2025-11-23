import {ChangeDetectionStrategy, Component, inject, Input} from '@angular/core';
import { CommonModule } from '@angular/common';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzStatisticModule } from 'ng-zorro-antd/statistic';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { FinancialSummary } from '../../../../core/models/dashboard.model';
import { CurrencyService } from '../../../../core/services/currency.service';

@Component({
  selector: 'app-summary-cards',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [CommonModule, NzCardModule, NzStatisticModule, NzGridModule, NzIconModule],
  template: `
    <div nz-row [nzGutter]="16">
      <div nz-col [nzXs]="24" [nzSm]="12" [nzLg]="6">
        <nz-card class="summary-card">
          <div class="statistic-custom">
            <div class="statistic-title">Liquid Assets</div>
            <div class="statistic-content" [style.color]="'#1890ff'">
              <span nz-icon nzType="wallet" nzTheme="outline" class="statistic-icon"></span>
              {{ formatValue(summary?.liquid_assets) }}
            </div>
          </div>
          <div class="card-footer">{{ summary?.account_count || 0 }} accounts</div>
        </nz-card>
      </div>

      <div nz-col [nzXs]="24" [nzSm]="12" [nzLg]="6">
        <nz-card class="summary-card">
          <div class="statistic-custom">
            <div class="statistic-title">Investments</div>
            <div class="statistic-content" [style.color]="'#52c41a'">
              <span nz-icon nzType="rise" nzTheme="outline" class="statistic-icon"></span>
              {{ formatValue(summary?.investments) }}
            </div>
          </div>
          <div class="card-footer">Long-term assets</div>
        </nz-card>
      </div>

      <div nz-col [nzXs]="24" [nzSm]="12" [nzLg]="6">
        <nz-card class="summary-card">
          <div class="statistic-custom">
            <div class="statistic-title">Credit Used</div>
            <div class="statistic-content" [style.color]="'#ff4d4f'">
              <span nz-icon nzType="credit-card" nzTheme="outline" class="statistic-icon"></span>
              {{ formatValue(summary?.credit_used) }}
            </div>
          </div>
          <div class="card-footer">Credit cards & loans</div>
        </nz-card>
      </div>

      <div nz-col [nzXs]="24" [nzSm]="12" [nzLg]="6">
        <nz-card class="summary-card">
          <div class="statistic-custom">
            <div class="statistic-title">Net Worth</div>
            <div class="statistic-content" [style.color]="getNetWorthColor()">
              <span nz-icon [nzType]="getNetWorthIcon()" nzTheme="outline" class="statistic-icon"></span>
              {{ formatValue(summary?.net_worth) }}
            </div>
          </div>
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

    .statistic-custom {
      text-align: left;
    }

    .statistic-title {
      font-size: 14px;
      color: rgba(0, 0, 0, 0.45);
      margin-bottom: 8px;
    }

    .statistic-content {
      font-size: 24px;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .statistic-icon {
      font-size: 20px;
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

      .statistic-content {
        font-size: 18px;
      }
    }
  `]
})
export class SummaryCardsComponent {
  private currencyService = inject(CurrencyService);

  @Input() summary: FinancialSummary | null = null;
  @Input() currencyCode = 'USD';

  formatValue(value: string | undefined): string {
    const amount = parseFloat(value || '0');
    return this.currencyService.formatAmount(amount, this.currencyCode);
  }

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
