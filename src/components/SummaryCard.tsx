import React from "react";
import { ArrowDownLeft, ArrowUpRight, Wallet, Percent } from "lucide-react";
import { formatCurrency } from "../utils/currency";
import { formatMonthName } from "../utils/date";

interface SummaryCardProps {
  month?: string;
  income: number;
  expenses: number;
  balance: number;
  savingsRate: number;
}

export const SummaryCard: React.FC<SummaryCardProps> = ({
  month,
  income,
  expenses,
  balance,
  savingsRate
}) => {
  const displayMonth = formatMonthName(month);

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-zinc-900/90 via-zinc-900/70 to-zinc-950/90 border border-zinc-800/80 p-5 shadow-xl backdrop-blur-md">
      {/* Decorative subtle ambient glows */}
      <div className="absolute -top-12 -right-12 w-36 h-36 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-12 -left-12 w-36 h-36 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header Month & Balance */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <span className="text-xs font-semibold tracking-wider uppercase text-zinc-400">
            Monthly Summary
          </span>
          <h2 className="text-lg font-bold text-zinc-100">{displayMonth}</h2>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-800/80 border border-zinc-700/50 text-xs font-medium">
          <Percent className="w-3.5 h-3.5 text-emerald-400" />
          <span className="text-zinc-400">Savings Rate:</span>
          <span className="text-emerald-400 font-bold">{savingsRate}%</span>
        </div>
      </div>

      {/* Main Remaining Balance */}
      <div className="mb-6 p-4 rounded-2xl bg-zinc-800/50 border border-zinc-800/80">
        <div className="flex items-center gap-2 text-xs font-medium text-zinc-400 mb-1">
          <Wallet className="w-4 h-4 text-zinc-300" />
          <span>Remaining Balance</span>
        </div>
        <div className="flex items-baseline gap-2">
          <span
            className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${
              balance >= 0 ? "text-zinc-100" : "text-rose-400"
            }`}
          >
            {formatCurrency(balance)}
          </span>
        </div>
      </div>

      {/* Grid: Income & Expenses */}
      <div className="grid grid-cols-2 gap-3">
        {/* Income Card */}
        <div className="p-3.5 rounded-2xl bg-emerald-950/20 border border-emerald-500/20 transition-all">
          <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-400 mb-1">
            <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center">
              <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <span>Income</span>
          </div>
          <div className="text-lg sm:text-xl font-bold text-emerald-400 truncate">
            {formatCurrency(income)}
          </div>
        </div>

        {/* Expenses Card */}
        <div className="p-3.5 rounded-2xl bg-rose-950/20 border border-rose-500/20 transition-all">
          <div className="flex items-center gap-1.5 text-xs font-medium text-rose-400 mb-1">
            <div className="w-5 h-5 rounded-full bg-rose-500/20 flex items-center justify-center">
              <ArrowUpRight className="w-3.5 h-3.5 text-rose-400" />
            </div>
            <span>Expenses</span>
          </div>
          <div className="text-lg sm:text-xl font-bold text-rose-400 truncate">
            {formatCurrency(expenses)}
          </div>
        </div>
      </div>
    </div>
  );
};
