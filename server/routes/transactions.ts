import { Router, Request, Response } from "express";
import {
  getAllTransactions,
  getTransactionById,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  TransactionValidationError,
  TransactionFilterParams
} from "../services/transactionService";

const router = Router();

// GET /api/transactions - returns all transactions sorted newest first, with optional filters
router.get("/", (req: Request, res: Response) => {
  try {
    const filters: TransactionFilterParams = {
      limit: req.query.limit ? Number(req.query.limit) : undefined,
      type: req.query.type as "expense" | "income" | undefined,
      categoryId: req.query.categoryId as string | undefined,
      paymentMethod: req.query.paymentMethod as string | undefined,
      search: req.query.search as string | undefined,
      month: req.query.month as string | undefined
    };

    const transactions = getAllTransactions(filters);
    res.json(transactions);
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to fetch transactions" });
  }
});

// GET /api/transactions/:id - returns single transaction
router.get("/:id", (req: Request, res: Response) => {
  try {
    const transaction = getTransactionById(req.params.id);
    if (!transaction) {
      res.status(404).json({ error: "Transaction not found" });
      return;
    }
    res.json(transaction);
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to fetch transaction" });
  }
});

// POST /api/transactions - create manual transaction
router.post("/", (req: Request, res: Response) => {
  try {
    const created = createTransaction(req.body);
    res.status(201).json(created);
  } catch (err: any) {
    if (err instanceof TransactionValidationError) {
      res.status(400).json({ error: err.message });
      return;
    }
    res.status(500).json({ error: err.message || "Failed to create transaction" });
  }
});

// PUT /api/transactions/:id - edit transaction
router.put("/:id", (req: Request, res: Response) => {
  try {
    const updated = updateTransaction(req.params.id, req.body);
    res.json(updated);
  } catch (err: any) {
    if (err instanceof TransactionValidationError) {
      res.status(400).json({ error: err.message });
      return;
    }
    if (err.message && err.message.includes("not found")) {
      res.status(404).json({ error: err.message });
      return;
    }
    res.status(500).json({ error: err.message || "Failed to update transaction" });
  }
});

// DELETE /api/transactions/:id - delete transaction
router.delete("/:id", (req: Request, res: Response) => {
  try {
    const success = deleteTransaction(req.params.id);
    if (!success) {
      res.status(404).json({ error: "Transaction not found" });
      return;
    }
    res.json({ success: true, message: "Transaction deleted successfully" });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to delete transaction" });
  }
});

export default router;
