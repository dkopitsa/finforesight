import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  inject,
  OnInit,
} from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzPopconfirmModule } from 'ng-zorro-antd/popconfirm';
import { NzEmptyModule } from 'ng-zorro-antd/empty';

import { FinancialInstitutionService } from '../../core/services/financial-institution.service';
import {
  FinancialInstitution,
  FinancialInstitutionCreate,
  FinancialInstitutionUpdate,
} from '../../core/models/financial-institution.model';

@Component({
  selector: 'app-financial-institutions',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    ReactiveFormsModule,
    NzButtonModule,
    NzModalModule,
    NzSpinModule,
    NzAlertModule,
    NzIconModule,
    NzTableModule,
    NzFormModule,
    NzInputModule,
    NzPopconfirmModule,
    NzEmptyModule,
  ],
  template: `
    <div class="institutions-container">
      <nz-spin [nzSpinning]="loading" nzTip="Loading...">
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
          <div>
            <!-- Header -->
            <div class="page-header">
              <div>
                <h2>Financial Institutions</h2>
                <p>Manage banks and financial institutions for your accounts</p>
              </div>
              <button nz-button nzType="primary" (click)="showCreateModal()">
                <span nz-icon nzType="plus" nzTheme="outline"></span>
                Add Institution
              </button>
            </div>

            <!-- Institutions Table -->
            @if (institutions.length > 0) {
              <nz-table
                #institutionsTable
                [nzData]="institutions"
                [nzPageSize]="10"
                [nzShowPagination]="institutions.length > 10"
                nzSize="middle"
              >
                <thead>
                  <tr>
                    <th>Name</th>
                    <th nzWidth="150px" nzAlign="center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  @for (institution of institutionsTable.data; track institution.id) {
                    <tr>
                      <td>
                        <span nz-icon nzType="bank" nzTheme="outline" style="margin-right: 8px; color: #1890ff;"></span>
                        {{ institution.name }}
                      </td>
                      <td nzAlign="center">
                        <button
                          nz-button
                          nzType="link"
                          nzSize="small"
                          (click)="showEditModal(institution)"
                        >
                          <span nz-icon nzType="edit"></span>
                        </button>
                        <button
                          nz-button
                          nzType="link"
                          nzSize="small"
                          nzDanger
                          nz-popconfirm
                          nzPopconfirmTitle="Delete this institution? Accounts using it will have their institution cleared."
                          (nzOnConfirm)="handleDelete(institution.id)"
                        >
                          <span nz-icon nzType="delete"></span>
                        </button>
                      </td>
                    </tr>
                  }
                </tbody>
              </nz-table>
            } @else {
              <div class="empty-state">
                <nz-empty
                  nzNotFoundContent="No financial institutions"
                  [nzNotFoundFooter]="emptyFooter"
                >
                  <ng-template #emptyFooter>
                    <button nz-button nzType="primary" (click)="showCreateModal()">
                      Add your first institution
                    </button>
                  </ng-template>
                </nz-empty>
              </div>
            }
          </div>
        }
      </nz-spin>

      <!-- Form Modal -->
      <nz-modal
        [(nzVisible)]="isModalVisible"
        [nzTitle]="modalTitle"
        [nzFooter]="null"
        (nzOnCancel)="handleModalCancel()"
        [nzWidth]="500"
      >
        <ng-container *nzModalContent>
          <form nz-form [formGroup]="form" (ngSubmit)="handleSubmit()">
            <nz-form-item>
              <nz-form-label [nzSpan]="6" nzRequired nzFor="name">Name</nz-form-label>
              <nz-form-control [nzSpan]="18" nzErrorTip="Please enter institution name">
                <input
                  nz-input
                  formControlName="name"
                  id="name"
                  placeholder="e.g., Bank of America, Chase, etc."
                />
              </nz-form-control>
            </nz-form-item>

            <div class="form-actions">
              <button nz-button nzType="default" type="button" (click)="handleModalCancel()">
                Cancel
              </button>
              <button
                nz-button
                nzType="primary"
                type="submit"
                [nzLoading]="formLoading"
                [disabled]="form.invalid"
              >
                {{ selectedInstitution ? 'Update' : 'Create' }}
              </button>
            </div>
          </form>
        </ng-container>
      </nz-modal>
    </div>
  `,
  styles: [
    `
      .institutions-container {
        padding: 0;
      }

      .page-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 24px;
      }

      .page-header h2 {
        margin: 0 0 8px 0;
        font-size: 24px;
        font-weight: 600;
      }

      .page-header p {
        margin: 0;
        color: #8c8c8c;
      }

      .empty-state {
        padding: 48px 24px;
        background: white;
        border-radius: 8px;
      }

      .form-actions {
        display: flex;
        justify-content: flex-end;
        gap: 8px;
        margin-top: 24px;
      }
    `,
  ],
})
export class FinancialInstitutionsComponent implements OnInit {
  private institutionService = inject(FinancialInstitutionService);
  private cdr = inject(ChangeDetectorRef);
  private messageService = inject(NzMessageService);
  private fb = inject(FormBuilder);

  institutions: FinancialInstitution[] = [];
  loading = false;
  error: string | null = null;

  isModalVisible = false;
  modalTitle = 'Add Institution';
  selectedInstitution: FinancialInstitution | null = null;
  formLoading = false;

  form: FormGroup = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(255)]],
  });

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading = true;
    this.error = null;

    this.institutionService.list().subscribe({
      next: (institutions) => {
        this.institutions = institutions;
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.error = err.error?.detail || 'Failed to load financial institutions';
        this.loading = false;
        this.cdr.markForCheck();
      },
    });
  }

  showCreateModal(): void {
    this.modalTitle = 'Add Institution';
    this.selectedInstitution = null;
    this.form.reset();
    this.isModalVisible = true;
  }

  showEditModal(institution: FinancialInstitution): void {
    this.modalTitle = 'Edit Institution';
    this.selectedInstitution = institution;
    this.form.patchValue({ name: institution.name });
    this.isModalVisible = true;
  }

  handleModalCancel(): void {
    this.isModalVisible = false;
    this.selectedInstitution = null;
    this.form.reset();
  }

  handleSubmit(): void {
    if (this.form.invalid) return;

    this.formLoading = true;
    const data = this.form.value;

    if (this.selectedInstitution) {
      this.institutionService.update(this.selectedInstitution.id, data as FinancialInstitutionUpdate).subscribe({
        next: () => {
          this.messageService.success('Institution updated successfully');
          this.formLoading = false;
          this.isModalVisible = false;
          this.selectedInstitution = null;
          this.form.reset();
          this.loadData();
          this.cdr.markForCheck();
        },
        error: (err) => {
          this.messageService.error(err.error?.detail || 'Failed to update institution');
          this.formLoading = false;
          this.cdr.markForCheck();
        },
      });
    } else {
      this.institutionService.create(data as FinancialInstitutionCreate).subscribe({
        next: () => {
          this.messageService.success('Institution created successfully');
          this.formLoading = false;
          this.isModalVisible = false;
          this.form.reset();
          this.loadData();
          this.cdr.markForCheck();
        },
        error: (err) => {
          this.messageService.error(err.error?.detail || 'Failed to create institution');
          this.formLoading = false;
          this.cdr.markForCheck();
        },
      });
    }
  }

  handleDelete(id: number): void {
    this.institutionService.delete(id).subscribe({
      next: () => {
        this.messageService.success('Institution deleted successfully');
        this.loadData();
      },
      error: (err) => {
        this.messageService.error(err.error?.detail || 'Failed to delete institution');
        this.cdr.markForCheck();
      },
    });
  }
}
