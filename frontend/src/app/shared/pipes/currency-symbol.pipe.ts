import { Pipe, PipeTransform } from '@angular/core';
import { CurrencyService } from '../../core/services/currency.service';

/**
 * Pipe to get currency symbol from currency code
 * Usage: {{ 'USD' | currencySymbol }} => $
 *        {{ account.currency | currencySymbol }} => €
 */
@Pipe({
  name: 'currencySymbol',
  standalone: true,
})
export class CurrencySymbolPipe implements PipeTransform {
  constructor(private currencyService: CurrencyService) {}

  transform(currencyCode: string): string {
    if (!currencyCode) {
      return this.currencyService.getCurrencySymbol(
        this.currencyService.getDefaultCurrency()
      );
    }
    return this.currencyService.getCurrencySymbol(currencyCode);
  }
}
