import React, { useState, useEffect } from 'react';
import { transactionsAPI, aiAPI } from '../../services/api';
import { FaPiggyBank, FaChartLine, FaLightbulb } from 'react-icons/fa';
import '../dashboard/DashboardPage.css';

const InvestmentAdvisorPage = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [sipAmount, setSipAmount] = useState(5000);
  const [sipDuration, setSipDuration] = useState(5);
  const [expectedReturn, setExpectedReturn] = useState(12);
  const [recommendations, setRecommendations] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (stats) {
      loadAIRecommendations();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stats, sipAmount, sipDuration, expectedReturn]);

  const loadData = async () => {
    try {
      setLoading(true);
      const response = await transactionsAPI.getStats();
      const statsData = response.data.data || response.data;
      setStats(statsData);
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAIRecommendations = async () => {
    try {
      const response = await aiAPI.getInvestmentAdvice(sipAmount, sipDuration, expectedReturn);
      const data = response.data;

      const recommendations = data.recommendations.map(rec => {
        let icon = FaPiggyBank;
        if (rec.type === 'emergency') icon = FaLightbulb;
        if (rec.type === 'portfolio') icon = FaChartLine;

        return {
          type: rec.type,
          icon,
          title: rec.title,
          message: rec.message,
          action: rec.type === 'sip' ? 'Start SIP' : rec.type === 'emergency' ? 'Set Goal' : 'View Plans',
        };
      });

      setRecommendations(recommendations);

      // Update SIP calculation if projection is available
      if (data.sipProjection) {
        // SIP projection is handled by local calculation, but we can use AI insights
      }
    } catch (error) {
      console.error('Error loading AI recommendations:', error);
      // Fallback to local recommendations
      generateLocalRecommendations();
    }
  };

  const generateLocalRecommendations = () => {
    const recommendations = [];
    const monthlySavings = (stats?.totalIncome || 0) - (stats?.totalExpense || 0);

    if (monthlySavings > 0) {
      const suggestedSIP = Math.min(monthlySavings * 0.3, 10000);
      recommendations.push({
        type: 'sip',
        icon: FaPiggyBank,
        title: 'SIP Investment Recommendation',
        message: `Based on your savings, consider starting a SIP of ${formatCurrency(suggestedSIP)} per month.`,
        action: 'Start SIP',
      });
    }

    const emergencyFundTarget = (stats?.totalExpense || 0) * 6;
    if ((stats?.balance || 0) < emergencyFundTarget) {
      recommendations.push({
        type: 'emergency',
        icon: FaLightbulb,
        title: 'Build Emergency Fund',
        message: `Aim for ${formatCurrency(emergencyFundTarget)} (6 months expenses) as emergency fund.`,
        action: 'Set Goal',
      });
    }

    if (monthlySavings > 5000) {
      recommendations.push({
        type: 'mutual-fund',
        icon: FaChartLine,
        title: 'Diversified Portfolio',
        message: 'Consider allocating 60% equity, 30% debt, and 10% hybrid funds for balanced growth.',
        action: 'View Plans',
      });
    }

    setRecommendations(recommendations);
  };

  const calculateSIP = () => {
    // SIP Calculation Formula: FV = P × [((1 + r)^n - 1) / r] × (1 + r)
    // Where P = Monthly investment, r = Monthly rate, n = Number of months
    // The (1 + r) multiplier accounts for payments made at the beginning of each period

    const monthlyRate = expectedReturn / 12 / 100; // Convert annual rate to monthly decimal
    const months = sipDuration * 12;
    const monthlyInvestment = sipAmount;

    // Total amount invested (principal)
    const investedAmount = monthlyInvestment * months;

    // Future Value of SIP using annuity formula
    let maturityAmount = 0;

    if (monthlyRate > 0) {
      // Standard SIP formula for payments at the beginning of period
      // FV = P × [((1 + r)^n - 1) / r] × (1 + r)
      const compoundFactor = Math.pow(1 + monthlyRate, months);
      maturityAmount = monthlyInvestment *
        (((compoundFactor - 1) / monthlyRate) * (1 + monthlyRate));
    } else {
      // If rate is 0, it's just the sum of all payments
      maturityAmount = investedAmount;
    }

    // Round to 2 decimal places for accuracy
    maturityAmount = Math.round(maturityAmount * 100) / 100;

    // Calculate returns (maturity amount - invested amount)
    const returns = maturityAmount - investedAmount;

    // Calculate return percentage (absolute returns)
    const returnPercentage = investedAmount > 0 ? (returns / investedAmount) * 100 : 0;

    // Calculate CAGR (Compound Annual Growth Rate) approximation
    // CAGR = ((FV / PV)^(1/n) - 1) × 100
    const cagr = months > 0 && investedAmount > 0
      ? (Math.pow(maturityAmount / investedAmount, 12 / months) - 1) * 100
      : 0;

    return {
      investedAmount: Math.round(investedAmount * 100) / 100,
      maturityAmount,
      returns: Math.round(returns * 100) / 100,
      returnPercentage: Math.round(returnPercentage * 100) / 100,
      cagr: Math.round(cagr * 100) / 100,
      monthlyInvestment,
      totalMonths: months,
      annualReturn: expectedReturn,
    };
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="dashboard-page">
        <div className="page-loading">
          <div className="spinner"></div>
          <p>Loading investment advisor...</p>
        </div>
      </div>
    );
  }

  const sipCalculation = calculateSIP();

  return (
    <div className="dashboard-page">
      <div className="page-header">
        <div>
          <h1>Smart Investment Advisor</h1>
          <p className="page-subtitle">Mutual Funds & SIP Planning with AI-powered recommendations</p>
        </div>
      </div>

      {recommendations.length > 0 && (
        <div className="insights-grid">
          {recommendations.map((rec, index) => {
            const Icon = rec.icon;
            return (
              <div key={index} className="insight-card success">
                <div className="insight-icon">
                  <Icon />
                </div>
                <div className="insight-content">
                  <h3>{rec.title}</h3>
                  <p>{rec.message}</p>
                  <button className="btn-primary" style={{ marginTop: '0.5rem' }}>
                    {rec.action}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="analytics-grid">
        <div className="analytics-card">
          <h3>SIP Calculator</h3>
          <div className="sip-calculator">
            <div className="form-group">
              <label>Monthly SIP Amount</label>
              <input
                type="number"
                value={sipAmount}
                onChange={(e) => setSipAmount(Number(e.target.value))}
                min="100"
                step="100"
              />
            </div>
            <div className="form-group">
              <label>Investment Duration (Years)</label>
              <input
                type="number"
                value={sipDuration}
                onChange={(e) => setSipDuration(Number(e.target.value))}
                min="1"
                max="30"
              />
            </div>
            <div className="form-group">
              <label>Expected Annual Return (%)</label>
              <input
                type="number"
                value={expectedReturn}
                onChange={(e) => setExpectedReturn(Number(e.target.value))}
                min="6"
                max="20"
                step="0.5"
              />
            </div>
          </div>
        </div>

        <div className="analytics-card">
          <h3>SIP Projection</h3>
          <div className="sip-results">
            <div className="sip-result-item">
              <span className="result-label">Monthly Investment</span>
              <span className="result-value">{formatCurrency(sipCalculation.monthlyInvestment)}</span>
            </div>
            <div className="sip-result-item">
              <span className="result-label">Investment Duration</span>
              <span className="result-value">{sipCalculation.totalMonths} months ({sipDuration} years)</span>
            </div>
            <div className="sip-result-item">
              <span className="result-label">Total Invested (Principal)</span>
              <span className="result-value">{formatCurrency(sipCalculation.investedAmount)}</span>
            </div>
            <div className="sip-result-item">
              <span className="result-label">Expected Returns</span>
              <span className="result-value positive">{formatCurrency(sipCalculation.returns)}</span>
            </div>
            <div className="sip-result-item highlight">
              <span className="result-label">Maturity Amount</span>
              <span className="result-value">{formatCurrency(sipCalculation.maturityAmount)}</span>
            </div>
            <div className="sip-result-item">
              <span className="result-label">Absolute Returns</span>
              <span className="result-value positive">{sipCalculation.returnPercentage.toFixed(2)}%</span>
            </div>
            <div className="sip-result-item">
              <span className="result-label">Approx. CAGR</span>
              <span className="result-value positive">{sipCalculation.cagr.toFixed(2)}%</span>
            </div>
          </div>
        </div>
      </div>

      <div className="analytics-card">
        <h3>Mutual Fund Recommendations</h3>
        <div className="mutual-fund-grid">
          <div className="fund-card">
            <div className="fund-header">
              <h4>Equity Funds</h4>
              <span className="fund-risk high">High Risk</span>
            </div>
            <p>Best for long-term wealth creation (5+ years)</p>
            <div className="fund-stats">
              <span>Expected Return: 12-15%</span>
              <span>Recommended: 60% of portfolio</span>
            </div>
          </div>
          <div className="fund-card">
            <div className="fund-header">
              <h4>Debt Funds</h4>
              <span className="fund-risk low">Low Risk</span>
            </div>
            <p>Stable returns with capital preservation</p>
            <div className="fund-stats">
              <span>Expected Return: 6-8%</span>
              <span>Recommended: 30% of portfolio</span>
            </div>
          </div>
          <div className="fund-card">
            <div className="fund-header">
              <h4>Hybrid Funds</h4>
              <span className="fund-risk medium">Medium Risk</span>
            </div>
            <p>Balanced mix of equity and debt</p>
            <div className="fund-stats">
              <span>Expected Return: 9-11%</span>
              <span>Recommended: 10% of portfolio</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvestmentAdvisorPage;

