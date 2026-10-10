import React from "react";
import { Sparkles, RefreshCw, Compass, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { SpendingInsight } from "../../types/insight";
import { MonthlySpendingTrend, CategoryTrend } from "../../types/analytics";
import { MonthSelector } from "../../components/MonthSelector";
import { SpendingTrendCard } from "./SpendingTrendCard";
import { SavingsOpportunityCard } from "./SavingsOpportunityCard";
import { InsightCard } from "./InsightCard";
import { EmptyState } from "../../components/EmptyState";
import { CategoryIcon } from "../transactions/categoryIcon";
import { formatCurrency } from "../../utils/currency";

interface InsightsScreenProps {
  selectedMonth: string;
  onMonthChange: (month: string) => void;
  insights: SpendingInsight[];
  trend: MonthlySpendingTrend;
  categoryTrends: CategoryTrend[];
  isLoading: boolean;
  error?: string | null;
  onRetry: () => void;
}

export const InsightsScreen: React.FC<InsightsScreenProps> = ({
  selectedMonth,
  onMonthChange,
  insights,
  trend,
  categoryTrends,
  isLoading,
  error,
  onRetry
}) => {
  const savingsOpportunities = insights.filter((i) => i.type === "potential_savings");
  const observationInsights = insights.filter((i) => i.type !== "potential_savings");

  return (
    <div className="space-y-5 pb-24">
      {/* Month Selector */}
      <MonthSelector selectedMonth={selectedMonth} onMonthChange={onMonthChange} />

      {/* Header */}
      <div className="px-1">
        <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
          Financial Intelligence
        </span>
        <h2 className="text-xl font-bold text-zinc-100">Spending Insights & Trends</h2>
      </div>

      {/* Error State */}
      {error ? (
        <div className="p-6 rounded-2xl bg-rose-950/20 border border-rose-500/30 text-center space-y-3">
          <p className="text-sm text-rose-300 font-medium">Couldn't load spending insights.</p>
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry</span>
          </button>
        </div>
      ) : isLoading ? (
        <div className="py-16 flex flex-col items-center justify-center text-zinc-500 gap-3">
          <div className="w-7 h-7 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs">Analyzing financial habits...</span>
        </div>
      ) : (
        <>
          {/* 1. Month-Over-Month Macro Trend */}
          <SpendingTrendCard trend={trend} />

          {/* 2. Savings Opportunities */}
          {savingsOpportunities.length > 0 && (
            <section className="space-y-3">
              <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider px-1">
                Potential Savings Opportunities
              </h3>
              <div className="grid grid-cols-1 gap-3">
                {savingsOpportunities.map((opportunity) => (
                  <SavingsOpportunityCard key={opportunity.id} insight={opportunity} />
                ))}
              </div>
            </section>
          )}

          {/* 3. Rule-Based Alert & Status Observations */}
          <section className="space-y-3">
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider px-1">
              Habit & Budget Alerts ({observationInsights.length})
            </h3>
            {observationInsights.length === 0 ? (
              <EmptyState
                title="No critical alerts this month"
                description="Your spending is steady and within budgeted targets. Keep up the disciplined habits!"
                icon={Compass}
              />
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {observationInsights.map((insight) => (
                  <InsightCard key={insight.id} insight={insight} />
                ))}
              </div>
            )}
          </section>

          {/* 4. Significant Category Shifts */}
          {categoryTrends.length > 0 && (
            <section className="space-y-3 pt-2 border-t border-zinc-800/60">
              <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider px-1">
                Top Category Shifts vs Last Month
              </h3>
              <div className="space-y-2 p-4 rounded-2xl bg-zinc-900/50 border border-zinc-800/70">
                {categoryTrends.slice(0, 6).map((catTrend) => {
                  const increased = catTrend.difference > 0;
                  const decreased = catTrend.difference < 0;

                  return (
                    <div
                      key={catTrend.categoryId}
                      className="flex items-center justify-between text-xs py-1.5 border-b border-zinc-800/40 last:border-b-0"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                          style={{
                            backgroundColor: catTrend.categoryColor ? `${catTrend.categoryColor}25` : "#3f3f46",
                            color: catTrend.categoryColor || "#ffffff"
                          }}
                        >
                          <CategoryIcon iconName={catTrend.categoryIcon} className="w-3.5 h-3.5" />
                        </div>
                        <div className="min-w-0">
                          <span className="font-semibold text-zinc-200 block truncate">
                            {catTrend.categoryName}
                          </span>
                          <span className="text-[10px] text-zinc-500">
                            Now: {formatCurrency(catTrend.currentAmount)} | Prev: {formatCurrency(catTrend.previousAmount)}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0 text-right">
                        <span
                          className={`font-bold flex items-center gap-0.5 ${
                            increased ? "text-rose-400" : decreased ? "text-emerald-400" : "text-zinc-400"
                          }`}
                        >
                          {increased ? (
                            <ArrowUpRight className="w-3.5 h-3.5" />
                          ) : decreased ? (
                            <ArrowDownRight className="w-3.5 h-3.5" />
                          ) : null}
                          {increased ? "+" : ""}
                          {formatCurrency(catTrend.difference)} ({catTrend.percentageChange}%)
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
};
