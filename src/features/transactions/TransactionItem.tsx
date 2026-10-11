import React from "react";
import { FinanceTransaction } from "../../types/transaction";
import { TransactionCategory } from "../../types/category";
import { formatSignedCurrency } from "../../utils/currency";
import { formatTime } from "../../utils/date";
import { CategoryIcon } from "./categoryIcon";

interface TransactionItemProps {
  transaction: FinanceTransaction;
  category?: TransactionCategory;
  onClick?: (transaction: FinanceTransaction) => void;
  showTimeOnly?: boolean;
}

const PAYMENT_LABELS: Record<string, string> = {
  upi: "UPI",
  cash: "Cash",
  credit_card: "Credit Card",
  debit_card: "Debit Card",
  bank_transfer: "Bank Transfer",
  wallet: "Wallet",
  other: "Other"
};

export const TransactionItem: React.FC<TransactionItemProps> = ({
  transaction,
  category,
  onClick
}) => {
  const isIncome = transaction.type === "income";
  const title = transaction.merchant || transaction.description || category?.name || "Transaction";
  const categoryName = category?.name || transaction.categoryId;
  const paymentMethodLabel = transaction.paymentMethod ? PAYMENT_LABELS[transaction.paymentMethod] || transaction.paymentMethod : "";
  const timeStr = formatTime(transaction.timestamp);

  return (
    <button
      type="button"
      onClick={() => onClick && onClick(transaction)}
      className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-zinc-900/40 hover:bg-zinc-800/60 border border-zinc-800/40 hover:border-zinc-700/60 transition-all text-left group cursor-pointer"
    >
      <div className="flex items-center gap-3 min-w-0">
        {/* Category Icon Badge */}
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 shadow-sm transition-transform group-hover:scale-105"
          style={{
            backgroundColor: category?.color ? `${category.color}20` : isIncome ? "#05966920" : "#ef444420",
            color: category?.color || (isIncome ? "#10b981" : "#f87171")
          }}
        >
          <CategoryIcon iconName={category?.icon} className="w-5 h-5" />
        </div>

        {/* Details */}
        <div className="min-w-0">
          <div className="text-sm font-semibold text-zinc-100 truncate group-hover:text-emerald-400 transition-colors">
            {title}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-zinc-400 truncate mt-0.5">
            <span className="truncate">{categoryName}</span>
            {paymentMethodLabel && (
              <>
                <span className="text-zinc-600">•</span>
                <span className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 text-[10px] font-medium uppercase tracking-wider">
                  {paymentMethodLabel}
                </span>
              </>
            )}
            {transaction.source && transaction.source !== "manual" && (
              <>
                <span className="text-zinc-600">•</span>
                <span className="px-1.5 py-0.5 rounded bg-cyan-950/60 text-cyan-300 border border-cyan-500/20 text-[9px] font-semibold tracking-wider">
                  {transaction.source === "import" ? "Import" : "Auto"}
                </span>
              </>
            )}
            {transaction.reviewStatus === "pending_review" && (
              <>
                <span className="text-zinc-600">•</span>
                <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[9px] font-bold">
                  Review
                </span>
              </>
            )}
            {timeStr && (
              <>
                <span className="text-zinc-600">•</span>
                <span>{timeStr}</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Amount */}
      <div className="shrink-0 text-right pl-3">
        <span
          className={`text-sm sm:text-base font-bold tracking-tight ${
            isIncome ? "text-emerald-400" : "text-zinc-100"
          }`}
        >
          {formatSignedCurrency(transaction.amount, transaction.type)}
        </span>
      </div>
    </button>
  );
};
