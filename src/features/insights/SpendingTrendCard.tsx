import React from "react";
import { TrendingDown, TrendingUp, Minus } from "lucide-react";
import { MonthlySpendingTrend } from "../../types/analytics";
import { formatCurrency } from "../../utils/currency";
import { formatMonthName } from "../../utils/date";

interface SpendingTrendCardProps {
  trend: MonthlySpendingTrend;
}

export const SpendingTrendCard: React.FC<SpendingTrendCardProps> = ({ trend }) => {
  const currentMonthName = formatMonthName(trend.currentMonth);
  const prevMonthName = formatMonthName(trend.previousMonth);

  const expenseIncreased = trend.expenseChangeAmount > 0;
  const expenseDecreased = trend.expenseChangeAmount < 0;

  return (
    <div className="p-4 sm:p-5 rounded-3xl bg-zinc-900/60 border border-zinc-800/80 shadow-md space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
            Month-Over-Month Comparison
          </span>
          <h3 className="text-sm sm:text-base font-bold text-zinc-100">
            {currentMonthName} vs {prevMonthName}
          </h3>
        </div>

        {/* Change indicator pill */}
        <div
          className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border ${
            expenseDecreased
              ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
              : expenseIncreased
              ? "bg-rose-500/20 text-rose-300 border-rose-500/30"
              : "bg-zinc-800 text-zinc-400 border-zinc-700"
          }`}
        >
          {expenseDecreased ? (
            <>
              <TrendingDown className="w-3.5 h-3.5" />
              <span>Down {Math.abs(trend.expenseChangePercentage)}%</span>
            </>
          ) : expenseIncreased ? (
            <>
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Up {trend.expenseChangePercentage}%</span>
            </>
          ) : (
            <>
              <Minus className="w-3.5 h-3.5" />
              <span>No Change</span>
            </>
          )}
        </div>
      </div>

      {/* Side-by-side stats grid */}
      <div className="grid grid-cols-2 gap-3">
        {/* Current Month Expenses */}
        <div className="p-3.5 rounded-2xl bg-zinc-950/60 border border-zinc-800">
          <span className="text-[11px] text-zinc-400 font-medium block mb-1">
            {currentMonthName} Spending
          </span>
          <div className="text-base sm:text-lg font-bold text-zinc-100">
            {formatCurrency(trend.currentExpenses)}
          </div>
          <span className="text-[10px] text-zinc-400">
            Income: {formatCurrency(trend.currentIncome)}
          </span>
        </div>

        {/* Previous Month Expenses */}
        <div className="p-3.5 rounded-2xl bg-zinc-950/60 border border-zinc-800">
          <span className="text-[11px] text-zinc-400 font-medium block mb-1">
            {prevMonthName} Spending
          </span>
          <div className="text-base sm:text-lg font-bold text-zinc-300">
            {formatCurrency(trend.previousExpenses)}
          </div>
          <span className="text-[10px] text-zinc-400">
            Income: {formatCurrency(trend.previousIncome)}
          </span>
        </div>
      </div>

      {/* Difference summary footer */}
      <div className="text-xs text-zinc-400 flex items-center justify-between pt-1 border-t border-zinc-800/60">
        <span>Expense Difference:</span>
        <span
          className={`font-bold ${
            expenseIncreased ? "text-rose-400" : expenseDecreased ? "text-emerald-400" : "text-zinc-300"
          }`}
        >
          {expenseIncreased ? "+" : ""}
          {formatCurrency(trend.expenseChangeAmount)}
        </span>
      </div>
    </div>
  );
};
