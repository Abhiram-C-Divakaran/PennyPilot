import React from "react";
import {
  UtensilsCrossed,
  ShoppingBasket,
  Car,
  Fuel,
  ShoppingBag,
  Film,
  Receipt,
  Home,
  HeartPulse,
  GraduationCap,
  Repeat,
  Plane,
  MoreHorizontal,
  Briefcase,
  Laptop,
  Building2,
  TrendingUp,
  Gift,
  RotateCcw,
  Wallet,
  HelpCircle,
  LucideIcon
} from "lucide-react";

const ICON_MAP: Record<string, LucideIcon> = {
  UtensilsCrossed,
  ShoppingBasket,
  Car,
  Fuel,
  ShoppingBag,
  Film,
  Receipt,
  Home,
  HeartPulse,
  GraduationCap,
  Repeat,
  Plane,
  MoreHorizontal,
  Briefcase,
  Laptop,
  Building2,
  TrendingUp,
  Gift,
  RotateCcw,
  Wallet
};

interface CategoryIconProps {
  iconName?: string;
  className?: string;
}

export const CategoryIcon: React.FC<CategoryIconProps> = ({ iconName, className = "w-5 h-5" }) => {
  const IconComponent = (iconName && ICON_MAP[iconName]) || HelpCircle;
  return <IconComponent className={className} />;
};
