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

  async getHomeById(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      
      if (isNaN(id)) {
        res.status(400).json({ 
          message: 'Invalid ID parameter',
          error: 'ID must be a valid number'
        });
        return;
      }

      const home = await this.homesService.getHomeById(id);
      
      if (!home) {
        res.status(404).json({ 
          message: 'Home not found',
          error: `No home found with ID ${id}`
        });
        return;
      }

      res.json(home);
    } catch (error) {
      console.error('Error in getHomeById:', error);
      res.status(500).json({ 
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}
