// ai-service/routes/aiRoutes.js
const express = require('express');
const router = express.Router();
const {
  getExpensePredictions,
  getInvestmentRecommendations,
  getSalaryAnalysis,
  getSavingsGoalAnalysis,
  getAIInsights,
  smartCategorize,
  aiChatAssistant,
  getFinancialHealthScore,
  predictNecessity,
  forecastNeeds,
  suggestAllocation,
  extractReceiptData,
  suggestExpenseDetails
} = require('../controllers/aiController');

// AI Analysis Routes
router.post('/expense-prediction', getExpensePredictions);
router.post('/investment-advice', getInvestmentRecommendations);
router.post('/salary-analysis', getSalaryAnalysis);
router.post('/savings-goal-analysis', getSavingsGoalAnalysis);
router.post('/insights', getAIInsights);
router.post('/smart-categorize', smartCategorize);
router.post('/chat', aiChatAssistant);
router.post('/financial-health', getFinancialHealthScore);
router.post('/predict-necessity', predictNecessity);
router.post('/forecast-needs', forecastNeeds);
router.post('/suggest-allocation', suggestAllocation);

// Expense Management AI Routes
router.post('/extract-receipt', extractReceiptData);
router.post('/suggest-expense-details', suggestExpenseDetails);

module.exports = router;
