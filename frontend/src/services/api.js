import axios from 'axios';

const API_URL = 'http://localhost:5000/api';
const AI_SERVICE_URL = 'http://localhost:5001/api/ai';

// Set up axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Transactions API
export const transactionsAPI = {
  getAll: () => api.get('/transactions'),
  create: (data) => api.post('/transactions', data),
  update: (id, data) => api.put(`/transactions/${id}`, data),
  delete: (id) => api.delete(`/transactions/${id}`),
  getStats: () => api.get('/transactions/stats'),
  exportCSV: () => api.get('/transactions/export/csv'),
};

// Budgets API
export const budgetsAPI = {
  getAll: (params) => api.get('/budgets', { params }),
  create: (data) => api.post('/budgets', data),
  update: (id, data) => api.put(`/budgets/${id}`, data),
  delete: (id) => api.delete(`/budgets/${id}`),
  getSummary: (params) => api.get('/budgets/summary', { params }),
};

// Analytics API
export const analyticsAPI = {
  getYearOverYear: (params) => api.get('/analytics/year-over-year', { params }),
  getTrends: (params) => api.get('/analytics/trends', { params }),
  getCustomRange: (params) => api.get('/analytics/custom-range', { params }),
  getProjections: (params) => api.get('/analytics/projections', { params }),
};

// User API
export const userAPI = {
  getProfile: () => api.get('/users/profile'),
  updateProfile: (data) => api.put('/users/profile', data),
  changePassword: (data) => api.put('/users/password', data),
};

// AI Service API
const aiApi = axios.create({
  baseURL: AI_SERVICE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const aiAPI = {
  getExpensePredictions: (forecastPeriod) => {
    const token = localStorage.getItem('token');
    return aiApi.post('/expense-prediction', { token, forecastPeriod });
  },
  getInvestmentAdvice: (sipAmount, sipDuration, expectedReturn) => {
    const token = localStorage.getItem('token');
    return aiApi.post('/investment-advice', { token, sipAmount, sipDuration, expectedReturn });
  },
  getSalaryAnalysis: (salary, location) => {
    const token = localStorage.getItem('token');
    return aiApi.post('/salary-analysis', { token, salary, location });
  },
  getSavingsGoalAnalysis: (goals) => {
    const token = localStorage.getItem('token');
    return aiApi.post('/savings-goal-analysis', { token, goals });
  },
  getAIInsights: () => {
    const token = localStorage.getItem('token');
    return aiApi.post('/insights', { token });
  },
  smartCategorize: (title, amount, description) => {
    const token = localStorage.getItem('token');
    return aiApi.post('/smart-categorize', { token, title, amount, description });
  },
  chatAssistant: (message, conversationHistory) => {
    const token = localStorage.getItem('token');
    return aiApi.post('/chat', { token, message, conversationHistory });
  },
  getFinancialHealthScore: () => {
    const token = localStorage.getItem('token');
    return aiApi.post('/financial-health', { token });
  },
  predictNecessity: (title, category, amount) => {
    const token = localStorage.getItem('token');
    return aiApi.post('/predict-necessity', { token, title, category, amount });
  },
  forecastNeeds: () => {
    const token = localStorage.getItem('token');
    return aiApi.post('/forecast-needs', { token });
  },
  suggestAllocation: (surplusAmount) => {
    const token = localStorage.getItem('token');
    return aiApi.post('/suggest-allocation', { token, surplusAmount });
  },
  extractReceipt: (fileUrl) => {
    const token = localStorage.getItem('token');
    return aiApi.post('/extract-receipt', { token, file_url: fileUrl });
  },
  suggestExpenseDetails: (title, notes) => {
    const token = localStorage.getItem('token');
    return aiApi.post('/suggest-expense-details', { token, title, notes });
  },
};

// Expense Management API
export const expenseAPI = {
  uploadReceipt: (formData) => {
    const token = localStorage.getItem('token');
    return api.post('/transactions/upload-receipt', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        'Authorization': `Bearer ${token}`
      }
    });
  },
  createExpense: (data) => api.post('/transactions', data),
};

// Recurring Transactions API
export const recurringAPI = {
  getAll: () => api.get('/recurring'),
  create: (data) => api.post('/recurring', data),
  update: (id, data) => api.put(`/recurring/${id}`, data),
  delete: (id) => api.delete(`/recurring/${id}`),
  checkReminders: () => api.post('/recurring/reminders'),
};

// Notifications API
export const notificationsAPI = {
  getAll: (unreadOnly) => api.get('/notifications', { params: { unreadOnly } }),
  markAsRead: (id) => api.put(`/notifications/${id}/read`),
  markAllAsRead: () => api.put('/notifications/read-all'),
  delete: (id) => api.delete(`/notifications/${id}`),
};

export default api;

