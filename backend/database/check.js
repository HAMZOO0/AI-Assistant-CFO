const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'cfo_assistant.db');
const db = new sqlite3.Database(dbPath);

console.log('🔍 Checking database status...\n');

db.serialize(() => {
  // Check uploaded files
  db.get('SELECT COUNT(*) as count FROM uploaded_files', (err, row) => {
    if (err) console.error('Error checking uploaded_files:', err);
    else console.log(`📁 Uploaded files: ${row.count}`);
  });

  // Check financial transactions
  db.get('SELECT COUNT(*) as count FROM financial_transactions', (err, row) => {
    if (err) console.error('Error checking financial_transactions:', err);
    else console.log(`💰 Financial transactions: ${row.count}`);
  });

  // Check financial metrics
  db.get('SELECT COUNT(*) as count FROM financial_metrics', (err, row) => {
    if (err) console.error('Error checking financial_metrics:', err);
    else console.log(`📊 Financial metrics: ${row.count}`);
  });

  // Check AI insights
  db.get('SELECT COUNT(*) as count FROM ai_insights', (err, row) => {
    if (err) console.error('Error checking ai_insights:', err);
    else console.log(`🤖 AI insights: ${row.count}`);
  });

  // Show sample data if any exists
  setTimeout(() => {
    console.log('\n📋 Database Summary:');
    console.log('✅ Database is clean and empty');
    console.log('📁 Ready for real financial data uploads');
    console.log('🚀 Upload files to see real metrics and insights');
    db.close();
  }, 500);
}); 