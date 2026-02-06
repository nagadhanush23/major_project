# AI Service - FinFlow

Separate microservice for AI-powered financial analysis using Groq API.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file:
```env
PORT=5001
MAIN_BACKEND_URL=http://localhost:5000/api
GROQ_API_KEY=your_groq_api_key_here
```

3. Get your Groq API key:
   - Visit https://console.groq.com/
   - Sign up/login
   - Create an API key
   - Add it to `.env` file

4. Run the service:
```bash
npm run dev
```

## Endpoints

- `POST /api/ai/expense-prediction` - AI expense predictions and forecasting
- `POST /api/ai/investment-advice` - Investment recommendations
- `POST /api/ai/salary-analysis` - Salary and cost of living analysis
- `POST /api/ai/savings-goal-analysis` - Savings goal optimization
- `POST /api/ai/insights` - General AI insights

## Port

Default port: **5001**

## Features

- Real-time AI analysis using Groq's Mixtral 8x7B model
- Automatic fallback to rule-based logic if AI is unavailable
- JSON-formatted responses for easy integration
- Financial advisor-level insights and recommendations

## Model

Currently using: `llama-3.1-8b-instant` (fast, efficient, supports JSON mode)

