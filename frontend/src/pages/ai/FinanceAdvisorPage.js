import React, { useState } from 'react';
import { aiAPI } from '../../services/api';
import { Pie } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    ArcElement,
    Tooltip,
    Legend,
    CategoryScale,
    LinearScale,
    BarElement,
    Title
} from 'chart.js';
import { Loader2, TrendingUp, DollarSign, PieChart, Save, CreditCard, Plus, Trash2 } from 'lucide-react';
import './FinanceAdvisorPage.css';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

const FinanceAdvisorPage = () => {
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState(null);
    const [activeTab, setActiveTab] = useState('input');

    const [income, setIncome] = useState(3000);
    const [dependants, setDependants] = useState(0);
    const [expenses, setExpenses] = useState({
        Housing: 1200,
        Food: 400,
        Transport: 150,
        Utilities: 200,
        Entertainment: 100,
        Healthcare: 50,
        Personal: 100,
        Savings: 0,
        Other: 100
    });
    const [debts, setDebts] = useState([]);
    const [newDebt, setNewDebt] = useState({ name: '', amount: '', interest_rate: '', min_payment: '' });

    const handleExpenseChange = (category, value) => {
        setExpenses({ ...expenses, [category]: parseFloat(value) || 0 });
    };

    const addDebt = () => {
        if (newDebt.name && newDebt.amount) {
            setDebts([...debts, {
                ...newDebt,
                amount: parseFloat(newDebt.amount),
                interest_rate: parseFloat(newDebt.interest_rate),
                min_payment: parseFloat(newDebt.min_payment)
            }]);
            setNewDebt({ name: '', amount: '', interest_rate: '', min_payment: '' });
        }
    };

    const removeDebt = (index) => {
        setDebts(debts.filter((_, i) => i !== index));
    };

    const analyzeFinances = async () => {
        setLoading(true);
        try {
            const financialData = {
                monthly_income: income,
                dependants: dependants,
                manual_expenses: expenses,
                transactions: [],
                debts: debts
            };

            const response = await aiAPI.getFinancialAdvisorAnalysis(financialData);
            setResults(response.data);
            setActiveTab('budget');
        } catch (error) {
            console.error("Analysis failed", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="dashboard-page financial-advisor-container">
            <div className="financial-advisor-header">
                <h1 className="financial-advisor-title">AI Financial Advisor</h1>
                <p className="financial-advisor-subtitle">Comprehensive financial planning powered by Groq AI</p>
            </div>

            {/* Tabs */}
            <div className="advisor-tabs">
                {['input', 'budget', 'savings', 'debt'].map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        disabled={!results && tab !== 'input'}
                        className={`advisor-tab ${activeTab === tab ? 'active' : ''}`}
                    >
                        {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </button>
                ))}
            </div>

            {/* Input Tab */}
            {activeTab === 'input' && (
                <div className="advisor-input-grid">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                        {/* Income & Household */}
                        <div className="advisor-card">
                            <div className="advisor-card-header">
                                <DollarSign className="advisor-card-icon" />
                                <h2 className="advisor-card-title">Income & Household</h2>
                            </div>
                            <div className="advisor-form-grid">
                                <div className="advisor-form-group">
                                    <label className="advisor-form-label">Monthly Income ($)</label>
                                    <input
                                        type="number"
                                        value={income}
                                        onChange={(e) => setIncome(parseFloat(e.target.value) || 0)}
                                        className="advisor-input"
                                        placeholder="5000"
                                    />
                                </div>
                                <div className="advisor-form-group">
                                    <label className="advisor-form-label">Dependants</label>
                                    <input
                                        type="number"
                                        value={dependants}
                                        onChange={(e) => setDependants(parseInt(e.target.value) || 0)}
                                        className="advisor-input"
                                        placeholder="0"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Expenses */}
                        <div className="advisor-card">
                            <div className="advisor-card-header">
                                <PieChart className="advisor-card-icon" />
                                <h2 className="advisor-card-title">Monthly Expenses</h2>
                            </div>
                            <div className="advisor-form-grid">
                                {Object.keys(expenses).map(cat => (
                                    <div key={cat} className="advisor-form-group">
                                        <label className="advisor-form-label">{cat}</label>
                                        <input
                                            type="number"
                                            value={expenses[cat]}
                                            onChange={(e) => handleExpenseChange(cat, e.target.value)}
                                            className="advisor-input"
                                            placeholder="0"
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                        {/* Debts */}
                        <div className="advisor-card">
                            <div className="advisor-card-header">
                                <CreditCard className="advisor-card-icon" />
                                <h2 className="advisor-card-title">Debts</h2>
                            </div>

                            {debts.length > 0 ? (
                                <div className="debt-list">
                                    {debts.map((debt, idx) => (
                                        <div key={idx} className="debt-item">
                                            <div className="debt-info">
                                                <div className="debt-name">{debt.name}</div>
                                                <div className="debt-details">
                                                    <span className="debt-amount">${debt.amount.toLocaleString()}</span>
                                                    <span className="debt-rate">{debt.interest_rate}% APR</span>
                                                    <span>Min: ${debt.min_payment}</span>
                                                </div>
                                            </div>
                                            <button onClick={() => removeDebt(idx)} className="debt-remove-btn">
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="debt-empty">
                                    <p>No debts added yet</p>
                                </div>
                            )}

                            <div className="add-debt-form">
                                <div className="add-debt-title">Add New Debt</div>
                                <div className="add-debt-grid">
                                    <input
                                        placeholder="Debt Name (e.g. Credit Card)"
                                        value={newDebt.name}
                                        onChange={e => setNewDebt({ ...newDebt, name: e.target.value })}
                                        className="advisor-input"
                                    />
                                    <input
                                        placeholder="Amount ($)"
                                        type="number"
                                        value={newDebt.amount}
                                        onChange={e => setNewDebt({ ...newDebt, amount: e.target.value })}
                                        className="advisor-input"
                                    />
                                    <input
                                        placeholder="Interest Rate (%)"
                                        type="number"
                                        value={newDebt.interest_rate}
                                        onChange={e => setNewDebt({ ...newDebt, interest_rate: e.target.value })}
                                        className="advisor-input"
                                    />
                                    <input
                                        placeholder="Min Payment ($)"
                                        type="number"
                                        value={newDebt.min_payment}
                                        onChange={e => setNewDebt({ ...newDebt, min_payment: e.target.value })}
                                        className="advisor-input"
                                    />
                                </div>
                                <button onClick={addDebt} className="advisor-btn advisor-btn-secondary" style={{ width: '100%' }}>
                                    <Plus size={18} /> Add Debt
                                </button>
                            </div>
                        </div>

                        <button
                            onClick={analyzeFinances}
                            disabled={loading}
                            className="advisor-btn advisor-btn-primary"
                            style={{ width: '100%' }}
                        >
                            {loading ? (
                                <span className="advisor-loading">
                                    <Loader2 size={24} className="advisor-spinner" />
                                    Analyzing...
                                </span>
                            ) : (
                                <>
                                    <TrendingUp size={24} />
                                    Generate Financial Plan
                                </>
                            )}
                        </button>
                    </div>
                </div>
            )}

            {/* Budget Tab */}
            {!loading && results && activeTab === 'budget' && (
                <div className="fade-in">
                    <div className="results-grid">
                        <div className="advisor-card chart-container">
                            <h3 className="chart-title">Spending Breakdown</h3>
                            <div className="chart-wrapper">
                                <Pie
                                    data={{
                                        labels: results.budget_analysis.spending_categories.map(c => c.category),
                                        datasets: [{
                                            data: results.budget_analysis.spending_categories.map(c => c.amount),
                                            backgroundColor: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#6366f1', '#14b8a6', '#f43f5e'],
                                            borderWidth: 0
                                        }]
                                    }}
                                    options={{
                                        maintainAspectRatio: false,
                                        plugins: {
                                            legend: {
                                                position: 'right',
                                                labels: { color: '#94a3b8', padding: 15 }
                                            }
                                        }
                                    }}
                                />
                            </div>
                        </div>

                        <div className="advisor-card">
                            <h3 className="chart-title">Financial Health</h3>
                            <div className="health-cards">
                                <div className="health-card">
                                    <span className="health-label">Total Income</span>
                                    <span className="health-value positive">${results.budget_analysis.monthly_income.toLocaleString()}</span>
                                </div>
                                <div className="health-card">
                                    <span className="health-label">Total Expenses</span>
                                    <span className="health-value negative">${results.budget_analysis.total_expenses.toLocaleString()}</span>
                                </div>
                                <div className="health-card highlight">
                                    <span className="health-label">Monthly Surplus</span>
                                    <span className="health-value primary">
                                        ${(results.budget_analysis.monthly_income - results.budget_analysis.total_expenses).toLocaleString()}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="advisor-card recommendations-section">
                        <div className="recommendations-header">
                            <div className="recommendations-icon">
                                <TrendingUp size={24} style={{ color: 'var(--primary)' }} />
                            </div>
                            <h3 className="advisor-card-title">AI Recommendations</h3>
                        </div>
                        <div className="recommendations-grid">
                            {results.budget_analysis.recommendations.map((rec, i) => (
                                <div key={i} className="recommendation-card">
                                    <div className="recommendation-header">
                                        <h4 className="recommendation-title">{rec.category}</h4>
                                        {rec.potential_savings > 0 && (
                                            <span className="recommendation-badge">
                                                Save ${rec.potential_savings}
                                            </span>
                                        )}
                                    </div>
                                    <p className="recommendation-text">{rec.recommendation}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Savings Tab */}
            {!loading && results && activeTab === 'savings' && (
                <div className="fade-in">
                    <div className="emergency-fund-card">
                        <div className="emergency-fund-header">
                            <div className="emergency-fund-icon">
                                <Save size={24} />
                            </div>
                            <h3 className="emergency-fund-title">Emergency Fund Goal</h3>
                        </div>
                        <div className="emergency-fund-amount">
                            ${results.savings_strategy.emergency_fund.recommended_amount.toLocaleString()}
                        </div>
                        <div className="emergency-fund-status">
                            {results.savings_strategy.emergency_fund.current_status}
                        </div>
                    </div>

                    <div className="results-grid">
                        {results.savings_strategy.recommendations.map((rec, i) => (
                            <div key={i} className="advisor-card">
                                <h4 className="advisor-card-title">{rec.category}</h4>
                                <p className="recommendation-text" style={{ marginBottom: '1.5rem' }}>{rec.rationale}</p>
                                <div style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--primary)' }}>
                                    ${rec.amount}<span style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>/mo</span>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="advisor-card" style={{ marginTop: '2rem' }}>
                        <h3 className="advisor-card-title">Automation Strategy</h3>
                        <div className="recommendations-grid">
                            {results.savings_strategy.automation_techniques.map((tech, i) => (
                                <div key={i} className="recommendation-card">
                                    <h4 className="recommendation-title">{tech.name}</h4>
                                    <p className="recommendation-text">{tech.description}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Debt Tab */}
            {!loading && results && activeTab === 'debt' && (
                <div className="fade-in">
                    <div className="debt-payoff-grid">
                        <div className="debt-payoff-card">
                            <div className="debt-payoff-header">
                                <h3 className="debt-payoff-title">Avalanche Method</h3>
                                <span className="debt-payoff-subtitle">Highest Interest First</span>
                            </div>
                            <div className="debt-stats-grid">
                                <div className="debt-stat">
                                    <div className="debt-stat-label">Time to Freedom</div>
                                    <div className="debt-stat-value">{results.debt_reduction.payoff_plans.avalanche.months_to_payoff} mo</div>
                                </div>
                                <div className="debt-stat">
                                    <div className="debt-stat-label">Total Interest</div>
                                    <div className="debt-stat-value danger">${results.debt_reduction.payoff_plans.avalanche.total_interest}</div>
                                </div>
                            </div>
                            <div className="debt-payment-highlight">
                                <div className="debt-payment-label">Monthly Payment</div>
                                <div className="debt-payment-amount">${Math.round(results.debt_reduction.payoff_plans.avalanche.monthly_payment)}</div>
                            </div>
                        </div>

                        <div className="debt-payoff-card">
                            <div className="debt-payoff-header">
                                <h3 className="debt-payoff-title">Snowball Method</h3>
                                <span className="debt-payoff-subtitle">Smallest Balance First</span>
                            </div>
                            <div className="debt-stats-grid">
                                <div className="debt-stat">
                                    <div className="debt-stat-label">Time to Freedom</div>
                                    <div className="debt-stat-value">{results.debt_reduction.payoff_plans.snowball.months_to_payoff} mo</div>
                                </div>
                                <div className="debt-stat">
                                    <div className="debt-stat-label">Total Interest</div>
                                    <div className="debt-stat-value danger">${results.debt_reduction.payoff_plans.snowball.total_interest}</div>
                                </div>
                            </div>
                            <div className="debt-payment-highlight">
                                <div className="debt-payment-label">Monthly Payment</div>
                                <div className="debt-payment-amount">${Math.round(results.debt_reduction.payoff_plans.snowball.monthly_payment)}</div>
                            </div>
                        </div>
                    </div>

                    <div className="advisor-card">
                        <h3 className="advisor-card-title">Debt Reduction Strategy</h3>
                        <div className="recommendations-grid">
                            {results.debt_reduction.recommendations.map((rec, i) => (
                                <div key={i} className="recommendation-card">
                                    <h4 className="recommendation-title">{rec.title}</h4>
                                    <p className="recommendation-text">{rec.description}</p>
                                    {rec.impact && (
                                        <span className="recommendation-badge" style={{ marginTop: '1rem', display: 'inline-block' }}>
                                            Impact: {rec.impact}
                                        </span>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FinanceAdvisorPage;
