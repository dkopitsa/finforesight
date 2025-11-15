import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import {
  ScheduledTransaction,
  ScheduledTransactionCreate,
  ScheduledTransactionUpdate,
  TransactionInstance,
} from '../../../core/models/transaction.model';

@Injectable({
  providedIn: 'root',
})
export class SchedulerService {
  private apiService = inject(ApiService);

  /**
   * Get all scheduled transactions for the current user
   */
  listTransactions(): Observable<ScheduledTransaction[]> {
    return this.apiService.get<ScheduledTransaction[]>('/scheduled-transactions');
  }

  /**
   * Get a specific scheduled transaction by ID
   */
  getTransaction(id: number): Observable<ScheduledTransaction> {
    return this.apiService.get<ScheduledTransaction>(`/scheduled-transactions/${id}`);
  }

  /**
   * Create a new scheduled transaction
   */
  createTransaction(data: ScheduledTransactionCreate): Observable<ScheduledTransaction> {
    return this.apiService.post<ScheduledTransaction>('/scheduled-transactions', data);
  }

  /**
   * Update an existing scheduled transaction
   */
  updateTransaction(id: number, data: ScheduledTransactionUpdate): Observable<ScheduledTransaction> {
    return this.apiService.put<ScheduledTransaction>(`/scheduled-transactions/${id}`, data);
  }

  /**
   * Delete a scheduled transaction
   */
  deleteTransaction(id: number): Observable<void> {
    return this.apiService.delete<void>(`/scheduled-transactions/${id}`);
  }

  /**
   * Get transaction instances (expanded occurrences) for a date range
   */
  getInstances(fromDate: string, toDate: string): Observable<TransactionInstance[]> {
    return this.apiService.get<TransactionInstance[]>(
      `/scheduled-transactions/instances?from_date=${fromDate}&to_date=${toDate}`
    );
  }
}
