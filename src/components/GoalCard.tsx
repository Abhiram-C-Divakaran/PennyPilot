import React, { useState } from "react";
import { Plane, ShoppingBag, GraduationCap, ShieldAlert, Target, Calendar, ArrowUpRight, TrendingUp, Sparkles, Check, Download } from "lucide-react";
import { motion } from "motion/react";
import { SavingsGoal } from "../types";

interface GoalCardProps {
  key?: string;
  goal: SavingsGoal;
  currency: string;
  onQuickSave: (goalId: string, amount: number, source?: string) => void;
  onWithdraw: (goalId: string) => void;
  onSelect: (goal: SavingsGoal) => void;
  onVerifyPending?: (goalId: string) => void;
}

export default function GoalCard({
  goal,
  currency,
  onQuickSave,
  onWithdraw,
  onSelect,
  onVerifyPending
}: GoalCardProps) {
  const [quickSaveAmount, setQuickSaveAmount] = useState<string>("");
  const [isHovered, setIsHovered] = useState(false);
  const [showSourceSelector, setShowSourceSelector] = useState(false);
  const [largeAmount, setLargeAmount] = useState<number>(0);

  const percent = Math.min(100, Math.round((goal.currentSavings / goal.targetAmount) * 100));
  const remaining = Math.max(0, goal.targetAmount - goal.currentSavings);

  // Category Icon Resolver
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "Travel":
        return <Plane className="h-4 w-4 text-cyan-400" />;
      case "Shopping":
        return <ShoppingBag className="h-4 w-4 text-amber-400" />;
      case "Education":
        return <GraduationCap className="h-4 w-4 text-indigo-400" />;
      case "Emergency":
        return <ShieldAlert className="h-4 w-4 text-rose-400" />;
      default:
        return <Target className="h-4 w-4 text-emerald-400" />;
    }
  };

  const getCategoryColorClass = (category: string) => {
    switch (category) {
      case "Travel":
        return "bg-cyan-500/10 text-cyan-400 border-cyan-500/20";
      case "Shopping":
        return "bg-amber-500/10 text-amber-400 border-amber-500/20";
      case "Education":
        return "bg-indigo-500/10 text-indigo-400 border-indigo-500/20";
      case "Emergency":
        return "bg-rose-500/10 text-rose-400 border-rose-500/20";
      default:
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
    }
  };

  // Estimate completion date based on auto-save schedule
  const getEstimateText = () => {
    if (goal.status !== "active") return null;
    if (goal.autoSaveAmount <= 0 || goal.autoSaveFrequency === "none") {
      return "Manual savings";
    }

    const remainingAmount = goal.targetAmount - goal.currentSavings;
    if (remainingAmount <= 0) return "Fully saved!";

    let cyclesRemaining = Math.ceil(remainingAmount / goal.autoSaveAmount);
    const currentDate = new Date("2026-07-19T09:43:18-07:00");

    if (goal.autoSaveFrequency === "daily") {
      currentDate.setDate(currentDate.getDate() + cyclesRemaining);
    } else if (goal.autoSaveFrequency === "weekly") {
      currentDate.setDate(currentDate.getDate() + cyclesRemaining * 7);
    } else if (goal.autoSaveFrequency === "monthly") {
      currentDate.setMonth(currentDate.getMonth() + cyclesRemaining);
    }

    return `Estimated: ${currentDate.toLocaleDateString(undefined, {
      month: "short",
      year: "numeric"
    })}`;
  };

  const getDaysRemainingText = () => {
    if (!goal.targetDate) return "";
    const diffTime = new Date(goal.targetDate).getTime() - new Date("2026-07-19").getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays <= 0) return "Deadline passed";
    return `${diffDays} days remaining`;
  };

  const getVelocityText = () => {
    if (!goal.targetDate) return "";
    const diffTime = new Date(goal.targetDate).getTime() - new Date("2026-07-19").getTime();
    const diffDays = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
    const remainingAmount = goal.targetAmount - goal.currentSavings;
    
    if (remainingAmount <= 0) return "Completed!";
    
    if (diffDays >= 30) {
      const months = diffDays / 30.4;
      const monthlyRate = Math.round(remainingAmount / months);
      return `${currency}${monthlyRate.toLocaleString()}/month`;
    } else if (diffDays >= 7) {
      const weeks = diffDays / 7;
      const weeklyRate = Math.round(remainingAmount / weeks);
      return `${currency}${weeklyRate.toLocaleString()}/week`;
    } else {
      const dailyRate = Math.round(remainingAmount / diffDays);
      return `${currency}${dailyRate.toLocaleString()}/day`;
    }
  };

  const handleQuickSaveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = Number(quickSaveAmount);
    if (!isNaN(amount) && amount > 0) {
      const isLarge = amount > (goal.dailyRecommended || 333) * 10 || amount > 2000;
      if (isLarge) {
        setLargeAmount(amount);
        setShowSourceSelector(true);
      } else {
        onQuickSave(goal.id, amount);
        setQuickSaveAmount("");
      }
    }
  };

  const handleSourceSelect = (source: string) => {
    onQuickSave(goal.id, largeAmount, source);
    setQuickSaveAmount("");
    setLargeAmount(0);
    setShowSourceSelector(false);
  };

  const handleBypassSource = () => {
    onQuickSave(goal.id, largeAmount);
    setQuickSaveAmount("");
    setLargeAmount(0);
    setShowSourceSelector(false);
  };

  return (
    <motion.div
      layout
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="glass-panel glass-panel-hover rounded-2xl overflow-hidden shadow-xl flex flex-col relative"
    >
      {/* Background Banner with gradient overlay */}
      <div className="h-32 w-full relative bg-slate-900 flex-shrink-0">
        {goal.imageUrl ? (
          <img
            src={goal.imageUrl}
            alt={goal.name}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover opacity-45 transition-transform duration-500 hover:scale-105"
            onError={(e) => {
              // Fallback if image fails
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-tr from-slate-900 to-slate-800" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />

        {/* Category Badge */}
        <div className="absolute top-3 left-3 flex space-x-1.5 items-center z-10">
          <span className={`px-2.5 py-1 rounded-full text-[11px] font-medium border flex items-center gap-1.5 ${getCategoryColorClass(goal.category)}`}>
            {getCategoryIcon(goal.category)}
            {goal.category}
          </span>
          {goal.autoSaveAmount > 0 && (
            <span className="px-2.5 py-1 rounded-full text-[11px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              Auto
            </span>
          )}
          <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase border ${
            goal.priority === "high"
              ? "bg-rose-500/15 text-rose-400 border-rose-500/20"
              : goal.priority === "low"
                ? "bg-slate-800 text-slate-400 border-slate-700"
                : "bg-amber-500/15 text-amber-400 border-amber-500/20"
          }`}>
            {goal.priority || "medium"}
          </span>
        </div>

        {/* Status Indicator */}
        <div className="absolute top-3 right-3">
          {goal.status === "completed" && (
            <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20 flex items-center gap-1">
              <Check className="h-3.5 w-3.5 stroke-[3px]" /> Ready
            </span>
          )}
          {goal.status === "withdrawn" && (
            <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-800 text-slate-400 border border-slate-700 flex items-center gap-1">
              Withdrawn
            </span>
          )}
        </div>

        {/* Goal Title */}
        <div className="absolute bottom-3 left-4 right-4">
          <h3
            onClick={() => onSelect(goal)}
            className="font-display font-bold text-lg text-slate-100 hover:text-emerald-400 transition-colors cursor-pointer leading-tight truncate"
          >
            {goal.name}
          </h3>
        </div>
      </div>

      {/* Card Content */}
      <div className="p-4 flex-grow flex flex-col justify-between">
        {/* Progress & Numbers */}
        <div>
          <div className="flex justify-between items-end mb-2">
            <div>
              <p className="text-[10px] text-slate-400 font-mono tracking-widest uppercase">Saved So Far</p>
              <p className="text-xl font-display font-semibold text-slate-100">
                {currency}
                {goal.currentSavings.toLocaleString(undefined, { minimumFractionDigits: 0 })}
                <span className="text-xs font-normal text-slate-400 ml-1.5">
                  of {currency}
                  {goal.targetAmount.toLocaleString(undefined, { minimumFractionDigits: 0 })}
                </span>
              </p>
              <div className="mt-1 flex flex-col gap-0.5">
                <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1 font-sans">
                  🛡️ Verified: {currency}{(goal.verifiedSavings !== undefined ? goal.verifiedSavings : goal.currentSavings).toLocaleString()}
                </span>
                {goal.unverifiedSavingsPending && goal.unverifiedSavingsPending > 0 ? (
                  <div className="flex flex-col gap-1 mt-0.5">
                    <span className="text-[11px] text-amber-400 font-sans flex items-center gap-1">
                      ⏳ Unverified pending: {currency}{goal.unverifiedSavingsPending.toLocaleString()}
                    </span>
                    {onVerifyPending && (
                      <button
                        type="button"
                        onClick={() => onVerifyPending(goal.id)}
                        className="self-start px-2 py-0.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 text-[9px] font-bold uppercase rounded border border-amber-500/20 transition-all mt-0.5 cursor-pointer"
                      >
                        Verify Now
                      </button>
                    )}
                  </div>
                ) : null}
              </div>
            </div>
            <div className="text-right">
              <span className="text-2xl font-display font-bold text-emerald-400">{percent}%</span>
            </div>
          </div>

          {/* Progress bar: ████████░░ 75% */}
          <div className="h-2.5 w-full bg-slate-900 rounded-full overflow-hidden border border-slate-800/60 p-[1px] mb-3">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${percent}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className={`h-full rounded-full ${
                goal.status === "completed"
                  ? "bg-gradient-to-r from-emerald-500 to-teal-400 shadow-[0_0_10px_rgba(16,185,129,0.3)]"
                  : "bg-gradient-to-r from-emerald-500 to-cyan-400"
              }`}
            />
          </div>

          {/* Meta Info row */}
          <div className="grid grid-cols-2 gap-2 border-t border-slate-900 pt-3 mb-3">
            <div>
              <p className="text-[9px] text-slate-500 font-mono uppercase tracking-widest">Remaining</p>
              <p className="text-sm font-semibold text-slate-200">
                {remaining > 0
                  ? `${currency}${remaining.toLocaleString(undefined, { minimumFractionDigits: 0 })}`
                  : "Completed"}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[9px] text-slate-500 font-mono uppercase tracking-widest">Schedule Plan</p>
              <p className="text-xs text-slate-300 font-medium flex items-center justify-end gap-1 mt-0.5">
                <Calendar className="h-3 w-3 text-cyan-400" />
                {getEstimateText() || "Target reached"}
              </p>
            </div>
          </div>

          {/* Velocity Forecast Pill */}
          {goal.targetDate && remaining > 0 && (
            <div className="p-2.5 bg-slate-950/70 rounded-xl border border-slate-900/60 text-[10px] text-slate-400 flex flex-col gap-1 mb-4">
              <div className="flex justify-between font-sans">
                <span className="text-slate-500">Savings Rate:</span>
                <span className="text-cyan-400 font-bold font-mono">{getVelocityText()}</span>
              </div>
              <div className="flex justify-between text-[9px] text-slate-500">
                <span>Timeline target:</span>
                <span className="font-medium">{getDaysRemainingText()}</span>
              </div>
              <div className="flex justify-between text-[9px] text-slate-500 border-t border-slate-900/50 mt-1 pt-1">
                <span>Recommended Saving:</span>
                <span className="font-semibold text-slate-300 font-mono">{currency}{(goal.dailyRecommended || 333).toLocaleString()}/day</span>
              </div>
              <div className="flex justify-between text-[9px] text-slate-500">
                <span>Verification Limit:</span>
                <span className="font-semibold text-amber-400 font-mono">{currency}{(goal.dailyLimit || 500).toLocaleString()}/day</span>
              </div>
            </div>
          )}
        </div>

        {/* Dynamic Actions */}
        <div className="mt-2 pt-2 border-t border-slate-900/60">
          {goal.status === "active" && !showSourceSelector && (
            <form onSubmit={handleQuickSaveSubmit} className="flex space-x-2">
              <div className="relative flex-grow">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-mono text-slate-500">
                  {currency}
                </span>
                <input
                  type="number"
                  placeholder="Save sum"
                  value={quickSaveAmount}
                  onChange={(e) => setQuickSaveAmount(e.target.value)}
                  className="w-full bg-slate-950/80 border border-slate-800/80 focus:border-emerald-500/40 rounded-xl py-1.5 pl-7 pr-3 text-xs text-slate-200 placeholder-slate-600 focus:outline-none transition-all"
                />
              </div>
              <button
                type="submit"
                disabled={!quickSaveAmount || Number(quickSaveAmount) <= 0}
                className="bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-900 disabled:text-slate-600 text-slate-950 text-xs font-semibold px-3 py-1.5 rounded-xl transition-all flex items-center justify-center space-x-1 cursor-pointer"
              >
                <span>Add</span>
                <ArrowUpRight className="h-3.5 w-3.5" />
              </button>
            </form>
          )}

          {goal.status === "active" && showSourceSelector && (
            <div className="p-3 bg-slate-950 border border-amber-500/30 rounded-xl mt-2 text-xs flex flex-col gap-2">
              <p className="font-medium text-amber-400 flex items-center gap-1.5">
                <ShieldAlert className="h-4 w-4" />
                Large Deposit Verification
              </p>
              <p className="text-[11px] text-slate-400">
                Depositing {currency}{largeAmount.toLocaleString()} is large. Select funding source to maintain your Saver Score:
              </p>
              <div className="flex flex-wrap gap-1">
                {["Salary", "Bonus", "Gift", "Transfer", "Other"].map((src) => (
                  <button
                    key={src}
                    type="button"
                    onClick={() => handleSourceSelect(src)}
                    className="px-2 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 rounded text-[10px] font-medium transition-all cursor-pointer"
                  >
                    {src}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={handleBypassSource}
                  className="px-2 py-1 bg-slate-900 hover:bg-slate-800 text-slate-400 border border-slate-800 rounded text-[10px] transition-all cursor-pointer"
                >
                  Skip (Unverified)
                </button>
              </div>
            </div>
          )}

          {goal.status === "completed" && (
            <button
              onClick={() => onWithdraw(goal.id)}
              className="w-full py-2 bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-bold text-xs rounded-xl transition-all flex items-center justify-center space-x-2 shadow-lg shadow-emerald-500/10"
            >
              <Download className="h-4 w-4 stroke-[2.5px]" />
              <span>Withdraw to Wallet</span>
              <Sparkles className="h-3.5 w-3.5 fill-slate-950 animate-bounce" />
            </button>
          )}

          {goal.status === "withdrawn" && (
            <div className="w-full text-center py-2 text-slate-500 text-xs font-medium font-sans bg-slate-900/30 rounded-xl border border-slate-900">
              Funds withdrawn to main Wallet
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
