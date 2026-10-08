import React from "react";
import { LucideIcon, Receipt } from "lucide-react";

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  actionText?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon: Icon = Receipt,
  actionText,
  onAction
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center rounded-2xl bg-zinc-900/40 border border-zinc-800/60 my-4">
      <div className="w-14 h-14 rounded-2xl bg-zinc-800/80 flex items-center justify-center text-zinc-400 mb-4 shadow-inner">
        <Icon className="w-7 h-7 text-zinc-400" />
      </div>
      <h3 className="text-base font-semibold text-zinc-200 mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-zinc-400 max-w-sm mb-5 leading-relaxed">
          {description}
        </p>
      )}
      {actionText && onAction && (
        <button
          onClick={onAction}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-sm font-medium shadow-md shadow-emerald-500/20 hover:from-emerald-600 hover:to-teal-600 active:scale-95 transition-all"
        >
          {actionText}
        </button>
      )}
    </div>
  );
};
