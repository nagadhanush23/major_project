// server/middleware/rateLimiter.js
// Simple in-memory rate limiter (for production, use Redis)
const rateLimitStore = new Map();

const rateLimiter = (windowMs = 15 * 60 * 1000, maxRequests = 100) => {
  return (req, res, next) => {
    // Skip rate limiting for localhost/development
    const ip = req.ip || req.connection.remoteAddress || '';
    const isLocalhost = ip === '::1' || ip === '127.0.0.1' || ip === '::ffff:127.0.0.1' || 
                       req.hostname === 'localhost' || process.env.NODE_ENV !== 'production';
    
    if (isLocalhost) {
      return next(); // Skip rate limiting in development
    }
    
    const key = ip;
    const now = Date.now();
    
    // Clean old entries
    if (rateLimitStore.size > 10000) {
      rateLimitStore.clear();
    }
    
    const userLimit = rateLimitStore.get(key);
    
    if (!userLimit) {
      rateLimitStore.set(key, { count: 1, resetTime: now + windowMs });
      return next();
    }
    
    if (now > userLimit.resetTime) {
      rateLimitStore.set(key, { count: 1, resetTime: now + windowMs });
      return next();
    }
    
    if (userLimit.count >= maxRequests) {
      return res.status(429).json({
        success: false,
        message: 'Too many requests, please try again later',
        retryAfter: Math.ceil((userLimit.resetTime - now) / 1000)
      });
    }
    
    userLimit.count++;
    next();
  };
};

// Stricter rate limiter for auth routes (only in production)
const authRateLimiter = rateLimiter(15 * 60 * 1000, 10); // 10 requests per 15 minutes

// Standard rate limiter (only in production, very lenient)
const standardRateLimiter = rateLimiter(1 * 60 * 1000, 1000); // 1000 requests per minute (very lenient)

module.exports = {
  authRateLimiter,
  standardRateLimiter,
  rateLimiter
};

