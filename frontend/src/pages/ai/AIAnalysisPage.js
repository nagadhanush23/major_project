import React, { useState, useEffect, useCallback } from 'react';
import { transactionsAPI, aiAPI } from '../../services/api';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import { FaChartLine, FaLightbulb, FaArrowUp, FaArrowDown, FaHome, FaUtensils, FaCar, FaChartPie, FaDollarSign, FaBrain, FaHeart, FaCheckCircle, FaExclamationTriangle } from 'react-icons/fa';
import '../dashboard/DashboardPage.css';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const AIAnalysisPage = () => {
  const [activeTab, setActiveTab] = useState('predictions'); // 'predictions', 'salary', or 'health'

  // Expense Prediction State
  const [predictionLoading, setPredictionLoading] = useState(true);
  const [predictions, setPredictions] = useState(null);
  const [insights, setInsights] = useState([]);
  const [forecastPeriod, setForecastPeriod] = useState(6);

  // Salary Analyzer State
  const [salaryLoading, setSalaryLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [salary, setSalary] = useState(0);
  const [location, setLocation] = useState('Metro');
  const [analysis, setAnalysis] = useState(null);

  // Health Score State
  const [healthLoading, setHealthLoading] = useState(true);
  const [healthData, setHealthData] = useState(null);

  // Load initial data
  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const response = await transactionsAPI.getStats();
      const statsData = response.data.data || response.data;
      setStats(statsData);
      if (statsData.totalIncome > 0) {
        setSalary(statsData.totalIncome);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const generateInsights = useCallback((data) => {
    const insights = [];
    const projections = data.projections || [];

    if (projections.length > 0) {
      const avgIncome = data.averageMonthlyIncome || 0;
      const avgExpense = data.averageMonthlyExpense || 0;
      const currentBalance = data.currentBalance || 0;

      if (avgExpense > avgIncome * 0.8) {
        insights.push({
          type: 'warning',
          icon: FaArrowUp,
          title: 'High Spending Alert',
          message: `Your expenses are ${((avgExpense / avgIncome) * 100).toFixed(0)}% of your income. Consider reducing non-essential spending.`
        });
      } else {
        insights.push({
          type: 'success',
          icon: FaArrowDown,
          title: 'Healthy Spending Ratio',
          message: `Your spending is well within limits at ${((avgExpense / avgIncome) * 100).toFixed(0)}% of income.`
        });
      }

      const savingsRate = ((avgIncome - avgExpense) / avgIncome) * 100;
      if (savingsRate > 20) {
        insights.push({
          type: 'success',
          icon: FaLightbulb,
          title: 'Excellent Savings Rate',
          message: `You're saving ${savingsRate.toFixed(0)}% of your income. Great job!`
        });
      } else if (savingsRate < 10) {
        insights.push({
          type: 'warning',
          icon: FaLightbulb,
          title: 'Low Savings Rate',
          message: `You're only saving ${savingsRate.toFixed(0)}% of income. Aim for at least 20% for financial security.`
        });
      }

      if (projections.length > 0) {
        const lastProjection = projections[projections.length - 1];
        const projectedGrowth = ((lastProjection.projectedBalance - currentBalance) / currentBalance) * 100;

        if (projectedGrowth > 0) {
          insights.push({
            type: 'success',
            icon: FaChartLine,
            title: 'Positive Growth Projection',
            message: `Based on current trends, your balance is projected to grow by ${projectedGrowth.toFixed(0)}% over ${forecastPeriod} months.`
          });
        }
      }
    }

    return insights;
  }, [forecastPeriod]);

  // Load predictions
  const loadPredictions = useCallback(async () => {
    try {
      setPredictionLoading(true);
      const response = await aiAPI.getExpensePredictions(forecastPeriod);
      const data = response.data;

      setPredictions(data);

      if (data.insights && data.insights.length > 0) {
        const insightsWithIcons = data.insights.map(insight => ({
          ...insight,
          icon: insight.type === 'warning' ? FaArrowUp : insight.type === 'success' ? FaArrowDown : FaLightbulb
        }));
        setInsights(insightsWithIcons);
      } else {
        const generatedInsights = generateInsights(data);
        setInsights(generatedInsights);
      }
    } catch (error) {
      console.error('Error loading predictions:', error);
    } finally {
      setPredictionLoading(false);
    }
  }, [forecastPeriod, generateInsights]);

  const performLocalAnalysis = useCallback(() => {
    const monthlySalary = salary;
    const monthlyExpense = stats?.totalExpense || 0;
    const savings = monthlySalary - monthlyExpense;
    const savingsRate = (savings / monthlySalary) * 100;

    const colEstimates = {
      'Metro': { housing: 0.35, food: 0.15, transport: 0.10, other: 0.20 },
      'Tier-1': { housing: 0.30, food: 0.18, transport: 0.12, other: 0.22 },
      'Tier-2': { housing: 0.25, food: 0.20, transport: 0.10, other: 0.25 },
    };

    const col = colEstimates[location] || colEstimates['Metro'];

    const localAnalysis = {
      monthlySalary,
      monthlyExpense,
      savings,
      savingsRate,
      costOfLiving: {
        housing: monthlySalary * col.housing,
        food: monthlySalary * col.food,
        transport: monthlySalary * col.transport,
        other: monthlySalary * col.other,
        total: monthlySalary * (col.housing + col.food + col.transport + col.other),
      },
      recommendations: generateRecommendations(monthlySalary, monthlyExpense, savingsRate),
    };

    setAnalysis(localAnalysis);
  }, [salary, stats, location]);

  // Load salary analysis
  const loadAIAnalysis = useCallback(async () => {
    if (!stats || salary <= 0) {
      setSalaryLoading(false);
      return;
    }

    try {
      setSalaryLoading(true);
      const response = await aiAPI.getSalaryAnalysis(salary, location);
      const data = response.data;

      setAnalysis({
        monthlySalary: data.monthlySalary,
        monthlyExpense: data.monthlyExpense,
        savings: data.savings,
        savingsRate: data.savingsRate,
        costOfLiving: data.costOfLiving,
        recommendations: data.recommendations,
        benchmarkComparison: data.benchmarkComparison,
      });
    } catch (error) {
      console.error('Error loading AI salary analysis:', error);
      performLocalAnalysis();
    } finally {
      setSalaryLoading(false);
    }
  }, [stats, salary, location, performLocalAnalysis]);

  // Load health score
  const loadHealthScore = useCallback(async () => {
    try {
      setHealthLoading(true);
      const response = await aiAPI.getFinancialHealthScore();
      setHealthData(response.data);
    } catch (error) {
      console.error('Error loading health score:', error);
    } finally {
      setHealthLoading(false);
    }
  }, []);

  // Load data when tab changes
  useEffect(() => {
    if (activeTab === 'predictions') {
      loadPredictions();
    } else if (activeTab === 'salary') {
      loadAIAnalysis();
    } else if (activeTab === 'health') {
      loadHealthScore();
    }
  }, [activeTab, loadPredictions, loadAIAnalysis, loadHealthScore]);

  // Reload salary analysis when salary or location changes
  useEffect(() => {
    if (activeTab === 'salary' && salary > 0) {
      loadAIAnalysis();
    }
  }, [salary, location, activeTab, loadAIAnalysis]);


  const generateRecommendations = (salary, expense, savingsRate) => {
    const recommendations = [];

    if (savingsRate < 20) {
      recommendations.push({
        type: 'warning',
        title: 'Increase Savings Rate',
        message: `Your savings rate is ${savingsRate.toFixed(1)}%. Aim for at least 20% for financial security.`,
      });
    }

    if (expense > salary * 0.5) {
      recommendations.push({
        type: 'warning',
        title: 'High Expense Ratio',
        message: 'Your expenses exceed 50% of income. Review and reduce non-essential spending.',
      });
    }

    if (savingsRate >= 20) {
      recommendations.push({
        type: 'success',
        title: 'Excellent Savings',
        message: `Great job! You're saving ${savingsRate.toFixed(1)}% of your income.`,
      });
    }

    return recommendations;
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const chartData = predictions?.projections ? {
    labels: predictions.projections.map((p, i) => `Month ${i + 1}`),
    datasets: [
      {
        label: 'Projected Income',
        data: predictions.projections.map(p => p.projectedIncome),
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        tension: 0.4,
      },
      {
        label: 'Projected Expenses',
        data: predictions.projections.map(p => p.projectedExpense),
        borderColor: '#ef4444',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        tension: 0.4,
      },
      {
        label: 'Projected Balance',
        data: predictions.projections.map(p => p.projectedBalance),
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
      },
    ],
  } : null;

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      tooltip: {
        callbacks: {
          label: (context) => `${context.dataset.label}: ${formatCurrency(context.parsed.y)}`,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: (value) => formatCurrency(value),
        },
      },
    },
  };

  return (
    <div className="dashboard-page">
      <div className="page-header">
        <div>
          <h1>AI Financial Analysis</h1>
          <p className="page-subtitle">Intelligent predictions, salary insights, and cost-of-living analysis</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="transaction-tabs">
        <button
          className={`tab-btn ${activeTab === 'predictions' ? 'active' : ''}`}
          onClick={() => setActiveTab('predictions')}
        >
          <FaBrain /> Expense Predictions
        </button>
        <button
          className={`tab-btn ${activeTab === 'salary' ? 'active' : ''}`}
          onClick={() => setActiveTab('salary')}
        >
          <FaDollarSign /> Salary Analyzer
        </button>
        <button
          className={`tab-btn ${activeTab === 'health' ? 'active' : ''}`}
          onClick={() => setActiveTab('health')}
        >
          <FaHeart /> Health Score
        </button>
      </div>

      {/* Expense Predictions Tab */}
      {activeTab === 'predictions' && (
        <>
          <div className="page-header" style={{ marginBottom: '1rem', marginTop: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h2 style={{ fontSize: '1.5rem', margin: 0 }}>Expense Prediction & Forecasting</h2>
            </div>
            <div className="forecast-controls" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <label style={{ margin: 0, whiteSpace: 'nowrap' }}>Forecast Period:</label>
              <select
                value={forecastPeriod}
                onChange={(e) => setForecastPeriod(Number(e.target.value))}
                className="form-control"
                style={{ minWidth: '120px' }}
              >
                <option value={3}>3 Months</option>
                <option value={6}>6 Months</option>
                <option value={12}>12 Months</option>
              </select>
              <button className="btn-primary" onClick={loadPredictions} style={{ padding: '0.5rem 1rem', whiteSpace: 'nowrap' }}>
                Refresh Analysis
              </button>
            </div>
          </div>

          {predictionLoading ? (
            <div className="page-loading">
              <div className="spinner"></div>
              <p>Loading predictions...</p>
            </div>
          ) : (
            <>
              {insights.length > 0 && (
                <div className="insights-grid" style={{ marginTop: '1.5rem' }}>
                  {insights.map((insight, index) => {
                    const Icon = insight.icon;
                    return (
                      <div key={index} className={`insight-card ${insight.type}`}>
                        <div className="insight-icon">
                          <Icon />
                        </div>
                        <div className="insight-content">
                          <h3>{insight.title}</h3>
                          <p>{insight.message}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="analytics-grid" style={{ marginTop: insights.length > 0 ? '2rem' : '1.5rem' }}>
                {chartData && (
                  <div className="analytics-card">
                    <h3>Financial Forecast</h3>
                    <div className="chart-container" style={{ height: '400px' }}>
                      <Line data={chartData} options={chartOptions} />
                    </div>
                    <div className="projection-stats">
                      <div className="projection-stat">
                        <p className="stat-label">Current Balance</p>
                        <p className="stat-value">
                          {formatCurrency(predictions?.currentBalance || 0)}
                        </p>
                      </div>
                      <div className="projection-stat">
                        <p className="stat-label">Avg Monthly Income</p>
                        <p className="stat-value">
                          {formatCurrency(predictions?.averageMonthlyIncome || 0)}
                        </p>
                      </div>
                      <div className="projection-stat">
                        <p className="stat-label">Avg Monthly Expense</p>
                        <p className="stat-value">
                          {formatCurrency(predictions?.averageMonthlyExpense || 0)}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="analytics-card">
                  <h3>Prediction Summary</h3>
                  <div className="prediction-summary">
                    {predictions?.projections?.map((projection, index) => (
                      <div key={index} className="prediction-item">
                        <div className="prediction-header">
                          <span className="prediction-month">Month {projection.month}</span>
                          <span className={`prediction-trend ${projection.projectedBalance > (predictions.currentBalance || 0) ? 'positive' : 'negative'}`}>
                            {projection.projectedBalance > (predictions.currentBalance || 0) ? '↑' : '↓'}
                          </span>
                        </div>
                        <div className="prediction-details">
                          <div className="prediction-row">
                            <span>Income:</span>
                            <span className="amount income">{formatCurrency(projection.projectedIncome)}</span>
                          </div>
                          <div className="prediction-row">
                            <span>Expenses:</span>
                            <span className="amount expense">{formatCurrency(projection.projectedExpense)}</span>
                          </div>
                          <div className="prediction-row">
                            <span>Balance:</span>
                            <span className="amount balance">{formatCurrency(projection.projectedBalance)}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}
        </>
      )}

      {/* Salary Analyzer Tab */}
      {activeTab === 'salary' && (
        <>
          <div className="page-header" style={{ marginBottom: '1rem', marginTop: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 style={{ fontSize: '1.5rem', margin: 0 }}>Salary Analyzer & Cost-of-Living</h2>
            </div>
            <button className="btn-primary" onClick={loadAIAnalysis} style={{ padding: '0.5rem 1rem' }}>
              Refresh Analysis
            </button>
          </div>

          {salaryLoading ? (
            <div className="page-loading">
              <div className="spinner"></div>
              <p>Loading salary analysis...</p>
            </div>
          ) : (
            <>
              <div className="analytics-grid">
                <div className="analytics-card">
                  <h3>Salary Input</h3>
                  <div className="salary-input-form">
                    <div className="form-group">
                      <label>Monthly Salary</label>
                      <input
                        type="number"
                        value={salary}
                        onChange={(e) => setSalary(Number(e.target.value))}
                        placeholder="Enter monthly salary"
                      />
                    </div>
                    <div className="form-group">
                      <label>Location Type</label>
                      <select value={location} onChange={(e) => setLocation(e.target.value)}>
                        <option value="Metro">Metro City</option>
                        <option value="Tier-1">Tier-1 City</option>
                        <option value="Tier-2">Tier-2 City</option>
                      </select>
                    </div>
                  </div>
                </div>

                {analysis && (
                  <div className="analytics-card">
                    <h3>Financial Overview</h3>
                    <div className="salary-overview">
                      <div className="overview-item">
                        <span className="overview-label">Monthly Salary</span>
                        <span className="overview-value">{formatCurrency(analysis.monthlySalary)}</span>
                      </div>
                      <div className="overview-item">
                        <span className="overview-label">Monthly Expenses</span>
                        <span className="overview-value expense">{formatCurrency(analysis.monthlyExpense)}</span>
                      </div>
                      <div className="overview-item highlight">
                        <span className="overview-label">Monthly Savings</span>
                        <span className="overview-value positive">{formatCurrency(analysis.savings)}</span>
                      </div>
                      <div className="overview-item">
                        <span className="overview-label">Savings Rate</span>
                        <span className={`overview-value ${analysis.savingsRate >= 20 ? 'positive' : 'warning'}`}>
                          {analysis.savingsRate.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {analysis && (
                <>
                  <div className="analytics-card" style={{ marginTop: '2rem' }}>
                    <h3>Cost of Living Breakdown ({location})</h3>
                    <div className="col-breakdown">
                      <div className="col-item">
                        <div className="col-icon">
                          <FaHome />
                        </div>
                        <div className="col-details">
                          <span className="col-category">Housing</span>
                          <span className="col-amount">{formatCurrency(analysis.costOfLiving.housing)}</span>
                          <span className="col-percentage">{(analysis.costOfLiving.housing / analysis.monthlySalary * 100).toFixed(0)}%</span>
                        </div>
                      </div>
                      <div className="col-item">
                        <div className="col-icon">
                          <FaUtensils />
                        </div>
                        <div className="col-details">
                          <span className="col-category">Food & Groceries</span>
                          <span className="col-amount">{formatCurrency(analysis.costOfLiving.food)}</span>
                          <span className="col-percentage">{(analysis.costOfLiving.food / analysis.monthlySalary * 100).toFixed(0)}%</span>
                        </div>
                      </div>
                      <div className="col-item">
                        <div className="col-icon">
                          <FaCar />
                        </div>
                        <div className="col-details">
                          <span className="col-category">Transport</span>
                          <span className="col-amount">{formatCurrency(analysis.costOfLiving.transport)}</span>
                          <span className="col-percentage">{(analysis.costOfLiving.transport / analysis.monthlySalary * 100).toFixed(0)}%</span>
                        </div>
                      </div>
                      <div className="col-item">
                        <div className="col-icon">
                          <FaChartPie />
                        </div>
                        <div className="col-details">
                          <span className="col-category">Other Expenses</span>
                          <span className="col-amount">{formatCurrency(analysis.costOfLiving.other)}</span>
                          <span className="col-percentage">{(analysis.costOfLiving.other / analysis.monthlySalary * 100).toFixed(0)}%</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {analysis.recommendations && analysis.recommendations.length > 0 && (
                    <div className="analytics-card" style={{ marginTop: '2rem' }}>
                      <h3>AI Recommendations</h3>
                      <div className="recommendations-list">
                        {analysis.recommendations.map((rec, index) => (
                          <div key={index} className={`recommendation-item ${rec.type}`}>
                            <h4>{rec.title}</h4>
                            <p>{rec.message}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </>
      )}

      {/* Health Score Tab */}
      {activeTab === 'health' && (
        <>
          <div className="page-header" style={{ marginBottom: '1rem', marginTop: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 style={{ fontSize: '1.5rem', margin: 0 }}>Financial Health Score</h2>
            </div>
            <button className="btn-primary" onClick={loadHealthScore} style={{ padding: '0.5rem 1rem' }}>
              Refresh Analysis
            </button>
          </div>

          {healthLoading ? (
            <div className="page-loading">
              <div className="spinner"></div>
              <p>Analyzing your financial health...</p>
            </div>
          ) : (
            <>
              {healthData ? (
                <>
                  <div className="analytics-grid">
                    <div className="analytics-card highlight" style={{ gridColumn: '1 / -1' }}>
                      <div style={{ textAlign: 'center', padding: '2rem' }}>
                        <div style={{
                          fontSize: '4rem',
                          fontWeight: 'bold',
                          color: getScoreColor(healthData.score),
                          marginBottom: '1rem'
                        }}>
                          {healthData.score}
                        </div>
                        <div style={{
                          fontSize: '2rem',
                          fontWeight: '600',
                          color: getGradeColor(healthData.grade),
                          marginBottom: '0.5rem'
                        }}>
                          Grade {healthData.grade}
                        </div>
                        <p className="text-muted">Financial Health Score</p>
                      </div>
                    </div>

                    <div className="analytics-card">
                      <h3><FaChartLine /> Health Factors</h3>
                      <div className="factors-list">
                        {healthData.factors && healthData.factors.map((factor, index) => (
                          <div key={index} className="factor-item">
                            <div className="factor-header">
                              <span className="factor-name">{factor.name}</span>
                              <span className={`factor-impact ${factor.impact}`}>
                                {factor.impact === 'positive' ? <FaCheckCircle /> : <FaExclamationTriangle />}
                              </span>
                            </div>
                            <div className="factor-value">{factor.value}</div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="analytics-card">
                      <h3><FaHeart /> Recommendations</h3>
                      <div className="recommendations-list">
                        {healthData.recommendations && healthData.recommendations.map((rec, index) => (
                          <div key={index} className="recommendation-item">
                            <FaCheckCircle className="rec-icon" />
                            <p>{rec}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="analytics-card">
                  <p>Unable to load financial health data. Please try again.</p>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
};

const getScoreColor = (score) => {
  if (score >= 80) return '#10b981';
  if (score >= 65) return '#3b82f6';
  if (score >= 50) return '#f59e0b';
  if (score >= 35) return '#f97316';
  return '#ef4444';
};

const getGradeColor = (grade) => {
  if (grade === 'A') return '#10b981';
  if (grade === 'B') return '#3b82f6';
  if (grade === 'C') return '#f59e0b';
  if (grade === 'D') return '#f97316';
  return '#ef4444';
};

export default AIAnalysisPage;

