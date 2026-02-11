// client/src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import ErrorBoundary from './components/common/ErrorBoundary';
import { ToastProvider } from './components/common/Toast';
import Home from './pages/dashboard/Home';
import Register from './pages/auth/Register';
import DashboardLayout from './layouts/DashboardLayout';
import OverviewPage from './pages/dashboard/OverviewPage';
import TransactionsPage from './pages/transactions/TransactionsPage';
// import BudgetsPage from './pages/BudgetsPage';
import GoalsAndLimitsPage from './pages/finance/GoalsAndLimitsPage';
import SettingsPage from './pages/settings/SettingsPage';
import AIAnalysisPage from './pages/ai/AIAnalysisPage';
import InvestmentAdvisorPage from './pages/ai/InvestmentAdvisorPage';
import FinancialFlowPage from './pages/finance/FinancialFlowPage';
// import SavingsGoalPage from './pages/finance/SavingsGoalPage';
import AIChatPage from './pages/ai/AIChatPage';
import FinanceAdvisorPage from './pages/ai/FinanceAdvisorPage';
import FinancialChartsPage from './pages/dashboard/FinancialChartsPage';
import UnderConstruction from './pages/general/UnderConstruction';
import './index.css';

const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="loading-screen">Loading...</div>;
  }

  return user ? children : <Navigate to="/" />;
};

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <ToastProvider>
          <AuthProvider>
            <Router>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/register" element={<Register />} />
                <Route
                  path="/dashboard"
                  element={
                    <PrivateRoute>
                      <DashboardLayout />
                    </PrivateRoute>
                  }
                >
                  <Route index element={<OverviewPage />} />
                  <Route path="transactions" element={<TransactionsPage />} />
                  {/* <Route path="budgets" element={<BudgetsPage />} /> */}
                  <Route path="ai-analysis" element={<AIAnalysisPage />} />
                  <Route path="investment-advisor" element={<InvestmentAdvisorPage />} />
                  <Route path="financial-flow" element={<FinancialFlowPage />} />
                  <Route path="goals-limits" element={<GoalsAndLimitsPage />} />
                  {/* <Route path="budgets" element={<BudgetsPage />} /> */}
                  {/* <Route path="savings-goals" element={<SavingsGoalPage />} /> */}
                  <Route path="ai-chat" element={<AIChatPage />} />
                  <Route path="financial-advisor" element={<FinanceAdvisorPage />} />
                  <Route path="charts" element={<FinancialChartsPage />} />
                  <Route path="settings" element={<SettingsPage />} />
                </Route>
                <Route path="/status" element={<UnderConstruction />} />
              </Routes>
            </Router>
          </AuthProvider>
        </ToastProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;