// client/src/pages/Register.js
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

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
    <div className="register-wrapper">
      <Link to="/" className="back-link">
        ← Back to home
      </Link>

      <section className="heading">
        <h1>Create an account</h1>
        <p>Only the basics so you can log in right away.</p>
      </section>

      <section className="form">
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name">Name</label>
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
            <label htmlFor="email">Email</label>
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
          </div>

          {error && <p className="error">{error}</p>}
          {status && <p className="success-message">{status}</p>}

          <div className="form-group">
            <button type="submit" className="btn btn-block" disabled={isLoading}>
              {isLoading ? 'Registering...' : 'Register'}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
};

export default Register;