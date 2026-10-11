import React, { useState, useMemo } from "react";
import { Search, X, Filter, FileSpreadsheet, Smartphone, ShieldAlert } from "lucide-react";
import { FinanceTransaction, FinanceTransactionType } from "../../types/transaction";
import { TransactionCategory } from "../../types/category";
import { groupTransactionsByDate } from "../../utils/date";
import { formatCurrency } from "../../utils/currency";
import { TransactionItem } from "./TransactionItem";
import { EmptyState } from "../../components/EmptyState";
import { ReviewInbox } from "../review/ReviewInbox";

interface TransactionListProps {
  transactions: FinanceTransaction[];
  reviewTransactions?: FinanceTransaction[];
  categories: TransactionCategory[];
  onSelectTransaction: (transaction: FinanceTransaction) => void;
  onAddTransaction: () => void;
  onConfirmReview?: (
    id: string,
    updates: {
      categoryId?: string;
      merchant?: string;
      learnMerchantRule?: boolean;
    }
  ) => Promise<void>;
  onRejectReview?: (id: string) => Promise<void>;
  onOpenCSVImport?: () => void;
  onOpenSimulator?: () => void;
}

export const TransactionList: React.FC<TransactionListProps> = ({
  transactions,
  reviewTransactions = [],
  categories,
  onSelectTransaction,
  onAddTransaction,
  onConfirmReview,
  onRejectReview,
  onOpenCSVImport,
  onOpenSimulator
}) => {
  const [subView, setSubView] = useState<"history" | "review">("history");
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | FinanceTransactionType>("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>("all");

  const categoryMap = useMemo(() => {
    const map = new Map<string, TransactionCategory>();
    for (const cat of categories) {
      map.set(cat.id, cat);
    }
    return map;
  }, [categories]);

  // Filter transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      // Type filter
      if (typeFilter !== "all" && tx.type !== typeFilter) {
        return false;
      }

      // Category filter
      if (selectedCategory !== "all" && tx.categoryId !== selectedCategory) {
        return false;
      }

      // Payment method filter
      if (selectedPaymentMethod !== "all" && tx.paymentMethod !== selectedPaymentMethod) {
        return false;
      }

      // Search term filter across merchant, description, and category name
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const cat = categoryMap.get(tx.categoryId);
        const catName = cat?.name.toLowerCase() || "";
        const merchant = (tx.merchant || "").toLowerCase();
        const desc = (tx.description || "").toLowerCase();

        const matches =
          merchant.includes(query) ||
          desc.includes(query) ||
          catName.includes(query) ||
          tx.categoryId.toLowerCase().includes(query);

        if (!matches) return false;
      }

      return true;
    });
  }, [transactions, typeFilter, selectedCategory, selectedPaymentMethod, searchTerm, categoryMap]);

  // Group by date
  const grouped = useMemo(() => {
    return groupTransactionsByDate(filteredTransactions);
  }, [filteredTransactions]);

  const hasActiveFilters =
    searchTerm.trim() !== "" ||
    typeFilter !== "all" ||
    selectedCategory !== "all" ||
    selectedPaymentMethod !== "all";

  const clearFilters = () => {
    setSearchTerm("");
    setTypeFilter("all");
    setSelectedCategory("all");
    setSelectedPaymentMethod("all");
  };

  if (subView === "review") {
    return (
      <ReviewInbox
        transactions={reviewTransactions}
        categories={categories}
        onConfirm={async (id, updates) => {
          if (onConfirmReview) await onConfirmReview(id, updates);
        }}
        onReject={async (id) => {
          if (onRejectReview) await onRejectReview(id);
        }}
        onSelectTransaction={onSelectTransaction}
        onBack={() => setSubView("history")}
      />
    );
  }

  return (
    <div className="space-y-4 pb-24">
      {/* Top Toolbar: Quick Ingestion Tools & Subview switcher */}
      <div className="flex items-center justify-between gap-2 px-0.5">
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-zinc-900/80 border border-zinc-800 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setSubView("history")}
            className="py-1 px-2.5 rounded-lg bg-zinc-800 text-zinc-100 shadow-sm cursor-pointer"
          >
            History
          </button>
          <button
            type="button"
            onClick={() => setSubView("review")}
            className={`py-1 px-2.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
              reviewTransactions.length > 0
                ? "bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <span>Needs Review</span>
            {reviewTransactions.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-amber-500 text-zinc-950 font-extrabold text-[10px]">
                {reviewTransactions.length}
              </span>
            )}
          </button>
        </div>

        <div className="flex items-center gap-1.5">
          {onOpenCSVImport && (
            <button
              type="button"
              onClick={onOpenCSVImport}
              className="py-1.5 px-2.5 rounded-xl bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-zinc-100 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
              title="Import bank statement CSV"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">Import CSV</span>
              <span className="sm:hidden">CSV</span>
            </button>
          )}

          {onOpenSimulator && (
            <button
              type="button"
              onClick={onOpenSimulator}
              className="py-1.5 px-2.5 rounded-xl bg-purple-950/40 hover:bg-purple-900/50 border border-purple-500/30 text-purple-300 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
              title="Simulate notification / SMS ingestion"
            >
              <Smartphone className="w-3.5 h-3.5 text-purple-400" />
              <span className="hidden sm:inline">Simulate</span>
              <span className="sm:hidden">Sim</span>
            </button>
          )}
        </div>
      </div>

      {/* Review Alert Banner (when in history view and there are pending items) */}
      {reviewTransactions.length > 0 && (
        <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h4 className="text-xs font-bold text-amber-200 truncate">
                {reviewTransactions.length} automated transaction{reviewTransactions.length > 1 ? "s" : ""} pending review
              </h4>
              <p className="text-[10px] text-zinc-400 truncate">
                Confirm categories to keep budget and analytics accurate.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setSubView("review")}
            className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs transition-colors shrink-0 cursor-pointer"
          >
            Review Now
          </button>
        </div>
      )}

      {/* Search & Filter Header */}
      <div className="space-y-3">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input
            type="text"
            placeholder="Search transactions, payees, notes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-9 py-2.5 rounded-2xl bg-zinc-900/80 border border-zinc-800 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/60"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Type Filter Tabs (All / Expenses / Income) */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-zinc-900/60 border border-zinc-800/80 text-xs font-medium">
          <button
            type="button"
            onClick={() => setTypeFilter("all")}
            className={`flex-1 py-1.5 px-3 rounded-lg text-center transition-all ${
              typeFilter === "all"
                ? "bg-zinc-800 text-zinc-100 font-semibold shadow-sm"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            All ({transactions.length})
          </button>
          <button
            type="button"
            onClick={() => setTypeFilter("expense")}
            className={`flex-1 py-1.5 px-3 rounded-lg text-center transition-all ${
              typeFilter === "expense"
                ? "bg-rose-500/20 text-rose-300 border border-rose-500/30 font-semibold"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Expenses
          </button>
          <button
            type="button"
            onClick={() => setTypeFilter("income")}
            className={`flex-1 py-1.5 px-3 rounded-lg text-center transition-all ${
              typeFilter === "income"
                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Income
          </button>
        </div>

        {/* Secondary Filters: Category & Payment Method */}
        <div className="flex items-center gap-2">
          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="flex-1 px-3 py-2 rounded-xl bg-zinc-900/80 border border-zinc-800 text-xs text-zinc-300 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
          >
            <option value="all">All Categories</option>
            {categories
              .filter((c) => (typeFilter === "all" ? true : c.type === typeFilter))
              .map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name} ({cat.type})
                </option>
              ))}
          </select>

          {/* Payment Method Filter */}
          <select
            value={selectedPaymentMethod}
            onChange={(e) => setSelectedPaymentMethod(e.target.value)}
            className="px-3 py-2 rounded-xl bg-zinc-900/80 border border-zinc-800 text-xs text-zinc-300 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
          >
            <option value="all">All Payments</option>
            <option value="upi">UPI</option>
            <option value="cash">Cash</option>
            <option value="credit_card">Credit Card</option>
            <option value="debit_card">Debit Card</option>
            <option value="bank_transfer">Bank Transfer</option>
            <option value="wallet">Wallet</option>
            <option value="other">Other</option>
          </select>

          {/* Reset Filters button */}
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="px-2.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 text-xs flex items-center gap-1 transition-colors"
              title="Clear all filters"
            >
              <Filter className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* Transaction List Grouped by Date */}
      {transactions.length === 0 ? (
        <EmptyState
          title="No transactions yet."
          description="Add your first expense or income to start tracking your money."
          actionText="Add Transaction"
          onAction={onAddTransaction}
        />
      ) : filteredTransactions.length === 0 ? (
        <EmptyState
          title="No transactions match your filters."
          description="Try clearing or adjusting your search keywords and filter criteria."
          actionText="Reset Filters"
          onAction={clearFilters}
        />
      ) : (
        <div className="space-y-5">
          {grouped.map((group) => (
            <div key={group.dateKey} className="space-y-2">
              {/* Date Header with Daily Summary */}
              <div className="flex items-center justify-between px-1">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                  {group.displayDate}
                </h3>
                <div className="flex items-center gap-2 text-[11px] text-zinc-400">
                  {group.totalExpense > 0 && (
                    <span className="text-zinc-300">
                      Spent: <strong className="text-rose-400">-{formatCurrency(group.totalExpense)}</strong>
                    </span>
                  )}
                  {group.totalIncome > 0 && (
                    <span className="text-zinc-300">
                      Income: <strong className="text-emerald-400">+{formatCurrency(group.totalIncome)}</strong>
                    </span>
                  )}
                </div>
              </div>

              {/* Transactions for this day */}
              <div className="space-y-2">
                {group.transactions.map((tx) => (
                  <TransactionItem
                    key={tx.id}
                    transaction={tx}
                    category={categoryMap.get(tx.categoryId)}
                    onClick={onSelectTransaction}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
