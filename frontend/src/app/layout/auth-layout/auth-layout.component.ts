import {ChangeDetectionStrategy, Component} from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-auth-layout',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [RouterOutlet],
  template: `
    <div class="auth-layout">
      <div class="auth-container">
        <div class="auth-header">
          <h1 class="logo">FinForesight</h1>
          <p class="tagline">Smart Financial Planning</p>
        </div>
        <div class="auth-content">
          <router-outlet />
        </div>
      </div>
    </div>
  `,
  styles: [`
    .auth-layout {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 20px;
    }

    .auth-container {
      width: 100%;
      max-width: 450px;
    }

    .auth-header {
      text-align: center;
      margin-bottom: 32px;
    }

    .logo {
      font-size: 36px;
      font-weight: 700;
      color: white;
      margin: 0 0 8px 0;
      text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    .tagline {
      font-size: 16px;
      color: rgba(255, 255, 255, 0.9);
      margin: 0;
    }

    .auth-content {
      background: white;
      border-radius: 8px;
      padding: 40px;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
    }

    @media (max-width: 576px) {
      .auth-content {
        padding: 24px;
      }
    }
  `]
})
export class AuthLayoutComponent {}
