import React from "react";
import { CheckCircle2, Inbox, ShieldCheck, ArrowLeft } from "lucide-react";
import { FinanceTransaction } from "../../types/transaction";
import { TransactionCategory } from "../../types/category";
import { ReviewTransactionCard } from "./ReviewTransactionCard";

interface ReviewInboxProps {
  transactions: FinanceTransaction[];
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
  onSelectTransaction: (transaction: FinanceTransaction) => void;
  onBack?: () => void;
}

export const ReviewInbox: React.FC<ReviewInboxProps> = ({
  transactions,
  categories,
  onConfirm,
  onReject,
  onSelectTransaction,
  onBack
}) => {
  return (
    <div className="space-y-4 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          {onBack && (
            <button
              onClick={onBack}
              className="p-1.5 rounded-xl hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
              aria-label="Back"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                Transaction Ingestion
              </span>
              <span className="px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-bold">
                {transactions.length}
              </span>
            </div>
            <h2 className="text-xl font-bold text-zinc-100">Review Inbox</h2>
          </div>
        </div>
      </div>

      <p className="text-xs text-zinc-400 px-1 leading-relaxed">
        These transactions arrived automatically with medium or low categorization confidence. Confirm or adjust their categories so your analytics stay accurate.
      </p>

      {/* Review List or Empty State */}
      {transactions.length === 0 ? (
        <div className="p-8 rounded-2xl bg-zinc-900/40 border border-zinc-800/60 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-zinc-100">All caught up!</h3>
            <p className="text-xs text-zinc-400 mt-1 max-w-xs mx-auto">
              There are no automated transactions waiting for review. High-confidence transactions are auto-confirmed.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {transactions.map((tx) => (
            <ReviewTransactionCard
              key={tx.id}
              transaction={tx}
              categories={categories}
              onConfirm={onConfirm}
              onReject={onReject}
              onEditFull={onSelectTransaction}
            />
          ))}
        </div>
      )}
    </div>
  );
};
