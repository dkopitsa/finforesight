import {ChangeDetectionStrategy, Component, inject, Input, OnChanges, SimpleChanges} from '@angular/core';

import { NgxEchartsModule } from 'ngx-echarts';
import { EChartsOption } from 'echarts';
import { BalanceTrendPoint } from '../../../../core/models/dashboard.model';
import { CurrencyService } from '../../../../core/services/currency.service';

@Component({
  selector: 'app-forecast-chart',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [NgxEchartsModule],
  template: `
    <div class="chart-container">
      <div class="chart-header">
        <h3>Balance History & Forecast</h3>
        <p>Historical reconciliations and projected balance</p>
      </div>
      @if (chartOption) {
        <div echarts [options]="chartOption" class="chart"></div>
      }
      @if (!chartOption) {
        <div class="empty-state">
          <p>No data available</p>
        </div>
      }
    </div>
    `,
  styles: [`
    .chart-container {
      background: white;
      border-radius: 8px;
      padding: 24px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
    }

    .chart-header {
      margin-bottom: 24px;
    }

    .chart-header h3 {
      margin: 0 0 8px 0;
      color: #262626;
      font-size: 18px;
      font-weight: 600;
    }

    .chart-header p {
      margin: 0;
      color: #8c8c8c;
      font-size: 14px;
    }

    .chart {
      height: 400px;
      width: 100%;
    }

    .empty-state {
      height: 400px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #8c8c8c;
    }

    @media (max-width: 768px) {
      .chart-container {
        padding: 16px;
      }

      .chart {
        height: 300px;
      }

      .empty-state {
        height: 300px;
      }
    }
  `]
})
export class ForecastChartComponent implements OnChanges {
  private currencyService = inject(CurrencyService);

  @Input() balanceTrend: BalanceTrendPoint[] = [];
  @Input() liquidTrend: BalanceTrendPoint[] = [];
  @Input() investmentsTrend: BalanceTrendPoint[] = [];
  @Input() creditTrend: BalanceTrendPoint[] = [];
  @Input() todayDate = '';
  @Input() currencyCode = 'USD';

  chartOption: EChartsOption | null = null;

  private readonly colors = {
    netWorth: '#722ed1',
    liquid: '#52c41a',
    investments: '#1890ff',
    credit: '#ff4d4f',
    todayLine: '#faad14',
  };

  ngOnChanges(changes: SimpleChanges): void {
    if ((changes['balanceTrend'] || changes['liquidTrend'] || changes['investmentsTrend'] || changes['creditTrend'] || changes['todayDate']) &&
        this.balanceTrend.length > 0) {
      this.updateChart();
    }
  }

  private updateChart(): void {
    const dates = this.balanceTrend.map(point => point.date);
    const netWorthData = this.balanceTrend.map(point => parseFloat(point.balance));
    const liquidData = this.liquidTrend.map(point => parseFloat(point.balance));
    const investmentsData = this.investmentsTrend.map(point => parseFloat(point.balance));
    const creditData = this.creditTrend.map(point => parseFloat(point.balance));

    // Find today's index for the marker line
    const todayIndex = dates.findIndex(d => d === this.todayDate);

    this.chartOption = {
      tooltip: {
        trigger: 'axis',
        formatter: (params: any) => {
          if (!Array.isArray(params)) return '';
          const dateStr = params[0]?.axisValue || '';
          const isHistory = this.todayDate && dateStr < this.todayDate;
          const label = isHistory ? 'History' : (dateStr === this.todayDate ? 'Today' : 'Forecast');

          let html = `<div style="padding: 4px 8px;">
            <div style="font-weight: 600; margin-bottom: 4px;">${dateStr}</div>
            <div style="font-size: 11px; color: #8c8c8c; margin-bottom: 8px;">${label}</div>`;

          params.forEach((param: any) => {
            if (param.seriesName === 'Today') return;
            const value = parseFloat(param.value || 0);
            const formatted = this.currencyService.formatAmount(value, this.currencyCode);
            html += `<div style="display: flex; align-items: center; margin: 4px 0;">
              <span style="display: inline-block; width: 10px; height: 10px; border-radius: 50%; background: ${param.color}; margin-right: 8px;"></span>
              <span>${param.seriesName}: ${formatted}</span>
            </div>`;
          });

          html += '</div>';
          return html;
        },
      },
      legend: {
        data: ['Net Worth', 'Liquid Assets', 'Investments', 'Credit/Loans'],
        bottom: 0,
        selectedMode: 'multiple',
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '15%',
        top: '10%',
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        data: dates,
        boundaryGap: false,
        axisLabel: {
          rotate: 45,
          formatter: (value: string) => {
            const date = new Date(value);
            return `${date.getMonth() + 1}/${date.getDate()}`;
          },
        },
      },
      yAxis: {
        type: 'value',
        axisLabel: {
          formatter: (value: number) => this.currencyService.formatAmount(value, this.currencyCode),
        },
      },
      // Add vertical line for "today"
      ...(todayIndex >= 0 ? {
        markLine: {
          silent: true,
          symbol: 'none',
          lineStyle: {
            color: this.colors.todayLine,
            type: 'dashed',
            width: 2,
          },
          data: [{ xAxis: todayIndex }],
          label: {
            formatter: 'Today',
            position: 'insideEndTop',
          },
        },
      } : {}),
      series: [
        {
          name: 'Net Worth',
          type: 'line',
          smooth: true,
          data: netWorthData,
          lineStyle: {
            color: this.colors.netWorth,
            width: 3,
          },
          itemStyle: {
            color: this.colors.netWorth,
          },
          emphasis: {
            focus: 'series',
          },
          markLine: todayIndex >= 0 ? {
            silent: true,
            symbol: 'none',
            lineStyle: {
              color: this.colors.todayLine,
              type: 'dashed',
              width: 2,
            },
            data: [{ xAxis: todayIndex }],
            label: {
              formatter: 'Today',
              position: 'insideEndTop',
              color: this.colors.todayLine,
            },
          } : undefined,
        },
        {
          name: 'Liquid Assets',
          type: 'line',
          smooth: true,
          data: liquidData,
          lineStyle: {
            color: this.colors.liquid,
            width: 2,
          },
          itemStyle: {
            color: this.colors.liquid,
          },
          emphasis: {
            focus: 'series',
          },
        },
        {
          name: 'Investments',
          type: 'line',
          smooth: true,
          data: investmentsData,
          lineStyle: {
            color: this.colors.investments,
            width: 2,
          },
          itemStyle: {
            color: this.colors.investments,
          },
          emphasis: {
            focus: 'series',
          },
        },
        {
          name: 'Credit/Loans',
          type: 'line',
          smooth: true,
          data: creditData,
          lineStyle: {
            color: this.colors.credit,
            width: 2,
          },
          itemStyle: {
            color: this.colors.credit,
          },
          emphasis: {
            focus: 'series',
          },
        },
      ],
    };
  }
}
