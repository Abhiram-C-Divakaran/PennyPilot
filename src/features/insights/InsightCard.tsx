import React from "react";
import {
  AlertCircle,
  AlertTriangle,
  TrendingDown,
  TrendingUp,
  Lightbulb,
  Sparkles,
  Info
} from "lucide-react";
import { SpendingInsight } from "../../types/insight";

interface InsightCardProps {
  insight: SpendingInsight;
}

export const InsightCard: React.FC<InsightCardProps> = ({ insight }) => {
  const getSeverityStyles = () => {
    switch (insight.severity) {
      case "critical":
        return {
          container: "bg-rose-950/20 border-rose-500/30",
          iconBg: "bg-rose-500/20 text-rose-400",
          badge: "bg-rose-500/20 text-rose-300 border-rose-500/40",
          badgeText: "Critical",
          Icon: AlertCircle
        };
      case "warning":
        return {
          container: "bg-amber-950/20 border-amber-500/30",
          iconBg: "bg-amber-500/20 text-amber-400",
          badge: "bg-amber-500/20 text-amber-300 border-amber-500/40",
          badgeText: "Alert",
          Icon: AlertTriangle
        };
      case "positive":
        return {
          container: "bg-emerald-950/20 border-emerald-500/30",
          iconBg: "bg-emerald-500/20 text-emerald-400",
          badge: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
          badgeText: "Positive",
          Icon: TrendingDown
        };
      case "info":
      default:
        return {
          container: "bg-zinc-900/60 border-zinc-800/80",
          iconBg: "bg-indigo-500/20 text-indigo-400",
          badge: "bg-indigo-500/20 text-indigo-300 border-indigo-500/40",
          badgeText: "Notice",
          Icon: insight.type === "potential_savings" ? Lightbulb : Info
        };
    }
  };

  const style = getSeverityStyles();

  return (
    <div className={`p-4 rounded-2xl border ${style.container} shadow-sm space-y-2 transition-all`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${style.iconBg}`}>
            <style.Icon className="w-4 h-4" />
          </div>
          <h4 className="text-sm font-bold text-zinc-100 truncate">{insight.title}</h4>
        </div>
        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${style.badge}`}>
          {style.badgeText}
        </span>
      </div>

      <p className="text-xs text-zinc-300 leading-relaxed pl-10.5">{insight.message}</p>
    </div>
  );
};
