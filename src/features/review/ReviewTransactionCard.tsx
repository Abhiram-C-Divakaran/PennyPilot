import React, { useState } from "react";
import { Check, X, Sparkles, Tag, ArrowRight, ShieldAlert } from "lucide-react";
import { FinanceTransaction } from "../../types/transaction";
import { TransactionCategory } from "../../types/category";
import { formatCurrency } from "../../utils/currency";
import { CategoryIcon } from "../transactions/categoryIcon";

interface ReviewTransactionCardProps {
  transaction: FinanceTransaction;
  categories: TransactionCategory[];
  onConfirm: (
    id: string,
    updates: {
      categoryId?: string;
      merchant?: string;
      learnMerchantRule?: boolean;
    }
  ) => Promise<void>;
  onReject: (id: string) => Promise<void>;
  onEditFull: (transaction: FinanceTransaction) => void;
}

export const ReviewTransactionCard: React.FC<ReviewTransactionCardProps> = ({
  transaction,
  categories,
  onConfirm,
  onReject,
  onEditFull
}) => {
  const [selectedCatId, setSelectedCatId] = useState<string>(transaction.categoryId);
  const [learnRule, setLearnRule] = useState<boolean>(true);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const confidencePct = Math.round((transaction.categoryConfidence || 0) * 100);
  const selectedCategory = categories.find((c) => c.id === selectedCatId);

  // Common quick categories
  const quickCategories = categories.filter((c) => c.type === transaction.type).slice(0, 5);

  const handleConfirm = async () => {
    setIsProcessing(true);
    try {
      await onConfirm(transaction.id, {
        categoryId: selectedCatId,
        merchant: transaction.merchant,
        learnMerchantRule: learnRule
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    setIsProcessing(true);
    try {
      await onReject(transaction.id);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="p-4 rounded-2xl bg-zinc-900/70 border border-amber-500/30 shadow-lg space-y-3.5 transition-all">
      {/* Header with Amount & Confidence */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-amber-400 mb-0.5">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Needs Review</span>
            {transaction.source && (
              <>
                <span className="text-zinc-600">•</span>
                <span className="text-zinc-400">{transaction.source}</span>
              </>
            )}
          </div>
          <h3 className="text-base font-bold text-zinc-100">
            {transaction.merchant || transaction.description || "Unrecognized Transaction"}
          </h3>
          {transaction.rawDescription && transaction.rawDescription !== transaction.merchant && (
            <p className="text-[11px] text-zinc-400 line-clamp-1 italic mt-0.5">
              "{transaction.rawDescription}"
            </p>
          )}
        </div>

        <div className="text-right">
          <span className="text-base font-extrabold text-zinc-100 block">
            {formatCurrency(transaction.amount)}
          </span>
          <span
            className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full inline-block mt-0.5 ${
              confidencePct >= 75
                ? "bg-amber-500/20 text-amber-300"
                : "bg-zinc-800 text-zinc-400"
            }`}
          >
            {confidencePct > 0 ? `${confidencePct}% confidence` : "Low confidence"}
          </span>
        </div>
      </div>

      {/* Suggested Category & Category Picker */}
      <div className="space-y-1.5">
        <label className="text-[11px] font-semibold text-zinc-400 flex items-center gap-1">
          <Tag className="w-3 h-3 text-emerald-400" />
          <span>Category:</span>
        </label>
        <div className="flex flex-wrap gap-1.5">
          {quickCategories.map((cat) => {
            const isSelected = selectedCatId === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCatId(cat.id)}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  isSelected
                    ? "bg-emerald-500 text-zinc-950 shadow-sm"
                    : "bg-zinc-800/80 hover:bg-zinc-800 text-zinc-300 border border-zinc-700/50"
                }`}
              >
                <CategoryIcon iconName={cat.icon} className="w-3 h-3" />
                <span>{cat.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Learn Rule Toggle */}
      {transaction.merchant && (
        <label className="flex items-center gap-2 cursor-pointer select-none text-[11px] text-zinc-300 pt-1">
          <input
            type="checkbox"
            checked={learnRule}
            onChange={(e) => setLearnRule(e.target.checked)}
            className="w-3.5 h-3.5 accent-emerald-500 rounded cursor-pointer"
          />
          <span className="flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-400" />
            <span>Always categorize <strong>{transaction.merchant}</strong> as <strong>{selectedCategory?.name || "this category"}</strong></span>
          </span>
        </label>
      )}

      {/* Action Buttons */}
      <div className="flex items-center gap-2 pt-1 border-t border-zinc-800/60">
        <button
          type="button"
          disabled={isProcessing}
          onClick={handleConfirm}
          className="flex-1 py-2 px-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-zinc-950 font-bold text-xs shadow-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
        >
          <Check className="w-4 h-4 stroke-[2.5]" />
          <span>Confirm</span>
        </button>

        <button
          type="button"
          disabled={isProcessing}
          onClick={handleReject}
          className="py-2 px-3 rounded-xl bg-rose-950/40 hover:bg-rose-900/50 border border-rose-500/30 text-rose-300 font-semibold text-xs flex items-center gap-1 transition-all cursor-pointer disabled:opacity-50"
          title="Reject transaction (will not affect budgets or analytics)"
        >
          <X className="w-4 h-4" />
          <span>Reject</span>
        </button>

        <button
          type="button"
          onClick={() => onEditFull(transaction)}
          className="py-2 px-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 text-xs transition-colors cursor-pointer"
          title="Edit full transaction details"
        >
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
