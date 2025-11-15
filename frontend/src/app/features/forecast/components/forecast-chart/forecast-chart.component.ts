import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgxEchartsModule } from 'ngx-echarts';
import { EChartsOption, LineSeriesOption } from 'echarts';
import { ForecastData } from '../../../../core/models/dashboard.model';

@Component({
  selector: 'app-forecast-chart',
  standalone: true,
  imports: [CommonModule, NgxEchartsModule],
  template: `
    <div class="chart-container">
      @if (chartOption) {
        <div
          echarts
          [options]="chartOption"
          [merge]="chartOption"
          class="forecast-chart"
        ></div>
      } @else {
        <div class="empty-state">
          <p>No forecast data available</p>
        </div>
      }
    </div>
  `,
  styles: [`
    .chart-container {
      width: 100%;
      height: 500px;
      padding: 16px;
    }

    .forecast-chart {
      width: 100%;
      height: 100%;
    }

    .empty-state {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100%;
      color: #8c8c8c;
      font-size: 14px;
    }
  `]
})
export class ForecastChartComponent implements OnChanges {
  @Input() forecastData: ForecastData | null = null;
  @Input() currencySymbol = '$';

  chartOption: EChartsOption | null = null;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['forecastData'] && this.forecastData) {
      this.updateChart();
    }
  }

  updateChart(): void {
    if (!this.forecastData || this.forecastData.accounts.length === 0) {
      this.chartOption = null;
      return;
    }

    const series: LineSeriesOption[] = this.forecastData.accounts.map(account => ({
      name: account.account_name,
      type: 'line',
      smooth: true,
      data: account.data_points.map(point => [
        point.date,
        parseFloat(point.balance)
      ]),
      emphasis: {
        focus: 'series'
      },
      lineStyle: {
        width: 2
      }
    }));

    // Add today marker
    const today = new Date().toISOString().split('T')[0];

    this.chartOption = {
      title: {
        text: 'Balance Forecast',
        left: 'center',
        textStyle: {
          fontSize: 16,
          fontWeight: 'normal'
        }
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'cross',
          label: {
            backgroundColor: '#6a7985'
          }
        },
        formatter: (params: unknown) => {
          if (!Array.isArray(params) || params.length === 0) return '';

          const date = (params[0] as { axisValue: string }).axisValue;
          let html = `<div style="font-weight: bold; margin-bottom: 8px;">${date}</div>`;

          params.forEach((param: { marker: string; seriesName: string; value: [string, number] }) => {
            const value = param.value[1];
            html += `
              <div style="margin: 4px 0;">
                ${param.marker}
                <span style="margin-right: 8px;">${param.seriesName}:</span>
                <strong>${this.currencySymbol}${value.toFixed(2)}</strong>
              </div>
            `;
          });

          return html;
        }
      },
      legend: {
        data: this.forecastData.accounts.map(a => a.account_name),
        bottom: 10,
        type: 'scroll'
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '15%',
        top: '15%',
        containLabel: true
      },
      xAxis: {
        type: 'time',
        axisLabel: {
          formatter: '{MMM} {dd}'
        }
      },
      yAxis: {
        type: 'value',
        axisLabel: {
          formatter: (value: number) => `${this.currencySymbol}${value.toFixed(0)}`
        }
      },
      series: series,
      dataZoom: [
        {
          type: 'inside',
          start: 0,
          end: 100
        },
        {
          start: 0,
          end: 100,
          bottom: 50
        }
      ],
      // Mark today's date
      visualMap: undefined,
      markLine: {
        silent: true,
        symbol: 'none',
        data: [
          {
            xAxis: today,
            label: {
              formatter: 'Today',
              position: 'insideEndTop'
            },
            lineStyle: {
              type: 'dashed',
              color: '#ff4d4f',
              width: 2
            }
          }
        ]
      }
    };
  }
}
