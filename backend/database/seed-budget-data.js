const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const dbPath = path.join(__dirname, "cfo_assistant.db");

const seedBudgetData = () => {
  const db = new sqlite3.Database(dbPath);

  // Sample budget variance data
  const sampleData = [
    // January 2024
    {
      period: "2024-01",
      category: "Sales Revenue",
      department: "Sales",
      type: "revenue",
      budgeted: 1500000,
      actual: 1650000,
    },
    {
      period: "2024-01",
      category: "Product Revenue",
      department: "Product",
      type: "revenue",
      budgeted: 2200000,
      actual: 2100000,
    },
    {
      period: "2024-01",
      category: "Service Revenue",
      department: "Services",
      type: "revenue",
      budgeted: 800000,
      actual: 850000,
    },
    {
      period: "2024-01",
      category: "Marketing Expenses",
      department: "Marketing",
      type: "expense",
      budgeted: 200000,
      actual: 235000,
    },
    {
      period: "2024-01",
      category: "Operations Expenses",
      department: "Operations",
      type: "expense",
      budgeted: 800000,
      actual: 775000,
    },
    {
      period: "2024-01",
      category: "R&D Expenses",
      department: "R&D",
      type: "expense",
      budgeted: 500000,
      actual: 520000,
    },
    {
      period: "2024-01",
      category: "IT Equipment",
      department: "IT",
      type: "capital",
      budgeted: 150000,
      actual: 180000,
    },
    {
      period: "2024-01",
      category: "Office Equipment",
      department: "Admin",
      type: "capital",
      budgeted: 75000,
      actual: 68000,
    },

    // December 2023
    {
      period: "2023-12",
      category: "Sales Revenue",
      department: "Sales",
      type: "revenue",
      budgeted: 1400000,
      actual: 1320000,
    },
    {
      period: "2023-12",
      category: "Product Revenue",
      department: "Product",
      type: "revenue",
      budgeted: 2100000,
      actual: 2250000,
    },
    {
      period: "2023-12",
      category: "Marketing Expenses",
      department: "Marketing",
      type: "expense",
      budgeted: 180000,
      actual: 195000,
    },
    {
      period: "2023-12",
      category: "Operations Expenses",
      department: "Operations",
      type: "expense",
      budgeted: 750000,
      actual: 725000,
    },
    {
      period: "2023-12",
      category: "R&D Expenses",
      department: "R&D",
      type: "expense",
      budgeted: 480000,
      actual: 465000,
    },

    // November 2023
    {
      period: "2023-11",
      category: "Sales Revenue",
      department: "Sales",
      type: "revenue",
      budgeted: 1350000,
      actual: 1425000,
    },
    {
      period: "2023-11",
      category: "Product Revenue",
      department: "Product",
      type: "revenue",
      budgeted: 2000000,
      actual: 1980000,
    },
    {
      period: "2023-11",
      category: "Marketing Expenses",
      department: "Marketing",
      type: "expense",
      budgeted: 175000,
      actual: 168000,
    },
    {
      period: "2023-11",
      category: "Operations Expenses",
      department: "Operations",
      type: "expense",
      budgeted: 720000,
      actual: 740000,
    },
  ];

  // First, clear existing data
  db.run("DELETE FROM budget_variance", (err) => {
    if (err) {
      console.error("Error clearing budget variance data:", err);
      return;
    }

    console.log("Cleared existing budget variance data");

    // Insert sample data
    const insertQuery = `
      INSERT INTO budget_variance 
      (period, category, department, type, budgeted, actual, variance, variance_percent)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const stmt = db.prepare(insertQuery);
    let insertedCount = 0;

    sampleData.forEach((entry) => {
      const variance = entry.actual - entry.budgeted;
      const variancePercent =
        entry.budgeted !== 0 ? (variance / entry.budgeted) * 100 : 0;

      stmt.run(
        [
          entry.period,
          entry.category,
          entry.department,
          entry.type,
          entry.budgeted,
          entry.actual,
          variance,
          variancePercent,
        ],
        (err) => {
          if (err) {
            console.error("Error inserting budget variance entry:", err);
          } else {
            insertedCount++;
            if (insertedCount === sampleData.length) {
              console.log(
                `✅ Successfully inserted ${insertedCount} budget variance entries`
              );
              db.close();
            }
          }
        }
      );
    });

    stmt.finalize();
  });
};

// Run if called directly
if (require.main === module) {
  console.log("🌱 Seeding budget variance data...");
  seedBudgetData();
}

module.exports = { seedBudgetData };
