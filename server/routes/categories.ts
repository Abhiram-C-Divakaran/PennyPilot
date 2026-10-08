import { Router, Request, Response } from "express";
import { getDatabase } from "../db/database";

const router = Router();

// GET /api/categories - get all categories, optionally filtered by ?type=expense|income
router.get("/", (req: Request, res: Response) => {
  try {
    const db = getDatabase();
    let categories = db.categories || [];
    const type = req.query.type as string | undefined;

    if (type && (type === "expense" || type === "income")) {
      categories = categories.filter((c) => c.type === type);
    }

    res.json(categories);
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to fetch categories" });
  }
});

// GET /api/categories/:id - get single category
router.get("/:id", (req: Request, res: Response) => {
  try {
    const db = getDatabase();
    const category = (db.categories || []).find((c) => c.id === req.params.id);
    if (!category) {
      res.status(404).json({ error: "Category not found" });
      return;
    }
    res.json(category);
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to fetch category" });
  }
});

export default router;
