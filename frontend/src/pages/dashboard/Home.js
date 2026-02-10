// client/src/pages/Home.js
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { FaArrowRight, FaGoogle, FaApple, FaTwitter, FaInstagram, FaLinkedin } from 'react-icons/fa';
import './Home.css';

// Placeholder for the phone image since generation failed
// In a real scenario, this would be an import
const PhoneMockup = () => (
  <div className="phone-mockup-wrapper">
    <div className="phone-body">
      <div className="phone-notch"></div>
      <div className="phone-screen">
        <div className="app-header">
          <span>Good Morning</span>
          <div className="avatar-small"></div>
        </div>
        <div className="balance-card">
          <div className="balance-label">Total Balance</div>
          <div className="balance-amount">$23,643.00</div>
          <div className="balance-change positive">+2.3%</div>
        </div>
        <div className="chart-area">
          {/* Simple CSS Chart */}
          <svg viewBox="0 0 100 40" className="chart-svg">
            <path d="M0 30 Q 20 10, 40 25 T 100 15" fill="none" stroke="#10B981" strokeWidth="3" />
            <area fill="rgba(16, 185, 129, 0.1)" />
          </svg>
        </div>
        <div className="spending-cards">
          <div className="spending-card">
            <div className="icon-circle icon-purple"></div>
            <div>
              <div className="card-title">Spending</div>
              <div className="card-amount">$1,240</div>
            </div>
          </div>
          <div className="spending-card">
            <div className="icon-circle icon-orange"></div>
            <div>
              <div className="card-title">Income</div>
              <div className="card-amount">$4,500</div>
            </div>
          </div>
        </div>
        <div className="float-card income-float">
          <span>Income</span>
          <strong>$4,200</strong>
        </div>
        <div className="float-card expense-float">
          <span>Expense</span>
          <strong>$1,200</strong>
        </div>
      </div>
    </div>
  </div>
);

const Home = () => {
  const navigate = useNavigate();
  const { user, login } = useAuth();
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [loginError, setLoginError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const toggleLogin = () => {
    setIsLoginOpen((prev) => !prev);
    setLoginError('');
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setLoginData((prev) => ({ ...prev, [name]: value }));
  };

  const handleLogin = async (event) => {
    event.preventDefault();
    setLoginError('');
    setIsLoading(true);

    if (!loginData.email || !loginData.password) {
      setLoginError('Please enter both an email and password.');
      setIsLoading(false);
      return;
    }

    const result = await login(loginData.email, loginData.password);

    if (result.success) {
      setIsLoginOpen(false);
      setLoginData({ email: '', password: '' });
      navigate('/dashboard');
    } else {
      setLoginError(result.error || 'Login failed. Please try again.');
    }

    setIsLoading(false);
  };

  return (
    <div className="home-wrapper modern-ui">
      {/* Navigation */}
      <nav className={`site-nav ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
        <div className="home-container nav-container">
          <div className="nav-brand">
            <span className="brand-dot"></span>
            FinFlow.<span className="tm">™</span>
          </div>

          <button className="mobile-menu-toggle" onClick={toggleMobileMenu}>
            <span className="bar"></span>
            <span className="bar"></span>
            <span className="bar"></span>
          </button>

          <div className={`nav-content ${isMobileMenuOpen ? 'active' : ''}`}>
            <div className="nav-center">
              <ul className="nav-links">
                <li><a href="#hero" onClick={() => setIsMobileMenuOpen(false)}>Home</a></li>
                <li><a href="#features" onClick={() => setIsMobileMenuOpen(false)}>Features</a></li>
                <li><a href="#how-it-works" onClick={() => setIsMobileMenuOpen(false)}>How it Works</a></li>
                <li><a href="#testimonials" onClick={() => setIsMobileMenuOpen(false)}>Stories</a></li>
              </ul>
            </div>
            <div className="nav-actions">
              <button className="btn btn-white" onClick={toggleLogin}>Login</button>
              <Link className="btn btn-black" to="/register">Join</Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <header id="hero" className="hero-section">
        <div className="home-container hero-grid">
          <div className="hero-text-content">
            <div className="hero-badge">
              <span className="dot"></span> Smart Finance
            </div>
            <h1>
              Reimagine money, <br />
              <span className="text-highlight">Simple solutions</span>
            </h1>
            <p className="hero-subtitle">
              Automatically track your expenses, set budgets, and achieve your financial goals with AI-powered insights.
            </p>

            <div className="hero-buttons">
              <Link to="/register" className="btn btn-black btn-lg">Create Account</Link>
              <button className="btn btn-outline btn-lg">Contact Sale <FaArrowRight /></button>
            </div>

            <div className="social-proof">
              <div className="avatar-group">
                <div className="avatar" style={{ backgroundImage: 'url(https://i.pravatar.cc/100?img=1)' }}></div>
                <div className="avatar" style={{ backgroundImage: 'url(https://i.pravatar.cc/100?img=2)' }}></div>
                <div className="avatar" style={{ backgroundImage: 'url(https://i.pravatar.cc/100?img=3)' }}></div>
              </div>
              <div className="proof-text">
                <strong>50k Downloads</strong>
                <span>Trusted by users worldwide</span>
              </div>
            </div>
          </div>

          <div className="hero-visual-content">
            <PhoneMockup />
          </div>
        </div>
      </header>

      {/* Partner Logos Strip */}
      <div className="partners-strip">
        <div className="home-container">
          <div className="partner-logos">
            <span>Spotify</span>
            <span>airbnb</span>
            <span>slack</span>
            <span>stripe</span>
            <span>Airwallex</span>
            <span>Booking.com</span>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <section id="features" className="section features-section">
        <div className="home-container">
          <div className="section-header">
            <div className="eyebrow-badge">Why FinFlow?</div>
            <h2>Everything you need to <br />take control.</h2>
            <p>We trimmed the fat to give you exactly what works.</p>
          </div>
          <div className="features-grid">
            <div className="feature-card glass-panel">
              <div className="feature-icon icon-mint">✨</div>
              <h3>Simple Planning</h3>
              <p>Set an intention for every rupee so your future self never wonders what happened.</p>
            </div>
            <div className="feature-card glass-panel">
              <div className="feature-icon icon-purple">📊</div>
              <h3>Clear Tracking</h3>
              <p>See spending at a glance with clean visuals and no cluttered dashboards.</p>
            </div>
            <div className="feature-card glass-panel">
              <div className="feature-icon icon-orange">🔄</div>
              <h3>Easy Adjustments</h3>
              <p>Make quick changes and stay flexible without rebuilding complicated budgets.</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="section bg-white">
        <div className="home-container">
          <div className="section-header">
            <div className="eyebrow-badge">Process</div>
            <h2>Three simple steps to <br />financial clarity.</h2>
          </div>
          <div className="timeline-steps">
            <div className="step-card">
              <span className="step-number">01</span>
              <h3>Clarify Priorities</h3>
              <p>Define three intention buckets and connect your accounts.</p>
            </div>
            <div className="step-card">
              <span className="step-number">02</span>
              <h3>Log Reality</h3>
              <p>Capture transactions with plain language and tags.</p>
            </div>
            <div className="step-card">
              <span className="step-number">03</span>
              <h3>Stay Consistent</h3>
              <p>Use nudges to rebalance categories and keep goals on track.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="section testimonials-section">
        <div className="home-container">
          <div className="section-header">
            <div className="eyebrow-badge">Stories</div>
            <h2>See how FinFlow brings <br />calm to chaos.</h2>
          </div>

          <div className="marquee-container">
            <div className="marquee-track">
              {/* Testimonials - Hardcoded for demo stability */}
              {[
                { text: "I used to stress about money every single day. FinFlow helped me see exactly where my money was going.", name: "Ananya Desai", role: "Freelance Designer" },
                { text: "The 'Goals & Limits' feature is a game changer. I finally paid off my credit card debt.", name: "Rahul Kumar", role: "Software Engineer" },
                { text: "Simple, fast, and beautiful. Most finance apps feel like spreadsheets, but this one feels like a modern tool.", name: "Sarah Mitchell", role: "Small Business Owner" },
                { text: "The AI categorization saves me hours. I just upload my receipts and it knows exactly where to put them.", name: "David Chen", role: "Marketing Director" },
              ].map((t, i) => (
                <div key={i} className="testimonial-card">
                  <div className="quote-icon">❝</div>
                  <p className="testimonial-text">"{t.text}"</p>
                  <div className="testimonial-user">
                    <div className="avatar-small"></div>
                    <div className="user-info">
                      <h4>{t.name}</h4>
                      <span>{t.role}</span>
                    </div>
                  </div>
                </div>
              ))}
              {/* DUPLICATE FOR MARQUEE EFFECT */}
              {[
                { text: "I used to stress about money every single day. FinFlow helped me see exactly where my money was going.", name: "Ananya Desai", role: "Freelance Designer" },
                { text: "The 'Goals & Limits' feature is a game changer. I finally paid off my credit card debt.", name: "Rahul Kumar", role: "Software Engineer" },
                { text: "Simple, fast, and beautiful. Most finance apps feel like spreadsheets, but this one feels like a modern tool.", name: "Sarah Mitchell", role: "Small Business Owner" },
                { text: "The AI categorization saves me hours. I just upload my receipts and it knows exactly where to put them.", name: "David Chen", role: "Marketing Director" },
              ].map((t, i) => (
                <div key={`dup-${i}`} className="testimonial-card">
                  <div className="quote-icon">❝</div>
                  <p className="testimonial-text">"{t.text}"</p>
                  <div className="testimonial-user">
                    <div className="avatar-small"></div>
                    <div className="user-info">
                      <h4>{t.name}</h4>
                      <span>{t.role}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="section cta-section">
        <div className="home-container">
          <div className="cta-box">
            <div className="cta-content">
              <h2>Ready to simplify your finances?</h2>
              <p>Join thousands of users who have found financial calm.</p>
              <Link className="btn btn-black btn-lg" to="/register">Create Free Account</Link>
            </div>
          </div>
        </div>
      </section>


      {/* Footer */}
      <footer className="simple-footer">
        <div className="home-container footer-content">
          <div className="footer-left">
            <span className="brand-dot"></span> FinFlow.
          </div>
          <div className="footer-links">
            <a href="#privacy">Privacy Policy</a>
            <a href="#terms">Terms and Conditions</a>
          </div>
        </div>
      </footer>

      {/* Login Modal */}
      {isLoginOpen && (
        <div className="modal-backdrop" onClick={toggleLogin}>
          <div className="glass-panel modal" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <h2>Welcome Back</h2>
              <p>Enter your details to access your account.</p>
            </div>

            <form onSubmit={handleLogin}>
              <div className="form-group">
                <label>Email Address</label>
                <input
                  name="email"
                  type="email"
                  value={loginData.email}
                  onChange={handleChange}
                  placeholder="name@company.com"
                  required
                />
              </div>
              <div className="form-group">
                <label>Password</label>
                <input
                  name="password"
                  type="password"
                  value={loginData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  required
                />
              </div>

              {loginError && <p className="error-message">{loginError}</p>}

              <div className="modal-actions">
                <button type="submit" className="btn btn-black btn-block" disabled={isLoading}>
                  {isLoading ? 'Logging in...' : 'Sign In'}
                </button>
              </div>

              <div className="modal-divider">or continue with</div>

              <div className="social-login">
                <button type="button" className="btn-social"><FaGoogle /></button>
                <button type="button" className="btn-social"><FaApple /></button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;
