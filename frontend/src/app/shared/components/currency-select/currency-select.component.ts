import { Component, forwardRef, Input } from '@angular/core';
import {
  ControlValueAccessor,
  NG_VALUE_ACCESSOR,
  FormsModule,
} from '@angular/forms';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { CurrencyService } from '../../../core/services/currency.service';

/**
 * Reusable currency select component with ControlValueAccessor
 * Can be used with both template-driven and reactive forms
 *
 * Usage:
 * <app-currency-select formControlName="currency"></app-currency-select>
 * <app-currency-select [(ngModel)]="currency"></app-currency-select>
 * <app-currency-select [disabled]="true"></app-currency-select>
 */
@Component({
  selector: 'app-currency-select',
  standalone: true,
  imports: [NzSelectModule, FormsModule],
  template: `
    <nz-select
      [ngModel]="value"
      (ngModelChange)="onChange($event)"
      [nzPlaceHolder]="placeholder"
      [nzDisabled]="disabled"
      nzShowSearch
      style="width: 100%"
    >
      @for (option of currencyOptions; track option.value) {
        <nz-option [nzValue]="option.value" [nzLabel]="option.label" />
      }
    </nz-select>
  `,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => CurrencySelectComponent),
      multi: true,
    },
  ],
})
export class CurrencySelectComponent implements ControlValueAccessor {
  @Input() placeholder = 'Select currency';

  value: string = '';
  disabled = false;
  currencyOptions: Array<{ label: string; value: string }> = [];

  // ControlValueAccessor callbacks
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private onChangeCallback = (value: string) => {};
  private onTouchedCallback = () => {};

  constructor(private currencyService: CurrencyService) {
    this.currencyOptions = this.currencyService.getCurrencyOptions();
  }

  // ControlValueAccessor implementation
  writeValue(value: string): void {
    this.value = value || '';
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChangeCallback = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouchedCallback = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  // Handle value changes
  onChange(value: string): void {
    this.value = value;
    this.onChangeCallback(value);
    this.onTouchedCallback();
  }
}
