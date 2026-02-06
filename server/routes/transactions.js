// server/routes/transactions.js
const express = require('express');
const router = express.Router();
const {
  getTransactions,
  addTransaction,
  deleteTransaction,
  updateTransaction,
  getTransactionStats,
  getAIData
} = require('../controllers/transactionController');
const { exportToCSV, getExportData } = require('../controllers/exportController');
const { protect } = require('../middleware/auth');
const { standardRateLimiter } = require('../middleware/rateLimiter');
const upload = require('../middleware/upload');
const path = require('path');

router.route('/')
  .get(protect, standardRateLimiter, getTransactions)
  .post(protect, standardRateLimiter, addTransaction);

router.route('/:id')
  .delete(protect, standardRateLimiter, deleteTransaction)
  .put(protect, standardRateLimiter, updateTransaction);

// File upload for receipts
router.post('/upload-receipt', protect, standardRateLimiter, upload.single('receipt'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    // Return the file URL
    const fileUrl = `/uploads/${req.file.filename}`;
    res.json({
      success: true,
      file_url: fileUrl,
      filename: req.file.filename
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/stats', protect, standardRateLimiter, getTransactionStats);
router.get('/ai-data', protect, standardRateLimiter, getAIData);
router.get('/export/csv', protect, standardRateLimiter, exportToCSV);
router.get('/export/data', protect, standardRateLimiter, getExportData);

module.exports = router;