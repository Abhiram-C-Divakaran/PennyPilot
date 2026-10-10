export type BudgetStatus = "safe" | "warning" | "over";

export interface Budget {
  id: string;
  categoryId: string;
  month: string; // "YYYY-MM"
  limit: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBudgetInput {
  categoryId: string;
  month: string;
  limit: number;
}

export interface UpdateBudgetInput {
  limit?: number;
}

export interface BudgetProgress {
  budgetId: string;
  categoryId: string;
  categoryName: string;
  categoryIcon?: string;
  categoryColor?: string;
  limit: number;
  spent: number;
  remaining: number;
  percentageUsed: number;
  status: BudgetStatus;
  month: string;
}

export interface MonthlyBudgetSummary {
  month: string;
  totalBudget: number;
  totalSpentInBudgetedCategories: number;
  remainingBudget: number;
  overallPercentage: number;
  categoriesOnTrack: number;
  categoriesWarning: number;
  categoriesOverBudget: number;
  budgetCount: number;
}
