import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { NzLayoutModule } from 'ng-zorro-antd/layout';
import { NzMenuModule } from 'ng-zorro-antd/menu';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink,
    NzLayoutModule,
    NzMenuModule,
    NzIconModule,
    NzDropDownModule,
    NzAvatarModule,
  ],
  template: `
    <nz-layout class="main-layout">
      <!-- Sidebar -->
      <nz-sider
        nzCollapsible
        [(nzCollapsed)]="isCollapsed"
        [nzWidth]="240"
        [nzCollapsedWidth]="80"
        nzTheme="dark"
      >
        <div class="logo">
          <span class="logo-text" [class.collapsed]="isCollapsed">
            {{ isCollapsed ? 'FF' : 'FinForesight' }}
          </span>
        </div>

        <ul
          nz-menu
          nzTheme="dark"
          nzMode="inline"
          [nzInlineCollapsed]="isCollapsed"
        >
          <li nz-menu-item nzMatchRouter>
            <a routerLink="/dashboard">
              <span nz-icon nzType="dashboard" nzTheme="outline"></span>
              <span>Dashboard</span>
            </a>
          </li>

          <li nz-menu-item nzMatchRouter>
            <a routerLink="/accounts">
              <span nz-icon nzType="wallet" nzTheme="outline"></span>
              <span>Accounts</span>
            </a>
          </li>

          <li nz-menu-item nzMatchRouter>
            <a routerLink="/scheduler">
              <span nz-icon nzType="schedule" nzTheme="outline"></span>
              <span>Scheduler</span>
            </a>
          </li>

          <li nz-menu-item nzMatchRouter>
            <a routerLink="/forecast">
              <span nz-icon nzType="line-chart" nzTheme="outline"></span>
              <span>Forecast</span>
            </a>
          </li>

          <li nz-menu-item nzMatchRouter>
            <a routerLink="/reconciliation">
              <span nz-icon nzType="check-circle" nzTheme="outline"></span>
              <span>Reconciliation</span>
            </a>
          </li>

          <li nz-menu-item nzMatchRouter>
            <a routerLink="/analysis">
              <span nz-icon nzType="bar-chart" nzTheme="outline"></span>
              <span>Analysis</span>
            </a>
          </li>
        </ul>
      </nz-sider>

      <!-- Main Content Area -->
      <nz-layout>
        <!-- Header -->
        <nz-header class="header">
          <div class="header-content">
            <div class="header-left">
              <h1 class="page-title">{{ getPageTitle() }}</h1>
            </div>

            <div class="header-right">
              <!-- User Menu -->
              <div class="user-menu" nz-dropdown [nzDropdownMenu]="userDropdown" nzTrigger="click">
                <nz-avatar
                  nzIcon="user"
                  [nzText]="getUserInitials()"
                  [nzSize]="36"
                  style="background-color: #1890ff; cursor: pointer;"
                ></nz-avatar>
                <span class="user-name">{{ currentUser?.full_name || 'User' }}</span>
                <span nz-icon nzType="down" nzTheme="outline"></span>
              </div>

              <nz-dropdown-menu #userDropdown="nzDropdownMenu">
                <ul nz-menu>
                  <li nz-menu-item>
                    <span nz-icon nzType="user" nzTheme="outline"></span>
                    Profile
                  </li>
                  <li nz-menu-item>
                    <span nz-icon nzType="setting" nzTheme="outline"></span>
                    Settings
                  </li>
                  <li nz-menu-divider></li>
                  <li nz-menu-item (click)="logout()">
                    <span nz-icon nzType="logout" nzTheme="outline"></span>
                    Logout
                  </li>
                </ul>
              </nz-dropdown-menu>
            </div>
          </div>
        </nz-header>

        <!-- Page Content -->
        <nz-content class="content">
          <div class="content-wrapper">
            <router-outlet />
          </div>
        </nz-content>

        <!-- Footer -->
        <nz-footer class="footer">
          FinForesight ©2025 - Smart Financial Planning
        </nz-footer>
      </nz-layout>
    </nz-layout>
  `,
  styles: [`
    .main-layout {
      min-height: 100vh;
    }

    /* Sidebar Logo */
    .logo {
      height: 64px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(255, 255, 255, 0.1);
      margin: 16px;
      border-radius: 8px;
      transition: all 0.3s;
    }

    .logo-text {
      color: white;
      font-size: 20px;
      font-weight: 700;
      transition: all 0.3s;
    }

    .logo-text.collapsed {
      font-size: 18px;
    }

    /* Menu Styling */
    :host ::ng-deep .ant-menu-dark .ant-menu-item-selected {
      background-color: #1890ff !important;
    }

    :host ::ng-deep .ant-menu-dark .ant-menu-item:hover {
      background-color: rgba(24, 144, 255, 0.2) !important;
    }

    :host ::ng-deep .ant-menu-item a {
      display: flex;
      align-items: center;
      gap: 12px;
      color: inherit;
      text-decoration: none;
    }

    /* Header */
    .header {
      background: white;
      padding: 0 24px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
      z-index: 10;
    }

    .header-content {
      display: flex;
      align-items: center;
      justify-content: space-between;
      height: 100%;
    }

    .header-left {
      display: flex;
      align-items: center;
    }

    .page-title {
      font-size: 20px;
      font-weight: 600;
      color: #262626;
      margin: 0;
    }

    .header-right {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    /* User Menu */
    .user-menu {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 8px 16px;
      border-radius: 8px;
      cursor: pointer;
      transition: background-color 0.3s;
    }

    .user-menu:hover {
      background-color: #f5f5f5;
    }

    .user-name {
      font-size: 14px;
      font-weight: 500;
      color: #262626;
    }

    /* Content */
    .content {
      margin: 24px;
      background: #f0f2f5;
    }

    .content-wrapper {
      background: white;
      padding: 24px;
      min-height: calc(100vh - 64px - 48px - 70px - 48px);
      border-radius: 8px;
    }

    /* Footer */
    .footer {
      text-align: center;
      background: #f0f2f5;
      color: #8c8c8c;
      font-size: 14px;
    }

    /* Responsive */
    @media (max-width: 768px) {
      .content {
        margin: 16px;
      }

      .content-wrapper {
        padding: 16px;
      }

      .user-name {
        display: none;
      }
    }
  `]
})
export class MainLayoutComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  isCollapsed = false;
  currentUser = this.authService.getCurrentUser();

  getPageTitle(): string {
    const url = this.router.url;
    if (url.includes('/dashboard')) return 'Dashboard';
    if (url.includes('/accounts')) return 'Accounts';
    if (url.includes('/scheduler')) return 'Scheduler';
    if (url.includes('/forecast')) return 'Forecast';
    if (url.includes('/reconciliation')) return 'Reconciliation';
    if (url.includes('/analysis')) return 'Analysis';
    return 'FinForesight';
  }

  getUserInitials(): string {
    const name = this.currentUser?.full_name || 'U';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }

  logout(): void {
    this.authService.logout();
  }
}
