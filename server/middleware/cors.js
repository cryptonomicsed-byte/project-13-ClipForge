import pino from 'pino';

const logger = pino();

/**
 * CORS middleware
 */
export function corsMiddleware(req, res, next) {
  const allowedOrigins = [
    'http://localhost:1111',
    'http://localhost:3000',
    'http://127.0.0.1:1111',
    'http://127.0.0.1:3000',
    process.env.CORS_ORIGIN || ''
  ].filter(Boolean);

  const origin = req.headers.origin;

  // In development, allow all origins
  if (process.env.NODE_ENV === 'development') {
    res.setHeader('Access-Control-Allow-Origin', '*');
  } else if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Max-Age', '86400');

  if (req.method === 'OPTIONS') {
    res.sendStatus(204);
  } else {
    next();
  }
}

/**
 * Rate limiting middleware
 */
export function rateLimitMiddleware(req, res, next) {
  // Implement rate limiting if needed
  // This is a placeholder
  next();
}

/**
 * Request logging middleware
 */
export function requestLoggingMiddleware(req, res, next) {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info({
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip
    });
  });

  next();
}

/**
 * Security headers middleware
 */
export function securityHeadersMiddleware(req, res, next) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline'");

  next();
}

/**
 * Trailing slash redirect
 */
export function trailingSlashMiddleware(req, res, next) {
  if (req.path !== '/' && req.path.endsWith('/')) {
    const pathWithoutSlash = req.path.slice(0, -1);
    return res.redirect(301, pathWithoutSlash + (req.url.slice(req.path.length)));
  }
  next();
}
