/**
 * Merchant Normalization Service
 * Deterministically normalizes merchant names by stripping noise, prefixes,
 * corporate suffixes, UPI handles, and payment provider artifacts.
 */

// Common payment prefixes found in SMS/notifications/bank statements
const COMMON_PREFIXES = [
  /^paid\s+to\s+/i,
  /^payment\s+to\s+/i,
  /^transfer\s+to\s+/i,
  /^sent\s+to\s+/i,
  /^vpa\s*[:\-]?\s*/i,
  /^upi\s*[:\-\/]?\s*/i,
  /^pos\s*[:\-]?\s*/i,
  /^e-?com\s*[:\-]?\s*/i,
  /^purchase\s+at\s+/i,
  /^txn\s+to\s+/i,
  /^billdesk\s*[\*\-]?\s*/i,
  /^razorpay\s*[\*\-]?\s*/i,
  /^paytm\s*[\*\-]?\s*/i
];

// Common corporate / noise suffixes
const COMMON_SUFFIXES = [
  /\s+pvt\.?\s*ltd\.?$/i,
  /\s+private\s+limited$/i,
  /\s+ltd\.?$/i,
  /\s+limited$/i,
  /\s+llp$/i,
  /\s+inc\.?$/i,
  /\s+corp\.?$/i,
  /\s+india$/i,
  /\s+online$/i,
  /\s+retail$/i,
  /\s+technologies$/i,
  /\s+services$/i,
  /\s+trip$/i,
  /\s+rides$/i,
  /\s+pay$/i,
  /\.com$/i,
  /\.in$/i
];

// Known UPI bank handles to strip (e.g., merchant@okhdfcbank)
const UPI_HANDLE_REGEX = /@([a-z0-9\-_]+)$/i;

/**
 * Normalizes a raw merchant name or payment handle.
 * Preserves the essence while removing noisy variations.
 */
export function normalizeMerchant(raw?: string): string {
  if (!raw || typeof raw !== "string") {
    return "";
  }

  let text = raw.trim();
  if (!text) return "";

  // 1. Strip UPI handle if present (e.g., 'zomato@upi' -> 'zomato')
  text = text.replace(UPI_HANDLE_REGEX, "");

  // 2. Strip leading transaction prefixes
  for (const prefix of COMMON_PREFIXES) {
    text = text.replace(prefix, "");
  }

  // 3. Lowercase & normalize spaces
  text = text.toLowerCase();

  // 4. Strip punctuation and special symbols except spaces and alphanumeric
  text = text.replace(/[^a-z0-9\s]/g, " ");

  // 5. Collapse consecutive spaces
  text = text.replace(/\s+/g, " ").trim();

  // 6. Strip trailing corporate suffixes
  for (const suffix of COMMON_SUFFIXES) {
    text = text.replace(suffix, "").trim();
  }

  // 7. Canonical alias mappings for common variations
  const aliases: Record<string, string> = {
    "amzn": "amazon",
    "amzn mktp": "amazon",
    "amazon pay": "amazon",
    "swiggy instamart": "instamart",
    "uber bv": "uber",
    "uber india systems": "uber",
    "rapido bike": "rapido",
    "netflix entertainment": "netflix",
    "spotify india": "spotify",
    "reliance retail": "reliance",
    "reliance jio": "jio",
    "airtel prepaid": "airtel",
    "airtel postpaid": "airtel",
    "airtel payments": "airtel",
    "bharat petroleum": "bpcl",
    "hindustan petroleum": "hpcl",
    "indian oil corp": "indian oil",
    "ioc l": "indian oil"
  };

  if (aliases[text]) {
    text = aliases[text];
  }

  return text.trim();
}

/**
 * Attempts to parse or extract a merchant name from a raw bank/SMS description
 * e.g., "Debited INR 450.00 for VPA zomato@upi on 11-10-26" -> "zomato"
 */
export function extractMerchantFromRawText(rawDescription?: string): string {
  if (!rawDescription) return "";

  // 1. Look for VPA / UPI pattern: e.g. "to VPA abc@xyz" or "UPI/zomato@upi"
  const vpaMatch = rawDescription.match(/(?:vpa|upi)\s*[:\-\/]?\s*([a-zA-Z0-9.\-_@]+)/i);
  if (vpaMatch && vpaMatch[1]) {
    return normalizeMerchant(vpaMatch[1]);
  }

  // 2. Look for "paid [optional amount] to [merchant]" or "transfer to [merchant]" or "at [merchant]"
  const toMatch = rawDescription.match(
    /(?:paid\s+(?:(?:rs\.?|inr|₹)?\s*[0-9,.]+\s+)?to|transfer\s+to|transferred\s+(?:(?:rs\.?|inr|₹)?\s*[0-9,.]+\s+)?to|sent\s+to|at)\s+([a-zA-Z0-9\s&.\-_]+?)(?:\s+via|\s+using|\s+ref|\s+on|\s+for|\.|$)/i
  );
  if (toMatch && toMatch[1]) {
    return normalizeMerchant(toMatch[1]);
  }

  return normalizeMerchant(rawDescription);
}
