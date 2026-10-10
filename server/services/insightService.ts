import { getDatabase } from "../db/database";
import { SpendingInsight, InsightSeverity } from "../../src/types/insight";
import { calculateBudgetProgressList } from "./budgetService";
import { calculateCategorySpendingTrends } from "./analyticsService";
import { getCurrentMonthKey } from "../utils/date";
import { toPaise, toRupees } from "../utils/finance";

// Non-discretionary fixed categories that shouldn't be penalized as discretionary splurging
const FIXED_CATEGORIES = new Set(["rent", "bills", "education", "health"]);

export function generateSpendingInsights(
  monthParam?: string,
  transactionsOverride?: any[],
  budgetsOverride?: any[],
  categoriesOverride?: any[]
): SpendingInsight[] {
  const db = getDatabase();
  const currentMonth = monthParam?.trim() || getCurrentMonthKey();
  const insights: SpendingInsight[] = [];

  const transactions = transactionsOverride || db.transactions || [];
  const budgets = budgetsOverride || db.budgets || [];
  const categories = categoriesOverride || db.categories || [];

  const budgetProgress = calculateBudgetProgressList(currentMonth, budgets, categories, transactions);
  const categoryTrends = calculateCategorySpendingTrends(currentMonth, categories, transactions);

  // 1. RULE 1 & 2: Budget status insights (Over budget & Approaching budget)
  for (const progress of budgetProgress) {
    if (progress.status === "over") {
      const overAmount = Math.abs(progress.remaining);
      insights.push({
        id: `ins-over-${progress.categoryId}-${currentMonth}`,
        type: "over_budget",
        severity: "critical",
        title: `Over Budget: ${progress.categoryName}`,
        message: `${progress.categoryName} is ₹${overAmount.toLocaleString("en-IN")} over budget this month (${progress.percentageUsed}% used of ₹${progress.limit.toLocaleString("en-IN")}).`,
        categoryId: progress.categoryId,
        categoryName: progress.categoryName,
        amount: overAmount
      });
    } else if (progress.percentageUsed >= 80 && progress.percentageUsed < 100) {
      insights.push({
        id: `ins-appr-${progress.categoryId}-${currentMonth}`,
        type: "approaching_budget",
        severity: "warning",
        title: `Approaching Budget: ${progress.categoryName}`,
        message: `You've used ${progress.percentageUsed}% of your ${progress.categoryName} budget. ₹${progress.remaining.toLocaleString("en-IN")} remains for the rest of the month.`,
        categoryId: progress.categoryId,
        categoryName: progress.categoryName,
        amount: progress.remaining
      });
    }
  }

  // 2. RULE 3 & 4: Spending Trends (Increased > 20% vs Improved / Decreased)
  for (const trend of categoryTrends) {
    if (trend.previousAmount > 0 && trend.percentageChange >= 20) {
      insights.push({
        id: `ins-inc-${trend.categoryId}-${currentMonth}`,
        type: "spending_increased",
        severity: "warning",
        title: `${trend.categoryName} Spending Increased`,
        message: `${trend.categoryName} spending increased by ${trend.percentageChange}% (+₹${trend.difference.toLocaleString("en-IN")}) compared with last month.`,
        categoryId: trend.categoryId,
        categoryName: trend.categoryName,
        amount: trend.difference
      });
    } else if (trend.previousAmount > 0 && trend.percentageChange <= -10) {
      const savedAmount = Math.abs(trend.difference);
      insights.push({
        id: `ins-imp-${trend.categoryId}-${currentMonth}`,
        type: "spending_improved",
        severity: "positive",
        title: `${trend.categoryName} Spending Improved`,
        message: `${trend.categoryName} spending is down ${Math.abs(trend.percentageChange)}% (-₹${savedAmount.toLocaleString("en-IN")}) compared with last month. Great job!`,
        categoryId: trend.categoryId,
        categoryName: trend.categoryName,
        amount: savedAmount
      });
    }
  }

  // 3. RULE 5: Largest Discretionary Spending Category
  const discretionaryTrends = categoryTrends.filter(
    (t) => !FIXED_CATEGORIES.has(t.categoryId) && t.currentAmount > 0
  );
  if (discretionaryTrends.length > 0) {
    const largest = discretionaryTrends.reduce((max, cur) =>
      cur.currentAmount > max.currentAmount ? cur : max
    );

    insights.push({
      id: `ins-largest-${largest.categoryId}-${currentMonth}`,
      type: "largest_category",
      severity: "info",
      title: `Largest Spending Category: ${largest.categoryName}`,
      message: `${largest.categoryName} is your highest discretionary spending category this month at ₹${largest.currentAmount.toLocaleString("en-IN")}.`,
      categoryId: largest.categoryId,
      categoryName: largest.categoryName,
      amount: largest.currentAmount
    });
  }

  // 4. RULE 6: Potential Savings Opportunities
  // Identify candidate categories: discretionary, spending > 0, and either over budget, approaching budget, or increased > 15%
  const candidateCategories = new Map<string, { name: string; amount: number; reason: string }>();

  for (const progress of budgetProgress) {
    if (!FIXED_CATEGORIES.has(progress.categoryId) && (progress.status === "over" || progress.status === "warning")) {
      candidateCategories.set(progress.categoryId, {
        name: progress.categoryName,
        amount: progress.spent,
        reason: progress.status === "over" ? "is over budget" : "is approaching budget limit"
      });
    }
  }

  for (const trend of categoryTrends) {
    if (!FIXED_CATEGORIES.has(trend.categoryId) && trend.percentageChange >= 15 && trend.currentAmount >= 1000) {
      if (!candidateCategories.has(trend.categoryId)) {
        candidateCategories.set(trend.categoryId, {
          name: trend.categoryName,
          amount: trend.currentAmount,
          reason: "has grown substantially compared to last month"
        });
      }
    }
  }

  // If no candidates from over-budget/increase, pick top discretionary category with spending >= 1000
  if (candidateCategories.size === 0 && discretionaryTrends.length > 0) {
    const top = discretionaryTrends[0];
    if (top.currentAmount >= 1000) {
      candidateCategories.set(top.categoryId, {
        name: top.categoryName,
        amount: top.currentAmount,
        reason: "is your top discretionary expense"
      });
    }
  }

  for (const [catId, data] of candidateCategories.entries()) {
    // 15% potential savings recommendation
    const monthlySavingPaise = Math.round(toPaise(data.amount) * 0.15);
    const monthlySaving = toRupees(monthlySavingPaise);
    const annualSaving = toRupees(monthlySavingPaise * 12);

    if (monthlySaving > 0) {
      insights.push({
        id: `ins-sav-${catId}-${currentMonth}`,
        type: "potential_savings",
        severity: "info",
        title: `Saving Opportunity: ${data.name}`,
        message: `Reducing ${data.name} spending by 15% (${data.reason}) would save approximately ₹${monthlySaving.toLocaleString("en-IN")}/month and ₹${annualSaving.toLocaleString("en-IN")}/year!`,
        categoryId: catId,
        categoryName: data.name,
        amount: data.amount,
        potentialMonthlySavings: monthlySaving,
        potentialAnnualSavings: annualSaving
      });
    }
  }

  // Rank insights: critical first, then warning, then positive, then info
  const severityRank: Record<InsightSeverity, number> = {
    critical: 0,
    warning: 1,
    positive: 2,
    info: 3
  };

  insights.sort((a, b) => severityRank[a.severity] - severityRank[b.severity]);

  return insights;
}
