export interface Reconciliation {
  id: number;
  user_id: number;
  account_id: number;
  reconciliation_date: string;
  actual_balance: string;
  expected_balance: string;
  difference: string;
  note?: string;
  adjustment_transaction_id?: number;
  created_at: string;
  updated_at: string;
}

export interface ReconciliationCreate {
  account_id: number;
  reconciliation_date: string;
  actual_balance: string;
  note?: string;
  create_adjustment?: boolean;
}

export interface ReconciliationSummary {
  id: number;
  account_id: number;
  account_name: string;
  reconciliation_date: string;
  actual_balance: string;
  expected_balance: string;
  difference: string;
  note?: string;
  created_at: string;
}

export interface BulkReconciliationItem {
  // Account info
  account_id: number;
  account_name: string;
  account_type: string;
  currency: string;
  financial_institution_id: number | null;
  financial_institution_name: string | null;

  // Balance data
  expected_balance: string;
  actual_balance: string | null;  // User input
  difference: string | null;      // Calculated

  // Options
  create_adjustment: boolean;
  note: string;

  // UI state
  loading: boolean;
  error: string | null;
  success: boolean;
}

export interface InstitutionGroup {
  institution_id: number | null;
  institution_name: string;
  accounts: BulkReconciliationItem[];
}
