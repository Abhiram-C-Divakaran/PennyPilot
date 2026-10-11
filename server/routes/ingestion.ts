import { Router, Request, Response } from "express";
import { ingestTransaction, IngestionValidationError } from "../services/transactionIngestionService";
import { generateCSVPreview, executeCSVImport } from "../services/importService";
import { IncomingTransaction } from "../../src/types/ingestion";

const router = Router();

/**
 * POST /api/ingestion/transaction
 * Internal/development ingestion endpoint for automated payment notifications, SMS, bank webhooks, etc.
 */
router.post("/transaction", (req: Request, res: Response) => {
  try {
    const incoming: IncomingTransaction = req.body;
    const result = ingestTransaction(incoming);

    // Standardized structured response
    res.status(result.status === "created" ? 201 : 200).json(result);
  } catch (err: any) {
    if (err instanceof IngestionValidationError) {
      res.status(400).json({
        error: {
          code: err.code || "INVALID_INGESTION_PAYLOAD",
          message: err.message
        }
      });
      return;
    }

    res.status(500).json({
      error: {
        code: "INGESTION_ERROR",
        message: err.message || "Failed to ingest transaction"
      }
    });
  }
});

/**
 * POST /api/ingestion/csv/preview
 * Analyzes uploaded CSV content and generates mapped dry-run preview
 */
router.post("/csv/preview", (req: Request, res: Response) => {
  try {
    const { csvContent, mapping } = req.body;
    if (!csvContent || typeof csvContent !== "string") {
      res.status(400).json({
        error: {
          code: "MISSING_CSV_CONTENT",
          message: "csvContent string is required"
        }
      });
      return;
    }

    const preview = generateCSVPreview(csvContent, mapping);
    res.json(preview);
  } catch (err: any) {
    res.status(400).json({
      error: {
        code: "CSV_PREVIEW_FAILED",
        message: err.message || "Failed to generate CSV preview"
      }
    });
  }
});

/**
 * POST /api/ingestion/csv/import
 * Imports confirmed items through the standard ingestion pipeline
 */
router.post("/csv/import", (req: Request, res: Response) => {
  try {
    const transactions: IncomingTransaction[] = Array.isArray(req.body)
      ? req.body
      : req.body.transactions;

    if (!Array.isArray(transactions) || transactions.length === 0) {
      res.status(400).json({
        error: {
          code: "NO_TRANSACTIONS_TO_IMPORT",
          message: "Expected non-empty transactions array in request body"
        }
      });
      return;
    }

    const result = executeCSVImport(transactions);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({
      error: {
        code: "CSV_IMPORT_FAILED",
        message: err.message || "Failed to execute CSV import"
      }
    });
  }
});

/**
 * POST /api/ingestion/batch
 * Batch ingestion endpoint (used by CSV import or batch sync)
 */
router.post("/batch", (req: Request, res: Response) => {
  try {
    const items: IncomingTransaction[] = Array.isArray(req.body)
      ? req.body
      : req.body.transactions;

    if (!Array.isArray(items)) {
      res.status(400).json({
        error: {
          code: "INVALID_BATCH_PAYLOAD",
          message: "Expected an array of incoming transactions in 'transactions' or request body"
        }
      });
      return;
    }

    let createdCount = 0;
    let reviewCount = 0;
    let duplicateCount = 0;
    let errorCount = 0;
    const results = [];

    for (const item of items) {
      try {
        const resItem = ingestTransaction(item);
        if (resItem.status === "created") createdCount++;
        else if (resItem.status === "pending_review") reviewCount++;
        else if (resItem.status === "duplicate") duplicateCount++;
        results.push(resItem);
      } catch (err: any) {
        errorCount++;
        results.push({
          status: "rejected" as const,
          error: err.message || "Invalid row",
          incoming: item
        });
      }
    }

    res.json({
      summary: {
        totalProcessed: items.length,
        createdCount,
        reviewCount,
        duplicateCount,
        errorCount
      },
      results
    });
  } catch (err: any) {
    res.status(500).json({
      error: {
        code: "BATCH_INGESTION_FAILED",
        message: err.message || "Failed to process batch ingestion"
      }
    });
  }
});

export default router;
