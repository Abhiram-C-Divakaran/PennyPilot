import { IncomingTransaction, CSVColumnMapping, CSVImportPreview, CSVImportPreviewItem, CSVImportResult } from "../../src/types/ingestion";
import { ingestTransaction } from "./transactionIngestionService";

/**
 * Parses raw CSV string into rows of header-value records
 */
export function parseCSVText(csvContent: string): { headers: string[]; rows: Record<string, string>[] } {
  if (!csvContent || !csvContent.trim()) {
    return { headers: [], rows: [] };
  }

  const lines = csvContent.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n").filter((l) => l.trim().length > 0);
  if (lines.length === 0) {
    return { headers: [], rows: [] };
  }

  // Helper to split a CSV line into cells accounting for quotes
  const parseLine = (line: string): string[] => {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === "," && !inQuotes) {
        result.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  };

  const headers = parseLine(lines[0]).map((h) => h.replace(/^["']|["']$/g, "").trim());
  const rows: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cells = parseLine(lines[i]);
    if (cells.length === 0 || (cells.length === 1 && !cells[0])) continue;

    const record: Record<string, string> = {};
    for (let j = 0; j < headers.length; j++) {
      record[headers[j]] = (cells[j] || "").replace(/^["']|["']$/g, "").trim();
    }
    rows.push(record);
  }

  return { headers, rows };
}

/**
 * Suggests default column mappings by analyzing header names
 */
export function detectColumnMapping(headers: string[]): CSVColumnMapping {
  const mapping: CSVColumnMapping = {
    dateColumn: "",
    descriptionColumn: ""
  };

  const lowerHeaders = headers.map((h) => h.toLowerCase());

  // Date detection
  const dateIdx = lowerHeaders.findIndex((h) => h.includes("date") || h.includes("time") || h === "txn_date");
  if (dateIdx !== -1) mapping.dateColumn = headers[dateIdx];

  // Description / Narration / Merchant detection
  const descIdx = lowerHeaders.findIndex(
    (h) => h.includes("desc") || h.includes("narrat") || h.includes("particular") || h.includes("merchant") || h.includes("remark")
  );
  if (descIdx !== -1) mapping.descriptionColumn = headers[descIdx];

  // Debit detection
  const debitIdx = lowerHeaders.findIndex(
    (h) => h.includes("debit") || h === "dr" || h.startsWith("dr ") || h.endsWith(" dr") || h.includes("withdrawal")
  );
  if (debitIdx !== -1) mapping.debitColumn = headers[debitIdx];

  // Credit detection
  const creditIdx = lowerHeaders.findIndex(
    (h) => h.includes("credit") || h === "cr" || h.startsWith("cr ") || h.endsWith(" cr") || h.includes("deposit")
  );
  if (creditIdx !== -1) mapping.creditColumn = headers[creditIdx];

  // Amount detection
  const amountIdx = lowerHeaders.findIndex((h) => h === "amount" || h.includes("txn amount") || h.includes("net amount"));
  if (amountIdx !== -1) mapping.amountColumn = headers[amountIdx];

  // Reference detection
  const refIdx = lowerHeaders.findIndex(
    (h) => h.includes("ref") || h.includes("utr") || h.includes("chq") || h.includes("txn id") || h.includes("trans id")
  );
  if (refIdx !== -1) mapping.referenceColumn = headers[refIdx];

  return mapping;
}

/**
 * Parses raw date string (supports DD/MM/YYYY, YYYY-MM-DD, DD-MM-YYYY, etc.)
 */
function parseDateString(rawDate?: string): string {
  if (!rawDate) return new Date().toISOString();
  const trimmed = rawDate.trim();

  // Try direct parse
  const direct = Date.parse(trimmed);
  if (!isNaN(direct)) {
    return new Date(direct).toISOString();
  }

  // Try DD/MM/YYYY or DD-MM-YYYY
  const parts = trimmed.split(/[/.-]/);
  if (parts.length === 3) {
    if (parts[0].length <= 2 && parts[1].length <= 2 && parts[2].length === 4) {
      const d = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10) - 1;
      const y = parseInt(parts[2], 10);
      const parsed = new Date(y, m, d);
      if (!isNaN(parsed.getTime())) return parsed.toISOString();
    }
  }

  return new Date().toISOString();
}

/**
 * Converts a parsed CSV row into an IncomingTransaction according to column mapping
 */
export function rowToIncomingTransaction(
  row: Record<string, string>,
  mapping: CSVColumnMapping
): IncomingTransaction | null {
  const dateVal = mapping.dateColumn ? row[mapping.dateColumn] : undefined;
  const descVal = mapping.descriptionColumn ? row[mapping.descriptionColumn] : "";
  const refVal = mapping.referenceColumn ? row[mapping.referenceColumn] : undefined;

  let amount = 0;
  let type: "expense" | "income" = "expense";

  if (mapping.debitColumn && row[mapping.debitColumn] && parseFloat(row[mapping.debitColumn].replace(/,/g, "")) > 0) {
    amount = Math.abs(parseFloat(row[mapping.debitColumn].replace(/,/g, "")));
    type = "expense";
  } else if (mapping.creditColumn && row[mapping.creditColumn] && parseFloat(row[mapping.creditColumn].replace(/,/g, "")) > 0) {
    amount = Math.abs(parseFloat(row[mapping.creditColumn].replace(/,/g, "")));
    type = "income";
  } else if (mapping.amountColumn && row[mapping.amountColumn]) {
    const rawAmt = parseFloat(row[mapping.amountColumn].replace(/,/g, ""));
    if (!isNaN(rawAmt)) {
      amount = Math.abs(rawAmt);
      type = rawAmt < 0 ? "expense" : "expense";
    }
  }

  if (amount <= 0 || isNaN(amount)) {
    return null;
  }

  return {
    source: "import",
    amount,
    type,
    merchant: descVal || undefined,
    rawDescription: descVal || undefined,
    timestamp: parseDateString(dateVal),
    externalReference: refVal || undefined,
    paymentMethod: "bank_transfer"
  };
}

/**
 * Dry-run preview of CSV transactions before persisting
 */
export function generateCSVPreview(
  csvContent: string,
  customMapping?: CSVColumnMapping
): CSVImportPreview {
  const { headers, rows } = parseCSVText(csvContent);
  const mapping = customMapping || detectColumnMapping(headers);

  const items: CSVImportPreviewItem[] = [];
  let readyCount = 0;
  let duplicateCount = 0;
  let reviewCount = 0;
  let invalidCount = 0;

  rows.forEach((row, idx) => {
    const incoming = rowToIncomingTransaction(row, mapping);
    if (!incoming) {
      invalidCount++;
      return;
    }

    try {
      // Dry-run through ingestion service (autoPersist: false)
      const res = ingestTransaction(incoming, { autoPersist: false });

      if (res.status === "duplicate") {
        duplicateCount++;
      } else if (res.status === "created") {
        readyCount++;
      } else if (res.status === "pending_review") {
        reviewCount++;
      }

      items.push({
        id: `row-${idx + 1}`,
        rowNumber: idx + 1,
        incoming,
        status: res.status,
        categorization: res.categorization,
        existingTransactionId: res.existingTransactionId
      });
    } catch (err: any) {
      invalidCount++;
    }
  });

  return {
    totalRows: rows.length,
    readyCount,
    duplicateCount,
    reviewCount,
    invalidCount,
    items
  };
}

/**
 * Persists selected transactions from CSV preview through the standard ingestion pipeline
 */
export function executeCSVImport(incomingTransactions: IncomingTransaction[]): CSVImportResult {
  let createdCount = 0;
  let reviewCount = 0;
  let duplicateCount = 0;
  let errorCount = 0;

  for (const item of incomingTransactions) {
    try {
      const res = ingestTransaction(item, { autoPersist: true });
      if (res.status === "created") createdCount++;
      else if (res.status === "pending_review") reviewCount++;
      else if (res.status === "duplicate") duplicateCount++;
    } catch {
      errorCount++;
    }
  }

  return {
    totalProcessed: incomingTransactions.length,
    createdCount,
    reviewCount,
    duplicateCount,
    errorCount
  };
}

// Aliases for clean ergonomics
export const parseCSV = parseCSVText;
export const autoDetectColumnMapping = detectColumnMapping;
export const previewCSVImport = generateCSVPreview;

