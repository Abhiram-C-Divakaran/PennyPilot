export interface MonthlyAnalytics {
  month: string; // "YYYY-MM"
  income: number;
  expenses: number;
  balance: number;
  savingsRate: number;
}

export interface CategorySpendingItem {
  categoryId: string;
  category: string;
  amount: number;
  percentage?: number;
  count?: number;
  color?: string;
  icon?: string;
}
