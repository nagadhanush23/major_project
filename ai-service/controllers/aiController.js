// ai-service/controllers/aiController.js
const axios = require('axios');
const aiService = require('../services/groqService');

const MAIN_BACKEND_URL = process.env.MAIN_BACKEND_URL || 'http://localhost:5000/api';

// Helper function to fetch unified AI data (transactions + stats in one call)
const fetchAIData = async (token) => {
  try {
    const response = await axios.get(`${MAIN_BACKEND_URL}/transactions/ai-data`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    return response.data;
  } catch (error) {
    console.error(`Error fetching AI data from main backend: ${error.message}`);
    throw error;
  }
};







// @desc    AI Expense Prediction & Forecasting
// @route   POST /api/ai/expense-prediction
// @access  Private (via token)
const getExpensePredictions = async (req, res) => {
  try {
    const { token, forecastPeriod = 6 } = req.body;

    if (!token) {
      return res.status(401).json({ message: 'Authentication token required' });
    }

    // Fetch unified AI data (transactions + stats in one call)
    const aiDataResponse = await fetchAIData(token);
    const { transactions = [], stats = {} } = aiDataResponse?.data || {};

    // AI Analysis: Calculate trends and patterns
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const recentTransactions = Array.isArray(transactions)
      ? transactions.filter(t => new Date(t.date) >= sixMonthsAgo)
      : [];

    // Group by month
    const monthlyData = {};
    recentTransactions.forEach(t => {
      const date = new Date(t.date);
      const monthKey = `${date.getFullYear()}-${date.getMonth() + 1}`;
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { income: 0, expense: 0 };
      }
      if (t.type === 'income') {
        monthlyData[monthKey].income += t.amount;
      } else {
        monthlyData[monthKey].expense += t.amount;
      }
    });

    // Calculate averages and trends
    const months = Object.keys(monthlyData).sort();
    const monthlyIncomes = months.map(m => monthlyData[m].income);
    const monthlyExpenses = months.map(m => monthlyData[m].expense);

    const avgIncome = monthlyIncomes.length > 0
      ? monthlyIncomes.reduce((a, b) => a + b, 0) / monthlyIncomes.length
      : stats.totalIncome / 6;
    const avgExpense = monthlyExpenses.length > 0
      ? monthlyExpenses.reduce((a, b) => a + b, 0) / monthlyExpenses.length
      : stats.totalExpense / 6;

    // Calculate trend (linear regression)
    let incomeTrend = 0;
    let expenseTrend = 0;
    if (monthlyIncomes.length >= 2) {
      const n = monthlyIncomes.length;
      const sumX = (n * (n + 1)) / 2;
      const sumY = monthlyIncomes.reduce((a, b) => a + b, 0);
      const sumXY = monthlyIncomes.reduce((sum, val, idx) => sum + (idx + 1) * val, 0);
      const sumX2 = (n * (n + 1) * (2 * n + 1)) / 6;
      incomeTrend = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    }
    if (monthlyExpenses.length >= 2) {
      const n = monthlyExpenses.length;
      const sumX = (n * (n + 1)) / 2;
      const sumY = monthlyExpenses.reduce((a, b) => a + b, 0);
      const sumXY = monthlyExpenses.reduce((sum, val, idx) => sum + (idx + 1) * val, 0);
      const sumX2 = (n * (n + 1) * (2 * n + 1)) / 6;
      expenseTrend = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    }

    // Generate projections with trend adjustments
    const currentBalance = stats.balance || 0;
    const projections = [];
    let runningBalance = currentBalance;

    for (let i = 1; i <= forecastPeriod; i++) {
      // Apply trend (gradual adjustment)
      const trendFactor = 1 + (incomeTrend / avgIncome) * (i / forecastPeriod) * 0.3;
      const expenseTrendFactor = 1 + (expenseTrend / avgExpense) * (i / forecastPeriod) * 0.3;

      const projectedIncome = avgIncome * trendFactor;
      const projectedExpense = avgExpense * expenseTrendFactor;

      runningBalance = runningBalance + projectedIncome - projectedExpense;

      projections.push({
        month: i,
        projectedIncome: Math.round(projectedIncome * 100) / 100,
        projectedExpense: Math.round(projectedExpense * 100) / 100,
        projectedBalance: Math.round(runningBalance * 100) / 100
      });
    }

    // Generate AI insights using real AI service
    let insights = [];
    const savingsRate = avgIncome > 0 ? ((avgIncome - avgExpense) / avgIncome) * 100 : 0;

    try {
      // Use real AI for insights
      const aiAnalysis = await aiService.analyzeExpensePatterns({
        currentBalance,
        averageMonthlyIncome: avgIncome,
        averageMonthlyExpense: avgExpense,
        trends: {
          incomeTrend,
          expenseTrend,
          savingsRate
        }
      });

      if (aiAnalysis && aiAnalysis.insights) {
        insights = aiAnalysis.insights;
      }
    } catch (error) {
      console.error('AI analysis failed:', error.message);
      // Removed extensive fallback
      insights = [{ type: 'info', title: 'AI Unavailable', message: 'Could not generate detailed insights at this time.' }];
    }

    res.json({
      currentBalance: Math.round(currentBalance * 100) / 100,
      averageMonthlyIncome: Math.round(avgIncome * 100) / 100,
      averageMonthlyExpense: Math.round(avgExpense * 100) / 100,
      projections,
      insights,
      trends: {
        incomeTrend: Math.round(incomeTrend * 100) / 100,
        expenseTrend: Math.round(expenseTrend * 100) / 100,
        savingsRate: Math.round(savingsRate * 100) / 100
      }
    });
  } catch (error) {
    console.error('AI Expense Prediction Error:', error);
    res.status(500).json({ message: error.message || 'Failed to generate expense predictions' });
  }
};







// @desc    AI Investment Recommendations
// @route   POST /api/ai/investment-advice
// @access  Private
const getInvestmentRecommendations = async (req, res) => {
  try {
    const { token, sipAmount, sipDuration, expectedReturn } = req.body;

    if (!token) {
      return res.status(401).json({ message: 'Authentication token required' });
    }

    // Fetch unified AI data
    const aiDataResponse = await fetchAIData(token);
    const stats = aiDataResponse?.data?.stats || {};

    const monthlySavings = (stats.totalIncome || 0) - (stats.totalExpense || 0);
    const emergencyFundTarget = (stats.totalExpense || 0) * 6;
    const savingsRate = stats.totalIncome > 0 ? ((monthlySavings / stats.totalIncome) * 100) : 0;

    let recommendations = [];

    try {
      // Use real AI for investment recommendations
      const aiAnalysis = await aiService.analyzeInvestmentOpportunity({
        monthlySavings,
        currentBalance: stats.balance || 0,
        emergencyFundStatus: (stats.balance || 0) >= emergencyFundTarget ? 'adequate' : 'insufficient',
        savingsRate
      });

      if (aiAnalysis && aiAnalysis.recommendations) {
        recommendations = aiAnalysis.recommendations;
      }
    } catch (error) {
      console.error('AI investment analysis failed:', error.message);
      recommendations = [{ type: 'info', priority: 'medium', title: 'AI Unavailable', message: 'Please try again later for investment advice.' }];
    }

    // Calculate SIP projection if provided
    let sipProjection = null;
    if (sipAmount && sipDuration && expectedReturn) {
      const monthlyRate = expectedReturn / 12 / 100;
      const months = sipDuration * 12;
      const investedAmount = sipAmount * months;

      if (monthlyRate > 0) {
        const compoundFactor = Math.pow(1 + monthlyRate, months);
        const maturityAmount = sipAmount * (((compoundFactor - 1) / monthlyRate) * (1 + monthlyRate));
        const returns = maturityAmount - investedAmount;
        const cagr = (Math.pow(maturityAmount / investedAmount, 12 / months) - 1) * 100;

        sipProjection = {
          investedAmount: Math.round(investedAmount * 100) / 100,
          maturityAmount: Math.round(maturityAmount * 100) / 100,
          returns: Math.round(returns * 100) / 100,
          returnPercentage: Math.round((returns / investedAmount) * 100 * 100) / 100,
          cagr: Math.round(cagr * 100) / 100
        };
      }
    }

    res.json({
      recommendations,
      sipProjection,
      financialHealth: {
        monthlySavings,
        savingsRate: stats.totalIncome > 0 ? ((monthlySavings / stats.totalIncome) * 100) : 0,
        emergencyFundStatus: (stats.balance || 0) >= emergencyFundTarget ? 'adequate' : 'insufficient'
      }
    });
  } catch (error) {
    console.error('AI Investment Advice Error:', error);
    res.status(500).json({ message: error.message || 'Failed to generate investment recommendations' });
  }
};







// @desc    AI Salary Analyzer & Cost of Living
// @route   POST /api/ai/salary-analysis
// @access  Private
const getSalaryAnalysis = async (req, res) => {
  try {
    const { token, salary, location = 'Metro' } = req.body;

    if (!token) {
      return res.status(401).json({ message: 'Authentication token required' });
    }

    if (!salary || salary <= 0) {
      return res.status(400).json({ message: 'Valid salary amount is required' });
    }

    // Fetch unified AI data
    const aiDataResponse = await fetchAIData(token);
    const stats = aiDataResponse?.data?.stats || {};

    const monthlySalary = salary;
    const monthlyExpense = stats.totalExpense || 0;
    const savings = monthlySalary - monthlyExpense;
    const savingsRate = (savings / monthlySalary) * 100;

    // Cost of living estimates by location (AI-based recommendations)
    const colEstimates = {
      'Metro': { housing: 0.35, food: 0.15, transport: 0.10, other: 0.20, savings: 0.20 },
      'Tier-1': { housing: 0.30, food: 0.18, transport: 0.12, other: 0.22, savings: 0.18 },
      'Tier-2': { housing: 0.25, food: 0.20, transport: 0.10, other: 0.25, savings: 0.20 },
    };

    const col = colEstimates[location] || colEstimates['Metro'];

    const costOfLiving = {
      housing: monthlySalary * col.housing,
      food: monthlySalary * col.food,
      transport: monthlySalary * col.transport,
      other: monthlySalary * col.other,
      recommendedSavings: monthlySalary * col.savings,
      total: monthlySalary * (col.housing + col.food + col.transport + col.other)
    };

    // AI Recommendations using real AI
    let recommendations = [];
    let benchmarkComparison = {
      housing: {
        actual: (costOfLiving.housing / monthlySalary) * 100,
        recommended: col.housing * 100,
        status: (costOfLiving.housing / monthlySalary) <= col.housing ? 'good' : 'high'
      },
      savings: {
        actual: savingsRate,
        recommended: col.savings * 100,
        status: savingsRate >= (col.savings * 100) ? 'good' : 'low'
      }
    };

    try {
      const aiAnalysis = await aiService.analyzeSalaryAndCOL({
        monthlySalary,
        monthlyExpense,
        savings,
        savingsRate,
        location
      });

      if (aiAnalysis && aiAnalysis.recommendations) {
        recommendations = aiAnalysis.recommendations;
      }
      if (aiAnalysis && aiAnalysis.benchmarkComparison) {
        benchmarkComparison = aiAnalysis.benchmarkComparison;
      }
    } catch (error) {
      console.error('AI salary analysis failed:', error.message);
      recommendations = [{ type: 'info', priority: 'medium', title: 'AI Unavailable', message: 'Could not generate detailed salary insights.' }];
    }

    res.json({
      monthlySalary,
      monthlyExpense,
      savings,
      savingsRate: Math.round(savingsRate * 100) / 100,
      costOfLiving,
      location,
      recommendations,
      benchmarkComparison
    });
  } catch (error) {
    console.error('AI Salary Analysis Error:', error);
    res.status(500).json({ message: error.message || 'Failed to generate salary analysis' });
  }
};







// @desc    AI Savings Goal Analysis
// @route   POST /api/ai/savings-goal-analysis
// @access  Private
const getSavingsGoalAnalysis = async (req, res) => {
  try {
    const { token, goals } = req.body;

    if (!token) {
      return res.status(401).json({ message: 'Authentication token required' });
    }

    if (!goals || !Array.isArray(goals) || goals.length === 0) {
      return res.status(400).json({ message: 'Goals array is required' });
    }

    // Fetch unified AI data
    const aiDataResponse = await fetchAIData(token);
    const stats = aiDataResponse?.data?.stats || {};

    const currentBalance = stats.balance || 0;
    const monthlyIncome = stats.totalIncome || 0;
    const monthlyExpense = stats.totalExpense || 0;
    const monthlySavings = monthlyIncome - monthlyExpense;

    // Use AI to analyze goals
    let analyzedGoals = [];
    let overallRecommendations = [];

    try {
      const aiAnalysis = await aiService.analyzeSavingsGoals(goals, {
        monthlySavings,
        currentBalance
      });

      if (aiAnalysis && aiAnalysis.goals) {
        analyzedGoals = aiAnalysis.goals;
        overallRecommendations = aiAnalysis.overallRecommendations || [];
      } else {
        throw new Error('No goals returned from AI');
      }
    } catch (error) {
      console.error('AI goal analysis failed:', error.message);
      // Minimal fallback just to pass data back
      analyzedGoals = goals.map(g => ({ ...g, optimizations: [], achievable: true }));
      overallRecommendations = [{ type: 'info', title: 'AI Unavailable', message: 'Goal analysis services are currently offline.' }];
    }

    res.json({
      goals: analyzedGoals,
      overallRecommendations,
      financialCapacity: {
        monthlySavings,
        totalRequiredForGoals: analyzedGoals.reduce((sum, g) => sum + (g.requiredMonthly || 0), 0),
        capacityStatus: 'unknown'
      }
    });
  } catch (error) {
    console.error('AI Savings Goal Analysis Error:', error);
    res.status(500).json({ message: error.message || 'Failed to generate savings goal analysis' });
  }
};







// @desc    General AI Insights
// @route   POST /api/ai/insights
// @access  Private
const getAIInsights = async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(401).json({ message: 'Authentication token required' });
    }

    // Fetch unified AI data
    const aiDataResponse = await fetchAIData(token);
    const { transactions = [], stats = {} } = aiDataResponse?.data || {};

    let insights = [];
    let summary = { totalInsights: 0, critical: 0, warnings: 0 };

    try {
      // Use real AI for general insights
      const aiAnalysis = await aiService.generateGeneralInsights(transactions, stats);

      if (aiAnalysis && aiAnalysis.insights) {
        insights = aiAnalysis.insights;
        summary = aiAnalysis.summary || summary;
      }
    } catch (error) {
      console.error('AI insights failed:', error.message);
      insights = [{ type: 'info', category: 'system', title: 'AI Unavailable', message: 'Unable to generate insights.' }];
    }

    res.json({
      insights,
      summary
    });
  } catch (error) {
    console.error('AI Insights Error:', error);
    res.status(500).json({ message: error.message || 'Failed to generate AI insights' });
  }
};







// @desc    AI Smart Categorization
// @route   POST /api/ai/smart-categorize
// @access  Private
const smartCategorize = async (req, res) => {
  try {
    const { token, title, amount, description } = req.body;

    if (!token) {
      return res.status(401).json({ message: 'Authentication token required' });
    }

    if (!title) {
      return res.status(400).json({ message: 'Transaction title is required' });
    }

    try {
      const aiAnalysis = await aiService.categorizeTransaction({
        title,
        amount: parseFloat(amount) || 0,
        description: description || ''
      });

      if (aiAnalysis && aiAnalysis.category) {
        res.json({
          success: true,
          category: aiAnalysis.category,
          confidence: aiAnalysis.confidence || 0.8,
          suggestions: aiAnalysis.suggestions || []
        });
      } else {
        throw new Error('AI returned no category');
      }
    } catch (error) {
      console.error('AI categorization failed:', error.message);
      res.json({
        success: true,
        category: 'Other',
        confidence: 0.0,
        suggestions: []
      });
    }
  } catch (error) {
    console.error('Smart Categorization Error:', error);
    res.status(500).json({ message: error.message || 'Failed to categorize transaction' });
  }
};







// Helper function to detect if question is about user's personal finances
const isPersonalFinanceQuestion = (message) => {
  const lowerMessage = message.toLowerCase();

  // Personal indicators - questions about user's own finances
  const personalIndicators = [
    'my budget', 'my income', 'my expense', 'my spending', 'my savings',
    'my balance', 'my transaction', 'my financial', 'my money',
    'i have', 'i earn', 'i spend', 'i save', 'i want to',
    'based on my', 'according to my', 'for my', 'my current',
    'recommendation based on', 'advice for my', 'suggest for my',
    'what should i', 'how much should i', 'can i afford',
    'should i invest', 'my investment', 'my portfolio'
  ];

  // General indicators - questions about general financial concepts
  const generalIndicators = [
    'in general', 'generally', 'what is', 'what are', 'explain',
    'tell me about', 'is it better', 'which is better', 'compare',
    'difference between', 'pros and cons', 'advantages', 'disadvantages',
    'should one', 'is investing in', 'is it good to', 'is it worth',
    'what do you think about', 'your opinion on'
  ];

  // Check for personal indicators
  const hasPersonalIndicator = personalIndicators.some(indicator =>
    lowerMessage.includes(indicator)
  );

  // Check for general indicators
  const hasGeneralIndicator = generalIndicators.some(indicator =>
    lowerMessage.includes(indicator)
  );

  // If it has general indicators and no personal indicators, it's general
  if (hasGeneralIndicator && !hasPersonalIndicator) {
    return false;
  }

  // If it has personal indicators, it's personal
  if (hasPersonalIndicator) {
    return true;
  }

  // Default: if question is short and doesn't clearly indicate personal, treat as general
  // But if it's a longer question or has financial action words, treat as personal
  const actionWords = ['invest', 'save', 'spend', 'budget', 'plan'];
  const hasActionWords = actionWords.some(word => lowerMessage.includes(word));

  // If question is very short (< 20 chars) and has action words but no personal indicators, might be general
  if (message.length < 20 && hasActionWords && !hasPersonalIndicator) {
    return false;
  }

  // Default to personal if it's about financial actions
  return hasActionWords;
};







// @desc    AI Financial Chat Assistant
// @route   POST /api/ai/chat
// @access  Private
const aiChatAssistant = async (req, res) => {
  try {
    const { token, message, conversationHistory = [] } = req.body;

    if (!token) {
      return res.status(401).json({ message: 'Authentication token required' });
    }

    if (!message || message.trim().length === 0) {
      return res.status(400).json({ message: 'Message is required' });
    }

    // Determine if this is a personal finance question
    const isPersonal = isPersonalFinanceQuestion(message);

    let financialContext = null;
    let transactions = [];
    let stats = {};

    // Only fetch user data if it's a personal finance question
    if (isPersonal) {
      // Fetch unified AI data (transactions + stats in one call)
      const aiDataResponse = await fetchAIData(token);
      const aiData = aiDataResponse?.data || {};
      transactions = aiData.transactions || [];
      stats = aiData.stats || {};

      // Calculate additional financial metrics
      const monthlyIncome = stats.totalIncome || 0;
      const monthlyExpense = stats.totalExpense || 0;
      const monthlySavings = monthlyIncome - monthlyExpense;
      const savingsRate = monthlyIncome > 0 ? ((monthlySavings / monthlyIncome) * 100) : 0;

      // Category breakdown
      const categoryBreakdown = {};
      if (Array.isArray(transactions)) {
        transactions.filter(t => t.type === 'expense').forEach(t => {
          categoryBreakdown[t.category] = (categoryBreakdown[t.category] || 0) + t.amount;
        });
      }

      // Top spending categories
      const topCategories = Object.entries(categoryBreakdown)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([category, amount]) => ({ category, amount }));

      // Recent transactions summary
      const recentTransactions = Array.isArray(transactions)
        ? transactions
          .sort((a, b) => new Date(b.date) - new Date(a.date))
          .slice(0, 10)
          .map(t => ({
            title: t.title,
            amount: t.amount,
            type: t.type,
            category: t.category,
            date: t.date
          }))
        : [];

      financialContext = {
        totalIncome: monthlyIncome,
        totalExpense: monthlyExpense,
        balance: stats.balance || 0,
        monthlySavings,
        savingsRate,
        topCategories,
        recentTransactions,
        transactionCount: transactions.length
      };
    }

    try {
      const aiResponse = await aiService.chatWithFinancialAssistant({
        message,
        conversationHistory,
        financialContext: financialContext,
        isPersonalQuestion: isPersonal
      });

      if (aiResponse && aiResponse.response) {
        res.json({
          success: true,
          response: aiResponse.response,
          suggestions: aiResponse.suggestions || []
        });
      } else {
        throw new Error('AI returned no response');
      }
    } catch (error) {
      console.error('AI chat failed:', error.message);
      res.json({
        success: false,
        response: "I'm having trouble connecting to my brain right now. Please try again in a moment.",
        suggestions: []
      });
    }
  } catch (error) {
    console.error('AI Chat Error:', error);
    res.status(500).json({ message: error.message || 'Failed to process chat message' });
  }
};







// @desc    Calculate Financial Health Score
// @route   POST /api/ai/financial-health
// @access  Private
const getFinancialHealthScore = async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(401).json({ message: 'Authentication token required' });
    }

    // Fetch unified AI data
    const aiDataResponse = await fetchAIData(token);
    const { transactions = [], stats = {} } = aiDataResponse?.data || {};

    try {
      const healthAnalysis = await aiService.analyzeFinancialHealth({
        totalIncome: stats.totalIncome || 0,
        totalExpense: stats.totalExpense || 0,
        balance: stats.balance || 0,
        transactions: Array.isArray(transactions) ? transactions.slice(0, 50) : [],
        monthlyData: stats.monthlyData || []
      });

      if (healthAnalysis && healthAnalysis.score) {
        res.json({
          success: true,
          score: healthAnalysis.score,
          grade: healthAnalysis.grade,
          factors: healthAnalysis.factors || [],
          recommendations: healthAnalysis.recommendations || []
        });
      } else {
        throw new Error('No health score returned from AI');
      }
    } catch (error) {
      console.error('AI health analysis failed:', error.message);
      res.json({
        success: false,
        score: 0,
        grade: 'N/A',
        factors: [],
        recommendations: ['AI Service Unavailable']
      });
    }
  } catch (error) {
    console.error('Financial Health Score Error:', error);
    res.status(500).json({ message: error.message || 'Failed to calculate financial health score' });
  }
};







// @desc    Predict Necessity (Need vs Want)
// @route   POST /api/ai/predict-necessity
// @access  Private
const predictNecessity = async (req, res) => {
  try {
    const { token, title, category, amount } = req.body;

    if (!token) {
      return res.status(401).json({ message: 'Authentication token required' });
    }

    try {
      const aiAnalysis = await aiService.analyzeNecessity({
        title,
        category,
        amount
      });

      if (aiAnalysis && aiAnalysis.necessity) {
        res.json({
          necessity: aiAnalysis.necessity,
          confidence: aiAnalysis.confidence || 0.8,
          reasoning: aiAnalysis.reasoning
        });
      } else {
        throw new Error('AI analysis failed');
      }
    } catch (error) {
      console.error('AI necessity prediction failed:', error.message);
      // Minimal fallback to avoid crash
      res.json({
        necessity: 'Want',
        confidence: 0.5,
        reasoning: 'AI Unavailable'
      });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};





// @desc    Financial Advisor Agent Analysis
// @route   POST /api/ai/financial-advisor/analyze
// @access  Private
const getFinancialAdvisorAnalysis = async (req, res) => {
  try {
    const { token, financialData } = req.body;

    if (!token) {
      return res.status(401).json({ message: 'Authentication token required' });
    }

    if (!financialData) {
      return res.status(400).json({ message: 'Financial data is required' });
    }

    // 1. Budget Analysis
    const budgetAnalysis = await aiService.performBudgetAnalysis(financialData);

    // 2. Savings Strategy
    const savingsStrategy = await aiService.performSavingsStrategy(financialData, budgetAnalysis);

    // 3. Debt Reduction
    const debtReduction = await aiService.performDebtReduction(financialData, budgetAnalysis, savingsStrategy);

    res.json({
      budget_analysis: budgetAnalysis,
      savings_strategy: savingsStrategy,
      debt_reduction: debtReduction
    });

  } catch (error) {
    console.error('Financial Advisor Error:', error);
    res.status(500).json({ message: error.message || 'Failed to generate financial advisor analysis' });
  }
};



// @desc    Forecast Next Month's Needs
// @route   POST /api/ai/forecast-needs
// @access  Private
const forecastNeeds = async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(401).json({ message: 'Token required' });

    const aiDataResponse = await fetchAIData(token);
    const { transactions = [] } = aiDataResponse?.data || {};

    const fallbackNecessityCheck = (category, title) => {
      const needs = ['Food', 'Transport', 'Bills', 'Healthcare', 'Education', 'Rent', 'Groceries'];
      if (needs.includes(category)) return 'Need';
      const lowerTitle = title.toLowerCase();
      if (lowerTitle.includes('rent') || lowerTitle.includes('bill')) return 'Need';
      return 'Want';
    };

    // Helper: Verify if a transaction is a "Need"
    const isNeed = (t) => t.necessity === 'Need' || fallbackNecessityCheck(t.category, t.title) === 'Need';

    // 1. Calculate History (Last 6 Months) for Sparklines
    const history = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);

      const monthlyTotal = transactions
        .filter(t => {
          const tDate = new Date(t.date);
          return tDate.getMonth() === d.getMonth() &&
            tDate.getFullYear() === d.getFullYear() &&
            t.type === 'expense' &&
            isNeed(t);
        })
        .reduce((sum, t) => sum + t.amount, 0);

      history.push({
        month: d.toLocaleString('default', { month: 'short' }),
        amount: monthlyTotal
      });
    }

    // 2. Forecast Logic (Simple Average of last 3 months)
    const recentHistory = history.slice(-3);
    const avgNeeds = recentHistory.reduce((sum, h) => sum + h.amount, 0) / (recentHistory.length || 1);

    res.json({
      forecastedAmount: Math.round(avgNeeds * 1.05), // Add 5% buffer
      breakdown: {
        base: Math.round(avgNeeds),
        buffer: Math.round(avgNeeds * 0.05)
      },
      history: history, // Return history for sparklines
      confidence: 0.85
    });

  } catch (error) {
    console.error('Forecast Needs Error:', error);
    res.status(500).json({ message: 'Failed to forecast needs' });
  }
};







// @desc    Suggest Dynamic Surplus Allocation
// @route   POST /api/ai/suggest-allocation
// @access  Private
const suggestAllocation = async (req, res) => {
  try {
    const { token, surplusAmount } = req.body;
    if (!token) return res.status(401).json({ message: 'Token required' });

    // 1. Fetch unified AI data (transactions + stats)
    const aiDataResponse = await fetchAIData(token);
    const { transactions = [], stats = {} } = aiDataResponse?.data || {};

    // 2. Prepare Financial Context
    const savingsRate = stats.totalIncome > 0
      ? ((stats.totalIncome - stats.totalExpense) / stats.totalIncome) * 100
      : 0;

    // Get Top Categories
    const categorySpending = {};
    transactions.filter(t => t.type === 'expense').forEach(t => {
      categorySpending[t.category] = (categorySpending[t.category] || 0) + t.amount;
    });
    const topCategories = Object.entries(categorySpending)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([cat, amt]) => ({ category: cat, amount: amt }));

    // Get Recent Transactions (Last 10)
    const recentTransactions = transactions
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 10)
      .map(t => ({
        title: t.title,
        amount: t.amount,
        category: t.category
      }));

    // 3. Call AI Service
    try {
      const aiResponse = await aiService.suggestAllocation({
        income: stats.totalIncome || 0,
        expenses: stats.totalExpense || 0,
        surplus: parseFloat(surplusAmount) || 0,
        savingsRate,
        recentTransactions,
        topCategories
      });

      // 4. Return AI Response
      if (aiResponse) {
        const savingsSplit = aiResponse.savingsSplit / 100; // Convert 70 to 0.7
        res.json({
          splits: {
            savings: {
              percentage: aiResponse.savingsSplit,
              amount: surplusAmount * savingsSplit
            },
            personal: {
              percentage: 100 - aiResponse.savingsSplit,
              amount: surplusAmount * (1 - savingsSplit)
            }
          },
          reasoning: aiResponse.reasoning,
          investmentSuggestions: aiResponse.investmentSuggestions || []
        });
      } else {
        throw new Error('No response from AI');
      }

    } catch (aiError) {
      console.error('AI Service Failed, using simplified fallback:', aiError);

      // Simple fallback without complex rules
      const savingsSplit = 0.5;
      res.json({
        splits: {
          savings: { percentage: 50, amount: surplusAmount * 0.5 },
          personal: { percentage: 50, amount: surplusAmount * 0.5 }
        },
        reasoning: "AI services are momentarily unavailable. We recommend a balanced 50/50 split.",
        investmentSuggestions: []
      });
    }

  } catch (error) {
    console.error('Allocation Suggestion Error:', error);
    res.status(500).json({ message: 'Failed to suggest allocation' });
  }
};

// @desc    Extract Receipt Data (OCR + AI)
// @route   POST /api/ai/extract-receipt
// @access  Private
const extractReceiptData = async (req, res) => {
  try {
    const { token, imageUrl, prompt } = req.body;
    if (!token) return res.status(401).json({ message: 'Token required' });

    if (!imageUrl) {
      return res.status(400).json({ message: 'Image URL or path is required' });
    }

    try {
      const result = await aiService.extractReceiptData(imageUrl, prompt);
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Receipt Extraction Failed:', error.message);
      res.status(500).json({ message: 'Failed to extract data from receipt', error: error.message });
    }
  } catch (error) {
    console.error('Extract Receipt Controller Error:', error);
    res.status(500).json({ message: error.message });
  }
};







// @desc    Suggest Expense Details (Auto-fill)
// @route   POST /api/ai/suggest-details
// @access  Private
const suggestExpenseDetails = async (req, res) => {
  try {
    const { token, title, notes } = req.body;
    if (!token) return res.status(401).json({ message: 'Token required' });

    if (!title) {
      return res.status(400).json({ message: 'Title is required' });
    }

    try {
      const result = await aiService.suggestExpenseDetails({
        title,
        notes,
        prompt: "Analyze user input and suggest standard expense details."
      });

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Expense Suggestion Failed:', error.message);
      res.status(500).json({ message: 'Failed to suggest expense details' });
    }
  } catch (error) {
    console.error('Suggest Expense Details Controller Error:', error);
    res.status(500).json({ message: error.message });
  }
};







module.exports = {
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
  suggestExpenseDetails,
  getFinancialAdvisorAnalysis
};
