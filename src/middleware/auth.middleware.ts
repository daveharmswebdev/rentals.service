import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';

/**
 * Middleware to ensure user is authenticated
 * Redirects to login if not authenticated
 */
export function ensureAuthenticated(req: Request, res: Response, next: NextFunction): void {
  if (req.isAuthenticated()) {
    return next();
  }

  logger.warn('Unauthenticated access attempt', {
    path: req.path,
    method: req.method,
    ip: req.ip,
  });

  res.status(401).json({
    error: 'Unauthorized',
    message: 'You must be logged in to access this resource',
    loginUrl: '/auth/google',
  });
}

/**
 * Optional authentication - adds user info if available but doesn't require it
 */
export function optionalAuthentication(req: Request, res: Response, next: NextFunction): void {
  // Just pass through - user info will be available if authenticated
  next();
}
