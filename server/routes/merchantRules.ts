import { Router, Request, Response } from "express";
import { getAllMerchantRules, addOrUpdateMerchantRule } from "../services/categorizationService";

const router = Router();

/**
 * GET /api/merchant-rules
 * Returns all active merchant categorization rules
 */
router.get("/", (req: Request, res: Response) => {
  try {
    const rules = getAllMerchantRules();
    res.json(rules);
  } catch (err: any) {
    res.status(500).json({
      error: {
        code: "FAILED_FETCH_RULES",
        message: err.message || "Failed to fetch merchant rules"
      }
    });
  }
});

/**
 * POST /api/merchant-rules
 * User-defined rule creation or learned merchant rule update
 */
router.post("/", (req: Request, res: Response) => {
  try {
    const { merchant, categoryId, paymentMethod } = req.body;
    if (!merchant || typeof merchant !== "string" || !merchant.trim()) {
      res.status(400).json({
        error: {
          code: "MERCHANT_REQUIRED",
          message: "Merchant name is required"
        }
      });
      return;
    }

    if (!categoryId || typeof categoryId !== "string" || !categoryId.trim()) {
      res.status(400).json({
        error: {
          code: "CATEGORY_REQUIRED",
          message: "Category ID is required"
        }
      });
      return;
    }

    const rule = addOrUpdateMerchantRule({
      merchant: merchant.trim(),
      categoryId: categoryId.trim(),
      paymentMethod
    });

    res.status(201).json({
      success: true,
      rule
    });
  } catch (err: any) {
    res.status(400).json({
      error: {
        code: "RULE_CREATION_FAILED",
        message: err.message || "Failed to create merchant rule"
      }
    });
  }
});

export default router;
