const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const router = express.Router();
const dbPath = path.join(__dirname, '../database/cfo_assistant.db');

// Initialize insights table
const initInsightsTable = () => {
  const db = new sqlite3.Database(dbPath);
  
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

  db.close();
};

// Initialize the table
initInsightsTable();

// GET /api/insights - Get all AI insights
router.get('/', (req, res) => {
  const db = new sqlite3.Database(dbPath);
  
  db.all(
    'SELECT * FROM ai_insights ORDER BY timestamp DESC',
    [],
    (err, rows) => {
      if (err) {
        console.error('Error fetching insights:', err);
        res.status(500).json({ error: 'Failed to fetch insights' });
      } else {
        const insights = rows.map(row => ({
          ...row,
          timestamp: new Date(row.timestamp),
          createdAt: new Date(row.created_at)
        }));
        res.json(insights);
      }
      db.close();
    }
  );
});

// POST /api/insights - Create new AI insight
router.post('/', (req, res) => {
  const { type, title, description, severity, category, actionable, action } = req.body;
  
  if (!type || !title || !description || !severity || !category) {
    return res.status(400).json({ 
      error: 'Missing required fields: type, title, description, severity, category' 
    });
  }
  
  const db = new sqlite3.Database(dbPath);
  
  const query = `
    INSERT INTO ai_insights 
    (type, title, description, severity, category, actionable, action)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;
  
  db.run(query, [
    type,
    title,
    description,
    severity,
    category,
    actionable ? 1 : 0,
    action || null
  ], function(err) {
    if (err) {
      console.error('Error creating insight:', err);
      res.status(500).json({ error: 'Failed to create insight' });
    } else {
      res.json({
        id: this.lastID,
        type,
        title,
        description,
        severity,
        category,
        actionable: actionable ? true : false,
        action,
        timestamp: new Date().toISOString()
      });
    }
    db.close();
  });
});

// GET /api/insights/generate - Generate insights from financial data
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
        return res.status(404).json({ error: 'No financial data available for insight generation' });
      }
      
      const revenue = financialData.revenue || 0;
      const expenses = financialData.expenses || 0;
      const profit = financialData.net_income || 0;
      const margin = revenue > 0 ? (profit / revenue) * 100 : 0;
      
      // Generate insights based on financial data
      const insights = [];
      
      // Revenue insights
      if (revenue > 0) {
        if (margin > 20) {
          insights.push({
            type: 'trend',
            title: 'Strong Profit Margins',
            description: `Your profit margin of ${margin.toFixed(1)}% is above industry average. Consider reinvesting in growth opportunities.`,
            severity: 'low',
            category: 'revenue',
            actionable: true,
            action: 'Review growth investment opportunities'
          });
        } else if (margin < 10) {
          insights.push({
            type: 'alert',
            title: 'Low Profit Margins',
            description: `Your profit margin of ${margin.toFixed(1)}% is below optimal levels. Focus on cost optimization and pricing strategies.`,
            severity: 'high',
            category: 'revenue',
            actionable: true,
            action: 'Review pricing and cost structure'
          });
        }
      }
      
      // Expense insights
      if (expenses > revenue * 0.8) {
        insights.push({
          type: 'alert',
          title: 'High Expense Ratio',
          description: `Expenses represent ${((expenses / revenue) * 100).toFixed(1)}% of revenue. Consider cost reduction strategies.`,
          severity: 'medium',
          category: 'expenses',
          actionable: true,
          action: 'Analyze expense categories for optimization'
        });
      }
      
      // Cash flow insights
      if (profit > 0) {
        insights.push({
          type: 'trend',
          title: 'Positive Cash Flow',
          description: `Net income of $${profit.toLocaleString()} indicates healthy cash flow. Consider debt reduction or investment.`,
          severity: 'low',
          category: 'cash_flow',
          actionable: true,
          action: 'Review cash management strategies'
        });
      } else {
        insights.push({
          type: 'alert',
          title: 'Negative Cash Flow',
          description: `Net loss of $${Math.abs(profit).toLocaleString()} requires immediate attention to cash flow management.`,
          severity: 'critical',
          category: 'cash_flow',
          actionable: true,
          action: 'Implement cash flow improvement measures'
        });
      }
      
      // Transaction volume insights
      if (financialData.transaction_count > 100) {
        insights.push({
          type: 'recommendation',
          title: 'High Transaction Volume',
          description: `${financialData.transaction_count} transactions processed. Consider automation to improve efficiency.`,
          severity: 'medium',
          category: 'efficiency',
          actionable: true,
          action: 'Evaluate process automation opportunities'
        });
      }
      
      // Insert insights into database
      if (insights.length > 0) {
        const insertQuery = `
          INSERT INTO ai_insights 
          (type, title, description, severity, category, actionable, action)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `;
        
        let insertedCount = 0;
        insights.forEach(insight => {
          db.run(insertQuery, [
            insight.type,
            insight.title,
            insight.description,
            insight.severity,
            insight.category,
            insight.actionable ? 1 : 0,
            insight.action
          ], function(err) {
            if (err) {
              console.error('Error inserting insight:', err);
            } else {
              insertedCount++;
              if (insertedCount === insights.length) {
                res.json({
                  message: `${insights.length} insights generated successfully`,
                  insights: insights.map((insight, index) => ({
                    id: this.lastID - insights.length + index + 1,
                    ...insight,
                    timestamp: new Date().toISOString()
                  }))
                });
                db.close();
              }
            }
          });
        });
      } else {
        res.json({
          message: 'No insights generated - insufficient data patterns',
          insights: []
        });
        db.close();
      }
    });
  } catch (error) {
    console.error('Error generating insights:', error);
    res.status(500).json({ error: 'Failed to generate insights' });
  }
});

// PUT /api/insights/:id - Update insight (mark as read)
router.put('/:id', (req, res) => {
  const { id } = req.params;
  const { actionable } = req.body;
  
  const db = new sqlite3.Database(dbPath);
  
  db.run(
    'UPDATE ai_insights SET actionable = ? WHERE id = ?',
    [actionable ? 1 : 0, id],
    function(err) {
      if (err) {
        console.error('Error updating insight:', err);
        res.status(500).json({ error: 'Failed to update insight' });
      } else if (this.changes === 0) {
        res.status(404).json({ error: 'Insight not found' });
      } else {
        res.json({ message: 'Insight updated successfully' });
      }
      db.close();
    }
  );
});

// DELETE /api/insights/:id - Delete an insight
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  const db = new sqlite3.Database(dbPath);
  
  db.run('DELETE FROM ai_insights WHERE id = ?', [id], function(err) {
    if (err) {
      console.error('Error deleting insight:', err);
      res.status(500).json({ error: 'Failed to delete insight' });
    } else if (this.changes === 0) {
      res.status(404).json({ error: 'Insight not found' });
    } else {
      res.json({ message: 'Insight deleted successfully' });
    }
    db.close();
  });
});

module.exports = router;
