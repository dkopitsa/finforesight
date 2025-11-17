import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { TransactionInstance } from '../../../core/models/transaction.model';

@Injectable({
  providedIn: 'root'
})
export class ConfirmationService {
  private http = inject(HttpClient);
  private readonly baseUrl = '/api/v1/scheduled-transactions';

  getPendingConfirmations(): Observable<TransactionInstance[]> {
    return this.http.get<TransactionInstance[]>(`${this.baseUrl}/instances/pending-confirmation`);
  }

  bulkConfirm(
    scheduledTransactionId: number,
    accountId: number,
    applyTo: 'past' | 'all' | 'specific_dates',
    specificDates?: string[]
  ): Observable<{ message: string; mode: string }> {
    let params = new HttpParams()
      .set('scheduled_transaction_id', scheduledTransactionId.toString())
      .set('account_id', accountId.toString())
      .set('apply_to', applyTo);

    if (specificDates && specificDates.length > 0) {
      specificDates.forEach(date => {
        params = params.append('specific_dates', date);
      });
    }

    return this.http.patch<{ message: string; mode: string }>(
      `${this.baseUrl}/instances/bulk-confirm`,
      null,
      { params }
    );
  }

  confirmSingleInstance(
    scheduledTransactionId: number,
    instanceDate: string,
    accountId: number
  ): Observable<any> {
    const params = new HttpParams()
      .set('update_mode', 'THIS_ONLY')
      .set('instance_date', instanceDate);

    return this.http.put(
      `${this.baseUrl}/${scheduledTransactionId}`,
      { account_id: accountId },
      { params }
    );
  }
}
