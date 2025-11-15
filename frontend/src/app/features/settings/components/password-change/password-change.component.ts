import { Component, inject } from '@angular/core';

import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzMessageService } from 'ng-zorro-antd/message';
import { SettingsService } from '../../services/settings.service';
import { PasswordChange } from '../../../../core/models/user.model';

@Component({
  selector: 'app-password-change',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    NzCardModule,
    NzFormModule,
    NzInputModule,
    NzButtonModule
],
  template: `
    <nz-card nzTitle="Change Password">
      <form nz-form [formGroup]="passwordForm" (ngSubmit)="onSubmit()">
        <nz-form-item>
          <nz-form-label [nzSpan]="6" nzRequired>Current Password</nz-form-label>
          <nz-form-control
            [nzSpan]="14"
            nzErrorTip="Please enter your current password"
          >
            <input
              nz-input
              type="password"
              formControlName="current_password"
              placeholder="Enter current password"
            />
          </nz-form-control>
        </nz-form-item>

        <nz-form-item>
          <nz-form-label [nzSpan]="6" nzRequired>New Password</nz-form-label>
          <nz-form-control
            [nzSpan]="14"
            [nzErrorTip]="newPasswordError"
          >
            <input
              nz-input
              type="password"
              formControlName="new_password"
              placeholder="Enter new password"
            />
          </nz-form-control>
        </nz-form-item>

        <nz-form-item>
          <nz-form-label [nzSpan]="6" nzRequired>Confirm Password</nz-form-label>
          <nz-form-control
            [nzSpan]="14"
            [nzErrorTip]="confirmPasswordError"
          >
            <input
              nz-input
              type="password"
              formControlName="confirm_password"
              placeholder="Confirm new password"
            />
          </nz-form-control>
        </nz-form-item>

        <nz-form-item>
          <nz-form-control [nzSpan]="14" [nzOffset]="6">
            <button
              nz-button
              nzType="primary"
              type="submit"
              [nzLoading]="loading"
              [disabled]="!passwordForm.valid"
            >
              Change Password
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
  `]
})
export class PasswordChangeComponent {
  private fb = inject(FormBuilder);
  private settingsService = inject(SettingsService);
  private messageService = inject(NzMessageService);

  passwordForm: FormGroup;
  loading = false;

  constructor() {
    this.passwordForm = this.fb.group({
      current_password: ['', Validators.required],
      new_password: ['', [Validators.required, Validators.minLength(6)]],
      confirm_password: ['', Validators.required],
    }, { validators: this.passwordMatchValidator });
  }

  passwordMatchValidator(form: FormGroup): Record<string, boolean> | null {
    const newPassword = form.get('new_password')?.value;
    const confirmPassword = form.get('confirm_password')?.value;

    if (newPassword !== confirmPassword) {
      return { passwordMismatch: true };
    }
    return null;
  }

  get newPasswordError(): string {
    const control = this.passwordForm.get('new_password');
    if (control?.hasError('required')) {
      return 'Please enter new password';
    }
    if (control?.hasError('minlength')) {
      return 'Password must be at least 6 characters';
    }
    return '';
  }

  get confirmPasswordError(): string {
    const control = this.passwordForm.get('confirm_password');
    if (control?.hasError('required')) {
      return 'Please confirm your password';
    }
    if (this.passwordForm.hasError('passwordMismatch') && control?.touched) {
      return 'Passwords do not match';
    }
    return '';
  }

  onSubmit(): void {
    if (!this.passwordForm.valid) return;

    this.loading = true;
    const data: PasswordChange = {
      current_password: this.passwordForm.value.current_password,
      new_password: this.passwordForm.value.new_password,
    };

    this.settingsService.changePassword(data).subscribe({
      next: () => {
        this.messageService.success('Password changed successfully');
        this.passwordForm.reset();
        this.loading = false;
      },
      error: (err) => {
        this.messageService.error(err.error?.detail || 'Failed to change password');
        this.loading = false;
      },
    });
  }
}
