import React, { useEffect } from "react";
import { Sparkles, Trophy, X, Star } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface CelebrationProps {
  isOpen: boolean;
  goalName: string;
  targetAmount: number;
  currency: string;
  onClose: () => void;
}

export default function Celebration({
  isOpen,
  goalName,
  targetAmount,
  currency,
  onClose
}: CelebrationProps) {
  // Auto-dismiss after 6 seconds
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(onClose, 6000);
      return () => clearTimeout(timer);
    }
  }, [isOpen, onClose]);

  // Generate particle coordinate arrays for floating stars
  const stars = Array.from({ length: 12 }).map((_, i) => ({
    id: i,
    x: Math.random() * 300 - 150,
    y: Math.random() * -300 - 50,
    scale: Math.random() * 1.5 + 0.5,
    duration: Math.random() * 2 + 2
  }));

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Blur background */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-950/85 backdrop-blur-md"
          />

          {/* Celebration container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.3, rotate: -10 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            exit={{ opacity: 0, scale: 0.5 }}
            transition={{ type: "spring", damping: 15, stiffness: 200 }}
            className="relative max-w-sm w-full p-8 rounded-3xl bg-slate-900 border border-slate-800 text-center shadow-2xl shadow-emerald-500/10 overflow-hidden"
          >
            {/* Confetti Particle Simulations */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              {stars.map((star) => (
                <motion.div
                  key={star.id}
                  initial={{ x: 0, y: 150, opacity: 1, rotate: 0 }}
                  animate={{ x: star.x, y: star.y, opacity: 0, rotate: 360 }}
                  transition={{ duration: star.duration, ease: "easeOut" }}
                  className="absolute left-1/2 bottom-0 text-emerald-400"
                  style={{ scale: star.scale }}
                >
                  <Star className="h-4 w-4 fill-emerald-400 text-emerald-400" />
                </motion.div>
              ))}
            </div>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-1.5 rounded-xl text-slate-500 hover:text-slate-200 hover:bg-slate-800/60 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Icon Banner */}
            <div className="relative mx-auto h-20 w-20 rounded-3xl bg-gradient-to-tr from-emerald-500 to-cyan-500 p-[1px] flex items-center justify-center shadow-2xl shadow-emerald-500/25">
              <div className="h-full w-full rounded-3xl bg-slate-950 flex items-center justify-center">
                <Trophy className="h-10 w-10 text-emerald-400 stroke-[1.5]" />
              </div>
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
                className="absolute -top-1.5 -right-1.5 h-6 w-6 bg-amber-500 rounded-full flex items-center justify-center shadow"
              >
                <Sparkles className="h-3.5 w-3.5 text-slate-950 fill-slate-950" />
              </motion.div>
            </div>

            {/* Achievement text headings */}
            <div className="mt-6 space-y-2">
              <span className="text-[10px] text-emerald-400 font-mono tracking-widest uppercase font-semibold">
                Milestone Completed! 🎉
              </span>
              <h2 className="font-display font-extrabold text-2xl text-slate-100 leading-tight">
                Congratulations!
              </h2>
              <p className="text-xs text-slate-400 max-w-[85%] mx-auto leading-relaxed">
                You reached your target saving goal for:
              </p>
              <div className="p-3 bg-slate-950/60 rounded-2xl border border-slate-850 mt-4">
                <p className="text-sm font-bold text-slate-200 font-display truncate">
                  {goalName}
                </p>
                <p className="text-sm font-mono font-bold text-emerald-400 mt-1">
                  {currency}
                  {targetAmount.toLocaleString()} Saved
                </p>
              </div>
            </div>

            {/* Confirm CTA */}
            <button
              onClick={onClose}
              className="mt-6 w-full py-2.5 bg-gradient-to-r from-emerald-500 to-cyan-400 hover:from-emerald-400 hover:to-cyan-300 text-slate-950 font-bold text-xs rounded-xl transition-all shadow-lg shadow-emerald-500/10"
            >
              Mark Done & Continue
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
