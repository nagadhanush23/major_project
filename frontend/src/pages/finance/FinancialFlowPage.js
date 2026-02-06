import React, { useState, useEffect } from 'react';
import { transactionsAPI, aiAPI, userAPI } from '../../services/api';
import { FaMoneyBillWave, FaShieldAlt, FaPiggyBank, FaGlassCheers, FaArrowRight, FaMagic, FaStream, FaBullseye, FaPlus } from 'react-icons/fa';
import AddExpenseModal from '../../components/transactions/AddExpenseModal';
import './FinancialFlowPage.css';

const Sparkline = ({ data, color }) => {
    if (!data || data.length === 0) return null;
    const max = Math.max(...data.map(d => d.amount));
    const min = Math.min(...data.map(d => d.amount));
    const range = max - min || 1;
    const points = data.map((d, i) => {
        const x = (i / (data.length - 1)) * 100;
        const y = 100 - ((d.amount - min) / range) * 80 - 10; // keep within 10-90% height
        return `${x},${y}`;
    }).join(' ');

    return (
        <svg viewBox="0 0 100 100" className="sparkline" preserveAspectRatio="none">
            <polyline
                fill="none"
                stroke={color}
                strokeWidth="2"
                points={points}
                vectorEffect="non-scaling-stroke"
            />
        </svg>
    );
};

const FinancialFlowPage = () => {
    const [loading, setLoading] = useState(true);
    const [income, setIncome] = useState(0);
    const [needs, setNeeds] = useState(0);
    const [forecast, setForecast] = useState(null);
    const [history, setHistory] = useState([]);
    const [allocation, setAllocation] = useState(null);
    const [showAIInsights, setShowAIInsights] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Enhanced Features State
    const [savingsGoal, setSavingsGoal] = useState(null);
    const [splitRatio, setSplitRatio] = useState(50); // 50% default

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [statsRes] = await Promise.all([
                transactionsAPI.getStats(),
                userAPI.getProfile()
            ]);

            const totalIncome = statsRes.data.data.totalIncome || 0;
            const totalExpense = statsRes.data.data.totalExpense || 0;
            const needsEst = totalExpense * 0.6;

            setIncome(totalIncome);
            setNeeds(needsEst);

            const aiRes = await aiAPI.forecastNeeds();
            if (aiRes.data) {
                setForecast(aiRes.data);
                setHistory(aiRes.data.history || []);
            }

            setSavingsGoal(null);

        } catch (error) {
            console.error('Error loading flow data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAIAllocation = async () => {
        try {
            setShowAIInsights(true);
            const surplus = income - needs;
            const res = await aiAPI.suggestAllocation(Math.max(surplus, 0));
            setAllocation(res.data);

            if (res.data && res.data.splits && res.data.splits.savings) {
                setSplitRatio(res.data.splits.savings.percentage);
            }
        } catch (error) {
            console.error('Allocation error:', error);
        }
    };

    const handleSliderChange = (e) => {
        setSplitRatio(parseInt(e.target.value));
        setShowAIInsights(false);
        setAllocation(null);
    };

    const handleSaveExpense = async (expenseData) => {
        try {
            await transactionsAPI.create(expenseData);
            // Reload data to reflect new expense
            await loadData();
        } catch (error) {
            console.error('Failed to save expense:', error);
            throw error;
        }
    };

    if (loading) return <div className="loading-state">Loading Financial Flow...</div>;

    const surplus = Math.max(income - needs, 0);
    const savingsAmount = (surplus * splitRatio) / 100;
    const personalAmount = surplus - savingsAmount;

    return (
        <div className="financial-flow-page animate-fade-in">
            <div className="header-container">
                <div className="header-content">
                    <h1 className="header-title">
                        <FaStream className="header-icon" /> Financial Flow
                    </h1>
                    <p className="header-subtitle">
                        Visualize how money moves from Income → Needs → Wealth.
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="ai-optimize-btn"
                        style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                    >
                        <FaPlus /> Add Expense
                    </button>
                    <button
                        onClick={handleAIAllocation}
                        className="ai-optimize-btn"
                    >
                        <FaMagic /> AI Optimize
                    </button>
                </div>
            </div>

            <AddExpenseModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSaveExpense}
            />

            {/* Main Flow Logic Visualizer */}
            <div className="flow-container">

                {/* Step 1: Income */}
                <div className="flow-step">
                    <div className="flow-card income-node">
                        <div className="icon-wrapper bg-green-100 text-green-600">
                            <FaMoneyBillWave />
                        </div>
                        <div className="card-content">
                            <p className="node-label">Monthly Income</p>
                            <h3 className="node-value">₹{income.toLocaleString()}</h3>
                        </div>
                        <div className="sparkline-wrapper">
                            <Sparkline data={[{ amount: 24000 }, { amount: 24500 }, { amount: 24500 }, { amount: 26000 }, { amount: 25500 }, { amount: income }]} color="#8b5cf6" />
                        </div>
                    </div>
                </div>

                <div className="flow-connector">
                    <FaArrowRight />
                </div>

                {/* Step 2: Needs Bucket */}
                <div className="flow-step">
                    <div className="flow-card needs-node border-blue">
                        <div className="card-header-row">
                            <div className="icon-wrapper bg-blue-100 text-blue-600">
                                <FaShieldAlt />
                            </div>
                            <span className="badge badge-blue">
                                Fixed Costs
                            </span>
                        </div>
                        <p className="node-label">Needs & Bills</p>
                        <h3 className="node-value">₹{Math.round(needs).toLocaleString()}</h3>

                        <div className="sparkline-wrapper">
                            <Sparkline data={history} color="#3b82f6" />
                        </div>

                        {forecast && (
                            <p className="forecast-text">
                                🔮 AI Forecast: ₹{forecast.forecastedAmount.toLocaleString()}
                            </p>
                        )}
                    </div>
                </div>

                <div className="flow-connector">
                    <FaArrowRight />
                </div>

                {/* Step 3: Surplus -> Split */}
                <div className="flow-step">
                    <div className="flow-card surplus-node">
                        <p className="node-label accent-text">YOUR SURPLUS</p>
                        <h2 className="node-value lg">₹{surplus.toLocaleString()}</h2>

                        {/* Interactive Slider */}
                        <div className="slider-section">
                            <input
                                type="range"
                                min="0"
                                max="100"
                                value={splitRatio}
                                onChange={handleSliderChange}
                                className="surplus-slider"
                            />
                            <div className="slider-labels">
                                <span className="text-success">{splitRatio}% Save</span>
                                <span className="text-warn">{100 - splitRatio}% Spend</span>
                            </div>
                        </div>
                    </div>

                    <div className="split-container">
                        {/* Savings Split */}
                        <div className={`split-card ${allocation ? 'highlight' : ''}`}>
                            <div className="split-header">
                                <div className="icon-wrapper sm bg-yellow-100 text-yellow-600">
                                    <FaPiggyBank />
                                </div>
                                {savingsGoal && (
                                    <div className="goal-tag" title={`Funding: ${savingsGoal.name}`}>
                                        <FaBullseye className="goal-icon" /> {savingsGoal.name}
                                    </div>
                                )}
                            </div>
                            <div>
                                <p className="node-sub">Savings ({splitRatio}%)</p>
                                <p className="amount-highlight text-success">
                                    ₹{Math.round(savingsAmount).toLocaleString()}
                                </p>
                            </div>
                        </div>

                        {/* Personal Split */}
                        <div className={`split-card ${allocation ? 'highlight' : ''}`}>
                            <div className="icon-wrapper sm bg-pink-100 text-pink-600">
                                <FaGlassCheers />
                            </div>
                            <div>
                                <p className="node-sub">Personal ({100 - splitRatio}%)</p>
                                <p className="amount-highlight">
                                    ₹{Math.round(personalAmount).toLocaleString()}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* AI Context Panel */}
            {showAIInsights && allocation && (
                <div className="ai-panel animate-slide-up">
                    <div className="ai-panel-content">
                        <div className="ai-icon">🚀</div>
                        <div>
                            <h3 className="ai-title">Profit-Oriented Investment Plan</h3>
                            <p className="ai-reasoning">{allocation.reasoning}</p>

                            {/* Investment Opportunities */}
                            {allocation.investmentSuggestions && allocation.investmentSuggestions.length > 0 && (
                                <div className="investment-suggestions">
                                    <h4 className="suggestions-title">Recommended Real-World Opportunities:</h4>
                                    <div className="suggestions-grid">
                                        {allocation.investmentSuggestions.map((inv, idx) => (
                                            <div key={idx} className="suggestion-card">
                                                <div className="suggestion-header">
                                                    <span className={`badge badge-${inv.type.toLowerCase().replace(' ', '-')}`}>{inv.type}</span>
                                                    <span className="allocation-percent">{inv.allocation}</span>
                                                </div>
                                                <h4 className="suggestion-name">{inv.name}</h4>
                                                <p className="suggestion-reason">{inv.reason}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="ai-actions">
                                <button
                                    className="ai-btn-primary"
                                    onClick={() => {
                                        if (allocation?.splits?.savings?.percentage) {
                                            setSplitRatio(allocation.splits.savings.percentage);
                                            setShowAIInsights(false);
                                        }
                                    }}
                                >
                                    Apply This Split
                                </button>
                                <button
                                    onClick={() => setShowAIInsights(false)}
                                    className="ai-btn-secondary"
                                >
                                    Dismiss
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FinancialFlowPage;
