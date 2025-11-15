import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { Category } from '../models/category.model';

@Injectable({
  providedIn: 'root',
})
export class CategoryService {
  private apiService = inject(ApiService);

  /**
   * Get all categories (system + user's custom)
   */
  listCategories(type?: string): Observable<Category[]> {
    const params = type ? `?type=${type}` : '';
    return this.apiService.get<Category[]>(`/categories${params}`);
  }
}
