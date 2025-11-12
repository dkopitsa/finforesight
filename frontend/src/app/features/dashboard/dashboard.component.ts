import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
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
  standalone: true,
  imports: [
    CommonModule,
    NzSpinModule,
    NzAlertModule,
    SummaryCardsComponent,
    ForecastChartComponent,
    UpcomingTransactionsComponent,
  ],
  template: `
    <div class="dashboard-container">
      <nz-spin [nzSpinning]="loading" nzTip="Loading dashboard...">
        <nz-alert
          *ngIf="error"
          nzType="error"
          [nzMessage]="error"
          nzShowIcon
          nzCloseable
          (nzOnClose)="error = null"
          style="margin-bottom: 24px;"
        ></nz-alert>

        <div *ngIf="!loading && !error && dashboardData">
          <!-- Summary Cards -->
          <app-summary-cards
            [summary]="dashboardData.financial_summary"
            [currencySymbol]="getCurrencySymbol()"
          ></app-summary-cards>

          <!-- Forecast Chart -->
          <div style="margin-top: 24px;">
            <app-forecast-chart
              [balanceTrend]="dashboardData.balance_trend"
              [currencySymbol]="getCurrencySymbol()"
            ></app-forecast-chart>
          </div>

          <!-- Upcoming Transactions -->
          <div style="margin-top: 24px;">
            <app-upcoming-transactions
              [transactions]="dashboardData.upcoming_transactions"
              [currencySymbol]="getCurrencySymbol()"
            ></app-upcoming-transactions>
          </div>
        </div>

        <div *ngIf="!loading && !error && !dashboardData" class="empty-state">
          <p>No dashboard data available</p>
        </div>
      </nz-spin>
    </div>
  `,
  styles: [`
    .dashboard-container {
      padding: 0;
    }

    .empty-state {
      padding: 48px 24px;
      text-align: center;
      color: #8c8c8c;
    }
  `]
})
export class DashboardComponent implements OnInit {
  private authService = inject(AuthService);
  private dashboardService = inject(DashboardService);

  currentUser = this.authService.getCurrentUser();
  dashboardData: DashboardData | null = null;
  loading = false;
  error: string | null = null;

  ngOnInit(): void {
    this.loadDashboard();
  }

  loadDashboard(): void {
    this.loading = true;
    this.error = null;

    this.dashboardService.getDashboard().subscribe({
      next: (data) => {
        this.dashboardData = data;
        this.loading = false;
      },
      error: (err) => {
        this.error = err.error?.detail || 'Failed to load dashboard data';
        this.loading = false;
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
}
