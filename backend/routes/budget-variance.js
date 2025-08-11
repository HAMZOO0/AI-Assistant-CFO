const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const router = express.Router();
const dbPath = path.join(__dirname, "../database/cfo_assistant.db");

// Initialize budget variance table
const initBudgetVarianceTable = () => {
  const db = new sqlite3.Database(dbPath);

  db.run(
    `
    CREATE TABLE IF NOT EXISTS budget_variance (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      period TEXT NOT NULL,
      category TEXT NOT NULL,
      department TEXT,
      type TEXT NOT NULL,
      budgeted REAL NOT NULL,
      actual REAL NOT NULL,
      variance REAL NOT NULL,
      variance_percent REAL NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `,
    (err) => {
      if (err) {
        console.error("Error creating budget_variance table:", err);
      } else {
        console.log("Budget variance table initialized");
      }
    }
  );

  db.close();
};

// Initialize the table
initBudgetVarianceTable();

// GET /api/budget-variance - Get all budget variance data
router.get("/", (req, res) => {
  const { period, department, type } = req.query;
  const db = new sqlite3.Database(dbPath);

  let query = "SELECT * FROM budget_variance WHERE 1=1";
  const params = [];

  if (period) {
    query += " AND period = ?";
    params.push(period);
  }

  if (department && department !== "all") {
    query += " AND department = ?";
    params.push(department);
  }

  if (type && type !== "all") {
    query += " AND type = ?";
    params.push(type);
  }

  query += " ORDER BY period DESC, category ASC";

  db.all(query, params, (err, rows) => {
    if (err) {
      console.error("Error fetching budget variance data:", err);
      res.status(500).json({ error: "Failed to fetch budget variance data" });
    } else {
      res.json(rows);
    }
    db.close();
  });
});

// GET /api/budget-variance/summary - Get budget variance summary metrics
router.get("/summary", (req, res) => {
  const { period, department, type } = req.query;
  const db = new sqlite3.Database(dbPath);

  let query = `
    SELECT 
      SUM(budgeted) as total_budgeted,
      SUM(actual) as total_actual,
      SUM(variance) as total_variance,
      COUNT(*) as total_items,
      COUNT(CASE WHEN variance > 0 THEN 1 END) as favorable_count,
      COUNT(CASE WHEN variance < 0 THEN 1 END) as unfavorable_count,
      MAX(ABS(variance)) as largest_variance_amount,
      MIN(variance_percent) as worst_variance_percent,
      MAX(variance_percent) as best_variance_percent
    FROM budget_variance 
    WHERE 1=1
  `;

  const params = [];

  if (period) {
    query += " AND period = ?";
    params.push(period);
  }

  if (department && department !== "all") {
    query += " AND department = ?";
    params.push(department);
  }

  if (type && type !== "all") {
    query += " AND type = ?";
    params.push(type);
  }

  db.get(query, params, (err, row) => {
    if (err) {
      console.error("Error fetching budget variance summary:", err);
      res
        .status(500)
        .json({ error: "Failed to fetch budget variance summary" });
    } else {
      // Calculate percentage variance
      const totalVariancePercent =
        row.total_budgeted > 0
          ? (row.total_variance / row.total_budgeted) * 100
          : 0;

      res.json({
        ...row,
        total_variance_percent: totalVariancePercent,
      });
    }
    db.close();
  });
});

// GET /api/budget-variance/trends - Get variance trends over time
router.get("/trends", (req, res) => {
  const { department, type, limit = 12 } = req.query;
  const db = new sqlite3.Database(dbPath);

  let query = `
    SELECT 
      period,
      SUM(budgeted) as total_budgeted,
      SUM(actual) as total_actual,
      SUM(variance) as total_variance,
      COUNT(*) as items_count
    FROM budget_variance 
    WHERE 1=1
  `;

  const params = [];

  if (department && department !== "all") {
    query += " AND department = ?";
    params.push(department);
  }

  if (type && type !== "all") {
    query += " AND type = ?";
    params.push(type);
  }

  query += " GROUP BY period ORDER BY period DESC LIMIT ?";
  params.push(parseInt(limit));

  db.all(query, params, (err, rows) => {
    if (err) {
      console.error("Error fetching budget variance trends:", err);
      res.status(500).json({ error: "Failed to fetch budget variance trends" });
    } else {
      // Calculate variance percentages
      const trends = rows
        .map((row) => ({
          ...row,
          variance_percent:
            row.total_budgeted > 0
              ? (row.total_variance / row.total_budgeted) * 100
              : 0,
        }))
        .reverse(); // Reverse to show oldest to newest

      res.json(trends);
    }
    db.close();
  });
});

// POST /api/budget-variance - Create new budget variance entry
router.post("/", (req, res) => {
  const { period, category, department, type, budgeted, actual } = req.body;

  // Validate required fields
  if (
    !period ||
    !category ||
    !type ||
    budgeted === undefined ||
    actual === undefined
  ) {
    return res.status(400).json({
      error:
        "Missing required fields: period, category, type, budgeted, actual",
    });
  }

  // Calculate variance
  const variance = actual - budgeted;
  const variancePercent = budgeted !== 0 ? (variance / budgeted) * 100 : 0;

  const db = new sqlite3.Database(dbPath);

  const query = `
    INSERT INTO budget_variance 
    (period, category, department, type, budgeted, actual, variance, variance_percent)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `;

  db.run(
    query,
    [
      period,
      category,
      department || null,
      type,
      budgeted,
      actual,
      variance,
      variancePercent,
    ],
    function (err) {
      if (err) {
        console.error("Error creating budget variance entry:", err);
        res
          .status(500)
          .json({ error: "Failed to create budget variance entry" });
      } else {
        res.json({
          id: this.lastID,
          period,
          category,
          department,
          type,
          budgeted,
          actual,
          variance,
          variance_percent: variancePercent,
          created_at: new Date().toISOString(),
        });
      }
      db.close();
    }
  );
});

// PUT /api/budget-variance/:id - Update budget variance entry
router.put("/:id", (req, res) => {
  const { id } = req.params;
  const { period, category, department, type, budgeted, actual } = req.body;

  // Calculate variance
  const variance = actual - budgeted;
  const variancePercent = budgeted !== 0 ? (variance / budgeted) * 100 : 0;

  const db = new sqlite3.Database(dbPath);

  const query = `
    UPDATE budget_variance 
    SET period = ?, category = ?, department = ?, type = ?, 
        budgeted = ?, actual = ?, variance = ?, variance_percent = ?,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `;

  db.run(
    query,
    [
      period,
      category,
      department || null,
      type,
      budgeted,
      actual,
      variance,
      variancePercent,
      id,
    ],
    function (err) {
      if (err) {
        console.error("Error updating budget variance entry:", err);
        res
          .status(500)
          .json({ error: "Failed to update budget variance entry" });
      } else if (this.changes === 0) {
        res.status(404).json({ error: "Budget variance entry not found" });
      } else {
        res.json({
          id: parseInt(id),
          period,
          category,
          department,
          type,
          budgeted,
          actual,
          variance,
          variance_percent: variancePercent,
          updated_at: new Date().toISOString(),
        });
      }
      db.close();
    }
  );
});

// DELETE /api/budget-variance/:id - Delete budget variance entry
router.delete("/:id", (req, res) => {
  const { id } = req.params;
  const db = new sqlite3.Database(dbPath);

  db.run("DELETE FROM budget_variance WHERE id = ?", [id], function (err) {
    if (err) {
      console.error("Error deleting budget variance entry:", err);
      res.status(500).json({ error: "Failed to delete budget variance entry" });
    } else if (this.changes === 0) {
      res.status(404).json({ error: "Budget variance entry not found" });
    } else {
      res.json({ message: "Budget variance entry deleted successfully" });
    }
    db.close();
  });
});

// POST /api/budget-variance/bulk - Bulk upload budget variance data
router.post("/bulk", (req, res) => {
  const { entries } = req.body;

  if (!Array.isArray(entries) || entries.length === 0) {
    return res.status(400).json({ error: "Invalid entries array" });
  }

  const db = new sqlite3.Database(dbPath);

  const query = `
    INSERT INTO budget_variance 
    (period, category, department, type, budgeted, actual, variance, variance_percent)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const stmt = db.prepare(query);
  let successCount = 0;
  let errorCount = 0;
  const errors = [];

  entries.forEach((entry, index) => {
    const { period, category, department, type, budgeted, actual } = entry;

    // Validate entry
    if (
      !period ||
      !category ||
      !type ||
      budgeted === undefined ||
      actual === undefined
    ) {
      errorCount++;
      errors.push(`Entry ${index + 1}: Missing required fields`);
      return;
    }

    // Calculate variance
    const variance = actual - budgeted;
    const variancePercent = budgeted !== 0 ? (variance / budgeted) * 100 : 0;

    stmt.run(
      [
        period,
        category,
        department || null,
        type,
        budgeted,
        actual,
        variance,
        variancePercent,
      ],
      (err) => {
        if (err) {
          errorCount++;
          errors.push(`Entry ${index + 1}: ${err.message}`);
        } else {
          successCount++;
        }
      }
    );
  });

  stmt.finalize((err) => {
    if (err) {
      console.error("Error finalizing bulk insert:", err);
      res.status(500).json({ error: "Failed to complete bulk insert" });
    } else {
      res.json({
        message: "Bulk upload completed",
        success_count: successCount,
        error_count: errorCount,
        errors: errors,
      });
    }
    db.close();
  });
});

// GET /api/budget-variance/departments - Get list of departments
router.get("/departments", (req, res) => {
  const db = new sqlite3.Database(dbPath);

  db.all(
    "SELECT DISTINCT department FROM budget_variance WHERE department IS NOT NULL ORDER BY department",
    [],
    (err, rows) => {
      if (err) {
        console.error("Error fetching departments:", err);
        res.status(500).json({ error: "Failed to fetch departments" });
      } else {
        res.json(rows.map((row) => row.department));
      }
      db.close();
    }
  );
});

// GET /api/budget-variance/periods - Get list of periods
router.get("/periods", (req, res) => {
  const db = new sqlite3.Database(dbPath);

  db.all(
    "SELECT DISTINCT period FROM budget_variance ORDER BY period DESC",
    [],
    (err, rows) => {
      if (err) {
        console.error("Error fetching periods:", err);
        res.status(500).json({ error: "Failed to fetch periods" });
      } else {
        res.json(rows.map((row) => row.period));
      }
      db.close();
    }
  );
});

module.exports = router;
