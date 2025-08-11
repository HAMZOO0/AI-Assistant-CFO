const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'cfo_assistant.db');

const initReportsAndInsightsTables = () => {
  const db = new sqlite3.Database(dbPath);
  
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
  `, (err) => {
    if (err) {
      console.error('Error creating financial_reports table:', err);
    } else {
      console.log('Financial reports table initialized');
    }
  });

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
  `, (err) => {
    if (err) {
      console.error('Error creating ai_insights table:', err);
    } else {
      console.log('AI insights table initialized');
    }
  });

  // Create AR/AP aging table
  db.run(`
    CREATE TABLE IF NOT EXISTS aging_reports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL,
      period TEXT NOT NULL,
      amount REAL NOT NULL,
      percentage REAL NOT NULL,
      days_range TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `, (err) => {
    if (err) {
      console.error('Error creating aging_reports table:', err);
    } else {
      console.log('Aging reports table initialized');
    }
  });

  // Create user profiles table
  db.run(`
    CREATE TABLE IF NOT EXISTS user_profiles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      role TEXT NOT NULL,
      company TEXT NOT NULL,
      phone TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `, (err) => {
    if (err) {
      console.error('Error creating user_profiles table:', err);
    } else {
      console.log('User profiles table initialized');
    }
  });

  // Create user settings table
  db.run(`
    CREATE TABLE IF NOT EXISTS user_settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      theme TEXT DEFAULT 'light',
      language TEXT DEFAULT 'en',
      timezone TEXT DEFAULT 'UTC',
      currency TEXT DEFAULT 'USD',
      date_format TEXT DEFAULT 'MM/DD/YYYY',
      notifications TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES user_profiles (id)
    )
  `, (err) => {
    if (err) {
      console.error('Error creating user_settings table:', err);
    } else {
      console.log('User settings table initialized');
    }
  });

  db.close();
};

// Run if called directly
if (require.main === module) {
  console.log('🗄️ Initializing reports and insights tables...');
  initReportsAndInsightsTables();
}

module.exports = { initReportsAndInsightsTables };
