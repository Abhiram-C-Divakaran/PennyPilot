import React, { useState, useEffect } from "react";
import {
  X,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Calendar,
  CreditCard,
  Building,
  FileText,
  Sparkles
} from "lucide-react";
import {
  FinanceTransaction,
  FinanceTransactionType,
  PaymentMethod,
  CreateTransactionInput,
  UpdateTransactionInput
} from "../../types/transaction";
import { TransactionCategory } from "../../types/category";
import { toDatetimeLocalInput, fromDatetimeLocalInput } from "../../utils/date";
import { CategoryIcon } from "./categoryIcon";

interface TransactionFormProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: FinanceTransaction | null;
  categories: TransactionCategory[];
  onSubmit: (data: CreateTransactionInput | UpdateTransactionInput) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
}

const PAYMENT_METHODS: { value: PaymentMethod; label: string }[] = [
  { value: "upi", label: "UPI" },
  { value: "cash", label: "Cash" },
  { value: "credit_card", label: "Credit Card" },
  { value: "debit_card", label: "Debit Card" },
  { value: "bank_transfer", label: "Bank Transfer" },
  { value: "wallet", label: "Wallet" },
  { value: "other", label: "Other" }
];

export const TransactionForm: React.FC<TransactionFormProps> = ({
  isOpen,
  onClose,
  initialData,
  categories,
  onSubmit,
  onDelete
}) => {
  const isEditMode = Boolean(initialData);

  const [type, setType] = useState<FinanceTransactionType>("expense");
  const [amount, setAmount] = useState<string>("");
  const [categoryId, setCategoryId] = useState<string>("");
  const [merchant, setMerchant] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | "">("upi");
  const [datetime, setDatetime] = useState<string>("");
  const [description, setDescription] = useState<string>("");

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showDetectionDetails, setShowDetectionDetails] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Filter categories by selected transaction type
  const matchingCategories = categories.filter((c) => c.type === type);

  // Sync form state when modal opens or initialData changes
  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setType(initialData.type);
        setAmount(String(initialData.amount));
        setCategoryId(initialData.categoryId);
        setMerchant(initialData.merchant || "");
        setPaymentMethod(initialData.paymentMethod || "");
        setDatetime(toDatetimeLocalInput(initialData.timestamp));
        setDescription(initialData.description || "");
      } else {
        // Reset to default new transaction state
        setType("expense");
        setAmount("");
        const defaultCat = categories.find((c) => c.type === "expense");
        setCategoryId(defaultCat ? defaultCat.id : "");
        setMerchant("");
        setPaymentMethod("upi");
        setDatetime(toDatetimeLocalInput());
        setDescription("");
      }
      setErrors({});
      setShowDeleteConfirm(false);
      setSuccessMessage(null);
    }
  }, [isOpen, initialData, categories]);

  // When type changes, ensure categoryId matches new type
  const handleTypeChange = (newType: FinanceTransactionType) => {
    setType(newType);
    const validCategory = categories.find((c) => c.type === newType);
    setCategoryId(validCategory ? validCategory.id : "");
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    const numAmount = parseFloat(amount);
    if (!amount || isNaN(numAmount)) {
      newErrors.amount = "Amount is required and must be a number";
    } else if (numAmount <= 0) {
      newErrors.amount = "Amount must be greater than zero";
    }

    if (!categoryId) {
      newErrors.categoryId = "Please select a category";
    } else {
      const selectedCat = categories.find((c) => c.id === categoryId);
      if (!selectedCat) {
        newErrors.categoryId = "Selected category does not exist";
      } else if (selectedCat.type !== type) {
        newErrors.categoryId = `Category must match ${type} type`;
      }
    }

    if (!datetime) {
      newErrors.datetime = "Please select date and time";
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

      const payload: CreateTransactionInput = {
        type,
        amount: parseFloat(amount),
        categoryId,
        merchant: merchant.trim() || undefined,
        paymentMethod: paymentMethod ? (paymentMethod as PaymentMethod) : undefined,
        timestamp: fromDatetimeLocalInput(datetime),
        description: description.trim() || undefined
      };

      await onSubmit(payload);
      setSuccessMessage(isEditMode ? "Transaction updated!" : "Transaction added!");

      setTimeout(() => {
        setIsSubmitting(false);
        onClose();
      }, 500);
    } catch (err: any) {
      setIsSubmitting(false);
      setErrors({ general: err.message || "Failed to save transaction" });
    }
  };

  const handleDelete = async () => {
    if (!initialData || !onDelete) return;

    try {
      setIsDeleting(true);
      await onDelete(initialData.id);
      setIsDeleting(false);
      onClose();
    } catch (err: any) {
      setIsDeleting(false);
      setErrors({ general: err.message || "Failed to delete transaction" });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-lg max-h-[92vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl bg-zinc-900 border border-zinc-800 shadow-2xl p-5 sm:p-6 text-zinc-100 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800/80 mb-4">
          <h2 className="text-lg font-bold text-zinc-100">
            {isEditMode ? "Edit Transaction" : "Add Transaction"}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors"
            aria-label="Close form"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* General Error Banner */}
        {errors.general && (
          <div className="mb-4 p-3 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-300 text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{errors.general}</span>
          </div>
        )}

        {/* Success Banner */}
        {successMessage && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-sm flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{successMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Transaction Type Segmented Toggle */}
          <div>
            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
              Transaction Type
            </label>
            <div className="grid grid-cols-2 p-1 rounded-xl bg-zinc-950 border border-zinc-800">
              <button
                type="button"
                onClick={() => handleTypeChange("expense")}
                className={`py-2 px-3 rounded-lg text-sm font-semibold transition-all ${
                  type === "expense"
                    ? "bg-rose-500/20 text-rose-400 border border-rose-500/40 shadow-sm"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                Expense
              </button>
              <button
                type="button"
                onClick={() => handleTypeChange("income")}
                className={`py-2 px-3 rounded-lg text-sm font-semibold transition-all ${
                  type === "income"
                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-sm"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                Income
              </button>
            </div>
          </div>

          {/* Amount Input */}
          <div>
            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
              Amount *
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xl font-bold text-zinc-400">
                ₹
              </span>
              <input
                type="number"
                step="any"
                min="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className={`w-full pl-9 pr-4 py-2.5 rounded-xl bg-zinc-950 border text-lg font-bold text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-2 ${
                  errors.amount
                    ? "border-rose-500/60 focus:ring-rose-500/40"
                    : "border-zinc-800 focus:ring-emerald-500/40 focus:border-emerald-500"
                }`}
                autoFocus={!isEditMode}
              />
            </div>
            {errors.amount && (
              <p className="mt-1 text-xs text-rose-400 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                {errors.amount}
              </p>
            )}
          </div>

          {/* Category Selector */}
          <div>
            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
              Category *
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-40 overflow-y-auto p-1.5 rounded-xl bg-zinc-950/60 border border-zinc-800/80">
              {matchingCategories.map((cat) => {
                const isSelected = categoryId === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategoryId(cat.id)}
                    className={`flex flex-col items-center justify-center p-2 rounded-xl text-center transition-all ${
                      isSelected
                        ? "bg-zinc-800 border-2 border-emerald-500 shadow-sm"
                        : "bg-zinc-900/60 hover:bg-zinc-800/50 border border-zinc-800/40 text-zinc-400"
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
            {errors.categoryId && (
              <p className="mt-1 text-xs text-rose-400 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                {errors.categoryId}
              </p>
            )}
          </div>

          {/* Merchant / Payee */}
          <div>
            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
              {type === "expense" ? "Merchant / Payee (Optional)" : "Source / Payer (Optional)"}
            </label>
            <div className="relative">
              <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input
                type="text"
                placeholder={type === "expense" ? "e.g. Zomato, Uber, Amazon" : "e.g. Monthly Payroll, Client"}
                value={merchant}
                onChange={(e) => setMerchant(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Payment Method & Date/Time Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Payment Method */}
            <div>
              <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
                Payment Method
              </label>
              <div className="relative">
                <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                  className="w-full pl-9 pr-8 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-sm text-zinc-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 appearance-none cursor-pointer"
                >
                  <option value="">None / Unspecified</option>
                  {PAYMENT_METHODS.map((pm) => (
                    <option key={pm.value} value={pm.value}>
                      {pm.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Date & Time */}
            <div>
              <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
                Date & Time *
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
                <input
                  type="datetime-local"
                  value={datetime}
                  onChange={(e) => setDatetime(e.target.value)}
                  className={`w-full pl-9 pr-3 py-2 rounded-xl bg-zinc-950 border text-sm text-zinc-200 focus:outline-none focus:ring-2 ${
                    errors.datetime
                      ? "border-rose-500/60 focus:ring-rose-500/40"
                      : "border-zinc-800 focus:ring-emerald-500/40 focus:border-emerald-500"
                  }`}
                />
              </div>
              {errors.datetime && (
                <p className="mt-1 text-xs text-rose-400 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  {errors.datetime}
                </p>
              )}
            </div>
          </div>

          {/* Description / Notes */}
          <div>
            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
              Description / Notes (Optional)
            </label>
            <div className="relative">
              <FileText className="absolute left-3 top-3 w-4 h-4 text-zinc-500" />
              <textarea
                rows={2}
                placeholder="Add any extra notes..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 resize-none"
              />
            </div>
          </div>

          {/* Automated Detection Metadata (Step 16) */}
          {isEditMode && initialData?.source && initialData.source !== "manual" && (
            <div className="p-3.5 rounded-2xl bg-zinc-950/70 border border-zinc-800 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 font-bold text-zinc-300">
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Detection Details</span>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 text-[10px] font-semibold uppercase">
                  {initialData.source}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                <div>
                  <span className="text-zinc-500 block">Detected Merchant:</span>
                  <span className="font-semibold text-zinc-200">
                    {initialData.merchantNormalized || initialData.merchant || "N/A"}
                  </span>
                </div>
                <div>
                  <span className="text-zinc-500 block">Category Confidence:</span>
                  <span className="font-semibold text-emerald-400">
                    {initialData.categoryConfidence !== undefined
                      ? `${Math.round(initialData.categoryConfidence * 100)}%`
                      : "N/A"}
                  </span>
                </div>
                {initialData.externalReference && (
                  <div className="col-span-2">
                    <span className="text-zinc-500 block">Reference:</span>
                    <span className="font-mono text-zinc-300 text-[10px]">
                      {initialData.externalReference.length > 8
                        ? `${initialData.externalReference.slice(0, 3)}•••${initialData.externalReference.slice(-4)}`
                        : initialData.externalReference}
                    </span>
                  </div>
                )}
              </div>

              {initialData.rawDescription && (
                <div className="pt-1.5 border-t border-zinc-800/80">
                  <button
                    type="button"
                    onClick={() => setShowDetectionDetails(!showDetectionDetails)}
                    className="text-[10px] text-zinc-400 hover:text-zinc-200 underline cursor-pointer"
                  >
                    {showDetectionDetails ? "Hide Raw Text" : "View Raw Source Text"}
                  </button>
                  {showDetectionDetails && (
                    <p className="mt-1 p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-[10px] font-mono text-zinc-400 break-all leading-relaxed">
                      {initialData.rawDescription}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

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
                      className="flex-1 py-2.5 px-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all flex items-center justify-center gap-1"
                    >
                      {isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Confirm Delete"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowDeleteConfirm(false)}
                      className="py-2.5 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(true)}
                    className="p-2.5 rounded-xl border border-rose-500/30 text-rose-400 hover:bg-rose-500/10 transition-colors"
                    title="Delete transaction"
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
                  <span>{isEditMode ? "Save Changes" : "Add Transaction"}</span>
                )}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
