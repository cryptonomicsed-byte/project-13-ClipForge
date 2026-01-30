import pino from 'pino';

const logger = pino();

/**
 * Global error handler middleware
 */
export function errorHandler(err, req, res, next) {
  logger.error(err, `${req.method} ${req.path}`);

  // Default error
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  let code = err.code || 'INTERNAL_ERROR';

  // Specific error types
  if (err instanceof SyntaxError && 'body' in err) {
    statusCode = 400;
    message = 'Invalid JSON';
    code = 'INVALID_JSON';
  }

  if (err.code === 'LIMIT_FILE_SIZE') {
    statusCode = 413;
    message = 'File too large';
    code = 'FILE_TOO_LARGE';
  }

  if (err.code === 'LIMIT_FILE_COUNT') {
    statusCode = 400;
    message = 'Too many files';
    code = 'TOO_MANY_FILES';
  }

  if (err.code === 'PROTOCOL_ERROR') {
    statusCode = 400;
    message = 'Invalid request';
    code = 'PROTOCOL_ERROR';
  }

  // Don't expose internal details in production
  if (process.env.NODE_ENV === 'production') {
    if (statusCode === 500) {
      message = 'An error occurred processing your request';
    }
  }

  res.status(statusCode).json({
    error: {
      code,
      message,
      statusCode,
      ...(process.env.NODE_ENV !== 'production' && { details: err.message })
    }
  });
}

/**
 * 404 handler
 */
export function notFoundHandler(req, res) {
  res.status(404).json({
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.path} not found`,
      statusCode: 404
    }
  });
}

/**
 * Async route wrapper (catch errors automatically)
 */
export function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * Validation error
 */
export class ValidationError extends Error {
  constructor(message, code = 'VALIDATION_ERROR') {
    super(message);
    this.statusCode = 400;
    this.code = code;
  }
}

/**
 * Not found error
 */
export class NotFoundError extends Error {
  constructor(message = 'Not found', code = 'NOT_FOUND') {
    super(message);
    this.statusCode = 404;
    this.code = code;
  }
}

/**
 * Unauthorized error
 */
export class UnauthorizedError extends Error {
  constructor(message = 'Unauthorized', code = 'UNAUTHORIZED') {
    super(message);
    this.statusCode = 401;
    this.code = code;
  }
}

/**
 * Forbidden error
 */
export class ForbiddenError extends Error {
  constructor(message = 'Forbidden', code = 'FORBIDDEN') {
    super(message);
    this.statusCode = 403;
    this.code = code;
  }
}

/**
 * Conflict error
 */
export class ConflictError extends Error {
  constructor(message = 'Conflict', code = 'CONFLICT') {
    super(message);
    this.statusCode = 409;
    this.code = code;
  }
}
