const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const router = express.Router();
const dbPath = path.join(__dirname, '../database/cfo_assistant.db');

// Initialize reports table
const initReportsTable = () => {
  const db = new sqlite3.Database(dbPath);
  
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

  db.close();
};

// Initialize the table
initReportsTable();

// GET /api/reports - Get all financial reports
router.get('/', (req, res) => {
  const db = new sqlite3.Database(dbPath);
  
  db.all(
    'SELECT * FROM financial_reports ORDER BY generated_at DESC',
    [],
    (err, rows) => {
      if (err) {
        console.error('Error fetching reports:', err);
        res.status(500).json({ error: 'Failed to fetch reports' });
      } else {
        // Parse metrics_data from JSON string
        const reports = rows.map(row => ({
          ...row,
          keyInsights: JSON.parse(row.key_insights || '[]'),
          metrics: JSON.parse(row.metrics_data || '{}'),
          generatedAt: new Date(row.generated_at)
        }));
        res.json(reports);
      }
      db.close();
    }
  );
});

// POST /api/reports - Create new financial report
router.post('/', (req, res) => {
  const { type, period, summary, keyInsights, metrics } = req.body;
  
  if (!type || !period || !summary || !keyInsights || !metrics) {
    return res.status(400).json({ 
      error: 'Missing required fields: type, period, summary, keyInsights, metrics' 
    });
  }
  
  const db = new sqlite3.Database(dbPath);
  
  const query = `
    INSERT INTO financial_reports 
    (type, period, summary, key_insights, metrics_data)
    VALUES (?, ?, ?, ?, ?)
  `;
  
  db.run(query, [
    type,
    period,
    summary,
    JSON.stringify(keyInsights),
    JSON.stringify(metrics)
  ], function(err) {
    if (err) {
      console.error('Error creating report:', err);
      res.status(500).json({ error: 'Failed to create report' });
    } else {
      res.json({
        id: this.lastID,
        type,
        period,
        summary,
        keyInsights,
        metrics,
        generatedAt: new Date().toISOString()
      });
    }
    db.close();
  });
});

// GET /api/reports/generate - Generate reports from financial data
router.get('/generate', async (req, res) => {
  try {
    const db = new sqlite3.Database(dbPath);
    
    // Get financial data from transactions
    db.get(`
      SELECT 
        SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END) as revenue,
        SUM(CASE WHEN amount < 0 THEN ABS(amount) ELSE 0 END) as expenses,
        SUM(amount) as net_income,
        COUNT(*) as transaction_count
      FROM financial_transactions
    `, [], async (err, financialData) => {
      if (err) {
        console.error('Error fetching financial data:', err);
        return res.status(500).json({ error: 'Failed to fetch financial data' });
      }
      
      if (!financialData || financialData.transaction_count === 0) {
        return res.status(404).json({ error: 'No financial data available for report generation' });
      }
      
      const revenue = financialData.revenue || 0;
      const expenses = financialData.expenses || 0;
      const profit = financialData.net_income || 0;
      const margin = revenue > 0 ? (profit / revenue) * 100 : 0;
      const cashFlow = profit * 0.8;
      
      // Calculate changes (simplified - in real app would compare with previous period)
      const revenueChange = 15; // This would be calculated from historical data
      const expensesChange = -8;
      const profitChange = 25;
      
      // Generate monthly report
      const monthlyReport = {
        type: 'monthly',
        period: new Date().toISOString().slice(0, 7), // YYYY-MM format
        summary: `Financial performance for ${new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`,
        keyInsights: [
          `Revenue: $${revenue.toLocaleString()} (${revenueChange > 0 ? '+' : ''}${revenueChange}% vs previous)`,
          `Expenses: $${expenses.toLocaleString()} (${expensesChange > 0 ? '+' : ''}${expensesChange}% vs previous)`,
          `Profit Margin: ${margin.toFixed(1)}%`,
          `Cash Flow: $${cashFlow.toLocaleString()}`
        ],
        metrics: {
          revenue: { current: revenue, previous: revenue * 0.95, change: revenueChange, changePercent: revenueChange, trend: 'up' },
          expenses: { current: expenses, previous: expenses * 1.05, change: expensesChange, changePercent: expensesChange, trend: 'down' },
          profit: { current: profit, previous: profit * 0.9, change: profitChange, changePercent: profitChange, trend: 'up' },
          cashFlow: { current: cashFlow, previous: cashFlow * 0.85, change: 15, changePercent: 15, trend: 'up' },
          arDays: { current: 30, previous: 35, change: -5, changePercent: -14.3, trend: 'up' },
          apDays: { current: 25, previous: 30, change: -5, changePercent: -16.7, trend: 'up' },
          ebitda: { current: profit * 1.2, previous: profit * 1.1, change: 10, changePercent: 10, trend: 'up' },
          margins: { current: margin, previous: margin * 0.9, change: 10, changePercent: 10, trend: 'up' }
        }
      };
      
      // Insert monthly report
      const insertQuery = `
        INSERT INTO financial_reports 
        (type, period, summary, key_insights, metrics_data)
        VALUES (?, ?, ?, ?, ?)
      `;
      
      db.run(insertQuery, [
        monthlyReport.type,
        monthlyReport.period,
        monthlyReport.summary,
        JSON.stringify(monthlyReport.keyInsights),
        JSON.stringify(monthlyReport.metrics)
      ], function(err) {
        if (err) {
          console.error('Error inserting report:', err);
          return res.status(500).json({ error: 'Failed to generate report' });
        }
        
        res.json({
          message: 'Report generated successfully',
          report: {
            id: this.lastID,
            ...monthlyReport,
            generatedAt: new Date().toISOString()
          }
        });
        db.close();
      });
    });
  } catch (error) {
    console.error('Error generating report:', error);
    res.status(500).json({ error: 'Failed to generate report' });
  }
});

// DELETE /api/reports/:id - Delete a report
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  const db = new sqlite3.Database(dbPath);
  
  db.run('DELETE FROM financial_reports WHERE id = ?', [id], function(err) {
    if (err) {
      console.error('Error deleting report:', err);
      res.status(500).json({ error: 'Failed to delete report' });
    } else if (this.changes === 0) {
      res.status(404).json({ error: 'Report not found' });
    } else {
      res.json({ message: 'Report deleted successfully' });
    }
    db.close();
  });
});

module.exports = router;
