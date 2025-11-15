import { Injectable, inject } from '@angular/core';
import { Observable, forkJoin, map } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { ForecastData } from '../../../core/models/dashboard.model';
import { ReconciliationSummary } from '../../../core/models/reconciliation.model';
import { ScheduledTransactionInstance } from '../../../core/models/transaction.model';
import {
  AnalysisData,
  AnalysisParams,
  AnalysisSummary,
  CategoryAnalysis,
  MonthlyMetrics,
  PlanVsActualDataPoint,
} from '../../../core/models/analysis.model';

@Injectable({
  providedIn: 'root'
})
export class AnalysisService {
  private apiService = inject(ApiService);

  getAnalysis(params: AnalysisParams): Observable<AnalysisData> {
    // Fetch data from multiple endpoints in parallel
    const forecast$ = this.getForecast(params);
    const reconciliations$ = this.getReconciliations();
    const instances$ = this.getScheduledInstances(params);

    return forkJoin({
      forecast: forecast$,
      reconciliations: reconciliations$,
      instances: instances$,
    }).pipe(
      map(({ forecast, reconciliations, instances }) => {
        return this.calculateAnalysis(forecast, reconciliations, instances, params);
      })
    );
  }

  private getForecast(params: AnalysisParams): Observable<ForecastData> {
    const queryParams = new URLSearchParams();
    queryParams.append('from_date', params.from_date);
    queryParams.append('to_date', params.to_date);
    if (params.account_ids && params.account_ids.length > 0) {
      params.account_ids.forEach(id => {
        queryParams.append('account_ids', id.toString());
      });
    }
    return this.apiService.get<ForecastData>(`/forecast?${queryParams.toString()}`);
  }

  private getReconciliations(): Observable<ReconciliationSummary[]> {
    return this.apiService.get<ReconciliationSummary[]>('/reconciliations');
  }

  private getScheduledInstances(params: AnalysisParams): Observable<ScheduledTransactionInstance[]> {
    const queryParams = new URLSearchParams();
    queryParams.append('from_date', params.from_date);
    queryParams.append('to_date', params.to_date);
    return this.apiService.get<ScheduledTransactionInstance[]>(
      `/scheduled-transactions/instances?${queryParams.toString()}`
    );
  }

  private calculateAnalysis(
    forecast: ForecastData,
    reconciliations: ReconciliationSummary[],
    instances: ScheduledTransactionInstance[],
    params: AnalysisParams
  ): AnalysisData {
    // Calculate category breakdown
    const categoryBreakdown = this.calculateCategoryBreakdown(instances);

    // Calculate monthly metrics
    const monthlyMetrics = this.calculateMonthlyMetrics(instances);

    // Calculate summary
    const summary = this.calculateSummary(instances, reconciliations);

    // Calculate plan vs actual trend
    const planVsActualTrend = this.calculatePlanVsActualTrend(
      forecast,
      reconciliations,
      params
    );

    // Generate recommendations
    const recommendations = this.generateRecommendations(summary, categoryBreakdown);

    return {
      summary,
      monthly_metrics: monthlyMetrics,
      category_breakdown: categoryBreakdown,
      plan_vs_actual_trend: planVsActualTrend,
      recommendations,
    };
  }

  private calculateCategoryBreakdown(instances: ScheduledTransactionInstance[]): CategoryAnalysis[] {
    const categoryMap = new Map<string, { name: string; type: string; amount: number }>();

    instances.forEach(instance => {
      const key = instance.category_name;
      const amount = parseFloat(instance.amount);

      if (!categoryMap.has(key)) {
        categoryMap.set(key, {
          name: instance.category_name,
          type: instance.category_type,
          amount: 0,
        });
      }

      const category = categoryMap.get(key);
      if (category) {
        category.amount += amount;
      }
    });

    return Array.from(categoryMap.values()).map(cat => ({
      category_name: cat.name,
      category_type: cat.type as 'INCOME' | 'EXPENSE' | 'TRANSFER',
      planned_amount: Math.abs(cat.amount),
      actual_amount: 0, // TODO: Calculate from actual transactions when implemented
      difference: 0,
      difference_percentage: 0,
    }));
  }

  private calculateMonthlyMetrics(instances: ScheduledTransactionInstance[]): MonthlyMetrics[] {
    const monthMap = new Map<string, MonthlyMetrics>();

    instances.forEach(instance => {
      const month = instance.date.substring(0, 7); // YYYY-MM
      const amount = parseFloat(instance.amount);

      if (!monthMap.has(month)) {
        monthMap.set(month, {
          month,
          planned_income: 0,
          planned_expenses: 0,
          planned_savings: 0,
        });
      }

      const metrics = monthMap.get(month);

      if (metrics) {
        if (instance.category_type === 'INCOME') {
          metrics.planned_income += amount;
        } else if (instance.category_type === 'EXPENSE') {
          metrics.planned_expenses += Math.abs(amount);
        }
      }
    });

    // Calculate savings
    monthMap.forEach(metrics => {
      metrics.planned_savings = metrics.planned_income - metrics.planned_expenses;
    });

    return Array.from(monthMap.values()).sort((a, b) => a.month.localeCompare(b.month));
  }

  private calculateSummary(
    instances: ScheduledTransactionInstance[],
    _reconciliations: ReconciliationSummary[]
  ): AnalysisSummary {
    let totalPlannedIncome = 0;
    let totalPlannedExpenses = 0;

    instances.forEach(instance => {
      const amount = parseFloat(instance.amount);
      if (instance.category_type === 'INCOME') {
        totalPlannedIncome += amount;
      } else if (instance.category_type === 'EXPENSE') {
        totalPlannedExpenses += Math.abs(amount);
      }
    });

    const totalPlannedSavings = totalPlannedIncome - totalPlannedExpenses;

    // TODO: Calculate actual values from real transactions when implemented
    const totalActualIncome = 0;
    const totalActualExpenses = 0;
    const totalActualSavings = 0;

    return {
      total_planned_income: totalPlannedIncome,
      total_planned_expenses: totalPlannedExpenses,
      total_planned_savings: totalPlannedSavings,
      total_actual_income: totalActualIncome,
      total_actual_expenses: totalActualExpenses,
      total_actual_savings: totalActualSavings,
      income_variance: totalActualIncome - totalPlannedIncome,
      expense_variance: totalActualExpenses - totalPlannedExpenses,
      savings_variance: totalActualSavings - totalPlannedSavings,
    };
  }

  private calculatePlanVsActualTrend(
    forecast: ForecastData,
    reconciliations: ReconciliationSummary[],
    _params: AnalysisParams
  ): PlanVsActualDataPoint[] {
    const dataPoints: PlanVsActualDataPoint[] = [];

    // Aggregate forecast data by date (sum all accounts)
    const forecastMap = new Map<string, number>();

    forecast.accounts.forEach(account => {
      account.data_points.forEach(point => {
        const currentBalance = forecastMap.get(point.date) || 0;
        forecastMap.set(point.date, currentBalance + parseFloat(point.balance));
      });
    });

    // Create reconciliation map by date
    const reconciliationMap = new Map<string, number>();
    reconciliations.forEach(rec => {
      reconciliationMap.set(rec.reconciliation_date, parseFloat(rec.actual_balance));
    });

    // Combine data
    forecastMap.forEach((plannedBalance, date) => {
      dataPoints.push({
        date,
        planned_balance: plannedBalance,
        actual_balance: reconciliationMap.get(date),
      });
    });

    return dataPoints.sort((a, b) => a.date.localeCompare(b.date));
  }

  private generateRecommendations(
    summary: AnalysisSummary,
    categoryBreakdown: CategoryAnalysis[]
  ): string[] {
    const recommendations: string[] = [];

    // Savings rate recommendation
    const savingsRate = summary.total_planned_income > 0
      ? (summary.total_planned_savings / summary.total_planned_income) * 100
      : 0;

    if (savingsRate < 10) {
      recommendations.push('Consider increasing your savings rate. Aim for at least 10-20% of income.');
    } else if (savingsRate > 30) {
      recommendations.push('Great job! Your savings rate is excellent.');
    }

    // Expense recommendations
    const expenseCategories = categoryBreakdown.filter(cat => cat.category_type === 'EXPENSE');
    expenseCategories.sort((a, b) => b.planned_amount - a.planned_amount);

    if (expenseCategories.length > 0) {
      const topExpense = expenseCategories[0];
      const expensePercentage = summary.total_planned_income > 0
        ? (topExpense.planned_amount / summary.total_planned_income) * 100
        : 0;

      if (expensePercentage > 30) {
        recommendations.push(
          `${topExpense.category_name} is your largest expense category (${expensePercentage.toFixed(1)}% of income). ` +
          'Consider reviewing if there are opportunities to optimize.'
        );
      }
    }

    // Income vs Expenses balance
    if (summary.total_planned_savings < 0) {
      recommendations.push(
        'Your planned expenses exceed your income. Consider reducing expenses or increasing income sources.'
      );
    }

    if (recommendations.length === 0) {
      recommendations.push('Your financial plan looks balanced. Keep tracking your progress!');
    }

    return recommendations;
  }
}
