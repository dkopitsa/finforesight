import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import {
  Account,
  AccountCreate,
  AccountUpdate,
  AccountSummary,
} from '../../../core/models/account.model';

@Injectable({
  providedIn: 'root',
})
export class AccountService {
  private apiService = inject(ApiService);

  /**
   * Get all accounts for the current user
   */
  listAccounts(): Observable<Account[]> {
    return this.apiService.get<Account[]>('/accounts/');
  }

  /**
   * Get a specific account by ID
   */
  getAccount(id: number): Observable<Account> {
    return this.apiService.get<Account>(`/accounts/${id}`);
  }

  /**
   * Create a new account
   */
  createAccount(data: AccountCreate): Observable<Account> {
    return this.apiService.post<Account>('/accounts/', data);
  }

  /**
   * Update an existing account
   */
  updateAccount(id: number, data: AccountUpdate): Observable<Account> {
    return this.apiService.put<Account>(`/accounts/${id}`, data);
  }

  /**
   * Delete an account (soft delete - sets is_active to false)
   */
  deleteAccount(id: number): Observable<void> {
    return this.apiService.delete<void>(`/accounts/${id}`);
  }

  /**
   * Get account summary with totals by category
   */
  getAccountSummary(): Observable<AccountSummary> {
    return this.apiService.get<AccountSummary>('/accounts/summary/totals');
  }
}
