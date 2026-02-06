// server/middleware/logger.js
const logger = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    
    // Only log errors, important routes, or slow requests
    const shouldLog = 
      res.statusCode >= 400 || // Errors
      res.statusCode >= 500 || // Server errors
      duration > 1000 || // Slow requests (>1s)
      req.originalUrl.includes('/api/users/register') || // Important events
      req.originalUrl.includes('/api/users/login') ||
      req.originalUrl.includes('/api/transactions') && req.method === 'POST' ||
      req.originalUrl.includes('/api/transactions') && req.method === 'PUT' ||
      req.originalUrl.includes('/api/transactions') && req.method === 'DELETE';
    
    if (shouldLog) {
      const log = {
        method: req.method,
        url: req.originalUrl,
        status: res.statusCode,
        duration: `${duration}ms`,
        ip: req.ip || req.connection.remoteAddress,
        timestamp: new Date().toISOString()
      };
      
      if (res.statusCode >= 400) {
        console.error('❌', log);
      } else if (duration > 1000) {
        console.warn('⚠️ Slow Request', log);
      } else {
        console.log('✅', log);
      }
    }
  });
  
  next();
};

module.exports = logger;

