import {ChangeDetectionStrategy, Component, inject, OnInit} from '@angular/core';

import { FormsModule } from '@angular/forms';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzMessageService } from 'ng-zorro-antd/message';
import { AnalysisService } from './services/analysis.service';
import { AccountService } from '../accounts/services/account.service';
import { AuthService } from '../../core/services/auth.service';
import { MetricsCardsComponent } from './components/metrics-cards/metrics-cards.component';
import { CategoryBreakdownComponent } from './components/category-breakdown/category-breakdown.component';
import { Account } from '../../core/models/account.model';
import { AnalysisData } from '../../core/models/analysis.model';

@Component({
  selector: 'app-analysis',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    FormsModule,
    NzCardModule,
    NzButtonModule,
    NzIconModule,
    NzSpinModule,
    NzAlertModule,
    NzDatePickerModule,
    NzSelectModule,
    MetricsCardsComponent,
    CategoryBreakdownComponent
],
  template: `
    <div class="analysis-container">
      <div class="analysis-header">
        <div>
          <h2>Financial Analysis</h2>
          <p class="subtitle">Compare planned vs actual financial performance</p>
        </div>
      </div>

      <!-- Filters -->
      <nz-card nzTitle="Analysis Period" class="filter-card">
        <div class="filters">
          <div class="filter-group">
            <label>Date Range</label>
            <nz-range-picker
              [(ngModel)]="dateRange"
              [nzFormat]="'yyyy-MM-dd'"
              style="width: 300px;"
            ></nz-range-picker>
          </div>

          <div class="filter-group">
            <label>Accounts</label>
            <nz-select
              [(ngModel)]="selectedAccountIds"
              nzMode="multiple"
              nzPlaceHolder="All accounts"
              nzAllowClear
              style="width: 300px;"
            >
              @for (account of accounts; track account.id) {
                <nz-option [nzValue]="account.id" [nzLabel]="account.name"></nz-option>
              }
            </nz-select>
          </div>

          <div class="filter-group">
            <label style="opacity: 0;">Action</label>
            <button nz-button nzType="primary" (click)="loadAnalysis()">
              <span nz-icon nzType="bar-chart" nzTheme="outline"></span>
              Analyze
            </button>
          </div>
        </div>
      </nz-card>

      <nz-spin [nzSpinning]="loading" nzTip="Analyzing financial data...">
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

        @if (analysisData) {
          <!-- Metrics Cards -->
          <div class="section">
            <h3 class="section-title">Financial Metrics</h3>
            <app-metrics-cards
              [summary]="analysisData.summary"
              [currencySymbol]="getCurrencySymbol()"
            ></app-metrics-cards>
          </div>

          <!-- Category Breakdown -->
          <div class="section">
            <h3 class="section-title">Category Breakdown</h3>
            <nz-card>
              <app-category-breakdown
                [categories]="analysisData.category_breakdown"
                [currencySymbol]="getCurrencySymbol()"
              ></app-category-breakdown>
            </nz-card>
          </div>

          <!-- Recommendations -->
          @if (analysisData.recommendations.length > 0) {
            <div class="section">
              <h3 class="section-title">Recommendations</h3>
              <nz-card>
                <ul class="recommendations">
                  @for (recommendation of analysisData.recommendations; track $index) {
                    <li>
                      <span nz-icon nzType="bulb" nzTheme="outline" class="icon"></span>
                      {{ recommendation }}
                    </li>
                  }
                </ul>
              </nz-card>
            </div>
          }
        }

        @if (!loading && !analysisData && !error) {
          <nz-card>
            <div class="empty-state">
              <span nz-icon nzType="bar-chart" nzTheme="outline" style="font-size: 48px; color: #d9d9d9;"></span>
              <h3>Select a period to analyze</h3>
              <p>Choose a date range and click "Analyze" to view your financial analysis</p>
            </div>
          </nz-card>
        }
      </nz-spin>
    </div>
  `,
  styles: [`
    .analysis-container {
      padding: 0;
    }

    .analysis-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
    }

    .analysis-header h2 {
      margin: 0 0 8px 0;
      font-size: 24px;
      color: #262626;
    }

    .subtitle {
      margin: 0;
      color: #8c8c8c;
      font-size: 14px;
    }

    .filter-card {
      margin-bottom: 24px;
    }

    .filters {
      display: flex;
      gap: 24px;
      align-items: flex-end;
      flex-wrap: wrap;
    }

    .filter-group {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .filter-group label {
      font-weight: 500;
      color: #262626;
      font-size: 14px;
    }

    .section {
      margin-bottom: 24px;
    }

    .section-title {
      font-size: 18px;
      font-weight: 600;
      color: #262626;
      margin: 0 0 16px 0;
    }

    .recommendations {
      list-style: none;
      padding: 0;
      margin: 0;
    }

    .recommendations li {
      padding: 12px;
      margin-bottom: 8px;
      background: #f6ffed;
      border: 1px solid #b7eb8f;
      border-radius: 4px;
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .recommendations li .icon {
      color: #52c41a;
      font-size: 16px;
    }

    .empty-state {
      text-align: center;
      padding: 48px 24px;
    }

    .empty-state h3 {
      margin: 16px 0 8px 0;
      color: #595959;
    }

    .empty-state p {
      color: #8c8c8c;
      margin: 0;
    }

    @media (max-width: 768px) {
      .filters {
        flex-direction: column;
        align-items: stretch;
      }

      .filter-group {
        width: 100%;
      }

      .filter-group nz-range-picker,
      .filter-group nz-select {
        width: 100% !important;
      }
    }
  `]
})
export class AnalysisComponent implements OnInit {
  private analysisService = inject(AnalysisService);
  private accountService = inject(AccountService);
  private authService = inject(AuthService);
  private messageService = inject(NzMessageService);

  currentUser = this.authService.getCurrentUser();
  accounts: Account[] = [];
  analysisData: AnalysisData | null = null;

  dateRange: [Date, Date] | null = null;
  selectedAccountIds: number[] = [];

  loading = false;
  error: string | null = null;

  ngOnInit(): void {
    this.loadAccounts();
    this.setDefaultDateRange();
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

  setDefaultDateRange(): void {
    const today = new Date();
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    this.dateRange = [threeMonthsAgo, today];
  }

  loadAnalysis(): void {
    if (!this.dateRange) {
      this.messageService.warning('Please select a date range');
      return;
    }

    this.loading = true;
    this.error = null;

    const [fromDate, toDate] = this.dateRange;
    const params = {
      from_date: this.formatDate(fromDate),
      to_date: this.formatDate(toDate),
      account_ids: this.selectedAccountIds.length > 0 ? this.selectedAccountIds : undefined,
    };

    this.analysisService.getAnalysis(params).subscribe({
      next: (data) => {
        this.analysisData = data;
        this.loading = false;
      },
      error: (err) => {
        this.error = err.error?.detail || 'Failed to load analysis';
        this.loading = false;
      },
    });
  }

  formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
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
