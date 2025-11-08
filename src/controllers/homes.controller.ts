import { Request, Response } from 'express';
import { HomesService } from '../services/homes.service';
import logger from '../utils/logger';
import { getCorrelationId } from '../utils/correlation-id';

export class HomesController {
  private homesService: HomesService;

  constructor() {
    this.homesService = new HomesService();
  }

  async getAllHomes(req: Request, res: Response): Promise<void> {
    const correlationId = getCorrelationId(req);
    try {
      logger.debug('Fetching all homes', { correlationId });
      const homes = await this.homesService.getAllHomes();
      logger.info('Successfully retrieved all homes', { 
        correlationId,
        count: homes.length 
      });
      res.json(homes);
    } catch (error) {
      logger.error('Error in getAllHomes', {
        correlationId,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      res.status(500).json({ 
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async getHomeById(req: Request, res: Response): Promise<void> {
    const correlationId = getCorrelationId(req);
    try {
      const id = parseInt(req.params.id, 10);
      
      if (isNaN(id)) {
        logger.warn('Invalid ID parameter provided', { 
          correlationId,
          providedId: req.params.id 
        });
        res.status(400).json({ 
          message: 'Invalid ID parameter',
          error: 'ID must be a valid number'
        });
        return;
      }

      logger.debug('Fetching home by ID', { correlationId, homeId: id });
      const home = await this.homesService.getHomeById(id);
      
      if (!home) {
        logger.info('Home not found', { correlationId, homeId: id });
        res.status(404).json({ 
          message: 'Home not found',
          error: `No home found with ID ${id}`
        });
        return;
      }

      logger.info('Successfully retrieved home', { correlationId, homeId: id });
      res.json(home);
    } catch (error) {
      logger.error('Error in getHomeById', {
        correlationId,
        homeId: req.params.id,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      res.status(500).json({ 
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}
