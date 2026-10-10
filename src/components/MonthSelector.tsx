import React from "react";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import {
  formatMonthName,
  getPreviousMonthKey,
  getNextMonthKey,
  getCurrentMonthKey
} from "../utils/date";

interface MonthSelectorProps {
  selectedMonth: string;
  onMonthChange: (month: string) => void;
  className?: string;
}

export const MonthSelector: React.FC<MonthSelectorProps> = ({
  selectedMonth,
  onMonthChange,
  className = ""
}) => {
  const isCurrentMonth = selectedMonth === getCurrentMonthKey();
  const readableName = formatMonthName(selectedMonth);

  const handlePrev = () => {
    onMonthChange(getPreviousMonthKey(selectedMonth));
  };

  const handleNext = () => {
    onMonthChange(getNextMonthKey(selectedMonth));
  };

  const handleResetCurrent = () => {
    onMonthChange(getCurrentMonthKey());
  };

  return (
    <div
      className={`flex items-center justify-between p-1.5 rounded-2xl bg-zinc-900/80 border border-zinc-800/80 shadow-sm ${className}`}
    >
      <button
        type="button"
        onClick={handlePrev}
        className="p-1.5 rounded-xl hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
        aria-label="Previous month"
        title="Previous month"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>

      <div className="flex items-center gap-2">
        <Calendar className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
        <span className="text-xs sm:text-sm font-bold text-zinc-100 tracking-wide">
          {readableName}
        </span>
        {!isCurrentMonth && (
          <button
            type="button"
            onClick={handleResetCurrent}
            className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-semibold hover:bg-emerald-500/30 transition-all cursor-pointer"
            title="Reset to current month"
          >
            Today
          </button>
        )}
      </div>

      <button
        type="button"
        onClick={handleNext}
        className="p-1.5 rounded-xl hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
        aria-label="Next month"
        title="Next month"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
};
