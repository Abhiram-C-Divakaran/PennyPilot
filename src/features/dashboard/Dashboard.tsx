import React, { useMemo } from "react";
import {
  ArrowRight,
  PieChart,
  Target,
  TrendingUp,
  AlertTriangle,
  AlertCircle,
  Sparkles
} from "lucide-react";
import { FinanceTransaction } from "../../types/transaction";
import { TransactionCategory } from "../../types/category";
import { MonthlyAnalytics, CategorySpendingItem } from "../../types/analytics";
import { MonthlyBudgetSummary } from "../../types/budget";
import { SpendingInsight } from "../../types/insight";
import { SummaryCard } from "../../components/SummaryCard";
import { MonthSelector } from "../../components/MonthSelector";
import { TransactionItem } from "../transactions/TransactionItem";
import { CategoryIcon } from "../transactions/categoryIcon";
import { formatCurrency } from "../../utils/currency";
import { EmptyState } from "../../components/EmptyState";
import { SavingsGoal } from "../../types";

interface DashboardProps {
  selectedMonth: string;
  onMonthChange: (month: string) => void;
  monthlyAnalytics: MonthlyAnalytics;
  categorySpending: CategorySpendingItem[];
  budgetSummary?: MonthlyBudgetSummary | null;
  topInsight?: SpendingInsight | null;
  recentTransactions: FinanceTransaction[];
  categories: TransactionCategory[];
  goals: SavingsGoal[];
  onAddTransaction: () => void;
  onSelectTransaction: (transaction: FinanceTransaction) => void;
  onViewAllTransactions: () => void;
  onViewBudgets: () => void;
  onViewInsights: () => void;
  onViewAllGoals: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  selectedMonth,
  onMonthChange,
  monthlyAnalytics,
  categorySpending,
  budgetSummary,
  topInsight,
  recentTransactions,
  categories,
  goals,
  onAddTransaction,
  onSelectTransaction,
  onViewAllTransactions,
  onViewBudgets,
  onViewInsights,
  onViewAllGoals
}) => {
  const categoryMap = useMemo(() => {
    const map = new Map<string, TransactionCategory>();
    for (const cat of categories) {
      map.set(cat.id, cat);
    }
    return map;
  }, [categories]);

  const activeGoals = useMemo(() => {
    return goals.filter((g) => g.status === "active").slice(0, 2);
  }, [goals]);

  return (
    <div className="space-y-5 pb-24">
      {/* 0. Month Selector */}
      <MonthSelector selectedMonth={selectedMonth} onMonthChange={onMonthChange} />

      {/* 1. Monthly Summary Card */}
      <SummaryCard
        month={monthlyAnalytics.month}
        income={monthlyAnalytics.income}
        expenses={monthlyAnalytics.expenses}
        balance={monthlyAnalytics.balance}
        savingsRate={monthlyAnalytics.savingsRate}
      />

      {/* 2. Top Alert / Smart Insight Banner (Step 13) */}
      {topInsight && (
        <section
          className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
            topInsight.severity === "critical"
              ? "bg-rose-950/25 border-rose-500/40 hover:border-rose-500/60"
              : topInsight.severity === "warning"
              ? "bg-amber-950/25 border-amber-500/40 hover:border-amber-500/60"
              : "bg-emerald-950/20 border-emerald-500/30 hover:border-emerald-500/50"
          }`}
          onClick={onViewInsights}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-2.5 min-w-0">
              <div
                className={`p-1.5 rounded-xl shrink-0 mt-0.5 ${
                  topInsight.severity === "critical"
                    ? "bg-rose-500/20 text-rose-400"
                    : topInsight.severity === "warning"
                    ? "bg-amber-500/20 text-amber-400"
                    : "bg-emerald-500/20 text-emerald-400"
                }`}
              >
                {topInsight.severity === "critical" ? (
                  <AlertTriangle className="w-4 h-4" />
                ) : topInsight.severity === "warning" ? (
                  <AlertCircle className="w-4 h-4" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
              </div>
              <div className="min-w-0">
                <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-400">
                  Top Alert
                </span>
                <h4 className="text-xs font-bold text-zinc-100 truncate">{topInsight.title}</h4>
                <p className="text-[11px] text-zinc-300 line-clamp-1 mt-0.5">
                  {topInsight.message}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 text-xs font-bold text-emerald-400 hover:text-emerald-300 shrink-0 mt-1">
              <span>View Insights</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>
        </section>
      )}

      {/* 3. Monthly Budget Status Widget (Step 13) */}
      <section className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <PieChart className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-zinc-100 uppercase tracking-wider">
              Monthly Budget
            </h3>
          </div>
          <button
            onClick={onViewBudgets}
            className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition-colors cursor-pointer"
          >
            <span>View Budgets</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {budgetSummary && budgetSummary.budgetCount > 0 ? (
          <div className="space-y-2.5">
            <div className="flex items-baseline justify-between">
              <div>
                <span className="text-base font-bold text-zinc-100">
                  {formatCurrency(budgetSummary.totalSpentInBudgetedCategories)}
                </span>
                <span className="text-xs text-zinc-400 font-medium">
                  {" "}of {formatCurrency(budgetSummary.totalBudget)} used
                </span>
              </div>
              <span
                className={`text-sm font-black ${
                  budgetSummary.overallPercentage >= 100
                    ? "text-rose-400"
                    : budgetSummary.overallPercentage >= 75
                    ? "text-amber-400"
                    : "text-emerald-400"
                }`}
              >
                {budgetSummary.overallPercentage}%
              </span>
            </div>

            {/* Progress Bar */}
            <div className="h-2 w-full bg-zinc-800/80 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  budgetSummary.overallPercentage >= 100
                    ? "bg-rose-500"
                    : budgetSummary.overallPercentage >= 75
                    ? "bg-amber-400"
                    : "bg-emerald-500"
                }`}
                style={{ width: `${Math.min(100, budgetSummary.overallPercentage)}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-[11px] text-zinc-400 pt-0.5">
              <span>
                {budgetSummary.remainingBudget >= 0
                  ? `${formatCurrency(budgetSummary.remainingBudget)} remaining`
                  : `${formatCurrency(Math.abs(budgetSummary.remainingBudget))} over budget`}
              </span>
              <div className="flex items-center gap-2">
                {budgetSummary.categoriesOverBudget > 0 && (
                  <span className="text-rose-400 font-semibold">
                    {budgetSummary.categoriesOverBudget} over
                  </span>
                )}
                {budgetSummary.categoriesWarning > 0 && (
                  <span className="text-amber-400 font-semibold">
                    {budgetSummary.categoriesWarning} warning
                  </span>
                )}
                <span className="text-emerald-400 font-semibold">
                  {budgetSummary.categoriesOnTrack} on track
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between text-xs py-1">
            <span className="text-zinc-400">No category budgets set for this month yet.</span>
            <button
              onClick={onViewBudgets}
              className="text-xs font-bold text-emerald-400 hover:underline cursor-pointer"
            >
              + Set Budget
            </button>
          </div>
        )}
      </section>

      {/* 4. Spending by Category */}
      <section className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <PieChart className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-zinc-100 uppercase tracking-wider">
              Spending by Category
            </h3>
          </div>
          {categorySpending.length > 0 && (
            <span className="text-xs text-zinc-400">
              {categorySpending.length} categories
            </span>
          )}
        </div>

        {categorySpending.length === 0 ? (
          <div className="p-4 rounded-2xl bg-zinc-900/40 border border-zinc-800/60 text-center text-xs text-zinc-400">
            No expenses recorded this month yet.
          </div>
        ) : (
          <div className="space-y-2.5 p-4 rounded-2xl bg-zinc-900/50 border border-zinc-800/70">
            {categorySpending.slice(0, 5).map((item) => {
              const cat = categoryMap.get(item.categoryId);
              return (
                <div key={item.categoryId} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <div
                        className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0 text-zinc-100 text-[10px]"
                        style={{
                          backgroundColor: item.color ? `${item.color}25` : "#3f3f46",
                          color: item.color || "#ffffff"
                        }}
                      >
                        <CategoryIcon iconName={item.icon || cat?.icon} className="w-3.5 h-3.5" />
                      </div>
                      <span className="font-semibold text-zinc-200 truncate">{item.category}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="font-bold text-zinc-100">{formatCurrency(item.amount)}</span>
                      <span className="text-[10px] text-zinc-400 w-10 text-right">
                        {item.percentage}%
                      </span>
                    </div>
                  </div>
                  {/* Progress bar */}
                  <div className="h-1.5 w-full bg-zinc-800/80 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.min(100, item.percentage)}%`,
                        backgroundColor: item.color || "#10b981"
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* 5. Recent Transactions */}
      <section className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-zinc-100 uppercase tracking-wider">
              Recent Transactions
            </h3>
          </div>
          {recentTransactions.length > 0 && (
            <button
              onClick={onViewAllTransactions}
              className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition-colors cursor-pointer"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {recentTransactions.length === 0 ? (
          <EmptyState
            title="No transactions yet."
            description="Add your first expense or income to start tracking your money."
            actionText="Add Transaction"
            onAction={onAddTransaction}
          />
        ) : (
          <div className="space-y-2">
            {recentTransactions.slice(0, 5).map((tx) => (
              <TransactionItem
                key={tx.id}
                transaction={tx}
                category={categoryMap.get(tx.categoryId)}
                onClick={onSelectTransaction}
              />
            ))}
          </div>
        )}
      </section>

      {/* 6. Savings Goals Teaser (Preserved feature) */}
      {activeGoals.length > 0 && (
        <section className="space-y-3 pt-2 border-t border-zinc-800/60">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-indigo-400" />
              <h3 className="text-sm font-bold text-zinc-100 uppercase tracking-wider">
                Savings Goals
              </h3>
            </div>
            <button
              onClick={onViewAllGoals}
              className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors cursor-pointer"
            >
              <span>Manage Goals</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {activeGoals.map((goal) => {
              const progress = Math.min(100, Math.round((goal.currentSavings / goal.targetAmount) * 100));
              return (
                <div
                  key={goal.id}
                  onClick={onViewAllGoals}
                  className="p-3.5 rounded-2xl bg-zinc-900/40 border border-zinc-800/60 hover:border-zinc-700/80 transition-all cursor-pointer group"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-zinc-100 group-hover:text-indigo-300 transition-colors truncate">
                      {goal.name}
                    </span>
                    <span className="text-xs font-bold text-indigo-400">{progress}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden mb-2">
                    <div
                      className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-xs text-zinc-400">
                    <span>{formatCurrency(goal.currentSavings)}</span>
                    <span>Target: {formatCurrency(goal.targetAmount)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
};
