// server/middleware/validator.js
const validator = {
  // Email validation
  isValidEmail: (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  // Password validation - at least 8 chars, 1 uppercase, 1 lowercase, 1 number
  isValidPassword: (password) => {
    if (password.length < 8) return { valid: false, message: 'Password must be at least 8 characters long' };
    if (!/[A-Z]/.test(password)) return { valid: false, message: 'Password must contain at least one uppercase letter' };
    if (!/[a-z]/.test(password)) return { valid: false, message: 'Password must contain at least one lowercase letter' };
    if (!/[0-9]/.test(password)) return { valid: false, message: 'Password must contain at least one number' };
    return { valid: true };
  },

  // Sanitize string input
  sanitizeString: (str) => {
    if (typeof str !== 'string') return '';
    return str.trim().replace(/[<>]/g, '');
  },

  // Validate amount
  isValidAmount: (amount) => {
    const num = parseFloat(amount);
    return !isNaN(num) && num > 0 && num <= 100000000; // Max 100 million
  },

  // Validate date
  isValidDate: (date) => {
    return date instanceof Date && !isNaN(date.getTime());
  }
};

module.exports = validator;

