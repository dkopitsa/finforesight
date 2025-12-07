import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { NzLayoutModule } from 'ng-zorro-antd/layout';
import { NzMenuModule } from 'ng-zorro-antd/menu';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { NzDrawerModule } from 'ng-zorro-antd/drawer';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterOutlet,
    RouterLink,
    NzLayoutModule,
    NzMenuModule,
    NzIconModule,
    NzDropDownModule,
    NzAvatarModule,
    NzDrawerModule,
    NzButtonModule,
  ],
  template: `
    <nz-layout class="app-layout">
      <!-- Top Navigation Header -->
      <nz-header>
        <div class="header-container">
          <!-- Logo -->
          <div class="logo">
            <a routerLink="/dashboard">
              <h1>FinForesight</h1>
            </a>
          </div>

          <!-- Desktop Navigation Menu -->
          <ul nz-menu class="top-nav" nzTheme="dark" nzMode="horizontal">
            <li nz-menu-item routerLinkActive="ant-menu-item-selected" routerLink="/dashboard">
              <span nz-icon nzType="dashboard" nzTheme="outline"></span>
              Dashboard
            </li>
            <li nz-menu-item routerLinkActive="ant-menu-item-selected" routerLink="/accounts">
              <span nz-icon nzType="wallet" nzTheme="outline"></span>
              Accounts
            </li>
            <li nz-menu-item routerLinkActive="ant-menu-item-selected" routerLink="/scheduler">
              <span nz-icon nzType="schedule" nzTheme="outline"></span>
              Scheduler
            </li>
            <li nz-menu-item routerLinkActive="ant-menu-item-selected" routerLink="/forecast">
              <span nz-icon nzType="line-chart" nzTheme="outline"></span>
              Forecast
            </li>
            <li nz-menu-item routerLinkActive="ant-menu-item-selected" routerLink="/reconciliation">
              <span nz-icon nzType="check-circle" nzTheme="outline"></span>
              Reconciliation
            </li>
            <li nz-menu-item routerLinkActive="ant-menu-item-selected" routerLink="/analysis">
              <span nz-icon nzType="bar-chart" nzTheme="outline"></span>
              Analysis
            </li>
          </ul>

          <!-- User Menu (Desktop) -->
          <div class="header-right">
            <div class="user-menu" nz-dropdown [nzDropdownMenu]="userDropdown" nzTrigger="click">
              <nz-avatar
                nzIcon="user"
                [nzText]="getUserInitials()"
                [nzSize]="32"
                style="background-color: #1890ff; cursor: pointer;"
              ></nz-avatar>
              <span class="user-name">{{ currentUser?.full_name || 'User' }}</span>
              <span nz-icon nzType="down" nzTheme="outline" class="dropdown-icon"></span>
            </div>

            <nz-dropdown-menu #userDropdown="nzDropdownMenu">
              <ul nz-menu>
                <li nz-menu-item>
                  <a routerLink="/settings">
                    <span nz-icon nzType="setting" nzTheme="outline"></span>
                    Settings
                  </a>
                </li>
                <li nz-menu-divider></li>
                <li nz-menu-item>
                  <a routerLink="/financial-institutions">
                    <span nz-icon nzType="bank" nzTheme="outline"></span>
                    Financial Institutions
                  </a>
                </li>
                <li nz-menu-item>
                  <a routerLink="/categories">
                    <span nz-icon nzType="tags" nzTheme="outline"></span>
                    Categories
                  </a>
                </li>
                <li nz-menu-divider></li>
                <li nz-menu-item (click)="logout()">
                  <span nz-icon nzType="logout" nzTheme="outline"></span>
                  Logout
                </li>
              </ul>
            </nz-dropdown-menu>

            <!-- Mobile Menu Button -->
            <button nz-button nzType="text" class="mobile-menu-button" (click)="openDrawer()">
              <span nz-icon nzType="menu" nzTheme="outline"></span>
            </button>
          </div>
        </div>
      </nz-header>

      <!-- Mobile Drawer -->
      <nz-drawer
        [nzVisible]="drawerVisible"
        [nzPlacement]="'right'"
        [nzClosable]="false"
        [nzWidth]="280"
        (nzOnClose)="closeDrawer()"
        [nzBodyStyle]="{ padding: '0' }"
      >
        <div class="mobile-drawer">
          <div class="drawer-header">
            <div class="logo">
              <h1>FinForesight</h1>
            </div>
            <button nz-button nzType="text" (click)="closeDrawer()" class="close-button">
              <span nz-icon nzType="close" nzTheme="outline"></span>
            </button>
          </div>

          <ul nz-menu nzTheme="dark" nzMode="inline" (click)="closeDrawer()">
            <li nz-menu-item routerLinkActive="ant-menu-item-selected" routerLink="/dashboard">
              <span nz-icon nzType="dashboard" nzTheme="outline"></span>
              <span>Dashboard</span>
            </li>
            <li nz-menu-item routerLinkActive="ant-menu-item-selected" routerLink="/accounts">
              <span nz-icon nzType="wallet" nzTheme="outline"></span>
              <span>Accounts</span>
            </li>
            <li nz-menu-item routerLinkActive="ant-menu-item-selected" routerLink="/categories">
              <span nz-icon nzType="tags" nzTheme="outline"></span>
              <span>Categories</span>
            </li>
            <li nz-menu-item routerLinkActive="ant-menu-item-selected" routerLink="/scheduler">
              <span nz-icon nzType="schedule" nzTheme="outline"></span>
              <span>Scheduler</span>
            </li>
            <li nz-menu-item routerLinkActive="ant-menu-item-selected" routerLink="/forecast">
              <span nz-icon nzType="line-chart" nzTheme="outline"></span>
              <span>Forecast</span>
            </li>
            <li nz-menu-item routerLinkActive="ant-menu-item-selected" routerLink="/reconciliation">
              <span nz-icon nzType="check-circle" nzTheme="outline"></span>
              <span>Reconciliation</span>
            </li>
            <li nz-menu-item routerLinkActive="ant-menu-item-selected" routerLink="/analysis">
              <span nz-icon nzType="bar-chart" nzTheme="outline"></span>
              <span>Analysis</span>
            </li>

            <li nz-menu-divider></li>

            <li nz-menu-item routerLink="/settings">
              <span nz-icon nzType="setting" nzTheme="outline"></span>
              <span>Settings</span>
            </li>
            <li nz-menu-item routerLink="/financial-institutions">
              <span nz-icon nzType="bank" nzTheme="outline"></span>
              <span>Financial Institutions</span>
            </li>

            <li nz-menu-item (click)="logout()">
              <span nz-icon nzType="logout" nzTheme="outline"></span>
              <span>Logout</span>
            </li>
          </ul>
        </div>
      </nz-drawer>

      <!-- Main Content -->
      <nz-content>
        <div class="inner-content">
          <router-outlet />
        </div>
      </nz-content>

      <!-- Footer -->
      <nz-footer class="footer"> FinForesight ©2025 - Smart Financial Planning </nz-footer>
    </nz-layout>
  `,
  styles: [
    `
      :host {
        display: flex;
        flex: 1;
      }

      .app-layout {
        min-height: 100vh;
      }

      /* Header */
      nz-header {
        background: #001529;
        padding: 0 24px;
        position: sticky;
        top: 0;
        z-index: 1000;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
      }

      .header-container {
        display: flex;
        align-items: center;
        justify-content: space-between;
        height: 100%;
        max-width: 1400px;
        margin: 0 auto;
      }

      /* Logo */
      .logo {
        float: left;
        min-width: 180px;
        padding-right: 24px;
      }

      .logo a {
        display: flex;
        align-items: center;
        text-decoration: none;
        gap: 12px;
      }

      .logo h1 {
        margin: 0;
        color: #fff;
        font-weight: 600;
        font-size: 20px;
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      }

      /* Top Navigation */
      .top-nav {
        flex: 1;
        line-height: 64px;
        border-bottom: none;
        display: flex;
        justify-content: center;
      }

      :host ::ng-deep .top-nav .ant-menu-item {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 0 20px;
      }

      :host ::ng-deep .top-nav .ant-menu-item span[nz-icon] {
        font-size: 16px;
      }

      /* Header Right */
      .header-right {
        display: flex;
        align-items: center;
        gap: 16px;
        min-width: 180px;
        justify-content: flex-end;
      }

      /* User Menu */
      .user-menu {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 6px 12px;
        border-radius: 6px;
        cursor: pointer;
        transition: background-color 0.3s;
      }

      .user-menu:hover {
        background-color: rgba(255, 255, 255, 0.1);
      }

      .user-name {
        font-size: 14px;
        font-weight: 500;
        color: #fff;
      }

      .dropdown-icon {
        color: #fff;
        font-size: 12px;
      }

      /* Mobile Menu Button */
      .mobile-menu-button {
        display: none;
        font-size: 20px;
        color: #fff;
      }

      .mobile-menu-button:hover {
        background-color: rgba(255, 255, 255, 0.1);
      }

      /* Mobile Drawer */
      .mobile-drawer {
        background: #001529;
        height: 100%;
      }

      .drawer-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 16px 20px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      }

      .drawer-header .logo {
        padding: 0;
        min-width: auto;
      }

      .drawer-header .logo h1 {
        font-size: 18px;
      }

      .close-button {
        color: white;
        font-size: 18px;
      }

      .close-button:hover {
        background: rgba(255, 255, 255, 0.1);
      }

      /* Content */
      nz-content {
        padding: 24px 50px;
        background: #f0f2f5;
      }

      .inner-content {
        padding: 24px;
        background: #fff;
        min-height: calc(100vh - 64px - 70px - 48px);
        border-radius: 8px;
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);
      }

      /* Footer */
      .footer {
        text-align: center;
        background: #f0f2f5;
        color: #8c8c8c;
        font-size: 14px;
      }

      /* Tablet */
      @media (max-width: 1200px) {
        .top-nav {
          display: none;
        }

        .mobile-menu-button {
          display: flex;
        }

        .logo {
          min-width: auto;
        }

        .header-right {
          min-width: auto;
        }
      }

      /* Mobile */
      @media (max-width: 768px) {
        nz-header {
          padding: 0 16px;
        }

        nz-content {
          padding: 16px;
        }

        .inner-content {
          padding: 16px;
          min-height: calc(100vh - 64px - 70px - 32px);
        }

        .user-name {
          display: none;
        }

        .dropdown-icon {
          display: none;
        }

        .user-menu {
          padding: 4px;
        }

        .logo h1 {
          font-size: 18px;
        }

        .footer {
          font-size: 12px;
          padding: 12px 8px;
        }
      }

      /* Small Mobile */
      @media (max-width: 480px) {
        nz-header {
          padding: 0 12px;
        }

        nz-content {
          padding: 12px;
        }

        .inner-content {
          padding: 12px;
        }

        .logo h1 {
          font-size: 16px;
        }
      }
    `,
  ],
})
export class MainLayoutComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  drawerVisible = false;
  currentUser = this.authService.getCurrentUser();

  openDrawer(): void {
    this.drawerVisible = true;
  }

  closeDrawer(): void {
    this.drawerVisible = false;
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
