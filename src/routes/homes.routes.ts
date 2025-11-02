import { Router } from 'express';
import { HomesController } from '../controllers/homes.controller';

export class HomesRoutes {
  router: Router;
  private homesController: HomesController;

  constructor() {
    this.router = Router();
    this.homesController = new HomesController();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.get('/', this.homesController.getAllHomes.bind(this.homesController));
  }

  getRouter() {
    return this.router;
  }
}
