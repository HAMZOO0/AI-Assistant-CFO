const db = require('./database/init');

console.log('🔍 Checking database contents...\n');

// Check financial_transactions table
db.all("SELECT COUNT(*) as count FROM financial_transactions", (err, rows) => {
  if (err) {
    console.error('❌ Error checking financial_transactions:', err);
  } else {
    console.log(`📊 Financial transactions: ${rows[0].count} records`);
  }
});

// Check financial_reports table
db.all("SELECT COUNT(*) as count FROM financial_reports", (err, rows) => {
  if (err) {
    console.error('❌ Error checking financial_reports:', err);
  } else {
    console.log(`📋 Financial reports: ${rows[0].count} records`);
  }
});

// Check ai_insights table
db.all("SELECT COUNT(*) as count FROM ai_insights", (err, rows) => {
  if (err) {
    console.error('❌ Error checking ai_insights:', err);
  } else {
    console.log(`🤖 AI insights: ${rows[0].count} records`);
  }
});

// Check budget_variance table
db.all("SELECT COUNT(*) as count FROM budget_variance", (err, rows) => {
  if (err) {
    console.error('❌ Error checking budget_variance:', err);
  } else {
    console.log(`💰 Budget variance: ${rows[0].count} records`);
  }
});

// Sample data from financial_transactions
db.all("SELECT * FROM financial_transactions LIMIT 3", (err, rows) => {
  if (err) {
    console.error('❌ Error fetching sample transactions:', err);
  } else {
    console.log('\n📝 Sample transactions:');
    console.log(JSON.stringify(rows, null, 2));
  }
  
  // Close database connection
  db.close();
});
