import { Router, Request, Response } from "express";
import {
  getMonthlyAnalytics,
  getCategorySpendingAnalytics,
  getMonthlySpendingTrends,
  getCategorySpendingTrends
} from "../services/analyticsService";

export const analyticsRouter = Router();

/**
 * GET /api/analytics/monthly?month=YYYY-MM
 */
analyticsRouter.get("/monthly", (req: Request, res: Response) => {
  try {
    const month = typeof req.query.month === "string" ? req.query.month : undefined;
    const analytics = getMonthlyAnalytics(month);
    res.json(analytics);
  } catch (error: any) {
    console.error("Error fetching monthly analytics:", error);
    res.status(500).json({
      error: { code: "SERVER_ERROR", message: error.message || "Failed to fetch monthly analytics" }
    });
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
  } catch (error: any) {
    console.error("Error fetching category spending analytics:", error);
    res.status(500).json({
      error: { code: "SERVER_ERROR", message: error.message || "Failed to fetch category analytics" }
    });
  }
});

/**
 * GET /api/analytics/trends?month=YYYY-MM
 */
analyticsRouter.get("/trends", (req: Request, res: Response) => {
  try {
    const month = typeof req.query.month === "string" ? req.query.month : undefined;
    const trends = getMonthlySpendingTrends(month);
    res.json(trends);
  } catch (error: any) {
    console.error("Error fetching spending trends:", error);
    res.status(500).json({
      error: { code: "SERVER_ERROR", message: error.message || "Failed to fetch spending trends" }
    });
  }
});

/**
 * GET /api/analytics/category-trends?month=YYYY-MM
 */
analyticsRouter.get("/category-trends", (req: Request, res: Response) => {
  try {
    const month = typeof req.query.month === "string" ? req.query.month : undefined;
    const categoryTrends = getCategorySpendingTrends(month);
    res.json(categoryTrends);
  } catch (error: any) {
    console.error("Error fetching category trends:", error);
    res.status(500).json({
      error: { code: "SERVER_ERROR", message: error.message || "Failed to fetch category trends" }
    });
  }
});

export default analyticsRouter;
