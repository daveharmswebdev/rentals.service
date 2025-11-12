import { Router } from 'express';
import { HomesController } from '../controllers/homes.controller';
import { ensureAuthenticated } from '../middleware/auth.middleware';

export class HomesRoutes {
  router: Router;
  private homesController: HomesController;

  constructor() {
    this.router = Router();
    this.homesController = new HomesController();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    // Protect all routes with authentication
    this.router.get('/', ensureAuthenticated, this.homesController.getAllHomes.bind(this.homesController));
    this.router.get('/:id', ensureAuthenticated, this.homesController.getHomeById.bind(this.homesController));
  }

  getRouter() {
    return this.router;
  }
}
