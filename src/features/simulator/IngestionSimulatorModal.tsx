import React, { useState } from "react";
import {
  X,
  Play,
  Smartphone,
  MessageSquare,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Loader2
} from "lucide-react";
import { IncomingTransaction, IngestionResult } from "../../types/ingestion";
import { sendIncomingTransaction } from "../../api/ingestion";
import { formatCurrency } from "../../utils/currency";

interface IngestionSimulatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTransactionIngested: () => Promise<void>;
}

export const IngestionSimulatorModal: React.FC<IngestionSimulatorModalProps> = ({
  isOpen,
  onClose,
  onTransactionIngested
}) => {
  const [amount, setAmount] = useState<string>("450");
  const [merchant, setMerchant] = useState<string>("ZOMATO");
  const [source, setSource] = useState<"notification" | "sms" | "bank_api" | "import">("notification");
  const [paymentMethod, setPaymentMethod] = useState<any>("upi");
  const [extRef, setExtRef] = useState<string>(() => `UPI-${Math.floor(100000 + Math.random() * 900000)}`);
  const [rawDesc, setRawDesc] = useState<string>("Paid ₹450 to ZOMATO via Google Pay");
  const [sourceApp, setSourceApp] = useState<string>("com.google.android.apps.nbu.paisa.user");

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [result, setResult] = useState<IngestionResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  // Preset scenarios
  const applyPreset = (preset: "gpay_zomato" | "phonepe_uber" | "sms_amazon" | "unknown_abc") => {
    setError(null);
    setResult(null);
    if (preset === "gpay_zomato") {
      setAmount("450");
      setMerchant("ZOMATO");
      setSource("notification");
      setPaymentMethod("upi");
      const ref = `UPI-ZOMATO-${Math.floor(100000 + Math.random() * 900000)}`;
      setExtRef(ref);
      setRawDesc("Paid ₹450 to ZOMATO via Google Pay");
      setSourceApp("com.google.android.apps.nbu.paisa.user");
    } else if (preset === "phonepe_uber") {
      setAmount("320");
      setMerchant("UBER INDIA");
      setSource("notification");
      setPaymentMethod("upi");
      const ref = `UPI-UBER-${Math.floor(100000 + Math.random() * 900000)}`;
      setExtRef(ref);
      setRawDesc("Transferred ₹320 to Uber India via PhonePe");
      setSourceApp("com.phonepe.app");
    } else if (preset === "sms_amazon") {
      setAmount("1499");
      setMerchant("AMZN MKTP");
      setSource("sms");
      setPaymentMethod("credit_card");
      setExtRef(`TXN-${Date.now()}`);
      setRawDesc("Dear customer, your card ending 8812 debited for INR 1,499.00 at AMZN MKTP on 11-10-26");
      setSourceApp("com.android.mms");
    } else if (preset === "unknown_abc") {
      setAmount("780");
      setMerchant("ABC TRADERS");
      setSource("notification");
      setPaymentMethod("upi");
      setExtRef(`UPI-ABC-${Math.floor(100000 + Math.random() * 900000)}`);
      setRawDesc("Paid ₹780 to ABC TRADERS via UPI");
      setSourceApp("com.google.android.apps.nbu.paisa.user");
    }
  };

  const handleSimulate = async () => {
    setError(null);
    setResult(null);
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError("Please enter a valid amount");
      return;
    }

    const payload: IncomingTransaction = {
      source,
      amount: parsedAmount,
      type: "expense",
      merchant: merchant.trim() || undefined,
      rawDescription: rawDesc.trim() || undefined,
      timestamp: new Date().toISOString(),
      paymentMethod: paymentMethod || undefined,
      externalReference: extRef.trim() || undefined,
      sourceApp: sourceApp.trim() || undefined
    };

    setIsLoading(true);
    try {
      const res = await sendIncomingTransaction(payload);
      setResult(res);
      await onTransactionIngested();
    } catch (err: any) {
      setError(err?.message || "Failed to simulate transaction");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md rounded-3xl bg-zinc-900 border border-zinc-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-zinc-800/80">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-purple-500/15 text-purple-400 flex items-center justify-center font-bold text-xs">
              DEV
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-zinc-100">Ingestion Pipeline Simulator</h2>
              <p className="text-[11px] text-zinc-400">Simulate Android notifications & SMS</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 text-xs">
          {/* Quick Presets */}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block mb-1.5">
              Quick Test Presets
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={() => applyPreset("gpay_zomato")}
                className="p-2 rounded-xl bg-zinc-950 border border-zinc-800 hover:border-emerald-500/40 text-left transition-colors"
              >
                <span className="font-bold text-zinc-200 block">Zomato (₹450)</span>
                <span className="text-[10px] text-emerald-400">GPay • High Conf</span>
              </button>
              <button
                type="button"
                onClick={() => applyPreset("phonepe_uber")}
                className="p-2 rounded-xl bg-zinc-950 border border-zinc-800 hover:border-emerald-500/40 text-left transition-colors"
              >
                <span className="font-bold text-zinc-200 block">Uber (₹320)</span>
                <span className="text-[10px] text-emerald-400">PhonePe • High Conf</span>
              </button>
              <button
                type="button"
                onClick={() => applyPreset("sms_amazon")}
                className="p-2 rounded-xl bg-zinc-950 border border-zinc-800 hover:border-emerald-500/40 text-left transition-colors"
              >
                <span className="font-bold text-zinc-200 block">Amazon (₹1,499)</span>
                <span className="text-[10px] text-cyan-400">Bank SMS</span>
              </button>
              <button
                type="button"
                onClick={() => applyPreset("unknown_abc")}
                className="p-2 rounded-xl bg-zinc-950 border border-zinc-800 hover:border-amber-500/40 text-left transition-colors"
              >
                <span className="font-bold text-zinc-200 block">ABC Traders (₹780)</span>
                <span className="text-[10px] text-amber-400">Review Required</span>
              </button>
            </div>
          </div>

          {/* Form Fields */}
          <div className="space-y-2.5 pt-1">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block mb-1">
                  Amount (₹)
                </label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 font-bold"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block mb-1">
                  Source
                </label>
                <select
                  value={source}
                  onChange={(e) => setSource(e.target.value as any)}
                  className="w-full px-3 py-1.5 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 font-medium"
                >
                  <option value="notification">Notification</option>
                  <option value="sms">SMS</option>
                  <option value="bank_api">Bank API</option>
                  <option value="import">Import</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block mb-1">
                Merchant
              </label>
              <input
                type="text"
                value={merchant}
                onChange={(e) => setMerchant(e.target.value)}
                className="w-full px-3 py-1.5 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block mb-1">
                External Reference (Deduplication Key)
              </label>
              <input
                type="text"
                value={extRef}
                onChange={(e) => setExtRef(e.target.value)}
                className="w-full px-3 py-1.5 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 font-mono text-[11px]"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block mb-1">
                Raw Description (SMS or Notification text)
              </label>
              <textarea
                rows={2}
                value={rawDesc}
                onChange={(e) => setRawDesc(e.target.value)}
                className="w-full px-3 py-1.5 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 resize-none text-[11px]"
              />
            </div>
          </div>

          {/* Feedback Result */}
          {error && (
            <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-300">
              {error}
            </div>
          )}

          {result && (
            <div
              className={`p-3 rounded-xl border text-xs space-y-1 ${
                result.status === "created"
                  ? "bg-emerald-950/40 border-emerald-500/40 text-emerald-200"
                  : result.status === "duplicate"
                  ? "bg-zinc-800/60 border-zinc-700 text-zinc-300"
                  : "bg-amber-950/40 border-amber-500/40 text-amber-200"
              }`}
            >
              <div className="flex items-center justify-between font-bold">
                <span className="uppercase">Result: {result.status.replace("_", " ")}</span>
                <span>{Math.round((result.categorization.confidence || 0) * 100)}% Conf</span>
              </div>
              <p className="text-[11px] opacity-90">
                {result.categorization.reason || result.duplicateReason}
              </p>
              {result.transaction && (
                <p className="text-[10px] opacity-75">
                  Category: {result.transaction.categoryId} • Review: {result.reviewStatus}
                </p>
              )}
            </div>
          )}

          {/* Action Button */}
          <button
            type="button"
            disabled={isLoading}
            onClick={handleSimulate}
            className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Processing Ingestion Pipeline...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                <span>Send To Ingestion Pipeline</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
