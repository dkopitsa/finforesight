import {ChangeDetectionStrategy, Component, EventEmitter, inject, Input, OnInit, Output} from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { Category, CategoryCreate, CategoryType, CategoryUpdate } from '../../../../core/models/category.model';

@Component({
  selector: 'app-category-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    ReactiveFormsModule,
    NzFormModule,
    NzInputModule,
    NzSelectModule,
    NzButtonModule
  ],
  template: `
    <form nz-form [formGroup]="categoryForm" (ngSubmit)="onSubmit()" [nzLayout]="'vertical'">
      <nz-form-item>
        <nz-form-label nzRequired>Category Name</nz-form-label>
        <nz-form-control nzErrorTip="Please enter category name (1-255 characters)">
          <input nz-input formControlName="name" placeholder="e.g., Groceries" />
        </nz-form-control>
      </nz-form-item>

      <nz-form-item>
        <nz-form-label nzRequired>Category Type</nz-form-label>
        <nz-form-control nzErrorTip="Please select category type">
          <nz-select formControlName="type" nzPlaceHolder="Select category type">
            <nz-option [nzValue]="CategoryType.INCOME" nzLabel="Income"></nz-option>
            <nz-option [nzValue]="CategoryType.EXPENSE" nzLabel="Expense"></nz-option>
            <nz-option [nzValue]="CategoryType.TRANSFER" nzLabel="Transfer"></nz-option>
          </nz-select>
        </nz-form-control>
      </nz-form-item>

      <nz-form-item>
        <nz-form-label>Icon</nz-form-label>
        <nz-form-control nzErrorTip="Icon identifier (max 50 characters)">
          <input nz-input formControlName="icon" placeholder="e.g., shopping-cart" />
        </nz-form-control>
      </nz-form-item>

      <nz-form-item>
        <nz-form-label>Color</nz-form-label>
        <nz-form-control nzErrorTip="Color in hex format (#RRGGBB)">
          <input nz-input formControlName="color" placeholder="#1890ff" type="color" />
        </nz-form-control>
      </nz-form-item>

      <nz-form-item>
        <nz-form-control>
          <button nz-button nzType="primary" type="submit" [nzLoading]="loading" [disabled]="!categoryForm.valid">
            {{ editMode ? 'Update' : 'Create' }} Category
          </button>
          <button nz-button type="button" (click)="onCancel()" style="margin-left: 8px;">
            Cancel
          </button>
        </nz-form-control>
      </nz-form-item>
    </form>
  `,
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class CategoryFormComponent implements OnInit {
  private fb = inject(FormBuilder);

  @Input() category: Category | null = null;
  @Input() loading = false;

  @Output() submitForm = new EventEmitter<CategoryCreate | CategoryUpdate>();
  @Output() cancel = new EventEmitter<void>();

  categoryForm!: FormGroup;
  editMode = false;
  CategoryType = CategoryType;

  ngOnInit(): void {
    this.editMode = !!this.category;
    this.initForm();

    if (this.category) {
      this.populateForm();
    }
  }

  private initForm(): void {
    this.categoryForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(1), Validators.maxLength(255)]],
      type: [null, [Validators.required]],
      icon: ['', [Validators.maxLength(50)]],
      color: ['', [Validators.pattern(/^#[0-9A-Fa-f]{6}$/)]],
    });
  }

  private populateForm(): void {
    if (!this.category) return;

    this.categoryForm.patchValue({
      name: this.category.name,
      type: this.category.type,
      icon: this.category.icon || '',
      color: this.category.color || '',
    });
  }

  onSubmit(): void {
    if (this.categoryForm.invalid) return;

    const formValue = this.categoryForm.value;
    const data: CategoryCreate | CategoryUpdate = {
      name: formValue.name,
      type: formValue.type,
      icon: formValue.icon || undefined,
      color: formValue.color || undefined,
    };

    this.submitForm.emit(data);
  }

  onCancel(): void {
    this.cancel.emit();
  }
}
