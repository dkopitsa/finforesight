import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';

import { NgxEchartsModule } from 'ngx-echarts';
import { EChartsOption } from 'echarts';
import { BalanceTrendPoint } from '../../../../core/models/dashboard.model';

@Component({
  selector: 'app-forecast-chart',
  standalone: true,
  imports: [NgxEchartsModule],
  template: `
    <div class="chart-container">
      <div class="chart-header">
        <h3>Balance Forecast (30 Days)</h3>
        <p>Projected balance based on scheduled transactions</p>
      </div>
      @if (chartOption) {
        <div echarts [options]="chartOption" class="chart"></div>
      }
      @if (!chartOption) {
        <div class="empty-state">
          <p>No forecast data available</p>
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
  @Input() balanceTrend: BalanceTrendPoint[] = [];
  @Input() currencySymbol = '$';

  chartOption: EChartsOption | null = null;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['balanceTrend'] && this.balanceTrend.length > 0) {
      this.updateChart();
    }
  }

  private updateChart(): void {
    const dates = this.balanceTrend.map(point => point.date);
    const balances = this.balanceTrend.map(point => parseFloat(point.balance));

    // Determine if balance is positive or negative for coloring
    const positiveColor = '#52c41a';
    const negativeColor = '#ff4d4f';
    const firstBalance = balances[0] || 0;
    const lineColor = firstBalance >= 0 ? positiveColor : negativeColor;

    this.chartOption = {
      tooltip: {
        trigger: 'axis',
        formatter: (params: any) => {
          const data = params[0];
          const value = parseFloat(data.value).toFixed(2);
          const color = parseFloat(data.value) >= 0 ? positiveColor : negativeColor;
          return `
            <div style="padding: 4px 8px;">
              <div style="font-weight: 600; margin-bottom: 4px;">${data.axisValue}</div>
              <div style="color: ${color};">
                Balance: ${this.currencySymbol}${value}
              </div>
            </div>
          `;
        },
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '10%',
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
          formatter: (value: number) => `${this.currencySymbol}${value.toFixed(0)}`,
        },
      },
      series: [
        {
          name: 'Balance',
          type: 'line',
          smooth: true,
          data: balances,
          lineStyle: {
            color: lineColor,
            width: 3,
          },
          itemStyle: {
            color: lineColor,
          },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: lineColor + '40' },
                { offset: 1, color: lineColor + '10' },
              ],
            },
          },
          emphasis: {
            focus: 'series',
          },
        },
      ],
    };
  }
}
