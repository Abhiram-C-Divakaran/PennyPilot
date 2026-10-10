import React, { useState } from "react";
import { Plus, PiggyBank, RefreshCw } from "lucide-react";
import { Budget, BudgetProgress, MonthlyBudgetSummary, CreateBudgetInput, UpdateBudgetInput } from "../../types/budget";
import { TransactionCategory } from "../../types/category";
import { MonthSelector } from "../../components/MonthSelector";
import { BudgetSummary } from "./BudgetSummary";
import { BudgetCard } from "./BudgetCard";
import { BudgetForm } from "./BudgetForm";
import { EmptyState } from "../../components/EmptyState";

interface BudgetScreenProps {
  selectedMonth: string;
  onMonthChange: (month: string) => void;
  budgets: Budget[];
  budgetProgress: BudgetProgress[];
  budgetSummary: MonthlyBudgetSummary;
  categories: TransactionCategory[];
  isLoading: boolean;
  error?: string | null;
  onRetry: () => void;
  onCreateBudget: (data: CreateBudgetInput) => Promise<void>;
  onUpdateBudget: (id: string, data: UpdateBudgetInput) => Promise<void>;
  onDeleteBudget: (id: string) => Promise<void>;
}

export const BudgetScreen: React.FC<BudgetScreenProps> = ({
  selectedMonth,
  onMonthChange,
  budgets,
  budgetProgress,
  budgetSummary,
  categories,
  isLoading,
  error,
  onRetry,
  onCreateBudget,
  onUpdateBudget,
  onDeleteBudget
}) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedProgress, setSelectedProgress] = useState<BudgetProgress | null>(null);

  const handleOpenAdd = () => {
    setSelectedProgress(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (progress: BudgetProgress) => {
    setSelectedProgress(progress);
    setIsFormOpen(true);
  };

  const handleSubmit = async (data: CreateBudgetInput | UpdateBudgetInput) => {
    if (selectedProgress) {
      await onUpdateBudget(selectedProgress.budgetId, data as UpdateBudgetInput);
    } else {
      await onCreateBudget(data as CreateBudgetInput);
    }
  };

  const handleDelete = async (id: string) => {
    await onDeleteBudget(id);
  };

  return (
    <div className="space-y-5 pb-24">
      {/* Month Selector */}
      <MonthSelector selectedMonth={selectedMonth} onMonthChange={onMonthChange} />

      {/* Top Header & Set Budget Button */}
      <div className="flex items-center justify-between px-1">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
            Monthly Planning
          </span>
          <h2 className="text-xl font-bold text-zinc-100">Category Budgets</h2>
        </div>
        <button
          type="button"
          onClick={handleOpenAdd}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-zinc-950 text-xs font-bold shadow-md shadow-emerald-500/20 active:scale-95 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Set Budget</span>
        </button>
      </div>

      {/* Error State with Retry */}
      {error ? (
        <div className="p-6 rounded-2xl bg-rose-950/20 border border-rose-500/30 text-center space-y-3">
          <p className="text-sm text-rose-300 font-medium">Couldn't load your budget information.</p>
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry</span>
          </button>
        </div>
      ) : isLoading ? (
        <div className="py-16 flex flex-col items-center justify-center text-zinc-500 gap-3">
          <div className="w-7 h-7 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs">Loading budgets...</span>
        </div>
      ) : (
        <>
          {/* Summary Card */}
          {budgetProgress.length > 0 && <BudgetSummary summary={budgetSummary} />}

          {/* Budget List */}
          {budgetProgress.length === 0 ? (
            <EmptyState
              title="No budgets set for this month"
              description="Plan your spending by setting monthly limits on categories like Food, Shopping, or Transport."
              icon={PiggyBank}
              actionText="+ Set First Budget"
              onAction={handleOpenAdd}
            />
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between px-1 text-xs text-zinc-400">
                <span>{budgetProgress.length} category budgets</span>
                <span>Click any budget to edit</span>
              </div>
              <div className="grid grid-cols-1 gap-3">
                {budgetProgress.map((prog) => (
                  <BudgetCard key={prog.budgetId} progress={prog} onEdit={handleOpenEdit} />
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Budget Form Modal */}
      <BudgetForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        initialData={selectedProgress}
        selectedMonth={selectedMonth}
        existingBudgets={budgets}
        categories={categories}
        onSubmit={handleSubmit}
        onDelete={selectedProgress ? handleDelete : undefined}
      />
    </div>
  );
};
