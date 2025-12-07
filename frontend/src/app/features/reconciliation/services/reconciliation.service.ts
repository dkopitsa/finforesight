import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiService } from '../../../core/services/api.service';
import { Reconciliation, ReconciliationCreate, ReconciliationSummary } from '../../../core/models/reconciliation.model';

@Injectable({
  providedIn: 'root'
})
export class ReconciliationService {
  private apiService = inject(ApiService);

  listReconciliations(accountId?: number): Observable<ReconciliationSummary[]> {
    return this.apiService.get<ReconciliationSummary[]>(`/reconciliations/`, {account_id: accountId});
  }

  getReconciliation(id: number): Observable<Reconciliation> {
    return this.apiService.get<Reconciliation>(`/reconciliations/${id}`);
  }

  createReconciliation(data: ReconciliationCreate): Observable<Reconciliation> {
    return this.apiService.post<Reconciliation>('/reconciliations/', data);
  }

  deleteReconciliation(id: number): Observable<void> {
    return this.apiService.delete<void>(`/reconciliations/${id}`);
  }

  getExpectedBalancesForDate(
    accountIds: number[],
    reconciliationDate: string
  ): Observable<Map<number, string>> {
    if (accountIds.length === 0) {
      return new Observable(observer => {
        observer.next(new Map());
        observer.complete();
      });
    }

    const fromDate = new Date(reconciliationDate);
    fromDate.setFullYear(fromDate.getFullYear() - 1);

    const params = {
      from_date: this.formatDate(fromDate),
      to_date: reconciliationDate,
      account_ids: accountIds.join(',')
    };

    return this.apiService.get<any>('/forecast/', params).pipe(
      map(forecast => {
        const balanceMap = new Map<number, string>();
        if (forecast && forecast.accounts) {
          forecast.accounts.forEach((accountForecast: any) => {
            const lastPoint = accountForecast.data_points && accountForecast.data_points.length > 0
              ? accountForecast.data_points[accountForecast.data_points.length - 1]
              : null;
            const balance = lastPoint
              ? lastPoint.balance
              : accountForecast.starting_balance;
            balanceMap.set(accountForecast.account_id, balance);
          });
        }
        return balanceMap;
      })
    );
  }

  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }
}
