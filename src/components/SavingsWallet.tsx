import React, { useState } from "react";
import { PlusCircle, ArrowUpRight, Cpu, ArrowDownLeft, Calendar, Filter, Sparkles, AlertCircle, X, ShieldCheck } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Wallet, WalletTransaction } from "../types";

interface SavingsWalletProps {
  wallet: Wallet;
  currency: string;
  onDeposit: (amount: number) => void;
  onWithdraw: (amount: number) => void;
  error?: string;
}

export default function SavingsWallet({ wallet, currency, onDeposit, onWithdraw, error }: SavingsWalletProps) {
  const [depositAmount, setDepositAmount] = useState<string>("");
  const [withdrawAmount, setWithdrawAmount] = useState<string>("");
  const [activeFilter, setActiveFilter] = useState<string>("all");

  const [showRazorpayModal, setShowRazorpayModal] = useState(false);
  const [showGPayModal, setShowGPayModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleDepositSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = Number(depositAmount);
    if (!isNaN(amount) && amount > 0) {
      setShowRazorpayModal(true);
    }
  };

  const handleWithdrawSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = Number(withdrawAmount);
    if (!isNaN(amount) && amount > 0 && amount <= wallet.balance) {
      setShowGPayModal(true);
    }
  };

  const processRazorpay = () => {
    setIsProcessing(true);
    setTimeout(() => {
      onDeposit(Number(depositAmount));
      setDepositAmount("");
      setIsProcessing(false);
      setShowRazorpayModal(false);
    }, 1500);
  };

  const processGPay = () => {
    setIsProcessing(true);
    setTimeout(() => {
      onWithdraw(Number(withdrawAmount));
      setWithdrawAmount("");
      setIsProcessing(false);
      setShowGPayModal(false);
    }, 1500);
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case "deposit":
        return <ArrowDownLeft className="h-4 w-4 text-emerald-400" />;
      case "withdrawal":
        return <ArrowUpRight className="h-4 w-4 text-amber-400" />;
      case "auto_save":
        return <Cpu className="h-4 w-4 text-cyan-400" />;
      default:
        return <PlusCircle className="h-4 w-4 text-emerald-500" />;
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case "deposit":
        return "text-emerald-400";
      case "withdrawal":
        return "text-amber-400";
      case "auto_save":
        return "text-cyan-400";
      default:
        return "text-slate-300";
    }
  };

  const getTransactionBg = (type: string) => {
    switch (type) {
      case "deposit":
        return "bg-emerald-500/10 border-emerald-500/10";
      case "withdrawal":
        return "bg-amber-500/10 border-amber-500/10";
      case "auto_save":
        return "bg-cyan-500/10 border-cyan-500/10";
      default:
        return "bg-slate-900 border-slate-800";
    }
  };

  // Filter Transactions
  const filteredTransactions = wallet.transactions.filter((tx) => {
    if (activeFilter === "all") return true;
    if (activeFilter === "deposits") return tx.type === "deposit";
    if (activeFilter === "saves") return tx.type === "auto_save" || tx.type === "manual_save";
    if (activeFilter === "withdrawals") return tx.type === "withdrawal";
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Balance Card */}
      <div className="glass-panel p-6 rounded-3xl relative overflow-hidden shadow-2xl">
        {/* Background Accent Sphere */}
        <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
        <div className="absolute -left-16 -bottom-16 h-48 w-48 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
          <div>
            <span className="text-[10px] text-slate-400 font-mono tracking-widest uppercase">Digital Savings Wallet</span>
            <h2 className="text-4xl font-display font-extrabold text-slate-100 tracking-tight mt-1.5">
              {currency}
              {wallet.balance.toLocaleString(undefined, { minimumFractionDigits: 0 })}
            </h2>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              This wallet serves as your personal automated holding tank. Load money from your bank account to fuel active savings goals, or withdraw completed savings instantly.
            </p>
          </div>

          {/* Quick Actions */}
          <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-850">
            <div className="flex gap-2 mb-3">
              <button
                className="flex-1 py-1.5 text-xs font-semibold rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
              >
                Add Funds
              </button>
            </div>
            
            <form onSubmit={handleDepositSubmit} className="space-y-3">
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-mono text-sm text-slate-500">
                  {currency}
                </span>
                <input
                  type="number"
                  placeholder="0.00"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 focus:border-emerald-500/40 rounded-xl py-2 pl-8 pr-4 text-sm font-semibold focus:outline-none focus:ring-0 transition-colors"
                />
              </div>

              {error && (
                <div className="p-2.5 bg-rose-500/10 border border-rose-500/20 text-[11px] text-rose-400 rounded-lg flex items-start gap-1.5">
                  <AlertCircle className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={!depositAmount || Number(depositAmount) <= 0}
                className="w-full py-2 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-900 disabled:text-slate-600 text-emerald-400 font-bold text-xs rounded-xl transition-colors border border-emerald-500/30 flex items-center justify-center gap-2 cursor-pointer"
              >
                Deposit via Razorpay <ArrowDownLeft className="h-3.5 w-3.5" />
              </button>
            </form>

            <form onSubmit={handleWithdrawSubmit} className="space-y-3 mt-4 pt-4 border-t border-slate-900">
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-mono text-sm text-slate-500">
                  {currency}
                </span>
                <input
                  type="number"
                  placeholder="Withdraw Amount"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 focus:border-amber-500/40 rounded-xl py-2 pl-8 pr-4 text-sm font-semibold focus:outline-none focus:ring-0 transition-colors"
                />
              </div>

              <button
                type="submit"
                disabled={!withdrawAmount || Number(withdrawAmount) <= 0 || Number(withdrawAmount) > wallet.balance}
                className="w-full py-2 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-900 disabled:text-slate-600 text-amber-400 font-bold text-xs rounded-xl transition-colors border border-amber-500/30 flex items-center justify-center gap-2 cursor-pointer"
              >
                Withdraw to GPay <ArrowUpRight className="h-3.5 w-3.5" />
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Transaction History Logs */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h3 className="font-display font-bold text-lg text-slate-200">Transaction History</h3>
          
          {/* Filters */}
          <div className="flex items-center space-x-1 bg-slate-900 p-1 rounded-xl border border-slate-800 max-w-max self-start sm:self-auto">
            {["all", "deposits", "saves", "withdrawals"].map((f) => (
              <button
                key={f}
                onClick={() => setActiveFilter(f)}
                className={`px-3 py-1 text-[11px] font-medium rounded-lg capitalize transition-colors ${
                  activeFilter === f
                    ? "bg-slate-800 text-slate-100"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        <div className="glass-panel rounded-2xl overflow-hidden divide-y divide-slate-900 border border-slate-800/80">
          {filteredTransactions.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500 font-sans">
              No transactions matching selection.
            </div>
          ) : (
            filteredTransactions.map((tx) => (
              <motion.div
                layout
                key={tx.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="p-4 flex items-center justify-between hover:bg-slate-900/30 transition-colors"
              >
                <div className="flex items-center space-x-3 min-w-0">
                  <div className={`h-8 w-8 rounded-xl border flex items-center justify-center flex-shrink-0 ${getTransactionBg(tx.type)}`}>
                    {getTransactionIcon(tx.type)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-200 truncate">{tx.description}</p>
                    <div className="flex items-center space-x-2 text-[10px] text-slate-500 font-mono mt-0.5">
                      <span className="capitalize">{tx.type.replace("_", " ")}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(tx.date).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit"
                        })}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-right flex-shrink-0 ml-4">
                  <span className={`text-sm font-mono font-bold ${getTransactionColor(tx.type)}`}>
                    {tx.type === "withdrawal" || tx.type === "auto_save" || tx.type === "manual_save" ? "-" : "+"}
                    {currency}
                    {tx.amount.toLocaleString(undefined, { minimumFractionDigits: 0 })}
                  </span>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>

      <AnimatePresence>
        {showRazorpayModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-sm bg-white rounded-xl overflow-hidden shadow-2xl shadow-emerald-500/20"
            >
              <div className="p-4 bg-[#02042A] text-white flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-blue-500 rounded flex items-center justify-center font-bold text-xs">D</div>
                  <span className="font-semibold text-sm">Demo Deposit</span>
                </div>
                <button onClick={() => setShowRazorpayModal(false)} className="text-white/70 hover:text-white cursor-pointer">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="p-6 text-center text-slate-800">
                <h4 className="text-lg font-bold mb-1">PennyPilot Simulation Wallet</h4>
                <p className="text-xs text-amber-600 font-medium mb-3">Simulation Mode • Demo Funds Only</p>
                <p className="text-2xl font-bold text-[#02042A] mb-6">
                  {currency}{Number(depositAmount).toLocaleString()}
                </p>
                <button
                  onClick={processRazorpay}
                  disabled={isProcessing}
                  className="w-full py-3 bg-[#3395FF] hover:bg-[#2080ea] text-white font-bold rounded flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-70"
                >
                  {isProcessing ? "Adding Demo Funds..." : "Confirm Demo Deposit"}
                </button>
                <p className="text-[10px] text-slate-500 mt-4 flex items-center justify-center gap-1">
                  <ShieldCheck className="h-3 w-3" /> Simulated wallet balance for savings goals
                </p>
              </div>
            </motion.div>
          </div>
        )}

        {showGPayModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl shadow-amber-500/20"
            >
              <div className="p-6">
                <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center gap-2 text-slate-100">
                    <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold text-xs">DEMO</span>
                    <span className="font-semibold text-sm">Demo Withdrawal</span>
                  </div>
                  <button onClick={() => setShowGPayModal(false)} className="text-slate-500 hover:text-slate-300 cursor-pointer">
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <div className="text-center mb-6">
                  <p className="text-xs text-slate-400 mb-1">Simulated Withdrawal</p>
                  <p className="text-3xl font-bold text-amber-400">
                    {currency}{Number(withdrawAmount).toLocaleString()}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">Simulation Mode • No actual money transferred</p>
                </div>
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 mb-6 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 bg-slate-800 rounded-full flex items-center justify-center">
                      <span className="text-xs font-bold text-slate-400">SBI</span>
                    </div>
                    <div className="text-left">
                      <p className="text-xs font-semibold text-slate-200">Demo Account</p>
                      <p className="text-[10px] text-slate-500">**** 4392</p>
                    </div>
                  </div>
                </div>
                <button
                  onClick={processGPay}
                  disabled={isProcessing}
                  className="w-full py-3 bg-white text-slate-900 hover:bg-slate-200 font-bold rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-70"
                >
                  {isProcessing ? "Processing Demo Transfer..." : "Confirm Demo Withdrawal"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
