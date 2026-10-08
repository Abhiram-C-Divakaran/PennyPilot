import { getDatabase } from "../db/database";
import { MonthlyAnalytics, CategorySpendingItem } from "../../src/types/analytics";

/**
 * Calculates monthly analytics for a given month ("YYYY-MM").
 * If no month is supplied, defaults to current month.
 */
export function getMonthlyAnalytics(monthParam?: string): MonthlyAnalytics {
  const db = getDatabase();
  const currentMonth = monthParam || new Date().toISOString().substring(0, 7);

  const monthTxs = (db.transactions || []).filter(
    (t) => t.timestamp && t.timestamp.startsWith(currentMonth)
  );

  let income = 0;
  let expenses = 0;

  for (const tx of monthTxs) {
    if (tx.type === "income") {
      income += Number(tx.amount);
    } else if (tx.type === "expense") {
      expenses += Number(tx.amount);
    }
  }

  const balance = income - expenses;
  const savingsRate = income > 0 ? Number(((balance / income) * 100).toFixed(1)) : 0;

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
  const currentMonth = monthParam || new Date().toISOString().substring(0, 7);

  const monthExpenses = (db.transactions || []).filter(
    (t) => t.type === "expense" && t.timestamp && t.timestamp.startsWith(currentMonth)
  );

  const spendingMap = new Map<string, { amount: number; count: number }>();
  let totalExpenses = 0;

  for (const tx of monthExpenses) {
    const amt = Number(tx.amount);
    totalExpenses += amt;
    const existing = spendingMap.get(tx.categoryId) || { amount: 0, count: 0 };
    existing.amount += amt;
    existing.count += 1;
    spendingMap.set(tx.categoryId, existing);
  }

  const categories = db.categories || [];
  const result: CategorySpendingItem[] = [];

  for (const [categoryId, val] of spendingMap.entries()) {
    const cat = categories.find((c) => c.id === categoryId);
    const categoryName = cat?.name || categoryId;
    const percentage = totalExpenses > 0 ? Number(((val.amount / totalExpenses) * 100).toFixed(1)) : 0;

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
