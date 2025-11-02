import { Request, Response } from 'express';
import { HomesService } from '../services/homes.service';

export class HomesController {
  private homesService: HomesService;

  constructor() {
    this.homesService = new HomesService();
  }

  async getAllHomes(req: Request, res: Response): Promise<void> {
    try {
      const homes = await this.homesService.getAllHomes();
      res.json(homes);
    } catch (error) {
      console.error('Error in getAllHomes:', error);
      res.status(500).json({ 
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}
