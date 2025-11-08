import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';

// Extend Express Request type to include correlationId
declare global {
  namespace Express {
    interface Request {
      correlationId?: string;
    }
  }
}

/**
 * Middleware to generate or extract correlation ID for request tracing
 * Checks for existing X-Correlation-ID header, otherwise generates a new UUID
 */
export const correlationIdMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Check if correlation ID exists in request header
  const correlationId = (req.headers['x-correlation-id'] as string) || randomUUID();
  
  // Attach to request object
  req.correlationId = correlationId;
  
  // Add to response headers for client tracking
  res.setHeader('X-Correlation-ID', correlationId);
  
  next();
};

/**
 * Get correlation ID from request
 */
export const getCorrelationId = (req: Request): string => {
  return req.correlationId || 'unknown';
};
