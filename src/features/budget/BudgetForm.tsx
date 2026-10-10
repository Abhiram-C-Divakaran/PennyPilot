import React, { useState, useEffect } from "react";
import { X, Trash2, AlertCircle, CheckCircle2, Loader2, Calendar } from "lucide-react";
import { Budget, CreateBudgetInput, UpdateBudgetInput, BudgetProgress } from "../../types/budget";
import { TransactionCategory } from "../../types/category";
import { CategoryIcon } from "../transactions/categoryIcon";
import { isValidPositiveAmount } from "../../utils/finance";
import { formatMonthName } from "../../utils/date";

interface BudgetFormProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: BudgetProgress | Budget | null;
  selectedMonth: string;
  existingBudgets: Budget[];
  categories: TransactionCategory[];
  onSubmit: (data: CreateBudgetInput | UpdateBudgetInput) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
}

export const BudgetForm: React.FC<BudgetFormProps> = ({
  isOpen,
  onClose,
  initialData,
  selectedMonth,
  existingBudgets,
  categories,
  onSubmit,
  onDelete
}) => {
  const isEditMode = Boolean(initialData);

  const [categoryId, setCategoryId] = useState<string>("");
  const [limit, setLimit] = useState<string>("");
  const [month, setMonth] = useState<string>(selectedMonth);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Only expense categories can be budgeted
  const expenseCategories = categories.filter((c) => c.type === "expense");

  // Reset or prefill form state
  useEffect(() => {
    if (isOpen) {
      setMonth(selectedMonth);
      if (initialData) {
        setCategoryId(initialData.categoryId);
        setLimit(String(initialData.limit));
      } else {
        // Find first expense category that doesn't already have a budget this month
        const budgetedCatIds = new Set(
          existingBudgets.filter((b) => b.month === selectedMonth).map((b) => b.categoryId)
        );
        const availableCat = expenseCategories.find((c) => !budgetedCatIds.has(c.id));
        setCategoryId(availableCat ? availableCat.id : expenseCategories[0]?.id || "");
        setLimit("");
      }
      setErrors({});
      setShowDeleteConfirm(false);
      setSuccessMessage(null);
    }
  }, [isOpen, initialData, selectedMonth, categories, existingBudgets]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!categoryId) {
      newErrors.categoryId = "Please select a category";
    }

    if (!isValidPositiveAmount(limit)) {
      newErrors.limit = "Please enter a valid positive monthly limit";
    }

    // In create mode, check if budget already exists for this category and month
    if (!isEditMode) {
      const alreadyExists = existingBudgets.some(
        (b) => b.categoryId === categoryId && b.month === month
      );
      if (alreadyExists) {
        const cat = categories.find((c) => c.id === categoryId);
        newErrors.categoryId = `A budget for ${cat?.name || categoryId} already exists in ${formatMonthName(month)}`;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      setIsSubmitting(true);
      setErrors({});

      if (isEditMode) {
        await onSubmit({ limit: parseFloat(limit) });
        setSuccessMessage("Budget updated!");
      } else {
        await onSubmit({
          categoryId,
          month,
          limit: parseFloat(limit)
        });
        setSuccessMessage("Budget created!");
      }

      setTimeout(() => {
        setIsSubmitting(false);
        onClose();
      }, 500);
    } catch (err: any) {
      setIsSubmitting(false);
      const msg = err.data?.error?.message || err.message || "Failed to save budget";
      setErrors({ general: msg });
    }
  };

  const handleDelete = async () => {
    if (!initialData || !onDelete) return;
    const budgetId = "budgetId" in initialData ? initialData.budgetId : initialData.id;
    if (!budgetId) return;

    try {
      setIsDeleting(true);
      await onDelete(budgetId);
      setIsDeleting(false);
      onClose();
    } catch (err: any) {
      setIsDeleting(false);
      const msg = err.data?.error?.message || err.message || "Failed to delete budget";
      setErrors({ general: msg });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl bg-zinc-900 border border-zinc-800 shadow-2xl p-5 sm:p-6 text-zinc-100 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800/80 mb-4">
          <div>
            <h3 className="text-lg font-bold text-zinc-100">
              {isEditMode ? "Edit Category Budget" : "Set Category Budget"}
            </h3>
            <span className="text-xs text-zinc-400">{formatMonthName(month)}</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error / Success Banners */}
        {errors.general && (
          <div className="mb-4 p-3 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{errors.general}</span>
          </div>
        )}

        {successMessage && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{successMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Category Selector */}
          <div>
            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
              Expense Category *
            </label>
            {isEditMode ? (
              <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center gap-3">
                {(() => {
                  const cat = categories.find((c) => c.id === categoryId);
                  return (
                    <>
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                        style={{
                          backgroundColor: cat?.color ? `${cat.color}25` : "#3f3f46",
                          color: cat?.color || "#ffffff"
                        }}
                      >
                        <CategoryIcon iconName={cat?.icon} className="w-4 h-4" />
                      </div>
                      <span className="font-bold text-sm text-zinc-200">{cat?.name || categoryId}</span>
                    </>
                  );
                })()}
              </div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-40 overflow-y-auto p-1.5 rounded-xl bg-zinc-950/60 border border-zinc-800/80">
                {expenseCategories.map((cat) => {
                  const isSelected = categoryId === cat.id;
                  const alreadyBudgeted = existingBudgets.some(
                    (b) => b.categoryId === cat.id && b.month === month
                  );

                  return (
                    <button
                      key={cat.id}
                      type="button"
                      disabled={alreadyBudgeted}
                      onClick={() => setCategoryId(cat.id)}
                      className={`flex flex-col items-center justify-center p-2 rounded-xl text-center transition-all ${
                        alreadyBudgeted
                          ? "opacity-30 cursor-not-allowed bg-zinc-900 border border-zinc-900"
                          : isSelected
                          ? "bg-zinc-800 border-2 border-emerald-500 shadow-sm cursor-pointer"
                          : "bg-zinc-900/60 hover:bg-zinc-800/50 border border-zinc-800/40 text-zinc-400 cursor-pointer"
                      }`}
                    >
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center mb-1 text-zinc-200"
                        style={{
                          backgroundColor: cat.color ? `${cat.color}25` : "#3f3f46",
                          color: cat.color || "#ffffff"
                        }}
                      >
                        <CategoryIcon iconName={cat.icon} className="w-4 h-4" />
                      </div>
                      <span
                        className={`text-[11px] truncate w-full ${
                          isSelected ? "text-zinc-100 font-bold" : "text-zinc-400"
                        }`}
                      >
                        {cat.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
            {errors.categoryId && (
              <p className="mt-1 text-xs text-rose-400 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                {errors.categoryId}
              </p>
            )}
          </div>

          {/* Monthly Limit Input */}
          <div>
            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
              Monthly Limit *
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xl font-bold text-zinc-400">
                ₹
              </span>
              <input
                type="number"
                step="any"
                min="1"
                placeholder="e.g. 5000"
                value={limit}
                onChange={(e) => setLimit(e.target.value)}
                className={`w-full pl-9 pr-4 py-2.5 rounded-xl bg-zinc-950 border text-lg font-bold text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-2 ${
                  errors.limit
                    ? "border-rose-500/60 focus:ring-rose-500/40"
                    : "border-zinc-800 focus:ring-emerald-500/40 focus:border-emerald-500"
                }`}
                autoFocus
              />
            </div>
            {errors.limit && (
              <p className="mt-1 text-xs text-rose-400 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                {errors.limit}
              </p>
            )}
          </div>

          {/* Month Indicator */}
          <div className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800 text-xs text-zinc-400 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-zinc-500" />
              Target Month:
            </span>
            <span className="font-bold text-zinc-200">{formatMonthName(month)} ({month})</span>
          </div>

          {/* Actions Button */}
          <div className="pt-2 flex items-center gap-3">
            {isEditMode && onDelete && (
              <>
                {showDeleteConfirm ? (
                  <div className="flex items-center gap-2 flex-1">
                    <button
                      type="button"
                      disabled={isDeleting}
                      onClick={handleDelete}
                      className="flex-1 py-2.5 px-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer"
                    >
                      {isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Confirm Delete"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowDeleteConfirm(false)}
                      className="py-2.5 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(true)}
                    className="p-2.5 rounded-xl border border-rose-500/30 text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                    title="Delete budget"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                )}
              </>
            )}

            {!showDeleteConfirm && (
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-zinc-950 font-bold text-sm shadow-md shadow-emerald-500/20 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-zinc-950" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <span>{isEditMode ? "Save Changes" : "Set Budget"}</span>
                )}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
