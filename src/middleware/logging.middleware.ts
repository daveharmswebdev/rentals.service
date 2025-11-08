import expressWinston from 'express-winston';
import winston from 'winston';
import logger from '../utils/logger';

const isProduction = process.env.NODE_ENV === 'production';

/**
 * HTTP request/response logging middleware
 * Logs all incoming requests and outgoing responses with timing information
 */
export const httpLogger = expressWinston.logger({
  winstonInstance: logger,
  meta: true,
  msg: 'HTTP {{req.method}} {{req.url}} - {{res.statusCode}} - {{res.responseTime}}ms',
  expressFormat: false,
  colorize: !isProduction,
  ignoreRoute: (req) => {
    // Don't log health check requests to reduce noise
    return req.url === '/' && req.method === 'GET';
  },
  dynamicMeta: (req, res) => {
    return {
      correlationId: req.correlationId,
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      responseTime: res.get('X-Response-Time'),
      userAgent: req.get('user-agent'),
      ip: req.ip || req.connection.remoteAddress
    };
  }
});

/**
 * HTTP error logging middleware
 * Logs errors that occur during request processing
 */
export const httpErrorLogger = expressWinston.errorLogger({
  winstonInstance: logger,
  meta: true,
  msg: 'HTTP Error: {{err.message}}',
  dynamicMeta: (req, res, err) => {
    return {
      correlationId: req.correlationId,
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      error: {
        message: err.message,
        stack: err.stack
      }
    };
  }
});

/**
 * Response time middleware
 * Adds X-Response-Time header and calculates request duration
 */
export const responseTimeMiddleware = (req: any, res: any, next: any) => {
  const startTime = Date.now();

  res.set('X-Response-Time', '0ms'); // Set a default value

  res.on('finish', () => {
    const duration = Date.now() - startTime;
    // You can't set headers here, but you can log the duration if needed
    // logger.info(`Request duration: ${duration}ms`);
  });

  next();
};
