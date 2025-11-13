import { Router, Request, Response, NextFunction } from 'express';
import passport from '../config/passport.config';
import logger from '../utils/logger';

/**
 * @swagger
 * tags:
 *   name: Authentication
 *   description: User authentication endpoints
 */
export class AuthRoutes {
  router: Router;

  constructor() {
    this.router = Router();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    /**
     * @swagger
     * /auth/google:
     *   get:
     *     summary: Initiate Google OAuth flow
     *     description: Redirects to Google for authentication
     *     tags: [Authentication]
     *     responses:
     *       302:
     *         description: Redirect to Google OAuth
     */
    this.router.get(
      '/google',
      passport.authenticate('google', {
        scope: ['profile', 'email'],
      })
    );

    /**
     * @swagger
     * /auth/google/callback:
     *   get:
     *     summary: Google OAuth callback
     *     description: Handles the callback from Google OAuth
     *     tags: [Authentication]
     *     responses:
     *       200:
     *         description: Authentication successful
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 success:
     *                   type: boolean
     *                   example: true
     *                 message:
     *                   type: string
     *                   example: 'Authentication successful'
     *                 user:
     *                   $ref: '#/components/schemas/User'
     *       302:
     *         description: Redirect to failure endpoint
     */
    this.router.get(
      '/google/callback',
      passport.authenticate('google', {
        failureRedirect: '/auth/failure',
      }),
      (req: Request, res: Response) => {
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

    /**
     * @swagger
     * /auth/failure:
     *   get:
     *     summary: Authentication failure
     *     description: Returns authentication failure message
     *     tags: [Authentication]
     *     responses:
     *       401:
     *         description: Authentication failed
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 success:
     *                   type: boolean
     *                   example: false
     *                 message:
     *                   type: string
     *                   example: 'Authentication failed'
     */
    this.router.get('/failure', (req: Request, res: Response) => {
      logger.warn('Authentication failed');
      res.status(401).json({
        success: false,
        message: 'Authentication failed',
      });
    });

    /**
     * @swagger
     * /auth/logout:
     *   get:
     *     summary: Logout user
     *     description: Logs out the current user and destroys the session
     *     tags: [Authentication]
     *     responses:
     *       200:
     *         description: Logged out successfully
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 success:
     *                   type: boolean
     *                   example: true
     *                 message:
     *                   type: string
     *                   example: 'Logged out successfully'
     */
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

    /**
     * @swagger
     * /auth/status:
     *   get:
     *     summary: Check authentication status
     *     description: Returns whether the user is currently authenticated
     *     tags: [Authentication]
     *     responses:
     *       200:
     *         description: Authentication status
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 authenticated:
     *                   type: boolean
     *                   example: true
     *                 user:
     *                   $ref: '#/components/schemas/User'
     */
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
