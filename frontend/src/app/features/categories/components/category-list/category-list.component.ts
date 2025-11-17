import {ChangeDetectionStrategy, Component, EventEmitter, Input, Output} from '@angular/core';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzPopconfirmModule } from 'ng-zorro-antd/popconfirm';
import { NzBadgeModule } from 'ng-zorro-antd/badge';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { Category, CategoryType } from '../../../../core/models/category.model';

@Component({
  selector: 'app-category-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    NzTableModule,
    NzButtonModule,
    NzIconModule,
    NzTagModule,
    NzPopconfirmModule,
    NzBadgeModule,
    NzToolTipModule
  ],
  template: `
    <nz-table
      #categoriesTable
      [nzData]="categories"
      [nzLoading]="loading"
      [nzPageSize]="20"
      [nzShowPagination]="categories.length > 20"
    >
      <thead>
        <tr>
          <th>Name</th>
          <th>Type</th>
          <th>Color</th>
          <th>Status</th>
          <th nzWidth="120px">Actions</th>
        </tr>
      </thead>
      <tbody>
        @for (category of categoriesTable.data; track category.id) {
          <tr>
            <td>
              <strong>{{ category.name }}</strong>
              @if (category.icon) {
                <span style="margin-left: 8px; color: #8c8c8c;">
                  ({{ category.icon }})
                </span>
              }
            </td>
            <td>
              @if (category.type === CategoryType.INCOME) {
                <nz-tag nzColor="success">Income</nz-tag>
              }
              @if (category.type === CategoryType.EXPENSE) {
                <nz-tag nzColor="error">Expense</nz-tag>
              }
              @if (category.type === CategoryType.TRANSFER) {
                <nz-tag nzColor="processing">Transfer</nz-tag>
              }
            </td>
            <td>
              @if (category.color) {
                <nz-badge [nzColor]="category.color" [nzText]="category.color"></nz-badge>
              }
              @if (!category.color) {
                <span style="color: #8c8c8c;">-</span>
              }
            </td>
            <td>
              @if (category.is_system) {
                <nz-tag nzColor="default">System</nz-tag>
              }
              @if (!category.is_system) {
                <nz-tag nzColor="blue">Custom</nz-tag>
              }
            </td>
            <td>
              <button
                nz-button
                nzType="default"
                nzSize="small"
                [disabled]="category.is_system"
                [nz-tooltip]="category.is_system ? 'System categories cannot be edited' : 'Edit category'"
                (click)="onEdit(category.id)"
                style="margin-right: 8px;"
              >
                <span nz-icon nzType="edit" nzTheme="outline"></span>
              </button>
              <button
                nz-button
                nzType="default"
                nzDanger
                nzSize="small"
                [disabled]="category.is_system"
                [nz-tooltip]="category.is_system ? 'System categories cannot be deleted' : 'Delete category'"
                nz-popconfirm
                nzPopconfirmTitle="Are you sure you want to delete this category?"
                nzPopconfirmPlacement="left"
                (nzOnConfirm)="onDelete(category.id)"
              >
                <span nz-icon nzType="delete" nzTheme="outline"></span>
              </button>
            </td>
          </tr>
        }
      </tbody>
    </nz-table>
  `,
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class CategoryListComponent {
  @Input() categories: Category[] = [];
  @Input() loading = false;

  @Output() editCategory = new EventEmitter<number>();
  @Output() deleteCategory = new EventEmitter<number>();

  CategoryType = CategoryType;

  onEdit(categoryId: number): void {
    this.editCategory.emit(categoryId);
  }

  onDelete(categoryId: number): void {
    this.deleteCategory.emit(categoryId);
  }
}
