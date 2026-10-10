import { getDatabase } from "../db/database";
import {
  MonthlyAnalytics,
  CategorySpendingItem,
  MonthlySpendingTrend,
  CategoryTrend
} from "../../src/types/analytics";
import {
  addMoney,
  subtractMoney,
  safePercentage,
  safePercentageChange,
  normalizeAmount
} from "../utils/finance";
import {
  isDateInMonth,
  getCurrentMonthKey,
  getPreviousMonthKey
} from "../utils/date";

/**
 * Calculates monthly analytics for a given month ("YYYY-MM").
 * If no month is supplied, defaults to current month.
 */
export function getMonthlyAnalytics(monthParam?: string): MonthlyAnalytics {
  const db = getDatabase();
  const currentMonth = monthParam?.trim() || getCurrentMonthKey();

  const monthTxs = (db.transactions || []).filter(
    (t) => isDateInMonth(t.timestamp, currentMonth)
  );

  let income = 0;
  let expenses = 0;

  for (const tx of monthTxs) {
    if (tx.type === "income") {
      income = addMoney(income, tx.amount);
    } else if (tx.type === "expense") {
      expenses = addMoney(expenses, tx.amount);
    }
  }

  const balance = subtractMoney(income, expenses);
  const savingsRate = income > 0 ? safePercentage(balance, income, 1) : 0;

  return {
    month: currentMonth,
    income,
    expenses,
    balance,
    savingsRate
  };
}

/**
 * Groups monthly expense transactions by category.
 */
export function getCategorySpendingAnalytics(monthParam?: string): CategorySpendingItem[] {
  const db = getDatabase();
  const currentMonth = monthParam?.trim() || getCurrentMonthKey();

  const monthExpenses = (db.transactions || []).filter(
    (t) => t.type === "expense" && isDateInMonth(t.timestamp, currentMonth)
  );

  const spendingMap = new Map<string, { amount: number; count: number }>();
  let totalExpenses = 0;

  for (const tx of monthExpenses) {
    const amt = normalizeAmount(tx.amount);
    totalExpenses = addMoney(totalExpenses, amt);
    const existing = spendingMap.get(tx.categoryId) || { amount: 0, count: 0 };
    existing.amount = addMoney(existing.amount, amt);
    existing.count += 1;
    spendingMap.set(tx.categoryId, existing);
  }

  const categories = db.categories || [];
  const result: CategorySpendingItem[] = [];

  for (const [categoryId, val] of spendingMap.entries()) {
    const cat = categories.find((c) => c.id === categoryId);
    const categoryName = cat?.name || categoryId;
    const percentage = safePercentage(val.amount, totalExpenses, 1);

    result.push({
      categoryId,
      category: categoryName,
      amount: val.amount,
      percentage,
      count: val.count,
      color: cat?.color,
      icon: cat?.icon
    });
  }

  // Sort highest expense first
  result.sort((a, b) => b.amount - a.amount);

  return result;
}

/**
 * Calculates spending trend comparing current month with previous month.
 * Handles month and year transitions safely (e.g. 2027-01 vs 2026-12).
 */
export function getMonthlySpendingTrends(monthParam?: string): MonthlySpendingTrend {
  const currentMonth = monthParam?.trim() || getCurrentMonthKey();
  const previousMonth = getPreviousMonthKey(currentMonth);

  const currentAnalytics = getMonthlyAnalytics(currentMonth);
  const previousAnalytics = getMonthlyAnalytics(previousMonth);

  const expenseChangeAmount = subtractMoney(currentAnalytics.expenses, previousAnalytics.expenses);
  const expenseChangePercentage = safePercentageChange(
    currentAnalytics.expenses,
    previousAnalytics.expenses,
    1
  );

  const incomeChangeAmount = subtractMoney(currentAnalytics.income, previousAnalytics.income);
  const incomeChangePercentage = safePercentageChange(
    currentAnalytics.income,
    previousAnalytics.income,
    1
  );

  return {
    currentMonth,
    previousMonth,
    currentExpenses: currentAnalytics.expenses,
    previousExpenses: previousAnalytics.expenses,
    expenseChangeAmount,
    expenseChangePercentage,
    currentIncome: currentAnalytics.income,
    previousIncome: previousAnalytics.income,
    incomeChangeAmount,
    incomeChangePercentage
  };
}

export function calculateCategorySpendingTrends(
  currentMonth: string,
  categories: any[],
  transactions: any[]
): CategoryTrend[] {
  const previousMonth = getPreviousMonthKey(currentMonth);
  const expenseCategories = categories.filter((c) => c.type === "expense");

  const currentMonthExpenses = transactions.filter(
    (t) => t.type === "expense" && isDateInMonth(t.timestamp, currentMonth)
  );
  const prevMonthExpenses = transactions.filter(
    (t) => t.type === "expense" && isDateInMonth(t.timestamp, previousMonth)
  );

  const curSpentMap = new Map<string, number>();
  for (const tx of currentMonthExpenses) {
    const cur = curSpentMap.get(tx.categoryId) || 0;
    curSpentMap.set(tx.categoryId, addMoney(cur, tx.amount));
  }

  const prevSpentMap = new Map<string, number>();
  for (const tx of prevMonthExpenses) {
    const cur = prevSpentMap.get(tx.categoryId) || 0;
    prevSpentMap.set(tx.categoryId, addMoney(cur, tx.amount));
  }

  const trends: CategoryTrend[] = [];

  for (const cat of expenseCategories) {
    const currentAmount = curSpentMap.get(cat.id) || 0;
    const previousAmount = prevSpentMap.get(cat.id) || 0;

    // Only include categories that had spending in either month
    if (currentAmount > 0 || previousAmount > 0) {
      const difference = subtractMoney(currentAmount, previousAmount);
      const percentageChange = safePercentageChange(currentAmount, previousAmount, 1);

      trends.push({
        categoryId: cat.id,
        categoryName: cat.name,
        categoryIcon: cat.icon,
        categoryColor: cat.color,
        currentAmount,
        previousAmount,
        difference,
        percentageChange
      });
    }
  }

  // Sort by highest absolute difference
  trends.sort((a, b) => Math.abs(b.difference) - Math.abs(a.difference));

  return trends;
}

/**
 * Calculates spending comparison for individual categories between current and previous month.
 */
export function getCategorySpendingTrends(monthParam?: string): CategoryTrend[] {
  const db = getDatabase();
  const currentMonth = monthParam?.trim() || getCurrentMonthKey();
  return calculateCategorySpendingTrends(
    currentMonth,
    db.categories || [],
    db.transactions || []
  );
}
