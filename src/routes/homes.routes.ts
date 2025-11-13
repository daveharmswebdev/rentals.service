import { Router } from 'express';
import { HomesController } from '../controllers/homes.controller';
import { ensureAuthenticated } from '../middleware/auth.middleware';

/**
 * @swagger
 * tags:
 *   name: Homes
 *   description: Rental homes management
 */
export class HomesRoutes {
  router: Router;
  private homesController: HomesController;

  constructor() {
    this.router = Router();
    this.homesController = new HomesController();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    /**
     * @swagger
     * /api/homes:
     *   get:
     *     summary: Get all homes
     *     description: Retrieve a list of all rental homes
     *     tags: [Homes]
     *     security:
     *       - cookieAuth: []
     *     responses:
     *       200:
     *         description: A list of homes
     *         content:
     *           application/json:
     *             schema:
     *               type: array
     *               items:
     *                 $ref: '#/components/schemas/Home'
     *       401:
     *         description: Unauthorized - Authentication required
     *       500:
     *         description: Internal server error
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/Error'
     */
    this.router.get('/', ensureAuthenticated, this.homesController.getAllHomes.bind(this.homesController));
    
    /**
     * @swagger
     * /api/homes/{id}:
     *   get:
     *     summary: Get a home by ID
     *     description: Retrieve a single rental home by its ID
     *     tags: [Homes]
     *     security:
     *       - cookieAuth: []
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: integer
     *         description: The home ID
     *         example: 1
     *     responses:
     *       200:
     *         description: A single home
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/Home'
     *       400:
     *         description: Bad request - Invalid ID parameter
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/Error'
     *       401:
     *         description: Unauthorized - Authentication required
     *       404:
     *         description: Home not found
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/Error'
     *       500:
     *         description: Internal server error
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/Error'
     */
    this.router.get('/:id', ensureAuthenticated, this.homesController.getHomeById.bind(this.homesController));
  }

  getRouter() {
    return this.router;
  }
}
