import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NzResultModule } from 'ng-zorro-antd/result';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, NzResultModule],
  template: `
    <div class="dashboard-placeholder">
      <nz-result
        nzStatus="info"
        nzTitle="Dashboard Coming Soon"
        [nzSubTitle]="'Welcome, ' + (currentUser?.full_name || 'User') + '!'"
      >
      </nz-result>

      <div class="info-box">
        <h3>Next Steps (Week 2)</h3>
        <ul>
          <li>Forecast chart showing 12-month balance projection</li>
          <li>Summary cards (Current Balance, Income, Expenses, Net)</li>
          <li>Upcoming transactions for next 7 days</li>
        </ul>
        <p><strong>Current User:</strong> {{ currentUser?.full_name }}</p>
        <p><strong>Email:</strong> {{ currentUser?.email }}</p>
        <p><strong>Currency:</strong> {{ currentUser?.currency }}</p>
      </div>
    </div>
  `,
  styles: [`
    .dashboard-placeholder {
      padding: 24px;
    }

    .info-box {
      background: #f5f5f5;
      border-radius: 8px;
      padding: 24px;
      max-width: 800px;
      margin: 24px auto 0;
    }

    .info-box h3 {
      margin: 0 0 16px 0;
      color: #262626;
      font-size: 18px;
    }

    .info-box ul {
      margin: 0 0 16px 0;
      padding-left: 24px;
    }

    .info-box li {
      margin: 8px 0;
      color: #595959;
      line-height: 1.6;
    }

    .info-box p {
      margin: 8px 0;
      color: #595959;
      line-height: 1.6;
    }
  `]
})
export class DashboardComponent {
  private authService = inject(AuthService);

  currentUser = this.authService.getCurrentUser();
}
