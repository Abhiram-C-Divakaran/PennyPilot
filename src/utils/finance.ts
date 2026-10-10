/**
 * Financial calculation utilities for PennyPilot.
 *
 * Prevents floating-point drift by working in integer paise (1 Rupee = 100 paise)
 * and safely handling edge cases (division by zero, NaN, non-finite numbers).
 */

/**
 * Convert a rupee amount to integer paise (1 INR = 100 paise).
 */
export function toPaise(rupees: number): number {
  if (!Number.isFinite(rupees)) return 0;
  return Math.round(Number(rupees) * 100);
}

/**
 * Convert integer paise back to standard rupee float with 2 decimal precision.
 */
export function toRupees(paise: number): number {
  if (!Number.isFinite(paise)) return 0;
  return Math.round(paise) / 100;
}

/**
 * Safely parse and normalize an amount to 2 decimal places.
 * Returns 0 if invalid, NaN, or non-finite.
 */
export function normalizeAmount(value: unknown): number {
  if (value === null || value === undefined || value === "") return 0;
  const num = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(num)) return 0;
  return toRupees(toPaise(num));
}

/**
 * Add multiple amounts using integer paise arithmetic to prevent floating-point drift.
 */
export function addMoney(...amounts: (number | undefined | null)[]): number {
  const totalPaise = amounts.reduce<number>((acc, curr) => {
    return acc + toPaise(normalizeAmount(curr));
  }, 0);
  return toRupees(totalPaise);
}

/**
 * Subtract amount B from amount A using integer paise arithmetic.
 */
export function subtractMoney(a: number, b: number): number {
  const paiseA = toPaise(normalizeAmount(a));
  const paiseB = toPaise(normalizeAmount(b));
  return toRupees(paiseA - paiseB);
}

/**
 * Safely compute percentage of part vs total.
 * Returns 0 if total is 0 or negative.
 */
export function safePercentage(part: number, total: number, decimals = 1): number {
  const normPart = normalizeAmount(part);
  const normTotal = normalizeAmount(total);
  if (normTotal <= 0) return 0;
  const raw = (normPart / normTotal) * 100;
  if (!Number.isFinite(raw)) return 0;
  return Number(raw.toFixed(decimals));
}

/**
 * Safely compute percentage change from previous to current value.
 * Handles edge cases like previous = 0 without producing Infinity or NaN.
 */
export function safePercentageChange(current: number, previous: number, decimals = 1): number {
  const cur = normalizeAmount(current);
  const prev = normalizeAmount(previous);

  if (prev === 0) {
    if (cur === 0) return 0;
    return cur > 0 ? 100 : -100;
  }

  const change = ((cur - prev) / prev) * 100;
  if (!Number.isFinite(change)) return 0;
  return Number(change.toFixed(decimals));
}

/**
 * Check if a number is a valid positive non-zero amount.
 */
export function isValidPositiveAmount(value: unknown): boolean {
  if (typeof value !== "number" && typeof value !== "string") return false;
  const num = Number(value);
  return Number.isFinite(num) && num > 0;
}
