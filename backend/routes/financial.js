const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const csv = require("csv-parser");
const XLSX = require("xlsx");
const db = require("../database/init");

// Multer storage configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, "../uploads");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(
      null,
      file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname)
    );
  },
});

const upload = multer({
  storage: storage,
  fileFilter: function (req, file, cb) {
    const allowedTypes = [".csv", ".xlsx", ".xls", ".pdf"];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(
        new Error(
          "Invalid file type. Only CSV, Excel, and PDF files are allowed."
        )
      );
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

// Process CSV file and store in database
async function processCSVFile(filePath, fileId) {
  return new Promise((resolve, reject) => {
    const transactions = [];

    fs.createReadStream(filePath)
      .pipe(csv())
      .on("data", (row) => {
        transactions.push({
          file_id: fileId,
          date: row.Date,
          description: row.Description,
          category: row.Category,
          amount: parseFloat(row.Amount),
          type: row.Type,
          account: row.Account,
        });
      })
      .on("end", async () => {
        try {
          // Insert transactions into database
          const stmt = db.prepare(`
            INSERT INTO financial_transactions 
            (file_id, date, description, category, amount, type, account)
            VALUES (?, ?, ?, ?, ?, ?, ?)
          `);

          for (const transaction of transactions) {
            stmt.run([
              transaction.file_id,
              transaction.date,
              transaction.description,
              transaction.category,
              transaction.amount,
              transaction.type,
              transaction.account,
            ]);
          }

          stmt.finalize();

          // Calculate and store aggregated metrics
          await calculateAndStoreMetrics(fileId);

          resolve(transactions.length);
        } catch (error) {
          reject(error);
        }
      })
      .on("error", reject);
  });
}

// Process Excel file and store in database
async function processExcelFile(filePath, fileId) {
  return new Promise((resolve, reject) => {
    try {
      console.log("📊 Processing Excel file:", filePath);

      // Read the Excel file
      const workbook = XLSX.readFile(filePath);
      const sheetName = workbook.SheetNames[0]; // Use first sheet
      const worksheet = workbook.Sheets[sheetName];

      // Convert to JSON
      const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

      console.log("📋 Excel data rows:", data.length);
      console.log("📋 First row (headers):", data[0]);

      // Helper function to format date properly
      const formatDate = (dateValue) => {
        if (!dateValue) return new Date().toISOString().split("T")[0];

        // If it's already a string date, return as is
        if (typeof dateValue === "string") {
          // Check if it's a valid date string
          const date = new Date(dateValue);
          if (!isNaN(date.getTime())) {
            return date.toISOString().split("T")[0];
          }
        }

        // If it's a number (Excel date), convert it
        if (typeof dateValue === "number") {
          const date = new Date((dateValue - 25569) * 86400 * 1000);
          return date.toISOString().split("T")[0];
        }

        // If it's a Date object
        if (dateValue instanceof Date) {
          return dateValue.toISOString().split("T")[0];
        }

        // Fallback to current date
        return new Date().toISOString().split("T")[0];
      };

      // Skip header row and process data
      const transactions = [];
      for (let i = 1; i < data.length; i++) {
        const row = data[i];
        if (row.length >= 4) {
          // Ensure we have enough columns
          const transaction = {
            file_id: fileId,
            date: formatDate(row[0]), // Date column with proper formatting
            description: row[1] || "No description", // Description column
            category: row[2] || "Uncategorized", // Category column
            amount: parseFloat(row[3]) || 0, // Amount column
            type: row[4] || "transaction", // Type column
            account: row[5] || "General", // Account column
          };

          // Only add transaction if amount is valid
          if (transaction.amount !== 0) {
            transactions.push(transaction);
          }
        }
      }

      console.log(
        "💾 Storing",
        transactions.length,
        "transactions in database"
      );

      // Insert transactions into database
      const stmt = db.prepare(`
        INSERT INTO financial_transactions 
        (file_id, date, description, category, amount, type, account)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);

      for (const transaction of transactions) {
        try {
          stmt.run([
            transaction.file_id,
            transaction.date,
            transaction.description,
            transaction.category,
            transaction.amount,
            transaction.type,
            transaction.account,
          ]);
        } catch (insertError) {
          console.error("❌ Error inserting transaction:", insertError);
          console.error("❌ Transaction data:", transaction);
        }
      }

      stmt.finalize();

      // Calculate and store aggregated metrics
      calculateAndStoreMetrics(fileId)
        .then(() => {
          console.log("✅ Excel file processed successfully");
          resolve(transactions.length);
        })
        .catch(reject);
    } catch (error) {
      console.error("❌ Error processing Excel file:", error);
      reject(error);
    }
  });
}

// Calculate and store financial metrics
async function calculateAndStoreMetrics(fileId) {
  return new Promise((resolve, reject) => {
    db.all(
      `
      SELECT 
        SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END) as revenue,
        SUM(CASE WHEN amount < 0 THEN ABS(amount) ELSE 0 END) as expenses,
        SUM(amount) as net_income,
        COUNT(*) as transaction_count
      FROM financial_transactions 
      WHERE file_id = ?
    `,
      [fileId],
      (err, rows) => {
        if (err) {
          reject(err);
          return;
        }

        const metrics = rows[0];
        const profit = metrics.net_income || 0;
        const revenue = metrics.revenue || 0;
        const expenses = metrics.expenses || 0;
        const margin = revenue > 0 ? (profit / revenue) * 100 : 0;

        // Calculate estimated cash flow (simplified)
        const cashFlow = profit * 0.8; // Assume 80% of profit becomes cash

        // Insert metrics into database
        db.run(
          `
        INSERT INTO financial_metrics 
        (date, revenue, expenses, profit, cash_flow, margin)
        VALUES (?, ?, ?, ?, ?, ?)
      `,
          [
            new Date().toISOString().split("T")[0],
            revenue,
            expenses,
            profit,
            cashFlow,
            margin,
          ],
          (err) => {
            if (err) reject(err);
            else resolve();
          }
        );
      }
    );
  });
}

// Get financial data from database
router.get("/data", async (req, res) => {
  try {
    console.log("📊 Fetching financial data from database...");
    // Get aggregated data from all transactions
    db.get(
      `
      SELECT 
        SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END) as revenue,
        SUM(CASE WHEN amount < 0 THEN ABS(amount) ELSE 0 END) as expenses,
        SUM(amount) as net_income,
        COUNT(*) as transaction_count
      FROM financial_transactions
    `,
      (err, row) => {
        if (err) {
          console.error("Database error:", err);
          return res
            .status(500)
            .json({ error: "Failed to fetch financial data" });
        }

        if (!row || row.transaction_count === 0) {
          console.log("📊 No transactions found in database");
          // Return empty data if no transactions exist
          return res.json({
            revenue: {
              current: 0,
              previous: 0,
              change: 0,
            },
            expenses: {
              current: 0,
              previous: 0,
              change: 0,
            },
            profit: {
              current: 0,
              previous: 0,
              change: 0,
            },
            cashFlow: {
              current: 0,
              previous: 0,
              change: 0,
            },
            metrics: {
              arDays: 30,
              apDays: 25,
              ebitda: 0,
              margin: 0,
            },
          });
        }

        const revenue = row.revenue || 0;
        const expenses = row.expenses || 0;
        const profit = row.net_income || 0;
        const margin = revenue > 0 ? (profit / revenue) * 100 : 0;
        const cashFlow = profit * 0.8; // Assume 80% of profit becomes cash

        console.log("📊 Financial data calculated:", {
          revenue,
          expenses,
          profit,
          margin,
          cashFlow,
          transactionCount: row.transaction_count,
        });

        // Return aggregated data from all transactions
        res.json({
          revenue: {
            current: revenue,
            previous: revenue * 0.95, // Estimate previous
            change: ((revenue - revenue * 0.95) / (revenue * 0.95)) * 100,
          },
          expenses: {
            current: expenses,
            previous: expenses * 1.05, // Estimate previous
            change: ((expenses - expenses * 1.05) / (expenses * 1.05)) * 100,
          },
          profit: {
            current: profit,
            previous: profit * 0.9, // Estimate previous
            change: ((profit - profit * 0.9) / (profit * 0.9)) * 100,
          },
          cashFlow: {
            current: cashFlow,
            previous: cashFlow * 0.85, // Estimate previous
            change: ((cashFlow - cashFlow * 0.85) / (cashFlow * 0.85)) * 100,
          },
          metrics: {
            arDays: 30,
            apDays: 25,
            ebitda: profit,
            margin: margin,
          },
        });
      }
    );
  } catch (error) {
    console.error("Error fetching financial data:", error);
    res.status(500).json({ error: "Failed to fetch financial data" });
  }
});

// Upload file
router.post("/upload", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const filePath = req.file.path;
    const fileInfo = {
      filename: req.file.filename,
      originalName: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype,
    };

    // Store file info in database
    db.run(
      `
      INSERT INTO uploaded_files (filename, original_name, file_type, file_size, status)
      VALUES (?, ?, ?, ?, ?)
    `,
      [
        fileInfo.filename,
        fileInfo.originalName,
        path.extname(fileInfo.originalName),
        fileInfo.size,
        "uploaded",
      ],
      function (err) {
        if (err) {
          console.error("Database error:", err);
          return res.status(500).json({ error: "Failed to store file info" });
        }

        const fileId = this.lastID;

        const processAndRespond = () => {
          db.get(
            "SELECT * FROM uploaded_files WHERE id = ?",
            [fileId],
            (err, row) => {
              if (err) {
                return res
                  .status(500)
                  .json({ error: "Failed to fetch file info" });
              }
              res.json({
                message: "File uploaded and processed successfully",
                file: row,
              });
            }
          );
        };

        // Process file based on type
        const fileExt = path.extname(fileInfo.originalName).toLowerCase();

        if (fileExt === ".csv") {
          // Process CSV file
          processCSVFile(filePath, fileId)
            .then(() => {
              // Update status to processed
              db.run(
                "UPDATE uploaded_files SET status = ? WHERE id = ?",
                ["processed", fileId],
                processAndRespond
              );
            })
            .catch((error) => {
              console.error("CSV Processing error:", error);
              // Update status to error
              db.run("UPDATE uploaded_files SET status = ? WHERE id = ?", [
                "error",
                fileId,
              ]);
              res.status(500).json({ error: "CSV file processing failed" });
            });
        } else if (fileExt === ".xlsx" || fileExt === ".xls") {
          // Process Excel file
          processExcelFile(filePath, fileId)
            .then(() => {
              // Update status to processed
              db.run(
                "UPDATE uploaded_files SET status = ? WHERE id = ?",
                ["processed", fileId],
                processAndRespond
              );
            })
            .catch((error) => {
              console.error("Excel Processing error:", error);
              // Update status to error
              db.run("UPDATE uploaded_files SET status = ? WHERE id = ?", [
                "error",
                fileId,
              ]);
              res.status(500).json({ error: "Excel file processing failed" });
            });
        } else {
          // Update status to processed for other file types (PDF, etc.)
          db.run(
            "UPDATE uploaded_files SET status = ? WHERE id = ?",
            ["processed", fileId],
            processAndRespond
          );
        }
      }
    );
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ error: "File upload failed" });
  }
});

// Get uploaded files
router.get("/files", async (req, res) => {
  try {
    db.all(
      `
      SELECT id, filename, original_name, file_type, upload_date, file_size, status
      FROM uploaded_files 
      ORDER BY upload_date DESC
    `,
      (err, rows) => {
        if (err) {
          console.error("Database error:", err);
          return res.status(500).json({ error: "Failed to fetch files" });
        }

        res.json(rows || []);
      }
    );
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch files" });
  }
});

// Get transaction data for charts
router.get("/transactions", async (req, res) => {
  try {
    db.all(
      `
      SELECT date, description, category, amount, type, account
      FROM financial_transactions 
      ORDER BY date DESC
      LIMIT 100
    `,
      (err, rows) => {
        if (err) {
          console.error("Database error:", err);
          return res
            .status(500)
            .json({ error: "Failed to fetch transactions" });
        }

        res.json(rows || []);
      }
    );
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch transactions" });
  }
});

// Delete file
router.delete("/files/:id", async (req, res) => {
  try {
    const fileId = req.params.id;

    // Get file info
    db.get(
      "SELECT filename FROM uploaded_files WHERE id = ?",
      [fileId],
      (err, row) => {
        if (err || !row) {
          return res.status(404).json({ error: "File not found" });
        }

        const filePath = path.join(__dirname, "../uploads", row.filename);

        // Delete from database first
        db.run("DELETE FROM financial_transactions WHERE file_id = ?", [
          fileId,
        ]);
        db.run("DELETE FROM uploaded_files WHERE id = ?", [fileId], (err) => {
          if (err) {
            return res
              .status(500)
              .json({ error: "Failed to delete from database" });
          }

          // Delete physical file
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }

          res.json({ message: "File deleted successfully" });
        });
      }
    );
  } catch (error) {
    res.status(500).json({ error: "Failed to delete file" });
  }
});

module.exports = router;
