import React from "react";
import { PieChart, AlertCircle, AlertTriangle, CheckCircle2 } from "lucide-react";
import { MonthlyBudgetSummary } from "../../types/budget";
import { formatCurrency } from "../../utils/currency";
import { formatMonthName } from "../../utils/date";

interface BudgetSummaryProps {
  summary: MonthlyBudgetSummary;
}

export const BudgetSummary: React.FC<BudgetSummaryProps> = ({ summary }) => {
  const isOver = summary.remainingBudget < 0;
  const monthName = formatMonthName(summary.month);

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-zinc-900/90 via-zinc-900/70 to-zinc-950/90 border border-zinc-800/80 p-5 shadow-xl backdrop-blur-md">
      {/* Decorative ambient glow */}
      <div className="absolute -top-12 -right-12 w-36 h-36 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <span className="text-xs font-semibold tracking-wider uppercase text-zinc-400">
            Monthly Budget Overview
          </span>
          <h3 className="text-lg font-bold text-zinc-100">{monthName}</h3>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-800/80 border border-zinc-700/50 text-xs font-medium">
          <PieChart className="w-3.5 h-3.5 text-emerald-400" />
          <span className="text-zinc-400">Used:</span>
          <span className={`font-bold ${isOver ? "text-rose-400" : "text-emerald-400"}`}>
            {summary.overallPercentage}%
          </span>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-3 gap-2.5 mb-4">
        <div className="p-3 rounded-2xl bg-zinc-800/40 border border-zinc-800">
          <span className="text-[10px] uppercase font-semibold text-zinc-400 block mb-0.5">
            Total Budget
          </span>
          <div className="text-sm sm:text-base font-bold text-zinc-100 truncate">
            {formatCurrency(summary.totalBudget)}
          </div>
        </div>

        <div className="p-3 rounded-2xl bg-zinc-800/40 border border-zinc-800">
          <span className="text-[10px] uppercase font-semibold text-zinc-400 block mb-0.5">
            Spent
          </span>
          <div className="text-sm sm:text-base font-bold text-zinc-100 truncate">
            {formatCurrency(summary.totalSpentInBudgetedCategories)}
          </div>
        </div>

        <div className={`p-3 rounded-2xl border ${isOver ? "bg-rose-950/20 border-rose-500/20" : "bg-emerald-950/20 border-emerald-500/20"}`}>
          <span className={`text-[10px] uppercase font-semibold block mb-0.5 ${isOver ? "text-rose-400" : "text-emerald-400"}`}>
            {isOver ? "Over Budget" : "Remaining"}
          </span>
          <div className={`text-sm sm:text-base font-bold truncate ${isOver ? "text-rose-400" : "text-emerald-400"}`}>
            {formatCurrency(Math.abs(summary.remainingBudget))}
          </div>
        </div>
      </div>

      {/* Category Status Breakdown Pills */}
      <div className="flex items-center justify-between text-xs pt-3 border-t border-zinc-800/60 text-zinc-400">
        <div className="flex items-center gap-1.5 text-emerald-400 font-medium">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>{summary.categoriesOnTrack} on track</span>
        </div>
        <div className="flex items-center gap-1.5 text-amber-400 font-medium">
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>{summary.categoriesWarning} warning</span>
        </div>
        <div className="flex items-center gap-1.5 text-rose-400 font-medium">
          <AlertCircle className="w-3.5 h-3.5" />
          <span>{summary.categoriesOverBudget} over limit</span>
        </div>
      </div>
    </div>
  );
};
