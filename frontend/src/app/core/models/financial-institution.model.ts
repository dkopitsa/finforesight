/**
 * Financial Institution model interfaces
 */

export interface FinancialInstitution {
  id: number;
  user_id: number;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface FinancialInstitutionCreate {
  name: string;
}

export interface FinancialInstitutionUpdate {
  name?: string;
}
