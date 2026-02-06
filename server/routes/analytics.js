// server/routes/analytics.js
const express = require('express');
const router = express.Router();
const { 
  getYearOverYear,
  getSpendingTrends,
  getCustomRangeReport,
  getProjections
} = require('../controllers/analyticsController');
const { protect } = require('../middleware/auth');

router.get('/year-over-year', protect, getYearOverYear);
router.get('/trends', protect, getSpendingTrends);
router.get('/custom-range', protect, getCustomRangeReport);
router.get('/projections', protect, getProjections);

module.exports = router;

