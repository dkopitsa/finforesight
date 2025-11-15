import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, AbstractControl } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    NzFormModule,
    NzInputModule,
    NzButtonModule,
    NzSelectModule,
    NzAlertModule,
    NzIconModule,
  ],
  template: `
    <div class="register-container">
      <h2>Create Account</h2>
      <p class="subtitle">Join FinForesight to start planning your financial future</p>

      @if (errorMessage) {
        <nz-alert
          nzType="error"
          [nzMessage]="errorMessage"
          nzCloseable
          (nzOnClose)="errorMessage = ''"
          style="margin-bottom: 24px;"
        ></nz-alert>
      }

      <form nz-form [formGroup]="registerForm" (ngSubmit)="onSubmit()">
        <nz-form-item>
          <nz-form-label [nzRequired]="true">Full Name</nz-form-label>
          <nz-form-control nzErrorTip="Please enter your full name">
            <input
              nz-input
              formControlName="full_name"
              type="text"
              placeholder="John Doe"
              [nzSize]="'large'"
            />
          </nz-form-control>
        </nz-form-item>

        <nz-form-item>
          <nz-form-label [nzRequired]="true">Email</nz-form-label>
          <nz-form-control nzErrorTip="Please enter a valid email address">
            <input
              nz-input
              formControlName="email"
              type="email"
              placeholder="your@email.com"
              [nzSize]="'large'"
            />
          </nz-form-control>
        </nz-form-item>

        <nz-form-item>
          <nz-form-label [nzRequired]="true">Password</nz-form-label>
          <nz-form-control [nzErrorTip]="passwordErrorTip">
            <input
              nz-input
              formControlName="password"
              type="password"
              placeholder="At least 8 characters"
              [nzSize]="'large'"
            />
          </nz-form-control>
        </nz-form-item>

        <nz-form-item>
          <nz-form-label [nzRequired]="true">Confirm Password</nz-form-label>
          <nz-form-control [nzErrorTip]="confirmPasswordErrorTip">
            <input
              nz-input
              formControlName="confirmPassword"
              type="password"
              placeholder="Re-enter your password"
              [nzSize]="'large'"
            />
          </nz-form-control>
        </nz-form-item>

        <nz-form-item>
          <nz-form-label [nzRequired]="true">Currency</nz-form-label>
          <nz-form-control nzErrorTip="Please select your currency">
            <nz-select
              formControlName="currency"
              nzPlaceHolder="Select your currency"
              [nzSize]="'large'"
            >
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

        <button
          nz-button
          nzType="primary"
          nzBlock
          [nzSize]="'large'"
          [nzLoading]="loading"
          [disabled]="!registerForm.valid"
          type="submit"
        >
          Create Account
        </button>

        <div class="login-link">
          Already have an account?
          <a routerLink="/auth/login">Sign in</a>
        </div>
      </form>
    </div>
  `,
  styles: [`
    .register-container {
      width: 100%;
    }

    h2 {
      font-size: 24px;
      font-weight: 600;
      color: #262626;
      margin: 0 0 8px 0;
      text-align: center;
    }

    .subtitle {
      font-size: 14px;
      color: #8c8c8c;
      margin: 0 0 32px 0;
      text-align: center;
    }

    nz-form-item {
      margin-bottom: 20px;
    }

    nz-form-label {
      font-weight: 500;
    }

    button[type="submit"] {
      margin-top: 8px;
    }

    .login-link {
      text-align: center;
      margin-top: 24px;
      font-size: 14px;
      color: #595959;
    }

    .login-link a {
      color: #1890ff;
      margin-left: 4px;
      font-weight: 500;
    }

    .login-link a:hover {
      color: #40a9ff;
    }
  `]
})
export class RegisterComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  registerForm: FormGroup;
  loading = false;
  errorMessage = '';

  constructor() {
    this.registerForm = this.fb.group({
      full_name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required]],
      currency: ['USD', [Validators.required]]
    }, {
      validators: this.passwordMatchValidator
    });
  }

  passwordMatchValidator(control: AbstractControl): Record<string, boolean> | null {
    const password = control.get('password');
    const confirmPassword = control.get('confirmPassword');

    if (!password || !confirmPassword) {
      return null;
    }

    return password.value === confirmPassword.value ? null : { passwordMismatch: true };
  }

  get passwordErrorTip(): string {
    const control = this.registerForm.get('password');
    if (control?.hasError('required')) {
      return 'Please enter a password';
    }
    if (control?.hasError('minlength')) {
      return 'Password must be at least 8 characters';
    }
    return '';
  }

  get confirmPasswordErrorTip(): string {
    const control = this.registerForm.get('confirmPassword');
    if (control?.hasError('required')) {
      return 'Please confirm your password';
    }
    if (this.registerForm.hasError('passwordMismatch') && control?.touched) {
      return 'Passwords do not match';
    }
    return '';
  }

  onSubmit(): void {
    if (this.registerForm.valid) {
      this.loading = true;
      this.errorMessage = '';

      const { full_name, email, password, currency } = this.registerForm.value;

      this.authService.register({
        full_name,
        email,
        password,
        currency
      }).subscribe({
        next: () => {
          this.loading = false;
          this.router.navigate(['/dashboard']);
        },
        error: (error) => {
          this.loading = false;
          this.errorMessage = error.error?.detail || 'Registration failed. Please try again.';
        }
      });
    }
  }
}
