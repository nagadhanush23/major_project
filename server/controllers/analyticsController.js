// server/controllers/analyticsController.js
const Transaction = require('../models/Transaction');

// @desc    Get year-over-year comparison
// @route   GET /api/analytics/year-over-year
// @access  Private
const getYearOverYear = async (req, res) => {
  try {
    const { year } = req.query;
    const currentYear = year ? parseInt(year) : new Date().getFullYear();
    const previousYear = currentYear - 1;
    
    const [currentYearData, previousYearData] = await Promise.all([
      Transaction.aggregate([
        {
          $match: {
            user: req.user._id,
            date: {
              $gte: new Date(currentYear, 0, 1),
              $lt: new Date(currentYear + 1, 0, 1)
            }
          }
        },
        {
          $group: {
            _id: { month: { $month: '$date' }, type: '$type' },
            total: { $sum: '$amount' }
          }
        },
        { $sort: { '_id.month': 1 } }
      ]),
      Transaction.aggregate([
        {
          $match: {
            user: req.user._id,
            date: {
              $gte: new Date(previousYear, 0, 1),
              $lt: new Date(previousYear + 1, 0, 1)
            }
          }
        },
        {
          $group: {
            _id: { month: { $month: '$date' }, type: '$type' },
            total: { $sum: '$amount' }
          }
        },
        { $sort: { '_id.month': 1 } }
      ])
    ]);
    
    res.json({
      currentYear: currentYearData,
      previousYear: previousYearData,
      currentYearTotal: currentYearData.reduce((sum, item) => sum + item.total, 0),
      previousYearTotal: previousYearData.reduce((sum, item) => sum + item.total, 0)
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get spending trends
// @route   GET /api/analytics/trends
// @access  Private
const getSpendingTrends = async (req, res) => {
  try {
    const { months = 6 } = req.query;
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - parseInt(months));
    
    const trends = await Transaction.aggregate([
      {
        $match: {
          user: req.user._id,
          type: 'expense',
          date: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$date' },
            month: { $month: '$date' },
            category: '$category'
          },
          total: { $sum: '$amount' }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);
    
    res.json(trends);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get custom date range report
// @route   GET /api/analytics/custom-range
// @access  Private
const getCustomRangeReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({ message: 'Please provide startDate and endDate' });
    }
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    const [income, expenses, byCategory] = await Promise.all([
      Transaction.aggregate([
        {
          $match: {
            user: req.user._id,
            type: 'income',
            date: { $gte: start, $lte: end }
          }
        },
        { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }
      ]),
      Transaction.aggregate([
        {
          $match: {
            user: req.user._id,
            type: 'expense',
            date: { $gte: start, $lte: end }
          }
        },
        { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }
      ]),
      Transaction.aggregate([
        {
          $match: {
            user: req.user._id,
            date: { $gte: start, $lte: end }
          }
        },
        {
          $group: {
            _id: { category: '$category', type: '$type' },
            total: { $sum: '$amount' },
            count: { $sum: 1 }
          }
        },
        { $sort: { total: -1 } }
      ])
    ]);
    
    res.json({
      income: income[0] || { total: 0, count: 0 },
      expenses: expenses[0] || { total: 0, count: 0 },
      balance: (income[0]?.total || 0) - (expenses[0]?.total || 0),
      byCategory,
      dateRange: { startDate, endDate }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get income vs expense projections
// @route   GET /api/analytics/projections
// @access  Private
const getProjections = async (req, res) => {
  try {
    const { months = 3 } = req.query;
    
    // Get average monthly income and expense from last 6 months
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    const [avgIncome, avgExpense] = await Promise.all([
      Transaction.aggregate([
        {
          $match: {
            user: req.user._id,
            type: 'income',
            date: { $gte: sixMonthsAgo }
          }
        },
        {
          $group: {
            _id: { year: { $year: '$date' }, month: { $month: '$date' } },
            total: { $sum: '$amount' }
          }
        },
        { $group: { _id: null, average: { $avg: '$total' } } }
      ]),
      Transaction.aggregate([
        {
          $match: {
            user: req.user._id,
            type: 'expense',
            date: { $gte: sixMonthsAgo }
          }
        },
        {
          $group: {
            _id: { year: { $year: '$date' }, month: { $month: '$date' } },
            total: { $sum: '$amount' }
          }
        },
        { $group: { _id: null, average: { $avg: '$total' } } }
      ])
    ]);
    
    const monthlyIncome = avgIncome[0]?.average || 0;
    const monthlyExpense = avgExpense[0]?.average || 0;
    
    // Get current balance
    const currentBalance = await Transaction.aggregate([
      { $match: { user: req.user._id, type: 'income' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const incomeTotal = currentBalance[0]?.total || 0;
    
    const expenseTotal = await Transaction.aggregate([
      { $match: { user: req.user._id, type: 'expense' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const expenseSum = expenseTotal[0]?.total || 0;
    
    const currentBal = incomeTotal - expenseSum;
    
    // Project for next N months
    const projections = [];
    for (let i = 1; i <= parseInt(months); i++) {
      const projectedIncome = currentBal + (monthlyIncome * i);
      const projectedExpense = monthlyExpense * i;
      const projectedBalance = projectedIncome - projectedExpense;
      
      projections.push({
        month: i,
        projectedIncome,
        projectedExpense,
        projectedBalance
      });
    }
    
    res.json({
      currentBalance: currentBal,
      averageMonthlyIncome: monthlyIncome,
      averageMonthlyExpense: monthlyExpense,
      projections
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getYearOverYear,
  getSpendingTrends,
  getCustomRangeReport,
  getProjections
};

