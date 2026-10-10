import React from "react";
import { AlertTriangle, AlertCircle, CheckCircle2, MoreVertical, Edit2 } from "lucide-react";
import { BudgetProgress } from "../../types/budget";
import { formatCurrency } from "../../utils/currency";
import { CategoryIcon } from "../transactions/categoryIcon";

interface BudgetCardProps {
  progress: BudgetProgress;
  onEdit: (progress: BudgetProgress) => void;
}

export const BudgetCard: React.FC<BudgetCardProps> = ({ progress, onEdit }) => {
  const isOver = progress.status === "over";
  const isWarning = progress.status === "warning";

  // Color schemes based on budget status
  const statusConfig = isOver
    ? {
        progressBg: "bg-rose-500",
        badgeBg: "bg-rose-500/20 text-rose-300 border-rose-500/30",
        textStatus: "text-rose-400",
        Icon: AlertCircle
      }
    : isWarning
    ? {
        progressBg: "bg-amber-500",
        badgeBg: "bg-amber-500/20 text-amber-300 border-amber-500/30",
        textStatus: "text-amber-400",
        Icon: AlertTriangle
      }
    : {
        progressBg: "bg-emerald-500",
        badgeBg: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
        textStatus: "text-emerald-400",
        Icon: CheckCircle2
      };

  const clampedProgressWidth = Math.min(100, progress.percentageUsed);

  return (
    <div
      onClick={() => onEdit(progress)}
      className="p-4 rounded-2xl bg-zinc-900/50 hover:bg-zinc-800/60 border border-zinc-800/60 hover:border-zinc-700/80 transition-all cursor-pointer group shadow-sm"
    >
      {/* Top Header: Category & Edit icon */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-inner group-hover:scale-105 transition-transform"
            style={{
              backgroundColor: progress.categoryColor ? `${progress.categoryColor}25` : "#3f3f46",
              color: progress.categoryColor || "#ffffff"
            }}
          >
            <CategoryIcon iconName={progress.categoryIcon} className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h4 className="text-sm font-bold text-zinc-100 truncate group-hover:text-emerald-400 transition-colors">
              {progress.categoryName}
            </h4>
            <div className="text-[11px] text-zinc-400 font-mono">
              Limit: {formatCurrency(progress.limit)}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Status Badge */}
          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold border ${statusConfig.badgeBg}`}
          >
            <statusConfig.Icon className="w-3 h-3" />
            <span>{progress.percentageUsed}%</span>
          </span>
          <Edit2 className="w-3.5 h-3.5 text-zinc-600 group-hover:text-zinc-300 transition-colors ml-1" />
        </div>
      </div>

      {/* Progress Bar */}
      <div className="h-2 w-full bg-zinc-800/80 rounded-full overflow-hidden mb-2.5">
        <div
          className={`h-full rounded-full transition-all duration-500 ${statusConfig.progressBg}`}
          style={{ width: `${clampedProgressWidth}%` }}
        />
      </div>

      {/* Amounts footer */}
      <div className="flex items-center justify-between text-xs">
        <div className="text-zinc-300 font-medium">
          Spent: <strong className="text-zinc-100">{formatCurrency(progress.spent)}</strong>
        </div>
        <div className={`font-semibold ${statusConfig.textStatus}`}>
          {isOver ? (
            <span>{formatCurrency(Math.abs(progress.remaining))} over budget</span>
          ) : (
            <span>{formatCurrency(progress.remaining)} remaining</span>
          )}
        </div>
      </div>
    </div>
  );
};
