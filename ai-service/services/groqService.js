// ai-service/services/groqService.js
const Groq = require('groq-sdk');

// Initialize Groq client only if API key is provided
let groq = null;
if (process.env.GROQ_API_KEY) {
  groq = new Groq({
    apiKey: process.env.GROQ_API_KEY
  });
} else {
  console.warn('⚠️  GROQ_API_KEY not found. AI features will use fallback logic.');
}

// Helper function to clean and parse JSON responses
const cleanAndParseJSON = (responseText) => {
  if (!responseText) return null;

  let cleaned = responseText.trim();

  // Remove markdown code blocks
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.replace(/```json\n?/g, '').replace(/```\n?/g, '');
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/```\n?/g, '');
  }

  // Try to extract JSON object if wrapped in text
  const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    cleaned = jsonMatch[0];
  }

  // Fix common JSON errors
  cleaned = cleaned
    .replace(/,\s*}/g, '}')  // Remove trailing commas before }
    .replace(/,\s*]/g, ']')   // Remove trailing commas before ]
    .replace(/null\s*,/g, '') // Remove null, patterns
    .replace(/,\s*null/g, '') // Remove ,null patterns
    .replace(/"\s*\*\s*[^"]*"/g, '') // Remove "* value" patterns
    .replace(/,\s*"[^"]*"\s*\*/g, ''); // Remove ,"value"* patterns

  try {
    return JSON.parse(cleaned);
  } catch (error) {
    console.error('JSON parse error:', error.message);
    console.error('Cleaned text:', cleaned.substring(0, 200));
    throw new Error('Invalid JSON response from AI');
  }
};







// @desc    Analyze expense patterns with AI
const analyzeExpensePatterns = async (data) => {
  if (!groq) {
    throw new Error('Groq API key not configured');
  }

  try {
    const prompt = `Financial data: Balance ₹${data.currentBalance.toLocaleString('en-IN')}, Income ₹${data.averageMonthlyIncome.toLocaleString('en-IN')}/mo, Expense ₹${data.averageMonthlyExpense.toLocaleString('en-IN')}/mo, Savings ${data.trends.savingsRate.toFixed(1)}%, Income ${data.trends.incomeTrend > 0 ? '↑' : data.trends.incomeTrend < 0 ? '↓' : '→'}, Expense ${data.trends.expenseTrend > 0 ? '↑' : data.trends.expenseTrend < 0 ? '↓' : '→'}

Provide MINIMUM 4-6 actionable insights. Return ONLY valid JSON:
{
  "insights": [
    {"type": "warning", "title": "Short actionable title", "message": "Specific actionable message with amounts"},
    {"type": "success", "title": "Short actionable title", "message": "Specific actionable message"},
    {"type": "info", "title": "Short actionable title", "message": "Specific actionable message"},
    {"type": "warning", "title": "Short actionable title", "message": "Specific actionable message"}
  ]
}
Focus on savings optimization, expense reduction, income growth, and financial planning.`;

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'Financial advisor. Provide MINIMUM 4-6 actionable insights. Return ONLY valid JSON. No explanations, just JSON.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      model: 'llama-3.1-8b-instant',
      temperature: 0.3,
      max_tokens: 800,
      response_format: { type: 'json_object' }
    });

    const response = cleanAndParseJSON(completion.choices[0].message.content);
    return response;
  } catch (error) {
    console.error('Groq API Error:', error);
    throw error;
  }
};







// @desc    Analyze investment opportunities with AI
const analyzeInvestmentOpportunity = async (data) => {
  if (!groq) {
    throw new Error('Groq API key not configured');
  }

  try {
    const prompt = `Investment analysis: Savings ₹${data.monthlySavings.toLocaleString('en-IN')}/mo, Balance ₹${data.currentBalance.toLocaleString('en-IN')}, Emergency Fund ${data.emergencyFundStatus}, Savings Rate ${data.savingsRate.toFixed(1)}%

Provide MINIMUM 4-6 specific investment recommendations. Return ONLY valid JSON:
{
  "recommendations": [
    {"type": "sip", "priority": "high", "title": "Start SIP in Equity Funds", "message": "Invest ₹${Math.round(data.monthlySavings * 0.3).toLocaleString('en-IN')}/mo in diversified equity mutual funds for long-term growth", "suggestedAmount": ${Math.round(data.monthlySavings * 0.3)}},
    {"type": "emergency", "priority": "high", "title": "Build Emergency Fund", "message": "Maintain 6 months expenses (₹${Math.round(data.monthlySavings * 6).toLocaleString('en-IN')}) in liquid funds", "suggestedAmount": ${Math.round(data.monthlySavings * 6)}},
    {"type": "portfolio", "priority": "medium", "title": "Diversify Portfolio", "message": "Allocate 60% equity, 30% debt, 10% gold for balanced growth", "suggestedAmount": ${Math.round(data.monthlySavings * 0.5)}},
    {"type": "sip", "priority": "medium", "title": "Tax-Saving Investments", "message": "Invest ₹${Math.min(150000, Math.round(data.monthlySavings * 12)).toLocaleString('en-IN')}/year in ELSS for tax benefits", "suggestedAmount": ${Math.min(150000, Math.round(data.monthlySavings * 12))}}
  ]
}
Use numeric values only. Provide specific amounts based on savings capacity.`;

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'Investment advisor. Provide MINIMUM 4-6 specific recommendations with amounts. Return ONLY valid JSON. No explanations, just JSON.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      model: 'llama-3.1-8b-instant',
      temperature: 0.3,
      max_tokens: 1000,
      response_format: { type: 'json_object' }
    });

    let responseText = completion.choices[0].message.content;
    // Clean JSON if needed
    responseText = responseText.trim();
    if (responseText.startsWith('```json')) {
      responseText = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    }
    if (responseText.startsWith('```')) {
      responseText = responseText.replace(/```\n?/g, '');
    }

    const response = JSON.parse(responseText);
    return response;
  } catch (error) {
    console.error('Groq API Error:', error);
    throw error;
  }
};







// @desc    Analyze salary and cost of living with AI
const analyzeSalaryAndCOL = async (data) => {
  if (!groq) {
    throw new Error('Groq API key not configured');
  }

  try {
    const prompt = `Salary analysis: Salary ₹${data.monthlySalary.toLocaleString('en-IN')}/mo, Expenses ₹${data.monthlyExpense.toLocaleString('en-IN')}/mo, Location ${data.location}, Savings ₹${data.savings.toLocaleString('en-IN')}, Rate ${data.savingsRate.toFixed(1)}%

Provide MINIMUM 4-6 actionable recommendations for ${data.location}. Return ONLY valid JSON:
{
  "recommendations": [
    {"type": "warning", "priority": "high", "title": "Optimize Housing Costs", "message": "Your housing is ${((data.monthlyExpense / data.monthlySalary) * 100).toFixed(0)}% of salary. Aim for 30% max. Consider shared accommodation or relocate."},
    {"type": "success", "priority": "medium", "title": "Maintain Savings Rate", "message": "Current savings rate ${data.savingsRate.toFixed(1)}% is good. Increase to 25% for better financial security."},
    {"type": "info", "priority": "medium", "title": "Budget Optimization", "message": "Review and reduce non-essential expenses by 10-15% to save additional ₹${Math.round(data.monthlyExpense * 0.1).toLocaleString('en-IN')}/mo."},
    {"type": "warning", "priority": "high", "title": "Emergency Fund Priority", "message": "Build emergency fund of ₹${Math.round(data.monthlyExpense * 6).toLocaleString('en-IN')} (6 months expenses) before other investments."},
    {"type": "info", "priority": "low", "title": "Location-Specific Tips", "message": "For ${data.location}, consider cost-saving strategies like meal prep, public transport, and shared subscriptions."}
  ],
  "benchmarkComparison": {
    "housing": {"actual": ${Math.round((data.monthlyExpense / data.monthlySalary) * 100)}, "recommended": 30, "status": "${(data.monthlyExpense / data.monthlySalary) > 0.35 ? 'high' : (data.monthlyExpense / data.monthlySalary) > 0.3 ? 'medium' : 'good'}"},
    "savings": {"actual": ${data.savingsRate.toFixed(1)}, "recommended": 20, "status": "${data.savingsRate >= 20 ? 'good' : 'low'}"}
  }
}
Use numeric percentages. Provide specific actionable advice.`;

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'Financial planner. Provide MINIMUM 4-6 actionable recommendations. Return ONLY valid JSON. No explanations, just JSON.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      model: 'llama-3.1-8b-instant',
      temperature: 0.3,
      max_tokens: 1000,
      response_format: { type: 'json_object' }
    });

    const response = cleanAndParseJSON(completion.choices[0].message.content);
    return response;
  } catch (error) {
    console.error('Groq API Error:', error);
    throw error;
  }
};







// @desc    Analyze savings goals with AI
const analyzeSavingsGoals = async (goals, financialData) => {
  if (!groq) {
    throw new Error('Groq API key not configured');
  }

  try {
    const goalsSummary = goals.map(g => ({
      name: g.name,
      targetAmount: g.targetAmount,
      targetDate: g.targetDate,
      priority: g.priority
    }));

    const prompt = `Goals: ${JSON.stringify(goalsSummary)}, Savings ₹${financialData.monthlySavings.toLocaleString('en-IN')}/mo, Balance ₹${financialData.currentBalance.toLocaleString('en-IN')}

For each goal, provide MINIMUM 2-3 optimizations. Provide MINIMUM 4-5 overall recommendations. Return ONLY valid JSON:
{
  "goals": [
    {"id": "goal1", "optimizations": [
      {"type": "adjustment", "priority": "high", "message": "Increase monthly savings by ₹${Math.round(financialData.monthlySavings * 0.2).toLocaleString('en-IN')} to reach goal faster"},
      {"type": "suggestion", "priority": "medium", "message": "Extend timeline by 2-3 months for more realistic achievement"},
      {"type": "success", "priority": "low", "message": "Consider breaking large goal into smaller milestones"}
    ], "achievable": true}
  ],
  "overallRecommendations": [
    {"type": "warning", "title": "Prioritize High-Value Goals", "message": "Focus on top 2-3 goals first. Allocate ₹${Math.round(financialData.monthlySavings * 0.6).toLocaleString('en-IN')}/mo to priority goals."},
    {"type": "info", "title": "Timeline Optimization", "message": "Extend timelines by 10-20% for more achievable targets without financial stress."},
    {"type": "success", "title": "Increase Savings Capacity", "message": "Boost monthly savings by 5-10% (₹${Math.round(financialData.monthlySavings * 0.075).toLocaleString('en-IN')}/mo) to accelerate all goals."},
    {"type": "warning", "title": "Emergency Fund First", "message": "Build emergency fund of ₹${Math.round(financialData.monthlySavings * 6).toLocaleString('en-IN')} before long-term goals."},
    {"type": "info", "title": "Goal Sequencing Strategy", "message": "Achieve short-term goals (0-1 year) first, then focus on medium (1-3 years) and long-term (3+ years) goals."}
  ]
}`;

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'Financial goals advisor. Provide MINIMUM 2-3 optimizations per goal and 4-5 overall recommendations with specific amounts. Return ONLY valid JSON. No explanations, just JSON.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      model: 'llama-3.1-8b-instant',
      temperature: 0.3,
      max_tokens: 1200,
      response_format: { type: 'json_object' }
    });

    const response = cleanAndParseJSON(completion.choices[0].message.content);
    return response;
  } catch (error) {
    console.error('Groq API Error:', error);
    throw error;
  }
};







// @desc    Generate general AI insights
const generateGeneralInsights = async (transactions, stats) => {
  if (!groq) {
    throw new Error('Groq API key not configured');
  }

  try {
    // Summarize transaction patterns
    const categorySpending = {};
    transactions.filter(t => t.type === 'expense').forEach(t => {
      categorySpending[t.category] = (categorySpending[t.category] || 0) + t.amount;
    });

    const topCategories = Object.entries(categorySpending)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([cat, amt]) => ({ category: cat, amount: amt }));

    const recentCount = transactions.filter(t => {
      const date = new Date(t.date);
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return date >= thirtyDaysAgo;
    }).length;

    const prompt = `Spending data: Income ₹${stats.totalIncome.toLocaleString('en-IN')}, Expenses ₹${stats.totalExpense.toLocaleString('en-IN')}, Balance ₹${stats.balance.toLocaleString('en-IN')}, Top Categories ${JSON.stringify(topCategories)}, Recent Transactions ${recentCount}

Provide MINIMUM 4-6 actionable insights covering spending patterns, savings behavior, and financial health. Return ONLY valid JSON:
{
  "insights": [
    {"type": "warning", "category": "spending", "title": "High Spending Alert", "message": "Your expenses are ${((stats.totalExpense / stats.totalIncome) * 100).toFixed(0)}% of income. Reduce by ₹${Math.round((stats.totalExpense - stats.totalIncome * 0.7)).toLocaleString('en-IN')}/mo to reach 70%."},
    {"type": "info", "category": "savings", "title": "Savings Optimization", "message": "Current savings rate ${((stats.totalIncome - stats.totalExpense) / stats.totalIncome * 100).toFixed(1)}%. Aim for 25-30% by cutting non-essentials."},
    {"type": "warning", "category": "spending", "title": "Category Spending Review", "message": "Top category ${topCategories[0]?.category || 'N/A'} is ₹${topCategories[0]?.amount?.toLocaleString('en-IN') || 0}. Review and optimize this category."},
    {"type": "success", "category": "behavior", "title": "Transaction Frequency", "message": "You have ${recentCount} transactions in last 30 days. Maintain this tracking habit."},
    {"type": "info", "category": "savings", "title": "Emergency Fund Status", "message": "Build emergency fund of ₹${Math.round(stats.totalExpense * 6).toLocaleString('en-IN')} (6 months expenses) for financial security."},
    {"type": "warning", "category": "spending", "title": "Budget Allocation", "message": "Create monthly budget allocating 50% needs, 30% wants, 20% savings for better control."}
  ],
  "summary": {"totalInsights": 6, "critical": 0, "warnings": 3}
}`;

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'Financial behavior analyst. Provide MINIMUM 4-6 actionable insights with specific amounts. Return ONLY valid JSON. No explanations, just JSON.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      model: 'llama-3.1-8b-instant',
      temperature: 0.3,
      max_tokens: 1000,
      response_format: { type: 'json_object' }
    });

    const response = cleanAndParseJSON(completion.choices[0].message.content);
    return response;
  } catch (error) {
    console.error('Groq API Error:', error);
    throw error;
  }
};







// @desc    Categorize transaction using AI
const categorizeTransaction = async (data) => {
  if (!groq) {
    throw new Error('Groq API key not configured');
  }

  try {
    const prompt = `Categorize transaction: Title "${data.title}", Amount ₹${data.amount.toLocaleString('en-IN')}, Description "${data.description || 'N/A'}"

Categories: Food, Transport, Shopping, Bills, Entertainment, Healthcare, Education, Travel, Other

Return ONLY valid JSON:
{
  "category": "Transport",
  "confidence": 0.9,
  "suggestions": ["Transport", "Other"]
}`;

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'Transaction categorizer. Return ONLY valid JSON. No explanations, just JSON.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      model: 'llama-3.1-8b-instant',
      temperature: 0.2,
      max_tokens: 200,
      response_format: { type: 'json_object' }
    });

    const response = cleanAndParseJSON(completion.choices[0].message.content);
    return response;
  } catch (error) {
    console.error('Groq API Error:', error);
    throw error;
  }
};







// @desc    Chat with financial assistant
const chatWithFinancialAssistant = async (data) => {
  if (!groq) {
    throw new Error('Groq API key not configured');
  }

  try {
    const isPersonalQuestion = data.isPersonalQuestion !== false && data.financialContext !== null;
    const ctx = data.financialContext;

    let contextSummary = '';
    let promptInstructions = '';

    if (isPersonalQuestion && ctx) {
      // Build comprehensive financial context for personal questions
      let categoryDetails = '';
      if (ctx.topCategories && ctx.topCategories.length > 0) {
        categoryDetails = '\nTop Spending Categories:\n' +
          ctx.topCategories.map(cat =>
            `- ${cat.category}: ₹${cat.amount.toLocaleString('en-IN')}`
          ).join('\n');
      }

      let recentTransactionsDetails = '';
      if (ctx.recentTransactions && ctx.recentTransactions.length > 0) {
        recentTransactionsDetails = '\nRecent Transactions:\n' +
          ctx.recentTransactions.slice(0, 5).map(t =>
            `- ${t.title}: ₹${t.amount.toLocaleString('en-IN')} (${t.type}, ${t.category})`
          ).join('\n');
      }

      contextSummary = `Financial Profile: Income ₹${ctx.totalIncome.toLocaleString('en-IN')}/mo, Expenses ₹${ctx.totalExpense.toLocaleString('en-IN')}/mo, Savings ₹${ctx.monthlySavings.toLocaleString('en-IN')}/mo, Rate ${ctx.savingsRate.toFixed(1)}%, Balance ₹${ctx.balance.toLocaleString('en-IN')}, Transactions ${ctx.transactionCount || 0}${categoryDetails ? '\nTop Categories: ' + ctx.topCategories.slice(0, 3).map(c => `${c.category}: ₹${c.amount.toLocaleString('en-IN')}`).join(', ') : ''}${recentTransactionsDetails ? '\nRecent: ' + ctx.recentTransactions.slice(0, 3).map(t => `${t.title}: ₹${t.amount.toLocaleString('en-IN')}`).join(', ') : ''}`;

      promptInstructions = `Personal finance question. Provide specific ₹ amounts. For investments: use savings capacity. For budget: use spending patterns. For savings: use current rate.`;
    } else {
      // General question - no user data
      promptInstructions = `General finance question. No personal data. Provide general advice, pros/cons, comparisons. No specific amounts.`;
    }

    const conversationContext = data.conversationHistory
      .slice(-5)
      .map(msg => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`)
      .join('\n');

    const prompt = `${isPersonalQuestion && ctx ? 'Personal finance question with user data.' : 'General finance question.'}

${contextSummary}

${conversationContext ? `Previous: ${conversationContext.slice(-200)}\n` : ''}

Question: ${data.message}

${promptInstructions}

Return ONLY valid JSON:
{
  "response": "Your detailed answer here",
  "suggestions": ["suggestion1", "suggestion2"]
}`;

    const systemMessage = isPersonalQuestion && ctx
      ? 'Financial advisor. Return ONLY valid JSON: {"response": "answer", "suggestions": []}. No explanations, just JSON. Use ₹ for currency.'
      : 'Financial advisor. Return ONLY valid JSON: {"response": "answer", "suggestions": []}. No explanations, just JSON. No specific amounts.';

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: systemMessage
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      model: 'llama-3.1-8b-instant',
      temperature: 0.3,
      max_tokens: 500,
      response_format: { type: 'json_object' }
    });

    let response;
    try {
      response = cleanAndParseJSON(completion.choices[0].message.content);
    } catch (parseError) {
      // Fallback: wrap the response in JSON format
      const responseText = completion.choices[0].message.content || '';
      response = {
        response: responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim() || 'I understand your question. Let me help you with that.',
        suggestions: []
      };
    }

    // Ensure response has required fields
    if (!response.response) {
      response.response = 'I understand your question. Let me help you with that.';
    }
    if (!response.suggestions) {
      response.suggestions = [];
    }

    return response;
  } catch (error) {
    console.error('Groq API Error:', error);
    // Return a more helpful error message
    if (error.message && error.message.includes('JSON')) {
      throw new Error('Failed to parse AI response. Please try rephrasing your question.');
    }
    throw error;
  }
};







// @desc    Analyze financial health
const analyzeFinancialHealth = async (data) => {
  if (!groq) {
    throw new Error('Groq API key not configured');
  }

  try {
    const savingsRate = data.totalIncome > 0 ? ((data.totalIncome - data.totalExpense) / data.totalIncome * 100) : 0;
    const prompt = `Financial data: Income ₹${data.totalIncome.toLocaleString('en-IN')}, Expenses ₹${data.totalExpense.toLocaleString('en-IN')}, Balance ₹${data.balance.toLocaleString('en-IN')}, Transactions ${data.transactions.length}, Savings Rate ${savingsRate.toFixed(1)}%

Calculate health score (0-100) and provide MINIMUM 4-6 actionable recommendations. Return ONLY valid JSON:
{
  "score": 75,
  "grade": "B",
  "factors": [
    {"name": "Savings Rate", "value": "${savingsRate.toFixed(1)}%", "impact": "${savingsRate >= 20 ? 'positive' : 'negative'}"},
    {"name": "Expense Ratio", "value": "${data.totalIncome > 0 ? ((data.totalExpense / data.totalIncome) * 100).toFixed(1) : 0}%", "impact": "${data.totalIncome > 0 && (data.totalExpense / data.totalIncome) > 0.8 ? 'negative' : 'positive'}"},
    {"name": "Balance Status", "value": "₹${data.balance.toLocaleString('en-IN')}", "impact": "${data.balance > 0 ? 'positive' : 'negative'}"}
  ],
  "recommendations": [
    "Increase savings rate to 25-30% by reducing non-essential expenses by ₹${Math.round((data.totalExpense - data.totalIncome * 0.7)).toLocaleString('en-IN')}/mo",
    "Build emergency fund of ₹${Math.round(data.totalExpense * 6).toLocaleString('en-IN')} (6 months expenses) in liquid savings",
    "Review and optimize top spending categories to save additional 10-15% monthly",
    "Set up automatic savings transfer of ₹${Math.round((data.totalIncome - data.totalExpense) * 0.3).toLocaleString('en-IN')}/mo to build wealth",
    "Track expenses daily for better budget control and identify unnecessary spending",
    "Consider increasing income sources or negotiating salary raise to improve financial health"
  ]
}`;

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'Financial health analyst. Provide MINIMUM 4-6 actionable recommendations with specific amounts. Return ONLY valid JSON. No explanations, just JSON.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      model: 'llama-3.1-8b-instant',
      temperature: 0.3,
      max_tokens: 800,
      response_format: { type: 'json_object' }
    });

    const response = cleanAndParseJSON(completion.choices[0].message.content);
    return response;
  } catch (error) {
    console.error('Groq API Error:', error);
    throw error;
  }
};







// @desc    Extract receipt data using AI vision
const axios = require('axios');
const Tesseract = require('tesseract.js');

// @desc    Extract receipt data using AI vision (Hybrid: Local OCR + LLM Parsing)
const extractReceiptData = async (imageUrl, prompt) => {
  if (!groq) {
    throw new Error('Groq API key not configured');
  }

  try {
    let imageBuffer = imageUrl;

    // 1. Get Image Buffer
    if (imageUrl.startsWith('http')) {
      try {
        const imageResponse = await axios.get(imageUrl, { responseType: 'arraybuffer' });
        imageBuffer = imageResponse.data;
      } catch (fetchError) {
        console.error('Failed to fetch image for OCR:', fetchError.message);
        throw new Error('Failed to access receipt image');
      }
    } else if (imageUrl.startsWith('/uploads/') || imageUrl.startsWith('\\\\uploads\\\\')) {
      // It's a local file path relative to server root, likely in sibling directory
      // We need to resolve it relative to ai-service execution
      try {
        const path = require('path');
        const fs = require('fs');

        // Remove leading slash/uploads prefix/etc to get just filename if possible, 
        // or just rely on path construction. 
        // Backend returns: /uploads/filename.jpg

        // Construct absolute path to server/uploads
        // Current file is in: ai-service/services/
        const serverUploadsDir = path.join(__dirname, '../../server');

        // Join server root with the imageUrl (which has /uploads/...)
        // Note: path.join will treat /uploads/... as relative segment usually if not root
        // But to be safe, let's explicit:
        const relativePath = imageUrl.startsWith('/') ? imageUrl.substring(1) : imageUrl;
        const layoutPath = path.join(serverUploadsDir, relativePath);

        console.log('Resolving local image path:', layoutPath);

        if (fs.existsSync(layoutPath)) {
          imageBuffer = fs.readFileSync(layoutPath);
        } else {
          // Fallback: try just current dir? No, unlikely.
          throw new Error(`Local file not found at ${layoutPath}`);
        }
      } catch (localError) {
        console.error('Failed to read local file:', localError.message);
        throw new Error('Failed to access local receipt file');
      }
    }

    // 2. Perform OCR using Tesseract.js
    console.log('Starting OCR extraction...');
    const { data: { text } } = await Tesseract.recognize(imageBuffer, 'eng');
    console.log('OCR Text Extracted:', text.substring(0, 100) + '...');

    if (!text || text.trim().length === 0) {
      throw new Error('No text found in receipt image');
    }

    // 3. Parse Text with LLM
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'Receipt Parsing Expert. Extract structured JSON from the raw OCR text. Fields: vendor, amount (number), title (short description), category (food, transport, shopping, entertainment, utilities, health, travel, education, subscriptions, other), date (YYYY-MM-DD). If field missing, infer or use null.'
        },
        {
          role: 'user',
          content: `Raw Receipt Text:\\n"\${text}"\\n\\n\${prompt}\\n\\nReturn ONLY valid JSON.`
        }
      ],
      model: 'llama-3.1-8b-instant', // Robust text model
      temperature: 0.1,
      max_tokens: 500,
      response_format: { type: 'json_object' }
    });

    const response = cleanAndParseJSON(completion.choices[0].message.content);
    return response;
  } catch (error) {
    console.error('Receipt extraction error:', error);
    throw error;
  }
};







// @desc    Suggest expense details using AI
const suggestExpenseDetails = async (data) => {
  if (!groq) {
    throw new Error('Groq API key not configured');
  }

  try {
    const prompt = `${data.prompt}

Analyze: "${data.title}"${data.notes ? `\nNotes: "${data.notes}"` : ''}

Categories: food, transport, shopping, entertainment, utilities, health, travel, education, subscriptions, other

Return ONLY valid JSON:
{
  "category": "food",
  "vendor": "Starbucks",
  "title": "Coffee at Starbucks"
}`;

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'Expense categorization expert. Suggest category, vendor, and clean title. Return ONLY valid JSON. No explanations.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      model: 'llama-3.1-8b-instant',
      temperature: 0.2,
      max_tokens: 200,
      response_format: { type: 'json_object' }
    });

    const response = cleanAndParseJSON(completion.choices[0].message.content);
    return response;
  } catch (error) {
    console.error('Expense suggestion error:', error);
    throw error;
  }
};







// @desc    Suggest Dynamic Surplus Allocation with Investment Advice
const suggestAllocation = async (data) => {
  if (!groq) {
    throw new Error('Groq API key not configured');
  }

  try {
    const { income, expenses, surplus, savingsRate, recentTransactions, topCategories } = data;

    const transactionSummary = recentTransactions.map(t =>
      `- ${t.title}: ₹${t.amount} (${t.category})`
    ).join('\n');

    const categorySummary = topCategories.map(c =>
      `${c.category}: ₹${c.amount}`
    ).join(', ');

    const prompt = `
      Current Financials:
      - Monthly Income: ₹${income.toLocaleString('en-IN')}
      - Monthly Expenses: ₹${expenses.toLocaleString('en-IN')}
      - Available Surplus: ₹${surplus.toLocaleString('en-IN')}
      - Savings Rate: ${savingsRate.toFixed(1)}%
      
      Spending Context (Top Categories): ${categorySummary}
      
      Recent Transactions:
      ${transactionSummary}

      You are an Aggressive Wealth Manager & Investment Planner. 
      Your Goal: MAXIMIZE PROFIT and FINANCIAL GROWTH for the user.
      
      Task:
      1. Analyze the user's spending habits from the provided transactions.
      2. Suggest an OPTIMAL split of the surplus (Savings % vs Personal Spending %). Be aggressive with savings if they are wasting money.
      3. Provide a persuasive "Reasoning" that references specific bad habits or good opportunities found in the data.
      4. Suggest 3-4 SPECIFIC, REAL-WORLD investment opportunities for the savings portion (e.g., "Nifty 50 Index Fund", "Gold Bees", "Bluechip Stocks", "Liquid Funds").

      Return ONLY valid JSON:
      {
        "savingsSplit": 70, 
        "reasoning": "You spent ₹4,500 on 'Dining Out' recently. Cutting this down allows us to allocate 70% of your surplus to high-growth assets. Your income is stable, so we should be aggressive.",
        "investmentSuggestions": [
          { "type": "Growth", "name": "Nifty 50 Index Fund", "allocation": "40%", "reason": "Stable long-term growth for core portfolio" },
          { "type": "High Risk", "name": "Mid-Cap Mutual Funds", "allocation": "30%", "reason": "Higher alpha potential given your surplus size" },
          { "type": "Stability", "name": "Corporate Bond Fund", "allocation": "30%", "reason": "To balance the risk of equity exposure" }
        ]
      }
    `;

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'You are a profit-focused Investment Planner. Return ONLY valid JSON. No markdown, no explanations.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      model: 'llama-3.1-8b-instant',
      temperature: 0.4,
      max_tokens: 1000,
      response_format: { type: 'json_object' }
    });

    const response = cleanAndParseJSON(completion.choices[0].message.content);
    return response;
  } catch (error) {
    console.error('Groq Suggest Allocation Error:', error);
    throw error;
  }
};


module.exports = {
  analyzeExpensePatterns,
  analyzeInvestmentOpportunity,
  analyzeSalaryAndCOL,
  analyzeSavingsGoals,
  generateGeneralInsights,
  categorizeTransaction,
  chatWithFinancialAssistant,
  analyzeFinancialHealth,
  extractReceiptData,
  suggestExpenseDetails,
  suggestAllocation
};





// @desc    Perform Budget Analysis
const performBudgetAnalysis = async (financialData) => {
  if (!groq) {
    throw new Error('Groq API key not configured');
  }

  try {
    const prompt = `
You are a Budget Analysis Agent specialized in reviewing financial transactions and expenses.
Analyze the following financial data:
${JSON.stringify(financialData, null, 2)}

Your tasks:
1. Analyze income, transactions, and expenses in detail.
2. Categorize spending into logical groups with clear breakdown.
3. Identify spending patterns and trends across categories.
4. Suggest specific areas where spending could be reduced with concrete suggestions.
5. Provide actionable recommendations with specific, quantified potential savings amounts.

Consider:
- Number of dependants when evaluating household expenses.
- Typical spending ratios for the income level.
- Essential vs discretionary spending.

Return ONLY valid JSON with this structure:
{
  "total_expenses": 0,
  "monthly_income": 0,
  "spending_categories": [{"category": "string", "amount": 0, "percentage": 0}],
  "recommendations": [{"category": "string", "recommendation": "string", "potential_savings": 0}]
}`;

    const completion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: 'Budget Analysis Agent. Return ONLY valid JSON.' },
        { role: 'user', content: prompt }
      ],
      model: 'llama-3.1-8b-instant',
      temperature: 0.3,
      response_format: { type: 'json_object' }
    });

    return cleanAndParseJSON(completion.choices[0].message.content);
  } catch (error) {
    console.error('Budget Analysis Error:', error);
    throw error;
  }
};




// @desc    Perform Savings Strategy
const performSavingsStrategy = async (financialData, budgetAnalysis) => {
  if (!groq) {
    throw new Error('Groq API key not configured');
  }

  try {
    const prompt = `
You are a Savings Strategy Agent.
Financial Data: ${JSON.stringify(financialData)}
Budget Analysis: ${JSON.stringify(budgetAnalysis)}

Tasks:
1. Recommend savings strategies.
2. Calculate optimal emergency fund.
3. Suggest savings allocation.
4. Recommend automation techniques.

Return ONLY valid JSON with this structure:
{
  "emergency_fund": {"recommended_amount": 0, "current_amount": 0, "current_status": "string"},
  "recommendations": [{"category": "string", "amount": 0, "rationale": "string"}],
  "automation_techniques": [{"name": "string", "description": "string"}]
}`;

    const completion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: 'Savings Strategy Agent. Return ONLY valid JSON.' },
        { role: 'user', content: prompt }
      ],
      model: 'llama-3.1-8b-instant',
      temperature: 0.3,
      response_format: { type: 'json_object' }
    });

    return cleanAndParseJSON(completion.choices[0].message.content);
  } catch (error) {
    console.error('Savings Strategy Error:', error);
    throw error;
  }
};




// @desc    Perform Debt Reduction Plan
const performDebtReduction = async (financialData, budgetAnalysis, savingsStrategy) => {
  if (!groq) {
    throw new Error('Groq API key not configured');
  }

  try {
    const prompt = `
You are a Debt Reduction Agent.
Financial Data: ${JSON.stringify(financialData)}
Budget Analysis: ${JSON.stringify(budgetAnalysis)}
Savings Strategy: ${JSON.stringify(savingsStrategy)}

Tasks:
1. Analyze debts.
2. Create payoff plans (avalanche and snowball).
3. Calculate interest and timeline.
4. Provide recommendations.

Return ONLY valid JSON with this structure:
{
  "total_debt": 0,
  "debts": [],
  "payoff_plans": {
    "avalanche": {"total_interest": 0, "months_to_payoff": 0, "monthly_payment": 0},
    "snowball": {"total_interest": 0, "months_to_payoff": 0, "monthly_payment": 0}
  },
  "recommendations": [{"title": "string", "description": "string", "impact": "string"}]
}`;

    const completion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: 'Debt Reduction Agent. Return ONLY valid JSON.' },
        { role: 'user', content: prompt }
      ],
      model: 'llama-3.1-8b-instant',
      temperature: 0.3,
      response_format: { type: 'json_object' }
    });

    return cleanAndParseJSON(completion.choices[0].message.content);
  } catch (error) {
    console.error('Debt Reduction Error:', error);
    throw error;
  }
};




module.exports = {
  analyzeExpensePatterns,
  analyzeInvestmentOpportunity,
  analyzeSalaryAndCOL,
  analyzeSavingsGoals,
  generateGeneralInsights,
  categorizeTransaction,
  chatWithFinancialAssistant,
  analyzeFinancialHealth,
  extractReceiptData,
  suggestExpenseDetails,
  suggestAllocation,
  performBudgetAnalysis,
  performSavingsStrategy,
  performDebtReduction
};
