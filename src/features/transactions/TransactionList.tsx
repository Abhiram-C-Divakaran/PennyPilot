import React, { useState, useMemo } from "react";
import { Search, X, Filter } from "lucide-react";
import { FinanceTransaction, FinanceTransactionType } from "../../types/transaction";
import { TransactionCategory } from "../../types/category";
import { groupTransactionsByDate } from "../../utils/date";
import { formatCurrency } from "../../utils/currency";
import { TransactionItem } from "./TransactionItem";
import { EmptyState } from "../../components/EmptyState";

interface TransactionListProps {
  transactions: FinanceTransaction[];
  categories: TransactionCategory[];
  onSelectTransaction: (transaction: FinanceTransaction) => void;
  onAddTransaction: () => void;
}

export const TransactionList: React.FC<TransactionListProps> = ({
  transactions,
  categories,
  onSelectTransaction,
  onAddTransaction
}) => {
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

  return (
    <div className="space-y-4 pb-24">
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
