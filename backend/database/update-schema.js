const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const dbPath = path.join(__dirname, "cfo_assistant.db");
const db = new sqlite3.Database(dbPath);

console.log("🔄 Updating database schema...");

db.serialize(() => {
  // Update ai_insights table schema
  console.log("📝 Updating ai_insights table...");

  // Add new columns if they don't exist
  db.run("ALTER TABLE ai_insights ADD COLUMN type TEXT", (err) => {
    if (err && !err.message.includes("duplicate column name")) {
      console.log('Column "type" already exists or error:', err.message);
    } else {
      console.log('✅ Added "type" column to ai_insights');
    }
  });

  db.run("ALTER TABLE ai_insights ADD COLUMN timestamp DATETIME", (err) => {
    if (err && !err.message.includes("duplicate column name")) {
      console.log('Column "timestamp" already exists or error:', err.message);
    } else {
      console.log('✅ Added "timestamp" column to ai_insights');
    }
  });

  // Update existing records to use the new schema
  db.run(
    `
    UPDATE ai_insights 
    SET type = insight_type, 
        timestamp = created_at 
    WHERE type IS NULL
  `,
    (err) => {
      if (err) {
        console.log("Error updating existing records:", err.message);
      } else {
        console.log("✅ Updated existing ai_insights records");
      }
    }
  );

  // Ensure financial_reports table has all required columns
  console.log("📝 Checking financial_reports table...");
  db.run(
    "ALTER TABLE financial_reports ADD COLUMN generated_at DATETIME",
    (err) => {
      if (err && !err.message.includes("duplicate column name")) {
        console.log(
          'Column "generated_at" already exists or error:',
          err.message
        );
      } else {
        console.log('✅ Added "generated_at" column to financial_reports');
      }
    }
  );

  // Update existing reports to have generated_at if missing
  db.run(
    `
    UPDATE financial_reports 
    SET generated_at = created_at 
    WHERE generated_at IS NULL
  `,
    (err) => {
      if (err) {
        console.log("Error updating reports:", err.message);
      } else {
        console.log("✅ Updated existing financial_reports records");
      }
    }
  );

  // Create missing tables if they don't exist
  console.log("📝 Creating missing tables...");

  db.run(
    `
    CREATE TABLE IF NOT EXISTS aging_reports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL,
      customer_vendor TEXT NOT NULL,
      amount REAL NOT NULL,
      days_outstanding INTEGER NOT NULL,
      category TEXT NOT NULL,
      risk_level TEXT DEFAULT 'low',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `,
    (err) => {
      if (err) {
        console.log("Error creating aging_reports table:", err.message);
      } else {
        console.log("✅ aging_reports table ready");
      }
    }
  );

  db.run(
    `
    CREATE TABLE IF NOT EXISTS user_profiles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT UNIQUE NOT NULL,
      company_name TEXT,
      industry TEXT,
      company_size TEXT,
      preferences TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `,
    (err) => {
      if (err) {
        console.log("Error creating user_profiles table:", err.message);
      } else {
        console.log("✅ user_profiles table ready");
      }
    }
  );

  db.run(
    `
    CREATE TABLE IF NOT EXISTS user_settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT UNIQUE NOT NULL,
      theme TEXT DEFAULT 'light',
      currency TEXT DEFAULT 'USD',
      date_format TEXT DEFAULT 'MM/DD/YYYY',
      notifications_enabled BOOLEAN DEFAULT 1,
      auto_refresh_interval INTEGER DEFAULT 300,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `,
    (err) => {
      if (err) {
        console.log("Error creating user_settings table:", err.message);
      } else {
        console.log("✅ user_settings table ready");
      }
    }
  );

  db.run(
    `
    CREATE TABLE IF NOT EXISTS budget_variance (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      period TEXT NOT NULL,
      category TEXT NOT NULL,
      budgeted REAL NOT NULL,
      actual REAL NOT NULL,
      variance REAL NOT NULL,
      variance_percent REAL NOT NULL,
      type TEXT NOT NULL,
      department TEXT,
      last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `,
    (err) => {
      if (err) {
        console.log("Error creating budget_variance table:", err.message);
      } else {
        console.log("✅ budget_variance table ready");
      }
    }
  );

  // Final check
  setTimeout(() => {
    console.log("\n📊 Schema update completed!");
    console.log("✅ Database is ready for use");
    db.close();
  }, 1000);
});
