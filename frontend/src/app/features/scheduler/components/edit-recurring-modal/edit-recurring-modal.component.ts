import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzRadioModule } from 'ng-zorro-antd/radio';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { FormsModule } from '@angular/forms';
import { UpdateMode } from '../../../../core/models/transaction.model';

@Component({
  selector: 'app-edit-recurring-modal',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NzModalModule,
    NzButtonModule,
    NzRadioModule,
    NzIconModule,
    NzAlertModule,
  ],
  template: `
    <nz-modal
      [(nzVisible)]="visible"
      [nzTitle]="'Edit Recurring Transaction'"
      [nzFooter]="modalFooter"
      (nzOnCancel)="handleCancel()"
      [nzWidth]="500"
    >
      <ng-container *nzModalContent>
        <nz-alert
          nzType="info"
          nzShowIcon
          nzMessage="This is a recurring transaction"
          nzDescription="Choose how you want to apply the changes."
          style="margin-bottom: 24px;"
        ></nz-alert>

        <div class="edit-mode-selection">
          <nz-radio-group [(ngModel)]="selectedMode">
            <div class="radio-option">
              <label nz-radio [nzValue]="UpdateMode.THIS_ONLY">
                <div class="option-content">
                  <div class="option-header">
                    <span nz-icon nzType="edit" nzTheme="outline"></span>
                    <strong>This occurrence only</strong>
                  </div>
                  <div class="option-description">
                    Edit only this specific date. Other occurrences remain unchanged.
                  </div>
                  @if (instanceDate) {
                    <div class="option-detail">
                      Date: {{ formatDate(instanceDate) }}
                    </div>
                  }
                </div>
              </label>
            </div>

            <div class="radio-option">
              <label nz-radio [nzValue]="UpdateMode.THIS_AND_FUTURE">
                <div class="option-content">
                  <div class="option-header">
                    <span nz-icon nzType="arrow-right" nzTheme="outline"></span>
                    <strong>This and future occurrences</strong>
                  </div>
                  <div class="option-description">
                    Edit this occurrence and all future ones. Past occurrences remain unchanged.
                  </div>
                  @if (instanceDate) {
                    <div class="option-detail">
                      From: {{ formatDate(instanceDate) }} onwards
                    </div>
                  }
                </div>
              </label>
            </div>

            <div class="radio-option">
              <label nz-radio [nzValue]="UpdateMode.ALL">
                <div class="option-content">
                  <div class="option-header">
                    <span nz-icon nzType="retweet" nzTheme="outline"></span>
                    <strong>All occurrences</strong>
                  </div>
                  <div class="option-description">
                    Edit the entire series. All past and future occurrences will be affected.
                  </div>
                  <div class="option-detail">
                    Applies to all instances in the series
                  </div>
                </div>
              </label>
            </div>
          </nz-radio-group>
        </div>
      </ng-container>

      <ng-template #modalFooter>
        <button nz-button nzType="default" (click)="handleCancel()">
          Cancel
        </button>
        <button nz-button nzType="primary" (click)="handleConfirm()" [disabled]="!selectedMode">
          Continue
        </button>
      </ng-template>
    </nz-modal>
  `,
  styles: [`
    .edit-mode-selection {
      padding: 8px 0;
    }

    .radio-option {
      margin-bottom: 16px;
      padding: 16px;
      border: 1px solid #d9d9d9;
      border-radius: 8px;
      transition: all 0.3s;
    }

    .radio-option:hover {
      border-color: #1890ff;
      background-color: #f0f7ff;
    }

    .radio-option:has(input[type="radio"]:checked) {
      border-color: #1890ff;
      background-color: #e6f7ff;
    }

    .option-content {
      width: 100%;
      margin-left: 8px;
    }

    .option-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 8px;
    }

    .option-header strong {
      font-size: 14px;
      color: #262626;
    }

    .option-description {
      font-size: 13px;
      color: #595959;
      line-height: 1.5;
      margin-bottom: 8px;
    }

    .option-detail {
      font-size: 12px;
      color: #8c8c8c;
      font-style: italic;
    }

    :host ::ng-deep .ant-radio-wrapper {
      width: 100%;
      align-items: flex-start;
    }

    :host ::ng-deep .ant-radio {
      margin-top: 2px;
    }
  `]
})
export class EditRecurringModalComponent {
  @Input() visible = false;
  @Input() transactionName = '';
  @Input() instanceDate?: string;

  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() modeSelected = new EventEmitter<UpdateMode>();
  @Output() cancel = new EventEmitter<void>();

  selectedMode: UpdateMode | null = null;
  UpdateMode = UpdateMode;

  handleConfirm(): void {
    if (this.selectedMode) {
      this.modeSelected.emit(this.selectedMode);
      this.visible = false;
      this.visibleChange.emit(false);
      this.selectedMode = null;
    }
  }

  handleCancel(): void {
    this.visible = false;
    this.visibleChange.emit(false);
    this.selectedMode = null;
    this.cancel.emit();
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }
}
