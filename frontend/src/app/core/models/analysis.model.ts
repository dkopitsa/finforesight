export interface CategoryAnalysis {
  category_name: string;
  category_type: 'INCOME' | 'EXPENSE' | 'TRANSFER';
  planned_amount: number;
  actual_amount: number;
  difference: number;
  difference_percentage: number;
}

export interface MonthlyMetrics {
  month: string; // YYYY-MM format
  planned_income: number;
  planned_expenses: number;
  planned_savings: number;
  actual_income?: number;
  actual_expenses?: number;
  actual_savings?: number;
}

export interface AnalysisSummary {
  total_planned_income: number;
  total_planned_expenses: number;
  total_planned_savings: number;
  total_actual_income: number;
  total_actual_expenses: number;
  total_actual_savings: number;
  income_variance: number;
  expense_variance: number;
  savings_variance: number;
}

export interface PlanVsActualDataPoint {
  date: string;
  planned_balance: number;
  actual_balance?: number;
}

export interface AnalysisData {
  summary: AnalysisSummary;
  monthly_metrics: MonthlyMetrics[];
  category_breakdown: CategoryAnalysis[];
  plan_vs_actual_trend: PlanVsActualDataPoint[];
  recommendations: string[];
}

export interface AnalysisParams {
  from_date: string;
  to_date: string;
  account_ids?: number[];
}
