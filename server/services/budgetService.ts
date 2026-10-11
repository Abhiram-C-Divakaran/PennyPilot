import { getDatabase, saveDatabase } from "../db/database";
import {
  Budget,
  CreateBudgetInput,
  UpdateBudgetInput,
  BudgetProgress,
  MonthlyBudgetSummary,
  BudgetStatus
} from "../../src/types/budget";
import {
  normalizeAmount,
  addMoney,
  subtractMoney,
  safePercentage,
  isValidPositiveAmount
} from "../utils/finance";
import { isDateInMonth, getCurrentMonthKey } from "../utils/date";

export class BudgetValidationError extends Error {
  code: string;
  status: number;

  constructor(message: string, code = "VALIDATION_ERROR", status = 400) {
    super(message);
    this.name = "BudgetValidationError";
    this.code = code;
    this.status = status;
  }
}

const MONTH_REGEX = /^\d{4}-(0[1-9]|1[0-2])$/;

/**
 * Validates a YYYY-MM month string
 */
export function isValidMonth(month?: string): boolean {
  if (!month || typeof month !== "string") return false;
  return MONTH_REGEX.test(month.trim());
}

/**
 * Retrieve all budgets, optionally filtered by month YYYY-MM
 */
export function getBudgets(monthParam?: string): Budget[] {
  const db = getDatabase();
  const budgets = db.budgets || [];

  if (monthParam) {
    const targetMonth = monthParam.trim();
    return budgets.filter((b) => b.month === targetMonth);
  }

  // Return newest first
  return [...budgets].sort((a, b) => b.month.localeCompare(a.month) || b.createdAt.localeCompare(a.createdAt));
}

/**
 * Retrieve single budget by ID
 */
export function getBudgetById(id: string): Budget | null {
  const db = getDatabase();
  const budgets = db.budgets || [];
  return budgets.find((b) => b.id === id) || null;
}

/**
 * Create a new monthly category budget with strict validation
 */
export function createBudget(input: CreateBudgetInput): Budget {
  const db = getDatabase();
  const categories = db.categories || [];
  const budgets = db.budgets || [];

  // Validate category
  if (!input.categoryId || typeof input.categoryId !== "string") {
    throw new BudgetValidationError("Category is required", "CATEGORY_REQUIRED");
  }

  const category = categories.find((c) => c.id === input.categoryId.trim());
  if (!category) {
    throw new BudgetValidationError(`Category '${input.categoryId}' does not exist`, "CATEGORY_NOT_FOUND");
  }

  if (category.type !== "expense") {
    throw new BudgetValidationError(
      `Cannot set budget for income category '${category.name}'. Only expense categories can be budgeted.`,
      "CATEGORY_NOT_EXPENSE"
    );
  }

  // Validate month
  const month = (input.month || getCurrentMonthKey()).trim();
  if (!isValidMonth(month)) {
    throw new BudgetValidationError("Month must be in YYYY-MM format", "INVALID_MONTH");
  }

  // Validate limit
  if (!isValidPositiveAmount(input.limit)) {
    throw new BudgetValidationError("Monthly limit must be a valid positive number", "INVALID_LIMIT");
  }
  const normalizedLimit = normalizeAmount(input.limit);

  // Check duplicate: Only one budget per category per month
  const existing = budgets.find((b) => b.categoryId === category.id && b.month === month);
  if (existing) {
    throw new BudgetValidationError(
      `A budget for '${category.name}' already exists for ${month}`,
      "BUDGET_ALREADY_EXISTS",
      409
    );
  }

  const now = new Date().toISOString();
  const newBudget: Budget = {
    id: `bgt-${category.id}-${month}-${Math.random().toString(36).substring(2, 7)}`,
    categoryId: category.id,
    month,
    limit: normalizedLimit,
    createdAt: now,
    updatedAt: now
  };

  db.budgets.push(newBudget);
  saveDatabase(db);

  return newBudget;
}

/**
 * Update an existing budget limit
 */
export function updateBudget(id: string, input: UpdateBudgetInput): Budget {
  const db = getDatabase();
  const budgets = db.budgets || [];
  const index = budgets.findIndex((b) => b.id === id);

  if (index === -1) {
    throw new BudgetValidationError(`Budget with ID '${id}' not found`, "BUDGET_NOT_FOUND", 404);
  }

  const existing = budgets[index];

  if (input.limit !== undefined) {
    if (!isValidPositiveAmount(input.limit)) {
      throw new BudgetValidationError("Monthly limit must be a valid positive number", "INVALID_LIMIT");
    }
    existing.limit = normalizeAmount(input.limit);
  }

  existing.updatedAt = new Date().toISOString();
  budgets[index] = existing;
  saveDatabase(db);

  return existing;
}

/**
 * Delete a budget by ID
 */
export function deleteBudget(id: string): boolean {
  const db = getDatabase();
  const budgets = db.budgets || [];
  const index = budgets.findIndex((b) => b.id === id);

  if (index === -1) {
    return false;
  }

  budgets.splice(index, 1);
  saveDatabase(db);
  return true;
}

export function calculateBudgetProgress(
  budget: Budget,
  category: any,
  spent: number
): BudgetProgress {
  const categoryName = category?.name || budget.categoryId;
  const remaining = subtractMoney(budget.limit, spent);
  const percentageUsed = safePercentage(spent, budget.limit, 1);

  let status: BudgetStatus = "safe";
  if (percentageUsed >= 100) {
    status = "over";
  } else if (percentageUsed >= 75) {
    status = "warning";
  }

  return {
    budgetId: budget.id,
    categoryId: budget.categoryId,
    categoryName,
    categoryIcon: category?.icon,
    categoryColor: category?.color,
    limit: budget.limit,
    spent,
    remaining,
    percentageUsed,
    status,
    month: budget.month
  };
}

export function calculateMonthlyBudgetSummary(
  targetMonth: string,
  progressList: BudgetProgress[]
): MonthlyBudgetSummary {
  let totalBudget = 0;
  let totalSpentInBudgetedCategories = 0;
  let categoriesOnTrack = 0;
  let categoriesWarning = 0;
  let categoriesOverBudget = 0;

  for (const item of progressList) {
    totalBudget = addMoney(totalBudget, item.limit);
    totalSpentInBudgetedCategories = addMoney(totalSpentInBudgetedCategories, item.spent);

    if (item.status === "over") {
      categoriesOverBudget += 1;
    } else if (item.status === "warning") {
      categoriesWarning += 1;
    } else {
      categoriesOnTrack += 1;
    }
  }

  const remainingBudget = subtractMoney(totalBudget, totalSpentInBudgetedCategories);
  const overallPercentage = safePercentage(totalSpentInBudgetedCategories, totalBudget, 1);

  return {
    month: targetMonth,
    totalBudget,
    totalSpentInBudgetedCategories,
    remainingBudget,
    overallPercentage,
    categoriesOnTrack,
    categoriesWarning,
    categoriesOverBudget,
    budgetCount: progressList.length
  };
}

export function calculateBudgetProgressList(
  targetMonth: string,
  budgets: Budget[],
  categories: any[],
  transactions: any[]
): BudgetProgress[] {
  const monthBudgets = budgets.filter((b) => b.month === targetMonth);
  const monthExpenses = transactions.filter(
    (t) =>
      t.type === "expense" &&
      isDateInMonth(t.timestamp, targetMonth) &&
      (t.reviewStatus === undefined || t.reviewStatus === "confirmed")
  );

  const spentByCatMap = new Map<string, number>();
  for (const tx of monthExpenses) {
    const cur = spentByCatMap.get(tx.categoryId) || 0;
    spentByCatMap.set(tx.categoryId, addMoney(cur, tx.amount));
  }

  const result: BudgetProgress[] = monthBudgets.map((b) => {
    const cat = categories.find((c) => c.id === b.categoryId);
    const spent = spentByCatMap.get(b.categoryId) || 0;
    return calculateBudgetProgress(b, cat, spent);
  });

  return result.sort((a, b) => b.percentageUsed - a.percentageUsed);
}

/**
 * Calculate budget progress comparing each budget with actual expense transactions in that month
 */
export function getBudgetProgressList(monthParam?: string): BudgetProgress[] {
  const db = getDatabase();
  const targetMonth = monthParam && isValidMonth(monthParam) ? monthParam.trim() : getCurrentMonthKey();
  return calculateBudgetProgressList(
    targetMonth,
    db.budgets || [],
    db.categories || [],
    db.transactions || []
  );
}

/**
 * Calculate overall monthly budget summary
 */
export function getMonthlyBudgetSummary(monthParam?: string): MonthlyBudgetSummary {
  const targetMonth = monthParam && isValidMonth(monthParam) ? monthParam.trim() : getCurrentMonthKey();
  const progressList = getBudgetProgressList(targetMonth);
  return calculateMonthlyBudgetSummary(targetMonth, progressList);
}
