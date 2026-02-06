// client/src/pages/Home.js
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { FaDollarSign, FaTwitter, FaInstagram, FaLinkedin, FaArrowRight } from 'react-icons/fa';
import './Home.css';

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

  const testimonials = [
    {
      text: "I used to stress about money every single day. FinFlow helped me see exactly where my money was going without making me feel guilty.",
      name: "Ananya Desai",
      role: "Freelance Designer",
      avatar: "AD"
    },
    {
      text: "The 'Goals & Limits' feature is a game changer. I finally paid off my credit card debt because I could visualize my progress.",
      name: "Rahul Kumar",
      role: "Software Engineer",
      avatar: "RK"
    },
    {
      text: "Simple, fast, and beautiful. Most finance apps feel like spreadsheets, but this one feels like a modern tool for modern living.",
      name: "Sarah Mitchell",
      role: "Small Business Owner",
      avatar: "SM"
    },
    {
      text: "The AI categorization saves me hours. I just upload my receipts and it knows exactly where to put them. Genius!",
      name: "David Chen",
      role: "Marketing Director",
      avatar: "DC"
    },
    {
      text: "Finally, an app that doesn't feel like a chore. The design makes checking my finances actually enjoyable.",
      name: "Priya Patel",
      role: "Architect",
      avatar: "PP"
    },
    {
      text: "I felt lost with investments, but the simple tracking features here helped me get confident about building wealth.",
      name: "Marcus Johnson",
      role: "Teacher",
      avatar: "MJ"
    }
  ];

  return (
    <div className="home-wrapper">
      <nav className={`site-nav ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
        <div className="home-container nav-container">
          <div className="nav-brand">
            <div className="logo-icon-home">
              <FaDollarSign />
            </div>
            <span>FinFlow</span>
          </div>

          <button className="mobile-menu-toggle" onClick={toggleMobileMenu}>
            <span className="bar"></span>
            <span className="bar"></span>
            <span className="bar"></span>
          </button>

          <div className={`nav-content ${isMobileMenuOpen ? 'active' : ''}`}>
            <ul className="nav-links">
              <li><a href="#hero" onClick={() => setIsMobileMenuOpen(false)}>Home</a></li>
              <li><a href="#features" onClick={() => setIsMobileMenuOpen(false)}>Features</a></li>
              <li><a href="#how-it-works" onClick={() => setIsMobileMenuOpen(false)}>How it Works</a></li>
              <li><a href="#testimonials" onClick={() => setIsMobileMenuOpen(false)}>Stories</a></li>
            </ul>
            <div className="nav-actions">
              {user ? (
                <Link className="btn btn-primary" to="/dashboard">Dashboard</Link>
              ) : (
                <>
                  <button className="btn btn-ghost" onClick={toggleLogin}>Login</button>
                  <Link className="btn btn-primary" to="/register">Register</Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      <header id="hero" className="hero-section">
        <div className="home-container hero-container">
          <div className="hero-content">
            <span className="eyebrow">Financial Freedom</span>
            <h1>Simple finances for <br /><span className="gradient-text">busy people.</span></h1>
            <p className="subtitle">
              We trimmed everything down to the essentials: a calm home page, a quick login modal,
              and a lightweight registration form. Nothing more, nothing less.
            </p>
            <div className="hero-cta">
              <button className="btn btn-primary btn-lg" onClick={toggleLogin}>Get Started</button>
              <a href="#features" className="btn btn-ghost btn-lg">Learn More</a>
            </div>
          </div>
          <div className="hero-visual">
            <div className="glass-card hero-card">
              <div className="card-header">
                <h3>Total Balance</h3>
                <span className="amount custom-gradient">₹1,24,500</span>
              </div>
              <div className="mini-chart">
                <div className="bar" style={{ height: '40%' }}></div>
                <div className="bar" style={{ height: '70%' }}></div>
                <div className="bar" style={{ height: '55%' }}></div>
                <div className="bar active" style={{ height: '85%' }}></div>
                <div className="bar" style={{ height: '60%' }}></div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <section id="features" className="section features-section">
        <div className="home-container">
          <div className="section-header">
            <h2>Why FinFlow?</h2>
            <p>Everything you need to take control, nothing you don't.</p>
          </div>
          <div className="features-grid">
            <div className="feature-card glass-panel">
              <div className="feature-icon">✨</div>
              <h3>Simple Planning</h3>
              <p>Set an intention for every rupee so your future self never wonders what happened.</p>
            </div>
            <div className="feature-card glass-panel">
              <div className="feature-icon">📊</div>
              <h3>Clear Tracking</h3>
              <p>See spending at a glance with clean visuals and no cluttered dashboards.</p>
            </div>
            <div className="feature-card glass-panel">
              <div className="feature-icon">🔄</div>
              <h3>Easy Adjustments</h3>
              <p>Make quick changes and stay flexible without rebuilding complicated budgets.</p>
            </div>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="section dark-section">
        <div className="home-container">
          <div className="section-header">
            <h2>How it Works</h2>
            <p>Three simple steps to financial clarity.</p>
          </div>
          <div className="timeline-steps">
            <div className="step-card glass-panel">
              <span className="step-number">01</span>
              <h3>Clarify Priorities</h3>
              <p>Define three intention buckets and connect your accounts.</p>
            </div>
            <div className="step-card glass-panel">
              <span className="step-number">02</span>
              <h3>Log Reality</h3>
              <p>Capture transactions with plain language and tags.</p>
            </div>
            <div className="step-card glass-panel">
              <span className="step-number">03</span>
              <h3>Stay Consistent</h3>
              <p>Use nudges to rebalance categories and keep goals on track.</p>
            </div>
          </div>
        </div>
      </section>

      <section id="testimonials" className="section testimonials-section">
        <div className="home-container">
          <div className="section-header">
            <h2>Success Stories</h2>
            <p>See how FinFlow brings calm to financial chaos.</p>
          </div>

          <div className="marquee-container">
            <div className="marquee-track">
              {/* Duplicate the cards to create seamless infinite scroll */}
              {[...testimonials, ...testimonials].map((t, i) => (
                <div key={i} className="testimonial-card">
                  <div className="quote-icon">❝</div>
                  <p className="testimonial-text">"{t.text}"</p>
                  <div className="testimonial-user">
                    <div className="user-avatar">{t.avatar}</div>
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

      <section className="section cta-section">
        <div className="home-container">
          <div className="cta-box glass-panel">
            <h2>Ready to simplify your finances?</h2>
            <p>Join thousands of users who have found financial calm.</p>
            <Link className="btn btn-primary btn-lg" to="/register">Create Free Account</Link>
          </div>
        </div>
      </section>

      <footer className="site-footer">
        <div className="home-container footer-content">
          <div className="footer-brand">
            <div className="nav-brand">FinFlow</div>
            <p>Purpose-built tools to keep your money decisions grounded, confident, and calm.</p>
            <div className="footer-social-icons">
              <a href="#!" className="social-icon" aria-label="Twitter"><FaTwitter /></a>
              <a href="#!" className="social-icon" aria-label="Instagram"><FaInstagram /></a>
              <a href="#!" className="social-icon" aria-label="LinkedIn"><FaLinkedin /></a>
            </div>
          </div>

          <div className="footer-links-group">
            <div className="footer-col">
              <h4>Product</h4>
              <ul>
                <li><a href="#hero">Overview</a></li>
                <li><a href="#features">Features</a></li>
                <li><a href="#pricing">Pricing</a></li>
              </ul>
            </div>
            <div className="footer-col">
              <h4>Support</h4>
              <ul>
                <li><a href="#help">Help Center</a></li>
                <li><a href="#contact">Contact</a></li>
                <li><a href="#privacy">Privacy</a></li>
              </ul>
            </div>
          </div>

          <div className="footer-col footer-newsletter">
            <h4>Stay Updated</h4>
            <p>Get the latest financial tips and product updates.</p>
            <form className="newsletter-form" onSubmit={(e) => e.preventDefault()}>
              <input type="email" placeholder="Enter your email" />
              <button type="submit" className="btn-icon">
                <FaArrowRight />
              </button>
            </form>
          </div>
        </div>
        <div className="home-container footer-bottom">
          <p>© {new Date().getFullYear()} FinFlow. All rights reserved.</p>
          <div className="footer-legal">
            <a href="#terms">Terms</a>
            <span className="separator">•</span>
            <a href="#privacy">Privacy</a>
          </div>
        </div>
      </footer>

      {isLoginOpen && (
        <div className="modal-backdrop" onClick={toggleLogin}>
          <div className="glass-panel modal" onClick={(event) => event.stopPropagation()}>
            <h2>Welcome Back</h2>
            <p className="modal-text">Log in to your account.</p>
            <form onSubmit={handleLogin}>
              <div className="form-group">
                <label>Email</label>
                <input
                  name="email"
                  type="email"
                  value={loginData.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
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
                <button type="button" className="btn btn-ghost" onClick={toggleLogin} disabled={isLoading}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={isLoading}>
                  {isLoading ? 'Logging in...' : 'Login'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;
