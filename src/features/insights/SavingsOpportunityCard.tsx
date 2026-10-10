import React from "react";
import { Lightbulb, Sparkles, ArrowRight } from "lucide-react";
import { SpendingInsight } from "../../types/insight";
import { formatCurrency } from "../../utils/currency";

interface SavingsOpportunityCardProps {
  insight: SpendingInsight;
}

export const SavingsOpportunityCard: React.FC<SavingsOpportunityCardProps> = ({ insight }) => {
  const monthlySavings = insight.potentialMonthlySavings || 0;
  const annualSavings = insight.potentialAnnualSavings || 0;

  return (
    <div className="relative overflow-hidden p-5 rounded-3xl bg-gradient-to-br from-indigo-950/40 via-zinc-900/80 to-purple-950/30 border border-indigo-500/30 shadow-lg space-y-3">
      {/* Ambient background glow */}
      <div className="absolute -top-10 -right-10 w-28 h-28 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-indigo-400">
          <div className="w-7 h-7 rounded-lg bg-indigo-500/20 flex items-center justify-center">
            <Lightbulb className="w-4 h-4" />
          </div>
          <span className="text-xs font-bold uppercase tracking-wider">Savings Opportunity</span>
        </div>
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
          Rule-Based
        </span>
      </div>

      <div>
        <h4 className="text-sm font-bold text-zinc-100 mb-1">{insight.title}</h4>
        <p className="text-xs text-zinc-300 leading-relaxed">{insight.message}</p>
      </div>

      {/* Estimated Savings Grid */}
      <div className="grid grid-cols-2 gap-3 pt-2">
        <div className="p-3 rounded-2xl bg-zinc-900/80 border border-zinc-800">
          <span className="text-[10px] text-zinc-400 font-medium block mb-0.5">
            Potential Monthly Saving
          </span>
          <div className="text-base font-extrabold text-emerald-400">
            {formatCurrency(monthlySavings)}
            <span className="text-xs font-normal text-zinc-400"> /mo</span>
          </div>
        </div>

        <div className="p-3 rounded-2xl bg-zinc-900/80 border border-zinc-800">
          <span className="text-[10px] text-zinc-400 font-medium block mb-0.5">
            Projected Annual Saving
          </span>
          <div className="text-base font-extrabold text-indigo-400">
            {formatCurrency(annualSavings)}
            <span className="text-xs font-normal text-zinc-400"> /yr</span>
          </div>
        </div>
      </div>
    </div>
  );
};
