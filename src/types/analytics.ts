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

export interface MonthlySpendingTrend {
  currentMonth: string;
  previousMonth: string;
  currentExpenses: number;
  previousExpenses: number;
  expenseChangeAmount: number;
  expenseChangePercentage: number;
  currentIncome: number;
  previousIncome: number;
  incomeChangeAmount: number;
  incomeChangePercentage: number;
}

export interface CategoryTrend {
  categoryId: string;
  categoryName: string;
  categoryIcon?: string;
  categoryColor?: string;
  currentAmount: number;
  previousAmount: number;
  difference: number;
  percentageChange: number;
}
