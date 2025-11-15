import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { ForecastData } from '../../../core/models/dashboard.model';

export interface ForecastParams {
  from_date: string;
  to_date: string;
  account_ids?: number[];
}

@Injectable({
  providedIn: 'root'
})
export class ForecastService {
  private apiService = inject(ApiService);

  getForecast(params: ForecastParams): Observable<ForecastData> {
    const queryParams = new URLSearchParams();
    queryParams.append('from_date', params.from_date);
    queryParams.append('to_date', params.to_date);

    if (params.account_ids && params.account_ids.length > 0) {
      params.account_ids.forEach(id => {
        queryParams.append('account_ids', id.toString());
      });
    }

    return this.apiService.get<ForecastData>(`/forecast?${queryParams.toString()}`);
  }
}
