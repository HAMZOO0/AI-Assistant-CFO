const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const dbPath = path.join(__dirname, "cfo_assistant.db");

const seedReportsAndInsights = () => {
  const db = new sqlite3.Database(dbPath);

  // Clear existing data
  db.run("DELETE FROM financial_reports", (err) => {
    if (err) {
      console.error("Error clearing reports:", err);
    } else {
      console.log("Cleared existing reports");
    }
  });

  db.run("DELETE FROM ai_insights", (err) => {
    if (err) {
      console.error("Error clearing insights:", err);
    } else {
      console.log("Cleared existing insights");
    }
  });

  // Sample financial reports
  const sampleReports = [
    {
      type: "monthly",
      period: "2024-01",
      summary: "Strong revenue growth with improved profit margins",
      keyInsights: JSON.stringify([
        "Revenue increased by 15% compared to previous month",
        "Expenses reduced by 8% through cost optimization",
        "Cash flow positive with healthy working capital",
      ]),
      metricsData: JSON.stringify({
        revenue: {
          current: 1250000,
          previous: 1087000,
          change: 15,
          changePercent: 15,
          trend: "up",
        },
        expenses: {
          current: 920000,
          previous: 1000000,
          change: -8,
          changePercent: -8,
          trend: "down",
        },
        profit: {
          current: 330000,
          previous: 87000,
          change: 279,
          changePercent: 279,
          trend: "up",
        },
        cashFlow: {
          current: 280000,
          previous: 50000,
          change: 460,
          changePercent: 460,
          trend: "up",
        },
        arDays: {
          current: 28,
          previous: 35,
          change: -7,
          changePercent: -20,
          trend: "up",
        },
        apDays: {
          current: 22,
          previous: 30,
          change: -8,
          changePercent: -27,
          trend: "up",
        },
        ebitda: {
          current: 450000,
          previous: 200000,
          change: 125,
          changePercent: 125,
          trend: "up",
        },
        margins: {
          current: 26.4,
          previous: 8,
          change: 18.4,
          changePercent: 18.4,
          trend: "up",
        },
      }),
    },
    {
      type: "quarterly",
      period: "Q1 2024",
      summary: "Quarterly performance shows consistent growth trajectory",
      keyInsights: JSON.stringify([
        "Quarterly revenue target exceeded by 12%",
        "Cost optimization initiatives showing results",
        "Market expansion strategy on track",
      ]),
      metricsData: JSON.stringify({
        revenue: {
          current: 3750000,
          previous: 3261000,
          change: 15,
          changePercent: 15,
          trend: "up",
        },
        expenses: {
          current: 2760000,
          previous: 3000000,
          change: -8,
          changePercent: -8,
          trend: "down",
        },
        profit: {
          current: 990000,
          previous: 261000,
          change: 279,
          changePercent: 279,
          trend: "up",
        },
        cashFlow: {
          current: 840000,
          previous: 150000,
          change: 460,
          changePercent: 460,
          trend: "up",
        },
        arDays: {
          current: 25,
          previous: 32,
          change: -7,
          changePercent: -22,
          trend: "up",
        },
        apDays: {
          current: 20,
          previous: 28,
          change: -8,
          changePercent: -29,
          trend: "up",
        },
        ebitda: {
          current: 1350000,
          previous: 600000,
          change: 125,
          changePercent: 125,
          trend: "up",
        },
        margins: {
          current: 26.4,
          previous: 8,
          change: 18.4,
          changePercent: 18.4,
          trend: "up",
        },
      }),
    },
  ];

  // Sample AI insights
  const sampleInsights = [
    {
      type: "trend",
      title: "Strong Profit Margins",
      description:
        "Your profit margin of 26.4% is above industry average. Consider reinvesting in growth opportunities.",
      severity: "low",
      category: "revenue",
      actionable: 1,
      action: "Review growth investment opportunities",
    },
    {
      type: "alert",
      title: "High Expense Ratio",
      description:
        "Expenses represent 73.6% of revenue. Consider cost reduction strategies.",
      severity: "medium",
      category: "expenses",
      actionable: 1,
      action: "Analyze expense categories for optimization",
    },
    {
      type: "trend",
      title: "Positive Cash Flow",
      description:
        "Net income of $330,000 indicates healthy cash flow. Consider debt reduction or investment.",
      severity: "low",
      category: "cash_flow",
      actionable: 1,
      action: "Review cash management strategies",
    },
    {
      type: "recommendation",
      title: "High Transaction Volume",
      description:
        "156 transactions processed this month. Consider automation to improve efficiency.",
      severity: "medium",
      category: "efficiency",
      actionable: 1,
      action: "Evaluate process automation opportunities",
    },
    {
      type: "alert",
      title: "AR Days Improvement",
      description:
        "Accounts receivable days improved from 35 to 28 days. Continue monitoring collection efficiency.",
      severity: "low",
      category: "cash_flow",
      actionable: 1,
      action: "Maintain collection efficiency standards",
    },
  ];

  // Insert sample reports
  let reportsInserted = 0;
  sampleReports.forEach((report) => {
    db.run(
      `
      INSERT INTO financial_reports 
      (type, period, summary, key_insights, metrics_data)
      VALUES (?, ?, ?, ?, ?)
    `,
      [
        report.type,
        report.period,
        report.summary,
        report.keyInsights,
        report.metricsData,
      ],
      function (err) {
        if (err) {
          console.error("Error inserting report:", err);
        } else {
          reportsInserted++;
          console.log(`✅ Inserted report: ${report.type} - ${report.period}`);

          if (reportsInserted === sampleReports.length) {
            console.log("📊 All sample reports inserted successfully");
          }
        }
      }
    );
  });

  // Insert sample insights
  let insightsInserted = 0;
  sampleInsights.forEach((insight) => {
    db.run(
      `
      INSERT INTO ai_insights 
      (type, insight_type, title, description, severity, category, actionable, action, timestamp)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
      [
        insight.type,
        insight.type,
        insight.title,
        insight.description,
        insight.severity,
        insight.category,
        insight.actionable,
        insight.action,
        new Date().toISOString(),
      ],
      function (err) {
        if (err) {
          console.error("Error inserting insight:", err);
        } else {
          insightsInserted++;
          console.log(`✅ Inserted insight: ${insight.title}`);

          if (insightsInserted === sampleInsights.length) {
            console.log("💡 All sample insights inserted successfully");
            console.log("🎉 Database seeding completed!");
            db.close();
          }
        }
      }
    );
  });
};

// Run if called directly
if (require.main === module) {
  console.log("🌱 Seeding reports and insights data...");
  seedReportsAndInsights();
}

module.exports = { seedReportsAndInsights };
