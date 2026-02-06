// server/controllers/exportController.js
const Transaction = require('../models/Transaction');

// @desc    Export transactions to CSV
// @route   GET /api/transactions/export/csv
// @access  Private
const exportToCSV = async (req, res) => {
  try {
    const { startDate, endDate, type, category } = req.query;
    const query = { user: req.user._id };
    
    if (type) query.type = type;
    if (category) query.category = category;
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }
    
    const transactions = await Transaction.find(query).sort({ date: -1 });
    
    // Create CSV header
    const headers = ['Date', 'Type', 'Category', 'Title', 'Amount', 'Reference'];
    let csv = headers.join(',') + '\n';
    
    // Add transaction rows
    transactions.forEach(transaction => {
      const row = [
        new Date(transaction.date).toISOString().split('T')[0],
        transaction.type,
        transaction.category,
        `"${transaction.title.replace(/"/g, '""')}"`,
        transaction.amount,
        transaction.reference ? `"${transaction.reference.replace(/"/g, '""')}"` : ''
      ];
      csv += row.join(',') + '\n';
    });
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=transactions-${Date.now()}.csv`);
    res.send(csv);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get export data (for PDF generation on frontend)
// @route   GET /api/transactions/export/data
// @access  Private
const getExportData = async (req, res) => {
  try {
    const { startDate, endDate, type, category } = req.query;
    const query = { user: req.user._id };
    
    if (type) query.type = type;
    if (category) query.category = category;
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }
    
    const transactions = await Transaction.find(query).sort({ date: -1 });
    
    // Calculate summary
    const summary = await Transaction.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$type',
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      }
    ]);
    
    const incomeTotal = summary.find(s => s._id === 'income')?.total || 0;
    const expenseTotal = summary.find(s => s._id === 'expense')?.total || 0;
    
    res.json({
      transactions,
      summary: {
        income: incomeTotal,
        expense: expenseTotal,
        balance: incomeTotal - expenseTotal,
        totalTransactions: transactions.length
      },
      dateRange: {
        startDate: startDate || null,
        endDate: endDate || null
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  exportToCSV,
  getExportData
};

