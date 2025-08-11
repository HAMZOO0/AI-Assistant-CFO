const sqlite3 = require("sqlite3").verbose();
const path = require("path");

// Create database directory if it doesn't exist
const fs = require("fs");
const dbDir = path.join(__dirname);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(__dirname, "cfo_assistant.db");
const db = new sqlite3.Database(dbPath);

// Initialize database tables
db.serialize(() => {
  // Create uploaded files table
  db.run(`
    CREATE TABLE IF NOT EXISTS uploaded_files (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      filename TEXT NOT NULL,
      original_name TEXT NOT NULL,
      file_type TEXT NOT NULL,
      upload_date DATETIME DEFAULT CURRENT_TIMESTAMP,
      file_size INTEGER,
      status TEXT DEFAULT 'uploaded'
    )
  `);

  // Create financial transactions table
  db.run(`
    CREATE TABLE IF NOT EXISTS financial_transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      file_id INTEGER,
      date TEXT NOT NULL,
      description TEXT,
      category TEXT,
      amount REAL NOT NULL,
      type TEXT,
      account TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (file_id) REFERENCES uploaded_files (id)
    )
  `);

  // Create processed data table for aggregated metrics
  db.run(`
    CREATE TABLE IF NOT EXISTS financial_metrics (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      revenue REAL DEFAULT 0,
      expenses REAL DEFAULT 0,
      profit REAL DEFAULT 0,
      cash_flow REAL DEFAULT 0,
      ar_days INTEGER DEFAULT 0,
      ap_days INTEGER DEFAULT 0,
      ebitda REAL DEFAULT 0,
      margin REAL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create financial reports table
  db.run(`
    CREATE TABLE IF NOT EXISTS financial_reports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL,
      period TEXT NOT NULL,
      summary TEXT NOT NULL,
      key_insights TEXT NOT NULL,
      metrics_data TEXT NOT NULL,
      generated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create AI insights table
  db.run(`
    CREATE TABLE IF NOT EXISTS ai_insights (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      severity TEXT NOT NULL,
      category TEXT NOT NULL,
      actionable BOOLEAN DEFAULT 1,
      action TEXT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create aging reports table
  db.run(`
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
  `);

  // Create user profiles table
  db.run(`
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
  `);

  // Create user settings table
  db.run(`
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
  `);

  // Create budget variance table
  db.run(`
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
  `);

  console.log("✅ Database initialized successfully!");
  console.log(`📊 Database location: ${dbPath}`);
});

module.exports = db;
