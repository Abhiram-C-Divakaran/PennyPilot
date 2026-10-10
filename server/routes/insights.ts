import { Router, Request, Response } from "express";
import { generateSpendingInsights } from "../services/insightService";

export const insightsRouter = Router();

/**
 * GET /api/insights?month=YYYY-MM
 */
insightsRouter.get("/", (req: Request, res: Response) => {
  try {
    const month = typeof req.query.month === "string" ? req.query.month : undefined;
    const insights = generateSpendingInsights(month);
    res.json(insights);
  } catch (error: any) {
    console.error("Error generating insights:", error);
    res.status(500).json({
      error: { code: "SERVER_ERROR", message: error.message || "Failed to generate spending insights" }
    });
  }
});

export default insightsRouter;
