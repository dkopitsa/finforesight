import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  inject,
  OnInit,
  signal,
} from '@angular/core';

import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { AuthService } from '../../core/services/auth.service';
import { DashboardService } from '../../core/services/dashboard.service';
import { DashboardData } from '../../core/models/dashboard.model';
import { SummaryCardsComponent } from './components/summary-cards/summary-cards.component';
import { ForecastChartComponent } from './components/forecast-chart/forecast-chart.component';
import { UpcomingTransactionsComponent } from './components/upcoming-transactions/upcoming-transactions.component';

@Component({
  selector: 'app-dashboard',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    NzSpinModule,
    NzAlertModule,
    SummaryCardsComponent,
    ForecastChartComponent,
    UpcomingTransactionsComponent,
  ],
  template: `
    <div class="dashboard-container">
      <nz-spin [nzSpinning]="loading()" nzTip="Loading dashboard...">
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

        @if (!loading() && !error && dashboardData() != null) {
          <div>
            <!-- Summary Cards -->
            <app-summary-cards
              [summary]="dashboardData()!.financial_summary"
              [currencyCode]="getCurrencyCode()"
            ></app-summary-cards>
            <!-- Forecast Chart -->
            <div style="margin-top: 24px;">
              <app-forecast-chart
                [balanceTrend]="dashboardData()!.balance_trend"
                [liquidTrend]="dashboardData()!.liquid_trend"
                [investmentsTrend]="dashboardData()!.investments_trend"
                [creditTrend]="dashboardData()!.credit_trend"
                [todayDate]="dashboardData()!.today_date"
                [currencyCode]="getCurrencyCode()"
              ></app-forecast-chart>
            </div>
            <!-- Upcoming Transactions -->
            <div style="margin-top: 24px;">
              <app-upcoming-transactions
                [transactions]="dashboardData()!.upcoming_transactions"
                [currencyCode]="getCurrencyCode()"
              ></app-upcoming-transactions>
            </div>
          </div>
        }

        @if (!loading && !error && !dashboardData) {
          <div class="empty-state">
            <p>No dashboard data available</p>
          </div>
        }
      </nz-spin>
    </div>
  `,
  styles: [
    `
      .dashboard-container {
        padding: 0;
      }

      .empty-state {
        padding: 48px 24px;
        text-align: center;
        color: #8c8c8c;
      }
    `,
  ],
})
export class DashboardComponent implements OnInit {
  private cdr = inject(ChangeDetectorRef);
  private authService = inject(AuthService);
  private dashboardService = inject(DashboardService);

  currentUser = this.authService.getCurrentUser();
  // dashboardData: DashboardData | null = null;
  dashboardData = signal<DashboardData | null>(null);
  loading = signal<boolean>(false);
  error: string | null = null;

  ngOnInit(): void {
    this.loadDashboard();
  }

  loadDashboard(): void {
    this.loading.set(true);
    this.error = null;

    this.dashboardService.getDashboard().subscribe({
      next: (data) => {
        this.dashboardData.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        this.error = err.error?.detail || 'Failed to load dashboard data';
        this.loading.set(false);
      },
    });
  }

  getCurrencyCode(): string {
    return this.currentUser?.currency || 'USD';
  }
}
