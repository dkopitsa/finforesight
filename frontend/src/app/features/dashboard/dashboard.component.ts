import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzResultModule } from 'ng-zorro-antd/result';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, NzButtonModule, NzResultModule],
  template: `
    <div class="dashboard-placeholder">
      <nz-result
        nzStatus="success"
        nzTitle="Welcome to FinForesight!"
        [nzSubTitle]="'Logged in as: ' + (currentUser?.email || '')"
      >
        <div nz-result-extra>
          <button nz-button nzType="primary" (click)="logout()">Logout</button>
        </div>
      </nz-result>

      <div class="info-box">
        <h3>Dashboard Coming Soon</h3>
        <p>The full dashboard with forecast charts and financial summaries will be implemented in Week 2.</p>
        <p><strong>Current User:</strong> {{ currentUser?.full_name }}</p>
        <p><strong>Currency:</strong> {{ currentUser?.currency }}</p>
      </div>
    </div>
  `,
  styles: [`
    .dashboard-placeholder {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 40px 20px;
      background: #f0f2f5;
    }

    .info-box {
      background: white;
      border-radius: 8px;
      padding: 24px;
      max-width: 600px;
      margin-top: 24px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }

    .info-box h3 {
      margin: 0 0 16px 0;
      color: #262626;
      font-size: 18px;
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
  private router = inject(Router);

  currentUser = this.authService.getCurrentUser();

  logout(): void {
    this.authService.logout();
  }
}
