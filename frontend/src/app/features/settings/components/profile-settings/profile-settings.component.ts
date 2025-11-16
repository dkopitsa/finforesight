import {ChangeDetectionStrategy, Component, inject, OnInit} from '@angular/core';

import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzMessageService } from 'ng-zorro-antd/message';
import { SettingsService } from '../../services/settings.service';
import { AuthService } from '../../../../core/services/auth.service';
import { ProfileUpdate } from '../../../../core/models/user.model';

@Component({
  selector: 'app-profile-settings',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    ReactiveFormsModule,
    NzCardModule,
    NzFormModule,
    NzInputModule,
    NzButtonModule,
    NzSelectModule
],
  template: `
    <nz-card nzTitle="Profile Settings">
      <form nz-form [formGroup]="profileForm" (ngSubmit)="onSubmit()">
        <nz-form-item>
          <nz-form-label [nzSpan]="6" nzRequired>Full Name</nz-form-label>
          <nz-form-control [nzSpan]="14" nzErrorTip="Please enter your full name">
            <input
              nz-input
              formControlName="full_name"
              placeholder="John Doe"
            />
          </nz-form-control>
        </nz-form-item>

        <nz-form-item>
          <nz-form-label [nzSpan]="6" nzRequired>Currency</nz-form-label>
          <nz-form-control [nzSpan]="14" nzErrorTip="Please select your currency">
            <nz-select formControlName="currency" nzShowSearch>
              <nz-option nzValue="USD" nzLabel="USD - US Dollar"></nz-option>
              <nz-option nzValue="EUR" nzLabel="EUR - Euro"></nz-option>
              <nz-option nzValue="GBP" nzLabel="GBP - British Pound"></nz-option>
              <nz-option nzValue="JPY" nzLabel="JPY - Japanese Yen"></nz-option>
              <nz-option nzValue="CAD" nzLabel="CAD - Canadian Dollar"></nz-option>
              <nz-option nzValue="AUD" nzLabel="AUD - Australian Dollar"></nz-option>
              <nz-option nzValue="CHF" nzLabel="CHF - Swiss Franc"></nz-option>
              <nz-option nzValue="CNY" nzLabel="CNY - Chinese Yuan"></nz-option>
            </nz-select>
          </nz-form-control>
        </nz-form-item>

        <nz-form-item>
          <nz-form-label [nzSpan]="6">Email</nz-form-label>
          <nz-form-control [nzSpan]="14">
            <input
              nz-input
              [value]="currentUser?.email || ''"
              disabled
            />
            <small style="color: #8c8c8c;">Email cannot be changed</small>
          </nz-form-control>
        </nz-form-item>

        <nz-form-item>
          <nz-form-control [nzSpan]="14" [nzOffset]="6">
            <button
              nz-button
              nzType="primary"
              type="submit"
              [nzLoading]="loading"
              [disabled]="!profileForm.valid || !profileForm.dirty"
            >
              Save Changes
            </button>
          </nz-form-control>
        </nz-form-item>
      </form>
    </nz-card>
  `,
  styles: [`
    :host ::ng-deep .ant-form-item {
      margin-bottom: 24px;
    }

    small {
      display: block;
      margin-top: 4px;
    }
  `]
})
export class ProfileSettingsComponent implements OnInit {
  private fb = inject(FormBuilder);
  private settingsService = inject(SettingsService);
  private authService = inject(AuthService);
  private messageService = inject(NzMessageService);

  currentUser = this.authService.getCurrentUser();
  profileForm!: FormGroup;
  loading = false;

  ngOnInit(): void {
    this.profileForm = this.fb.group({
      full_name: [this.currentUser?.full_name || '', Validators.required],
      currency: [this.currentUser?.currency || 'USD', Validators.required],
    });
  }

  onSubmit(): void {
    if (!this.profileForm.valid) return;

    this.loading = true;
    const data: ProfileUpdate = this.profileForm.value;

    this.settingsService.updateProfile(data).subscribe({
      next: (user) => {
        this.messageService.success('Profile updated successfully');
        this.authService.updateCurrentUser(user);
        this.profileForm.markAsPristine();
        this.loading = false;
      },
      error: (err) => {
        this.messageService.error(err.error?.detail || 'Failed to update profile');
        this.loading = false;
      },
    });
  }
}
