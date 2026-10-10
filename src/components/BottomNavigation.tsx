import React from "react";
import { Home, Receipt, PieChart, Sparkles, Target } from "lucide-react";

export type NavigationTab = "home" | "transactions" | "budget" | "insights" | "goals";

interface BottomNavigationProps {
  currentTab: NavigationTab;
  onSelectTab: (tab: NavigationTab) => void;
  onAddClick?: () => void;
}

export const BottomNavigation: React.FC<BottomNavigationProps> = ({
  currentTab,
  onSelectTab
}) => {
  const tabs = [
    { id: "home" as const, label: "Home", icon: Home },
    { id: "transactions" as const, label: "History", icon: Receipt },
    { id: "budget" as const, label: "Budget", icon: PieChart },
    { id: "insights" as const, label: "Insights", icon: Sparkles },
    { id: "goals" as const, label: "Goals", icon: Target }
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-zinc-950/90 backdrop-blur-xl border-t border-zinc-800/80 max-w-md md:max-w-3xl mx-auto shadow-2xl">
      <div className="grid grid-cols-5 items-center px-1.5 py-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              className={`flex flex-col items-center justify-center gap-1 py-1 px-1 rounded-xl transition-all cursor-pointer ${
                isActive
                  ? "text-emerald-400 font-bold scale-105"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
              aria-label={tab.label}
            >
              <div
                className={`p-1 rounded-lg transition-colors ${
                  isActive ? "bg-emerald-500/15" : "bg-transparent"
                }`}
              >
                <Icon className="w-5 h-5" />
              </div>
              <span className="text-[10px] tracking-tight">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
