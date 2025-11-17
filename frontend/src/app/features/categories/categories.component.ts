import {ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, OnInit} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzModalRef, NzModalService } from 'ng-zorro-antd/modal';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { CategoryService } from './services/category.service';
import { Category, CategoryCreate, CategoryType, CategoryUpdate } from '../../core/models/category.model';
import { CategoryListComponent } from './components/category-list/category-list.component';
import { CategoryFormComponent } from './components/category-form/category-form.component';

@Component({
  selector: 'app-categories',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    FormsModule,
    NzCardModule,
    NzButtonModule,
    NzIconModule,
    NzSpinModule,
    NzAlertModule,
    NzSelectModule,
    CategoryListComponent
  ],
  providers: [NzModalService, NzMessageService],
  template: `
    <div class="categories-container">
      <div class="categories-header">
        <div>
          <h2>Categories</h2>
          <p class="subtitle">Manage transaction categories</p>
        </div>
        <div class="header-actions">
          <nz-select
            [(ngModel)]="selectedType"
            (ngModelChange)="onTypeFilterChange()"
            nzPlaceHolder="Filter by type"
            nzAllowClear
            style="width: 200px; margin-right: 12px;"
          >
            <nz-option [nzValue]="CategoryType.INCOME" nzLabel="Income"></nz-option>
            <nz-option [nzValue]="CategoryType.EXPENSE" nzLabel="Expense"></nz-option>
            <nz-option [nzValue]="CategoryType.TRANSFER" nzLabel="Transfer"></nz-option>
          </nz-select>
          <button nz-button nzType="primary" (click)="showCreateModal()">
            <span nz-icon nzType="plus"></span>
            Add Category
          </button>
        </div>
      </div>

      <nz-spin [nzSpinning]="loading" nzTip="Loading categories...">
        @if (error) {
          <nz-alert
            nzType="error"
            [nzMessage]="error"
            nzShowIcon
            nzCloseable
            (nzOnClose)="error = null"
            style="margin-bottom: 24px;"
          ></nz-alert>
        }

        @if (!loading && !error) {
          <nz-card>
            <app-category-list
              [categories]="categories"
              [loading]="loading"
              (editCategory)="showEditModal($event)"
              (deleteCategory)="handleDelete($event)"
            ></app-category-list>
          </nz-card>
        }
      </nz-spin>
    </div>
  `,
  styles: [`
    .categories-container {
      padding: 0;
    }

    .categories-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
    }

    .categories-header h2 {
      margin: 0 0 8px 0;
      font-size: 24px;
      color: #262626;
    }

    .subtitle {
      margin: 0;
      color: #8c8c8c;
      font-size: 14px;
    }

    .header-actions {
      display: flex;
      align-items: center;
    }

    @media (max-width: 768px) {
      .categories-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 16px;
      }

      .header-actions {
        width: 100%;
        flex-direction: column;
        gap: 8px;
      }

      .header-actions nz-select,
      .header-actions button {
        width: 100%;
      }
    }
  `]
})
export class CategoriesComponent implements OnInit {
  private categoryService = inject(CategoryService);
  private modalService = inject(NzModalService);
  private messageService = inject(NzMessageService);
  private cdr = inject(ChangeDetectorRef);

  categories: Category[] = [];
  loading = false;
  error: string | null = null;
  selectedType: CategoryType | null = null;
  CategoryType = CategoryType;

  ngOnInit(): void {
    this.loadCategories();
  }

  loadCategories(): void {
    this.loading = true;
    this.error = null;

    this.categoryService.listCategories(this.selectedType || undefined).subscribe({
      next: (categories) => {
        this.categories = categories;
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.error = err.error?.detail || 'Failed to load categories';
        this.loading = false;
        this.cdr.markForCheck();
      },
    });
  }

  onTypeFilterChange(): void {
    this.loadCategories();
  }

  showCreateModal(): void {
    const modal = this.modalService.create({
      nzTitle: 'Create Category',
      nzContent: CategoryFormComponent,
      nzFooter: null,
      nzWidth: 600,
    });

    const instance = modal.getContentComponent();
    if (instance) {
      instance.submitForm.subscribe((data: CategoryCreate) => {
        this.handleCreate(data, modal);
      });
      instance.cancel.subscribe(() => {
        modal.destroy();
      });
    }
  }

  showEditModal(categoryId: number): void {
    const category = this.categories.find(c => c.id === categoryId);
    if (!category) return;

    const modal = this.modalService.create({
      nzTitle: 'Edit Category',
      nzContent: CategoryFormComponent,
      nzFooter: null,
      nzWidth: 600,
    });

    const instance = modal.getContentComponent();
    if (instance) {
      instance.category = category;
      instance.submitForm.subscribe((data: CategoryUpdate) => {
        this.handleUpdate(categoryId, data, modal);
      });
      instance.cancel.subscribe(() => {
        modal.destroy();
      });
    }
  }

  handleCreate(data: CategoryCreate, modal: NzModalRef<CategoryFormComponent>): void {
    const instance = modal.getContentComponent();
    if (instance) {
      instance.loading = true;
    }

    this.categoryService.createCategory(data).subscribe({
      next: () => {
        this.messageService.success('Category created successfully');
        modal.destroy();
        this.loadCategories();
      },
      error: (err) => {
        this.messageService.error(err.error?.detail || 'Failed to create category');
        if (instance) {
          instance.loading = false;
        }
      },
    });
  }

  handleUpdate(categoryId: number, data: CategoryUpdate, modal: NzModalRef<CategoryFormComponent>): void {
    const instance = modal.getContentComponent();
    if (instance) {
      instance.loading = true;
    }

    this.categoryService.updateCategory(categoryId, data).subscribe({
      next: () => {
        this.messageService.success('Category updated successfully');
        modal.destroy();
        this.loadCategories();
      },
      error: (err) => {
        this.messageService.error(err.error?.detail || 'Failed to update category');
        if (instance) {
          instance.loading = false;
        }
      },
    });
  }

  handleDelete(categoryId: number): void {
    this.categoryService.deleteCategory(categoryId).subscribe({
      next: () => {
        this.messageService.success('Category deleted successfully');
        this.loadCategories();
      },
      error: (err) => {
        this.messageService.error(err.error?.detail || 'Failed to delete category');
      },
    });
  }
}
