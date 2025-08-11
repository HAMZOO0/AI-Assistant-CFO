const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'cfo_assistant.db');
const db = new sqlite3.Database(dbPath);

console.log('🗑️ Clearing all data from database...');

db.serialize(() => {
  // Clear all tables
  db.run('DELETE FROM ai_insights', (err) => {
    if (err) console.error('Error clearing ai_insights:', err);
    else console.log('✅ Cleared ai_insights table');
  });

  db.run('DELETE FROM financial_metrics', (err) => {
    if (err) console.error('Error clearing financial_metrics:', err);
    else console.log('✅ Cleared financial_metrics table');
  });

  db.run('DELETE FROM financial_transactions', (err) => {
    if (err) console.error('Error clearing financial_transactions:', err);
    else console.log('✅ Cleared financial_transactions table');
  });

  db.run('DELETE FROM uploaded_files', (err) => {
    if (err) console.error('Error clearing uploaded_files:', err);
    else console.log('✅ Cleared uploaded_files table');
  });

  // Reset auto-increment counters
  db.run('DELETE FROM sqlite_sequence WHERE name IN ("ai_insights", "financial_metrics", "financial_transactions", "uploaded_files")', (err) => {
    if (err) console.error('Error resetting sequences:', err);
    else console.log('✅ Reset auto-increment counters');
  });

  console.log('🎉 Database cleared successfully!');
  console.log('📊 All mock/trash data removed');
  console.log('📁 Database is now empty and ready for real data');
});

db.close(); 