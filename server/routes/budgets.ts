import { Router, Request, Response } from "express";
import {
  getBudgets,
  getBudgetById,
  createBudget,
  updateBudget,
  deleteBudget,
  getBudgetProgressList,
  getMonthlyBudgetSummary,
  BudgetValidationError
} from "../services/budgetService";

export const budgetsRouter = Router();

// GET /api/budgets/summary?month=YYYY-MM
budgetsRouter.get("/summary", (req: Request, res: Response) => {
  try {
    const month = typeof req.query.month === "string" ? req.query.month : undefined;
    const summary = getMonthlyBudgetSummary(month);
    res.json(summary);
  } catch (err: any) {
    res.status(500).json({
      error: { code: "SERVER_ERROR", message: err.message || "Failed to fetch budget summary" }
    });
  }
});

// GET /api/budgets/progress?month=YYYY-MM
budgetsRouter.get("/progress", (req: Request, res: Response) => {
  try {
    const month = typeof req.query.month === "string" ? req.query.month : undefined;
    const progress = getBudgetProgressList(month);
    res.json(progress);
  } catch (err: any) {
    res.status(500).json({
      error: { code: "SERVER_ERROR", message: err.message || "Failed to fetch budget progress" }
    });
  }
});

// GET /api/budgets?month=YYYY-MM
budgetsRouter.get("/", (req: Request, res: Response) => {
  try {
    const month = typeof req.query.month === "string" ? req.query.month : undefined;
    const budgets = getBudgets(month);
    res.json(budgets);
  } catch (err: any) {
    res.status(500).json({
      error: { code: "SERVER_ERROR", message: err.message || "Failed to fetch budgets" }
    });
  }
});

// GET /api/budgets/:id
budgetsRouter.get("/:id", (req: Request, res: Response) => {
  try {
    const budget = getBudgetById(req.params.id);
    if (!budget) {
      res.status(404).json({
        error: { code: "BUDGET_NOT_FOUND", message: `Budget '${req.params.id}' not found` }
      });
      return;
    }
    res.json(budget);
  } catch (err: any) {
    res.status(500).json({
      error: { code: "SERVER_ERROR", message: err.message || "Failed to fetch budget" }
    });
  }
});

// POST /api/budgets
budgetsRouter.post("/", (req: Request, res: Response) => {
  try {
    const newBudget = createBudget(req.body);
    res.status(201).json(newBudget);
  } catch (err: any) {
    if (err instanceof BudgetValidationError) {
      res.status(err.status).json({
        error: { code: err.code, message: err.message }
      });
      return;
    }
    res.status(500).json({
      error: { code: "SERVER_ERROR", message: err.message || "Failed to create budget" }
    });
  }
});

// PUT /api/budgets/:id
budgetsRouter.put("/:id", (req: Request, res: Response) => {
  try {
    const updated = updateBudget(req.params.id, req.body);
    res.json(updated);
  } catch (err: any) {
    if (err instanceof BudgetValidationError) {
      res.status(err.status).json({
        error: { code: err.code, message: err.message }
      });
      return;
    }
    res.status(500).json({
      error: { code: "SERVER_ERROR", message: err.message || "Failed to update budget" }
    });
  }
});

// DELETE /api/budgets/:id
budgetsRouter.delete("/:id", (req: Request, res: Response) => {
  try {
    const success = deleteBudget(req.params.id);
    if (!success) {
      res.status(404).json({
        error: { code: "BUDGET_NOT_FOUND", message: `Budget '${req.params.id}' not found` }
      });
      return;
    }
    res.json({ success: true, message: "Budget deleted successfully" });
  } catch (err: any) {
    res.status(500).json({
      error: { code: "SERVER_ERROR", message: err.message || "Failed to delete budget" }
    });
  }
});

export default budgetsRouter;
