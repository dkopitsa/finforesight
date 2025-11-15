import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { Reconciliation, ReconciliationCreate, ReconciliationSummary } from '../../../core/models/reconciliation.model';

@Injectable({
  providedIn: 'root'
})
export class ReconciliationService {
  private apiService = inject(ApiService);

  listReconciliations(accountId?: number): Observable<ReconciliationSummary[]> {
    const params = accountId ? `?account_id=${accountId}` : '';
    return this.apiService.get<ReconciliationSummary[]>(`/reconciliations${params}`);
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
}
