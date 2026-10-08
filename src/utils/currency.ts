/**
 * Reusable Indian Rupee currency formatting utilities using Intl.NumberFormat
 */

const inrFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 2,
  minimumFractionDigits: 0
});

const inrFormatterDecimals = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 2,
  minimumFractionDigits: 2
});

/**
 * Format a numeric amount to INR string (e.g. ₹450, ₹1,299, ₹12,450.50, ₹1,25,000)
 */
export function formatCurrency(amount: number, forceDecimals = false): string {
  const safeAmount = Number.isFinite(amount) ? amount : 0;
  if (forceDecimals || safeAmount % 1 !== 0) {
    return inrFormatterDecimals.format(safeAmount);
  }
  return inrFormatter.format(safeAmount);
}

/**
 * Format currency with explicit +/- sign based on transaction type
 * e.g. +₹30,000 or -₹450
 */
export function formatSignedCurrency(
  amount: number,
  type: "income" | "expense",
  forceDecimals = false
): string {
  const formatted = formatCurrency(Math.abs(amount), forceDecimals);
  if (type === "income") {
    return `+${formatted}`;
  }
  return `-${formatted}`;
}
