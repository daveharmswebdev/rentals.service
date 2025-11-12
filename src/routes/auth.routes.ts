import { Router, Request, Response, NextFunction } from 'express';
import passport from '../config/passport.config';
import logger from '../utils/logger';

export class AuthRoutes {
  router: Router;

  constructor() {
    this.router = Router();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    // Initiate Google OAuth flow
    this.router.get(
      '/google',
      passport.authenticate('google', {
        scope: ['profile', 'email'],
      })
    );

    // Google OAuth callback
    this.router.get(
      '/google/callback',
      passport.authenticate('google', {
        failureRedirect: '/auth/failure',
      }),
      (req: Request, res: Response) => {
        // Successful authentication
        logger.info('User successfully authenticated', {
          userId: (req.user as any)?.id,
          email: (req.user as any)?.email,
        });

        res.json({
          success: true,
          message: 'Authentication successful',
          user: req.user,
        });
      }
    );

    // Authentication failure
    this.router.get('/failure', (req: Request, res: Response) => {
      logger.warn('Authentication failed');
      res.status(401).json({
        success: false,
        message: 'Authentication failed',
      });
    });

    // Logout
    this.router.get('/logout', (req: Request, res: Response, next: NextFunction) => {
      const user = req.user;
      
      req.logout((err) => {
        if (err) {
          logger.error('Logout error', { error: err });
          return next(err);
        }

        logger.info('User logged out', {
          userId: (user as any)?.id,
        });

        res.json({
          success: true,
          message: 'Logged out successfully',
        });
      });
    });

    // Check authentication status
    this.router.get('/status', (req: Request, res: Response) => {
      if (req.isAuthenticated()) {
        res.json({
          authenticated: true,
          user: req.user,
        });
      } else {
        res.json({
          authenticated: false,
        });
      }
    });
  }

  getRouter() {
    return this.router;
  }
}
