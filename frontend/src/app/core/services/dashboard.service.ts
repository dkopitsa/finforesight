import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { DashboardData, ForecastData } from '../models/dashboard.model';

@Injectable({
  providedIn: 'root',
})
export class DashboardService {
  private apiService = inject(ApiService);

  getDashboard(): Observable<DashboardData> {
    return this.apiService.get<DashboardData>('/dashboard');
  }

  getForecast(fromDate: string, toDate: string, accountIds?: number[]): Observable<ForecastData> {
    const params: any = {
      from_date: fromDate,
      to_date: toDate,
    };

    if (accountIds && accountIds.length > 0) {
      params.account_ids = accountIds.join(',');
    }

    return this.apiService.get<ForecastData>('/forecast', params);
  }
}
