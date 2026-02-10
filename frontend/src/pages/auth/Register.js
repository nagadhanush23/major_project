// client/src/pages/auth/Register.js
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import '../dashboard/Home.css'; // Import the modern UI styles

const Register = () => {
  const navigate = useNavigate();
  const { user, register } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  });
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError('');
    setStatus('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setStatus('');
    setIsLoading(true);

    // Enhanced password validation
    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long.');
      setIsLoading(false);
      return;
    }
    if (!/[A-Z]/.test(formData.password)) {
      setError('Password must contain at least one uppercase letter.');
      setIsLoading(false);
      return;
    }
    if (!/[a-z]/.test(formData.password)) {
      setError('Password must contain at least one lowercase letter.');
      setIsLoading(false);
      return;
    }
    if (!/[0-9]/.test(formData.password)) {
      setError('Password must contain at least one number.');
      setIsLoading(false);
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address.');
      setIsLoading(false);
      return;
    }

    // Name validation
    if (formData.name.trim().length < 2) {
      setError('Name must be at least 2 characters long.');
      setIsLoading(false);
      return;
    }

    const result = await register(formData);

    if (result.success) {
      setStatus('Registration successful! Redirecting to dashboard...');
      setTimeout(() => {
        navigate('/dashboard');
      }, 1000);
    } else {
      setError(result.error || 'Registration failed. Please try again.');
    }

    setIsLoading(false);
  };

  return (
    <div className="home-wrapper modern-ui" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '2rem' }}>

      <div className="glass-panel" style={{ width: '100%', maxWidth: '450px', padding: '3rem', borderRadius: '24px' }}>

        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <Link to="/" style={{ textDecoration: 'none', color: 'var(--text-dark)', fontWeight: '800', fontSize: '1.5rem', display: 'block', marginBottom: '2rem' }}>
            FinFlow.<span style={{ color: 'var(--primary-green)' }}>.</span>
          </Link>

          <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Create Account</h1>
          <p style={{ color: 'var(--text-light)' }}>Join thousands of users today.</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name">Full Name</label>
            <input
              id="name"
              name="name"
              type="text"
              value={formData.name}
              onChange={handleChange}
              placeholder="Jane Doe"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="jane@example.com"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
              required
              minLength="6"
            />
            <p style={{ fontSize: '0.75rem', color: '#888', marginTop: '0.5rem' }}>
              Must be 8+ chars, include uppercase, lowercase & number.
            </p>
          </div>

          {error && <p className="error-message">{error}</p>}
          {status && <p className="success-message" style={{ color: 'var(--primary-green)', textAlign: 'center', marginBottom: '1rem' }}>{status}</p>}

          <div className="form-group" style={{ marginTop: '2rem' }}>
            <button type="submit" className="btn btn-black" style={{ width: '100%', padding: '1rem' }} disabled={isLoading}>
              {isLoading ? 'Creating Account...' : 'Create Account'}
            </button>
          </div>

          <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.9rem', color: 'var(--text-light)' }}>
            Already have an account? <Link to="/" style={{ color: 'var(--primary-green)', fontWeight: '600', textDecoration: 'none' }}>Log in</Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Register;