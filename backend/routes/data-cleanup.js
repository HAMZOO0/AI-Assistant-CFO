const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

// Database path
const dbPath = path.join(__dirname, '../database/cfo_assistant.db');
const uploadsDir = path.join(__dirname, '../uploads');

// Function to clear all data from database
const clearDatabase = () => {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(dbPath);
    
    db.serialize(() => {
      try {
        // Clear all tables
        db.run('DELETE FROM uploaded_files', (err) => {
          if (err) {
            console.error('Error clearing uploaded_files:', err);
            reject(err);
            return;
          }
        });
        
        db.run('DELETE FROM financial_transactions', (err) => {
          if (err) {
            console.error('Error clearing financial_transactions:', err);
            reject(err);
            return;
          }
        });
        
        db.run('DELETE FROM financial_metrics', (err) => {
          if (err) {
            console.error('Error clearing financial_metrics:', err);
            reject(err);
            return;
          }
        });
        
        db.run('DELETE FROM ai_insights', (err) => {
          if (err) {
            console.error('Error clearing ai_insights:', err);
            reject(err);
            return;
          }
        });
        
        // Reset auto-increment counters
        db.run('DELETE FROM sqlite_sequence', (err) => {
          if (err) {
            console.error('Error resetting auto-increment:', err);
            reject(err);
            return;
          }
        });
        
        db.close((err) => {
          if (err) {
            console.error('Error closing database:', err);
            reject(err);
            return;
          }
          console.log('✅ Database cleared successfully');
          resolve();
        });
      } catch (error) {
        console.error('Error in clearDatabase:', error);
        reject(error);
      }
    });
  });
};

// Function to clear all uploaded files
const clearUploadedFiles = () => {
  return new Promise((resolve, reject) => {
    try {
      if (fs.existsSync(uploadsDir)) {
        const files = fs.readdirSync(uploadsDir);
        
        files.forEach(file => {
          const filePath = path.join(uploadsDir, file);
          try {
            fs.unlinkSync(filePath);
            console.log(`🗑️ Deleted file: ${file}`);
          } catch (err) {
            console.error(`Error deleting file ${file}:`, err);
          }
        });
        
        console.log('✅ Uploaded files cleared successfully');
        resolve();
      } else {
        console.log('📁 Uploads directory does not exist, skipping file cleanup');
        resolve();
      }
    } catch (error) {
      console.error('Error in clearUploadedFiles:', error);
      reject(error);
    }
  });
};

// Route to clear all data
router.delete('/clear-all-data', async (req, res) => {
  try {
    console.log('🧹 Starting complete data cleanup...');
    
    // Clear database
    await clearDatabase();
    
    // Clear uploaded files
    await clearUploadedFiles();
    
    console.log('✅ Complete data cleanup finished successfully');
    
    res.json({
      success: true,
      message: 'All data cleared successfully',
      timestamp: new Date().toISOString(),
      cleared: {
        database: 'All tables cleared and auto-increment reset',
        files: 'All uploaded files removed'
      }
    });
  } catch (error) {
    console.error('❌ Error during data cleanup:', error);
    res.status(500).json({
      success: false,
      message: 'Error clearing data',
      error: error.message
    });
  }
});

// Route to get cleanup status
router.get('/status', (req, res) => {
  try {
    const db = new sqlite3.Database(dbPath);
    
    // Check database status
    db.get('SELECT COUNT(*) as count FROM uploaded_files', (err, result) => {
      if (err) {
        console.error('Error checking database status:', err);
        res.status(500).json({
          success: false,
          message: 'Error checking database status',
          error: err.message
        });
        return;
      }
      
      const uploadedFilesCount = result ? result.count : 0;
      
      // Check uploaded files directory
      let uploadedFilesInDir = 0;
      if (fs.existsSync(uploadsDir)) {
        try {
          uploadedFilesInDir = fs.readdirSync(uploadsDir).length;
        } catch (err) {
          console.error('Error reading uploads directory:', err);
        }
      }
      
      db.close();
      
      res.json({
        success: true,
        status: {
          database: {
            uploadedFiles: uploadedFilesCount,
            hasData: uploadedFilesCount > 0
          },
          files: {
            uploadedFiles: uploadedFilesInDir,
            hasFiles: uploadedFilesInDir > 0
          },
          totalData: uploadedFilesCount + uploadedFilesInDir
        }
      });
    });
  } catch (error) {
    console.error('Error getting cleanup status:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting cleanup status',
      error: error.message
    });
  }
});

module.exports = router; 