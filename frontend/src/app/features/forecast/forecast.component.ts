import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzStatisticModule } from 'ng-zorro-antd/statistic';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { ForecastService, ForecastParams } from './services/forecast.service';
import { ForecastFiltersComponent } from './components/forecast-filters/forecast-filters.component';
import { ForecastChartComponent } from './components/forecast-chart/forecast-chart.component';
import { AccountService } from '../accounts/services/account.service';
import { AuthService } from '../../core/services/auth.service';
import { Account } from '../../core/models/account.model';
import { ForecastData, AccountForecast } from '../../core/models/dashboard.model';

@Component({
  selector: 'app-forecast',
  standalone: true,
  imports: [
    CommonModule,
    NzCardModule,
    NzSpinModule,
    NzAlertModule,
    NzStatisticModule,
    NzGridModule,
    NzEmptyModule,
    ForecastFiltersComponent,
    ForecastChartComponent,
  ],
  template: `
    <div class="forecast-container">
      <div class="forecast-header">
        <h2>Balance Forecast</h2>
        <p class="subtitle">Project your future account balances based on scheduled transactions</p>
      </div>

      <nz-spin [nzSpinning]="loading" nzTip="Generating forecast...">
        <!-- Filters -->
        <div class="filters-section" style="margin-bottom: 24px;">
          <app-forecast-filters
            [accounts]="accounts"
            (filtersApplied)="loadForecast($event)"
          ></app-forecast-filters>
        </div>

        @if (error) {
          <nz-alert
            nzType="error"
            [nzMessage]="error"
            nzShowIcon
            nzCloseable
            (nzOnClose)="error = null"
            style="margin-bottom: 24px;"
          ></nz-alert>
        }

        @if (!loading && forecastData) {
          <!-- Summary Stats -->
          @if (forecastData.accounts.length > 0) {
            <div class="stats-section" style="margin-bottom: 24px;">
              <nz-card nzTitle="Forecast Summary" nzSize="small">
                <div nz-row [nzGutter]="16">
                  @for (account of forecastData.accounts; track account.account_id) {
                    <div nz-col [nzXs]="24" [nzSm]="12" [nzMd]="8" [nzLg]="6">
                      <nz-card class="stat-card">
                        <nz-statistic
                          [nzTitle]="account.account_name"
                          [nzValue]="getEndingBalance(account)"
                          [nzPrefix]="getCurrencySymbol()"
                          [nzValueStyle]="{ color: getBalanceColor(account) }"
                        >
                          <ng-template #nzSuffix>
                            <div class="balance-change">
                              {{ getBalanceChange(account) }}
                            </div>
                          </ng-template>
                        </nz-statistic>
                      </nz-card>
                    </div>
                  }
                </div>
              </nz-card>
            </div>

            <!-- Chart -->
            <div class="chart-section">
              <nz-card>
                <app-forecast-chart
                  [forecastData]="forecastData"
                  [currencySymbol]="getCurrencySymbol()"
                ></app-forecast-chart>
              </nz-card>
            </div>
          }
        }

        @if (!loading && !forecastData) {
          <div class="empty-state">
            <nz-empty
              nzNotFoundContent="No forecast data"
              [nzNotFoundFooter]="emptyFooter"
            >
              <ng-template #emptyFooter>
                <p style="color: #8c8c8c;">
                  Select date range and click "Generate Forecast" to see your projected balances
                </p>
              </ng-template>
            </nz-empty>
          </div>
        }
      </nz-spin>
    </div>
  `,
  styles: [`
    .forecast-container {
      padding: 0;
    }

    .forecast-header {
      margin-bottom: 24px;
    }

    .forecast-header h2 {
      margin: 0 0 8px 0;
      font-size: 24px;
      color: #262626;
    }

    .subtitle {
      margin: 0;
      color: #8c8c8c;
      font-size: 14px;
    }

    .stat-card {
      text-align: center;
      border-radius: 8px;
      transition: all 0.3s;
    }

    .stat-card:hover {
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
      transform: translateY(-2px);
    }

    .balance-change {
      font-size: 12px;
      margin-top: 4px;
    }

    .empty-state {
      padding: 64px 24px;
      text-align: center;
    }

    :host ::ng-deep .ant-statistic-title {
      font-size: 13px;
      margin-bottom: 4px;
    }

    :host ::ng-deep .ant-statistic-content {
      font-size: 20px;
      font-weight: 600;
    }
  `]
})
export class ForecastComponent implements OnInit {
  private forecastService = inject(ForecastService);
  private accountService = inject(AccountService);
  private authService = inject(AuthService);
  private messageService = inject(NzMessageService);

  currentUser = this.authService.getCurrentUser();
  accounts: Account[] = [];
  forecastData: ForecastData | null = null;
  loading = false;
  error: string | null = null;

  ngOnInit(): void {
    this.loadAccounts();
  }

  loadAccounts(): void {
    this.accountService.listAccounts().subscribe({
      next: (accounts) => {
        this.accounts = accounts;
      },
      error: (err) => {
        console.error('Failed to load accounts:', err);
        this.messageService.error('Failed to load accounts');
      },
    });
  }

  loadForecast(params: ForecastParams): void {
    this.loading = true;
    this.error = null;

    this.forecastService.getForecast(params).subscribe({
      next: (data) => {
        this.forecastData = data;
        this.loading = false;
      },
      error: (err) => {
        this.error = err.error?.detail || 'Failed to generate forecast';
        this.loading = false;
        this.messageService.error(this.error);
      },
    });
  }

  getCurrencySymbol(): string {
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
    return currencySymbols[this.currentUser?.currency || 'USD'] || '$';
  }

  getEndingBalance(account: AccountForecast): number {
    if (account.data_points.length === 0) {
      return parseFloat(account.starting_balance);
    }
    return parseFloat(account.data_points[account.data_points.length - 1].balance);
  }

  getBalanceChange(account: AccountForecast): string {
    const start = parseFloat(account.starting_balance);
    const end = this.getEndingBalance(account);
    const change = end - start;

    if (change > 0) {
      return `+${this.getCurrencySymbol()}${change.toFixed(2)}`;
    } else if (change < 0) {
      return `${this.getCurrencySymbol()}${change.toFixed(2)}`;
    }
    return 'No change';
  }

  getBalanceColor(account: AccountForecast): string {
    const start = parseFloat(account.starting_balance);
    const end = this.getEndingBalance(account);

    if (end > start) return '#3f8600';
    if (end < start) return '#cf1322';
    return '#8c8c8c';
  }
}
