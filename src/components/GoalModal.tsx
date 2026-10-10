import React, { useState } from "react";
import { X, Sparkles, Image, Shield, Calendar, TrendingUp, AlertTriangle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { GoalCategory, AutoSaveFrequency, GoalPriority } from "../types";

interface GoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (goalData: {
    name: string;
    targetAmount: number;
    currentSavings: number;
    targetDate?: string;
    category: GoalCategory;
    imageUrl?: string;
    autoSaveAmount: number;
    autoSaveFrequency: AutoSaveFrequency;
    priority: GoalPriority;
  }) => void;
  currency: string;
}

export default function GoalModal({ isOpen, onClose, onSubmit, currency }: GoalModalProps) {
  const [name, setName] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [currentSavings, setCurrentSavings] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [category, setCategory] = useState<GoalCategory>("Other");
  const [imageUrl, setImageUrl] = useState("");
  const [autoSaveAmount, setAutoSaveAmount] = useState("");
  const [autoSaveFrequency, setAutoSaveFrequency] = useState<AutoSaveFrequency>("none");
  const [priority, setPriority] = useState<GoalPriority>("medium");

  // Premium stock cover presets
  const presets = [
    { name: "Rolex Watch", url: "https://images.unsplash.com/photo-1547996160-81dfa63595aa?w=500&auto=format&fit=crop&q=60" },
    { name: "Japan Scenery", url: "https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=500&auto=format&fit=crop&q=60" },
    { name: "Education", url: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=500&auto=format&fit=crop&q=60" },
    { name: "House / Vault", url: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=500&auto=format&fit=crop&q=60" },
    { name: "Sports Car", url: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=500&auto=format&fit=crop&q=60" }
  ];

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !targetAmount) return;

    onSubmit({
      name: name.trim(),
      targetAmount: Number(targetAmount),
      currentSavings: Number(currentSavings || 0),
      targetDate: targetDate || undefined,
      category,
      imageUrl: imageUrl || presets[idxForDefaultCategory()].url,
      autoSaveAmount: autoSaveFrequency !== "none" ? Number(autoSaveAmount || 0) : 0,
      autoSaveFrequency,
      priority
    });

    // Reset state
    setName("");
    setTargetAmount("");
    setCurrentSavings("");
    setTargetDate("");
    setCategory("Other");
    setImageUrl("");
    setAutoSaveAmount("");
    setAutoSaveFrequency("none");
    setPriority("medium");
    onClose();
  };

  const idxForDefaultCategory = () => {
    if (category === "Travel") return 1;
    if (category === "Education") return 2;
    if (category === "Emergency") return 3;
    if (category === "Shopping") return 0;
    return 4;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 15 }}
            transition={{ type: "spring", damping: 25, stiffness: 350 }}
            className="relative w-full max-w-lg rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden z-10"
          >
            {/* Header */}
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/20">
              <h3 className="font-display font-bold text-base text-slate-100 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-emerald-400" /> Define New Savings Goal
              </h3>
              <button
                onClick={onClose}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleFormSubmit} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-3">
                {/* Name */}
                <div className="col-span-2">
                  <label className="block text-[10px] text-slate-400 font-mono tracking-widest uppercase mb-1">
                    What are you saving for? *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Vacation to Hawaii, Buy New Laptop"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500/40 rounded-xl px-3 py-2 text-xs focus:outline-none transition-colors"
                  />
                </div>

                {/* Category selection */}
                <div>
                  <label className="block text-[10px] text-slate-400 font-mono tracking-widest uppercase mb-1">
                    Goal Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as GoalCategory)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500/40 rounded-xl px-3 py-2 text-xs focus:outline-none text-slate-300 transition-colors"
                  >
                    <option value="Shopping">Shopping</option>
                    <option value="Travel">Travel</option>
                    <option value="Education">Education</option>
                    <option value="Emergency">Emergency</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                {/* Priority Level */}
                <div>
                  <label className="block text-[10px] text-slate-400 font-mono tracking-widest uppercase mb-1">
                    Priority Level
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as GoalPriority)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500/40 rounded-xl px-3 py-2 text-xs focus:outline-none text-slate-300 transition-colors"
                  >
                    <option value="high">🔥 High</option>
                    <option value="medium">⚡ Medium</option>
                    <option value="low">💤 Low</option>
                  </select>
                </div>

                {/* Target Date */}
                <div className="col-span-2">
                  <label className="block text-[10px] text-slate-400 font-mono tracking-widest uppercase mb-1 flex items-center gap-1">
                    <Calendar className="h-3 w-3" /> Target Completion Date (Optional)
                  </label>
                  <input
                    type="date"
                    value={targetDate}
                    onChange={(e) => setTargetDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500/40 rounded-xl px-3 py-1.5 text-xs focus:outline-none text-slate-300 transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Target Amount */}
                <div>
                  <label className="block text-[10px] text-slate-400 font-mono tracking-widest uppercase mb-1">
                    Target Amount ({currency}) *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="e.g. 50000"
                    value={targetAmount}
                    onChange={(e) => setTargetAmount(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500/40 rounded-xl px-3 py-2 text-xs focus:outline-none font-mono text-emerald-400 font-semibold"
                  />
                </div>

                {/* Initial Savings */}
                <div>
                  <label className="block text-[10px] text-slate-400 font-mono tracking-widest uppercase mb-1">
                    Starting Savings ({currency})
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 5000"
                    value={currentSavings}
                    onChange={(e) => setCurrentSavings(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500/40 rounded-xl px-3 py-2 text-xs focus:outline-none font-mono text-cyan-400"
                  />
                </div>
              </div>

              {/* Cover Image Selector */}
              <div className="space-y-2">
                <label className="block text-[10px] text-slate-400 font-mono tracking-widest uppercase mb-1 flex items-center gap-1">
                  <Image className="h-3 w-3" /> Cover Theme Image
                </label>
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {presets.map((p, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => setImageUrl(p.url)}
                      className={`h-11 w-18 flex-shrink-0 rounded-lg overflow-hidden border relative transition-all ${
                        imageUrl === p.url ? "border-emerald-500 scale-102" : "border-slate-800 opacity-60 hover:opacity-100"
                      }`}
                    >
                      <img src={p.url} alt={p.name} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
                <input
                  type="url"
                  placeholder="Or paste custom image web link (Unsplash, etc.)"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500/40 rounded-xl px-3 py-2 text-[10px] focus:outline-none text-slate-400 transition-colors"
                />
              </div>

              {/* Automatic savings scheduler */}
              <div className="p-3 bg-slate-950/60 rounded-2xl border border-slate-850 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                    <TrendingUp className="h-3.5 w-3.5 text-emerald-400" /> Automated Schedule Plan
                  </h4>
                  <span className="text-[9px] font-mono bg-cyan-500/10 text-cyan-400 border border-cyan-500/10 px-2 py-0.5 rounded">
                    Smart Lock
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-[9px] text-slate-500 font-mono uppercase mb-1">
                      Save Frequency
                    </label>
                    <select
                      value={autoSaveFrequency}
                      onChange={(e) => setAutoSaveFrequency(e.target.value as AutoSaveFrequency)}
                      className="w-full bg-slate-900 border border-slate-800 focus:border-emerald-500/40 rounded-xl px-2 py-1.5 text-xs text-slate-300 focus:outline-none"
                    >
                      <option value="none">Manual Only</option>
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                    </select>
                  </div>

                  {autoSaveFrequency !== "none" && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                    >
                      <label className="block text-[9px] text-slate-500 font-mono uppercase mb-1">
                        Amount to Save ({currency})
                      </label>
                      <input
                        type="number"
                        required
                        min="1"
                        placeholder="e.g. 500"
                        value={autoSaveAmount}
                        onChange={(e) => setAutoSaveAmount(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 focus:border-emerald-500/40 rounded-xl px-2.5 py-1.5 text-xs text-emerald-400 font-semibold focus:outline-none font-mono"
                      />
                    </motion.div>
                  )}
                </div>

                {autoSaveFrequency !== "none" && (
                  <p className="text-[10px] text-slate-500 font-sans leading-relaxed">
                    PennyPilot will auto-transfer **{currency}{autoSaveAmount || "0"}** periodically from your digital wallet directly into this savings pool.
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3 pt-3 border-t border-slate-800/60">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-1/2 py-2.5 border border-slate-800 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-xl text-xs font-semibold transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2.5 bg-gradient-to-r from-emerald-500 to-cyan-400 hover:from-emerald-400 hover:to-cyan-300 text-slate-950 font-bold text-xs rounded-xl transition-all shadow-lg shadow-emerald-500/10"
                >
                  Confirm Savings Goal
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
