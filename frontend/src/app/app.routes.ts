import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { MainLayoutComponent } from './layout/main-layout/main-layout.component';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/dashboard',
    pathMatch: 'full'
  },
  {
    path: 'auth',
    loadChildren: () => import('./features/auth/auth.routes').then(m => m.authRoutes)
  },
  {
    path: '',
    component: MainLayoutComponent,
    canActivate: [authGuard],
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent)
      },
      {
        path: 'accounts',
        loadComponent: () => import('./features/accounts/accounts.component').then(m => m.AccountsComponent)
      },
      {
        path: 'categories',
        loadComponent: () => import('./features/categories/categories.component').then(m => m.CategoriesComponent)
      },
      {
        path: 'scheduler',
        loadComponent: () => import('./features/scheduler/scheduler.component').then(m => m.SchedulerComponent)
      },
      {
        path: 'forecast',
        loadComponent: () => import('./features/forecast/forecast.component').then(m => m.ForecastComponent)
      },
      {
        path: 'reconciliation',
        loadComponent: () => import('./features/reconciliation/reconciliation.component').then(m => m.ReconciliationComponent)
      },
      {
        path: 'analysis',
        loadComponent: () => import('./features/analysis/analysis.component').then(m => m.AnalysisComponent)
      },
      {
        path: 'settings',
        loadComponent: () => import('./features/settings/settings.component').then(m => m.SettingsComponent)
      }
    ]
  },
  {
    path: '**',
    redirectTo: '/dashboard'
  }
];
