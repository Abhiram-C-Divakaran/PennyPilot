import { Router, Request, Response } from "express";
import { getMonthlyAnalytics, getCategorySpendingAnalytics } from "../services/analyticsService";

export const analyticsRouter = Router();

/**
 * GET /api/analytics/monthly?month=YYYY-MM
 */
analyticsRouter.get("/monthly", (req: Request, res: Response) => {
  try {
    const month = typeof req.query.month === "string" ? req.query.month : undefined;
    const analytics = getMonthlyAnalytics(month);
    res.json(analytics);
  } catch (error) {
    console.error("Error fetching monthly analytics:", error);
    res.status(500).json({ error: "Failed to fetch monthly analytics" });
  }
});

/**
 * GET /api/analytics/categories?month=YYYY-MM
 */
analyticsRouter.get("/categories", (req: Request, res: Response) => {
  try {
    const month = typeof req.query.month === "string" ? req.query.month : undefined;
    const categorySpending = getCategorySpendingAnalytics(month);
    res.json(categorySpending);
  } catch (error) {
    console.error("Error fetching category spending analytics:", error);
    res.status(500).json({ error: "Failed to fetch category analytics" });
  }
});

export default analyticsRouter;
