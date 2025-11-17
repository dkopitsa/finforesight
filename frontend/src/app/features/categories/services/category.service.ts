import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { Category, CategoryCreate, CategoryUpdate, CategoryType } from '../../../core/models/category.model';

@Injectable({
  providedIn: 'root'
})
export class CategoryService {
  private apiService = inject(ApiService);

  listCategories(type?: CategoryType): Observable<Category[]> {
    const params = type ? { type } : {};
    return this.apiService.get<Category[]>('/categories/', params);
  }

  getCategory(id: number): Observable<Category> {
    return this.apiService.get<Category>(`/categories/${id}`);
  }

  createCategory(data: CategoryCreate): Observable<Category> {
    return this.apiService.post<Category>('/categories/', data);
  }

  updateCategory(id: number, data: CategoryUpdate): Observable<Category> {
    return this.apiService.put<Category>(`/categories/${id}`, data);
  }

  deleteCategory(id: number): Observable<void> {
    return this.apiService.delete<void>(`/categories/${id}`);
  }
}
