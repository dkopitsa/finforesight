import {ChangeDetectionStrategy, Component, inject} from '@angular/core';

import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    NzFormModule,
    NzInputModule,
    NzButtonModule,
    NzCheckboxModule,
    NzAlertModule,
    NzIconModule
],
  template: `
    <div class="login-container">
      <h2>Welcome Back</h2>
      <p class="subtitle">Sign in to your account to continue</p>

      @if (errorMessage) {
        <nz-alert
          nzType="error"
          [nzMessage]="errorMessage"
          nzCloseable
          (nzOnClose)="errorMessage = ''"
          style="margin-bottom: 24px;"
        ></nz-alert>
      }

      <form nz-form [formGroup]="loginForm" (ngSubmit)="onSubmit()">
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
          <nz-form-control nzErrorTip="Please enter your password">
            <input
              nz-input
              formControlName="password"
              type="password"
              placeholder="Enter your password"
              [nzSize]="'large'"
            />
          </nz-form-control>
        </nz-form-item>

        <nz-form-item>
          <nz-form-control>
            <label nz-checkbox formControlName="rememberMe">
              Remember me
            </label>
          </nz-form-control>
        </nz-form-item>

        <button
          nz-button
          nzType="primary"
          nzBlock
          [nzSize]="'large'"
          [nzLoading]="loading"
          [disabled]="!loginForm.valid"
          type="submit"
        >
          Sign In
        </button>

        <div class="register-link">
          Don't have an account?
          <a routerLink="/auth/register">Register now</a>
        </div>
      </form>
    </div>
  `,
  styles: [`
    .login-container {
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
      margin-bottom: 24px;
    }

    nz-form-label {
      font-weight: 500;
    }

    button[type="submit"] {
      margin-top: 8px;
    }

    .register-link {
      text-align: center;
      margin-top: 24px;
      font-size: 14px;
      color: #595959;
    }

    .register-link a {
      color: #1890ff;
      margin-left: 4px;
      font-weight: 500;
    }

    .register-link a:hover {
      color: #40a9ff;
    }
  `]
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  loginForm: FormGroup;
  loading = false;
  errorMessage = '';

  constructor() {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      rememberMe: [false]
    });
  }

  onSubmit(): void {
    if (this.loginForm.valid) {
      this.loading = true;
      this.errorMessage = '';

      const { email, password } = this.loginForm.value;

      this.authService.login({ email, password }).subscribe({
        next: () => {
          this.loading = false;
          this.router.navigate(['/dashboard']);
        },
        error: (error) => {
          this.loading = false;
          this.errorMessage = error.error?.detail || 'Login failed. Please try again.';
        }
      });
    }
  }
}
