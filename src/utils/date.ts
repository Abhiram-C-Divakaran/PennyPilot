import { FinanceTransaction } from "../types/transaction";

/**
 * Format an ISO timestamp to human date (e.g. "7 October 2026")
 */
export function formatDate(timestamp: string): string {
  try {
    const d = new Date(timestamp);
    if (isNaN(d.getTime())) return timestamp;
    return d.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric"
    });
  } catch {
    return timestamp;
  }
}

/**
 * Format date for friendly headers: Today, Yesterday, or "7 October 2026"
 */
export function formatFriendlyDate(dateKey: string): string {
  try {
    const d = new Date(dateKey);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    const isToday =
      d.getFullYear() === today.getFullYear() &&
      d.getMonth() === today.getMonth() &&
      d.getDate() === today.getDate();

    if (isToday) return "Today";

    const isYesterday =
      d.getFullYear() === yesterday.getFullYear() &&
      d.getMonth() === yesterday.getMonth() &&
      d.getDate() === yesterday.getDate();

    if (isYesterday) return "Yesterday";

    return d.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric"
    });
  } catch {
    return dateKey;
  }
}

/**
 * Format time of day (e.g. "08:30 PM")
 */
export function formatTime(timestamp: string): string {
  try {
    const d = new Date(timestamp);
    if (isNaN(d.getTime())) return "";
    return d.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true
    });
  } catch {
    return "";
  }
}

/**
 * Format month key "YYYY-MM" to readable "October 2026"
 */
export function formatMonthName(monthStr?: string): string {
  try {
    const now = new Date();
    const targetMonth = monthStr || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const [year, month] = targetMonth.split("-").map(Number);
    const d = new Date(year, month - 1, 1);
    return d.toLocaleDateString("en-US", {
      month: "long",
      year: "numeric"
    });
  } catch {
    return monthStr || "";
  }
}

/**
 * Get current month key in "YYYY-MM" format
 */
export function getCurrentMonthKey(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

/**
 * Convert ISO string to format suitable for HTML datetime-local input
 */
export function toDatetimeLocalInput(isoString?: string): string {
  const d = isoString ? new Date(isoString) : new Date();
  if (isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  const year = d.getFullYear();
  const month = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const hours = pad(d.getHours());
  const minutes = pad(d.getMinutes());
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

/**
 * Convert datetime-local input string value back to ISO string
 */
export function fromDatetimeLocalInput(inputVal: string): string {
  if (!inputVal) return new Date().toISOString();
  const d = new Date(inputVal);
  return isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
}

export interface DateGroupedTransactions {
  dateKey: string;
  displayDate: string;
  transactions: FinanceTransaction[];
  totalExpense: number;
  totalIncome: number;
}

/**
 * Groups an array of transactions by day (YYYY-MM-DD), maintaining sorted order
 */
export function groupTransactionsByDate(
  transactions: FinanceTransaction[]
): DateGroupedTransactions[] {
  const groupsMap = new Map<string, FinanceTransaction[]>();

  for (const tx of transactions) {
    const dateKey = tx.timestamp ? tx.timestamp.split("T")[0] : "unknown";
    const existing = groupsMap.get(dateKey) || [];
    existing.push(tx);
    groupsMap.set(dateKey, existing);
  }

  const result: DateGroupedTransactions[] = [];

  for (const [dateKey, txs] of groupsMap.entries()) {
    let totalExpense = 0;
    let totalIncome = 0;

    for (const tx of txs) {
      if (tx.type === "expense") {
        totalExpense += Number(tx.amount);
      } else {
        totalIncome += Number(tx.amount);
      }
    }

    result.push({
      dateKey,
      displayDate: formatFriendlyDate(dateKey),
      transactions: txs,
      totalExpense,
      totalIncome
    });
  }

  return result;
}
