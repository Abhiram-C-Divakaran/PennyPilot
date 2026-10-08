import React, { useMemo } from "react";
import { ArrowRight, PieChart, Plus, Target, TrendingUp } from "lucide-react";
import { FinanceTransaction } from "../../types/transaction";
import { TransactionCategory } from "../../types/category";
import { MonthlyAnalytics, CategorySpendingItem } from "../../types/analytics";
import { SummaryCard } from "../../components/SummaryCard";
import { TransactionItem } from "../transactions/TransactionItem";
import { CategoryIcon } from "../transactions/categoryIcon";
import { formatCurrency } from "../../utils/currency";
import { EmptyState } from "../../components/EmptyState";
import { SavingsGoal } from "../../types";

interface DashboardProps {
  monthlyAnalytics: MonthlyAnalytics;
  categorySpending: CategorySpendingItem[];
  recentTransactions: FinanceTransaction[];
  categories: TransactionCategory[];
  goals: SavingsGoal[];
  onAddTransaction: () => void;
  onSelectTransaction: (transaction: FinanceTransaction) => void;
  onViewAllTransactions: () => void;
  onViewAllGoals: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  monthlyAnalytics,
  categorySpending,
  recentTransactions,
  categories,
  goals,
  onAddTransaction,
  onSelectTransaction,
  onViewAllTransactions,
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
    <div className="space-y-6 pb-24">
      {/* 1. Monthly Summary Card */}
      <SummaryCard
        month={monthlyAnalytics.month}
        income={monthlyAnalytics.income}
        expenses={monthlyAnalytics.expenses}
        balance={monthlyAnalytics.balance}
        savingsRate={monthlyAnalytics.savingsRate}
      />

      {/* 2. Spending by Category */}
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

      {/* 3. Recent Transactions */}
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

      {/* 4. Savings Goals Teaser (Preserved feature lower on dashboard) */}
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
