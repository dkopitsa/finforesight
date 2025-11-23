import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import {
  FinancialInstitution,
  FinancialInstitutionCreate,
  FinancialInstitutionUpdate,
} from '../models/financial-institution.model';

@Injectable({
  providedIn: 'root',
})
export class FinancialInstitutionService {
  private apiService = inject(ApiService);

  /**
   * Get all financial institutions for the current user
   */
  list(): Observable<FinancialInstitution[]> {
    return this.apiService.get<FinancialInstitution[]>('/financial-institutions/');
  }

  /**
   * Get a specific financial institution by ID
   */
  get(id: number): Observable<FinancialInstitution> {
    return this.apiService.get<FinancialInstitution>(`/financial-institutions/${id}`);
  }

  /**
   * Create a new financial institution
   */
  create(data: FinancialInstitutionCreate): Observable<FinancialInstitution> {
    return this.apiService.post<FinancialInstitution>('/financial-institutions/', data);
  }

  /**
   * Update an existing financial institution
   */
  update(id: number, data: FinancialInstitutionUpdate): Observable<FinancialInstitution> {
    return this.apiService.put<FinancialInstitution>(`/financial-institutions/${id}`, data);
  }

  /**
   * Delete a financial institution
   */
  delete(id: number): Observable<void> {
    return this.apiService.delete<void>(`/financial-institutions/${id}`);
  }
}
