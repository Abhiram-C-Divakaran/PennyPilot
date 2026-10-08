import React from "react";
import { Home, Receipt, Plus, Target } from "lucide-react";

export type NavigationTab = "home" | "transactions" | "goals";

interface BottomNavigationProps {
  currentTab: NavigationTab;
  onSelectTab: (tab: NavigationTab) => void;
  onAddClick: () => void;
}

export const BottomNavigation: React.FC<BottomNavigationProps> = ({
  currentTab,
  onSelectTab,
  onAddClick
}) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-zinc-950/85 backdrop-blur-xl border-t border-zinc-800/80 max-w-md mx-auto">
      <div className="flex items-center justify-around px-4 py-2.5">
        {/* Home / Dashboard */}
        <button
          onClick={() => onSelectTab("home")}
          className={`flex flex-col items-center gap-1 transition-all ${
            currentTab === "home"
              ? "text-emerald-400 font-semibold scale-105"
              : "text-zinc-400 hover:text-zinc-200"
          }`}
          aria-label="Home Dashboard"
        >
          <Home className="w-5 h-5" />
          <span className="text-[11px]">Home</span>
        </button>

        {/* Transactions */}
        <button
          onClick={() => onSelectTab("transactions")}
          className={`flex flex-col items-center gap-1 transition-all ${
            currentTab === "transactions"
              ? "text-emerald-400 font-semibold scale-105"
              : "text-zinc-400 hover:text-zinc-200"
          }`}
          aria-label="Transactions History"
        >
          <Receipt className="w-5 h-5" />
          <span className="text-[11px]">Transactions</span>
        </button>

        {/* Center Prominent Add (+) Action */}
        <div className="relative -top-5 flex items-center justify-center">
          <button
            onClick={onAddClick}
            className="w-14 h-14 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 text-zinc-950 font-bold flex items-center justify-center shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 hover:scale-105 active:scale-95 transition-all ring-4 ring-zinc-950"
            aria-label="Add Transaction"
          >
            <Plus className="w-7 h-7 stroke-[2.5]" />
          </button>
        </div>

        {/* Goals */}
        <button
          onClick={() => onSelectTab("goals")}
          className={`flex flex-col items-center gap-1 transition-all ${
            currentTab === "goals"
              ? "text-emerald-400 font-semibold scale-105"
              : "text-zinc-400 hover:text-zinc-200"
          }`}
          aria-label="Savings Goals"
        >
          <Target className="w-5 h-5" />
          <span className="text-[11px]">Goals</span>
        </button>
      </div>
    </nav>
  );
};
