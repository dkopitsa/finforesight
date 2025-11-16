import {ChangeDetectionStrategy, Component, inject} from '@angular/core';

import { Router } from '@angular/router';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzModalService } from 'ng-zorro-antd/modal';
import { NzMessageService } from 'ng-zorro-antd/message';
import { ProfileSettingsComponent } from './components/profile-settings/profile-settings.component';
import { PasswordChangeComponent } from './components/password-change/password-change.component';
import { SettingsService } from './services/settings.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-settings',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    NzCardModule,
    NzButtonModule,
    NzIconModule,
    ProfileSettingsComponent,
    PasswordChangeComponent
  ],
  providers: [NzModalService, NzMessageService],
  template: `
    <div class="settings-container">
      <div class="settings-header">
        <div>
          <h2>Settings</h2>
          <p class="subtitle">Manage your account settings and preferences</p>
        </div>
      </div>

      <div class="settings-content">
        <!-- Profile Settings -->
        <div class="settings-section">
          <app-profile-settings></app-profile-settings>
        </div>

        <!-- Password Change -->
        <div class="settings-section">
          <app-password-change></app-password-change>
        </div>

        <!-- Danger Zone -->
        <div class="settings-section">
          <nz-card nzTitle="Danger Zone">
            <div class="danger-item">
              <div class="danger-info">
                <h4>Logout from all devices</h4>
                <p>
                  This will log you out from all devices where you are currently signed in.
                  You will need to sign in again on each device.
                </p>
              </div>
              <button
                nz-button
                nzDanger
                (click)="confirmLogoutAll()"
              >
                <span nz-icon nzType="logout" nzTheme="outline"></span>
                Logout All
              </button>
            </div>
          </nz-card>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .settings-container {
      padding: 0;
    }

    .settings-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
    }

    .settings-header h2 {
      margin: 0 0 8px 0;
      font-size: 24px;
      color: #262626;
    }

    .subtitle {
      margin: 0;
      color: #8c8c8c;
      font-size: 14px;
    }

    .settings-content {
      max-width: 800px;
    }

    .settings-section {
      margin-bottom: 24px;
    }

    .danger-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 24px;
    }

    .danger-info {
      flex: 1;
    }

    .danger-info h4 {
      margin: 0 0 8px 0;
      font-size: 16px;
      font-weight: 600;
      color: #262626;
    }

    .danger-info p {
      margin: 0;
      font-size: 14px;
      color: #8c8c8c;
    }

    @media (max-width: 768px) {
      .danger-item {
        flex-direction: column;
        align-items: flex-start;
      }
    }
  `]
})
export class SettingsComponent {
  private settingsService = inject(SettingsService);
  private authService = inject(AuthService);
  private modalService = inject(NzModalService);
  private messageService = inject(NzMessageService);
  private router = inject(Router);

  confirmLogoutAll(): void {
    this.modalService.confirm({
      nzTitle: 'Logout from all devices?',
      nzContent: 'This will log you out from all devices. You will need to sign in again.',
      nzOkText: 'Logout All',
      nzOkDanger: true,
      nzCancelText: 'Cancel',
      nzOnOk: () => this.logoutAll(),
    });
  }

  logoutAll(): void {
    this.settingsService.logoutAllDevices().subscribe({
      next: () => {
        this.messageService.success('Logged out from all devices');
        // Logout current session
        this.authService.logout();
        this.router.navigate(['/auth/login']);
      },
      error: (err) => {
        this.messageService.error(err.error?.detail || 'Failed to logout from all devices');
      },
    });
  }
}
