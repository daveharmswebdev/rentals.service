import { Request, Response } from 'express';
import { AddressService } from '../services/address.service';
import logger from '../utils/logger';
import { getCorrelationId } from '../utils/correlation-id';

export class AddressController {
  private addressService: AddressService;

  constructor() {
    this.addressService = new AddressService();
  }

  async getAllAddresses(req: Request, res: Response): Promise<void> {
    const correlationId = getCorrelationId(req);
    try {
      logger.debug('Fetching all addresses', { correlationId });
      const addresses = await this.addressService.getAllAddresses();
      logger.info('Successfully retrieved all addresses', { 
        correlationId,
        count: addresses.length 
      });
      res.json(addresses);
    } catch (error) {
      logger.error('Error in getAllAddresses', {
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

  async getAddressById(req: Request, res: Response): Promise<void> {
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

      logger.debug('Fetching address by ID', { correlationId, addressId: id });
      const address = await this.addressService.getAddressById(id);

      if (!address) {
        logger.info('Address not found', { correlationId, addressId: id });
        res.status(404).json({
          message: 'Address not found',
          error: `No address found with ID ${id}`
        });
        return;
      }

      logger.info('Successfully retrieved address', { correlationId, addressId: id });
      res.json(address);
    } catch (error) {
      logger.error('Error in getAddressById', {
        correlationId,
        addressId: req.params.id,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      res.status(500).json({
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async createAddress(req: Request, res: Response): Promise<void> {
    const correlationId = getCorrelationId(req);
    try {
      const { street_address, city, state, zip_code, country } = req.body;

      // Validation
      if (!street_address || !city || !state || !zip_code) {
        logger.warn('Address creation validation failed', {
          correlationId,
          missingFields: {
            street_address: !street_address,
            city: !city,
            state: !state,
            zip_code: !zip_code
          }
        });
        res.status(400).json({
          message: 'Validation error',
          error: 'street_address, city, state, and zip_code are required'
        });
        return;
      }

      logger.debug('Creating new address', { correlationId, city, state });
      const address = await this.addressService.createAddress({
        street_address,
        city,
        state,
        zip_code,
        country
      });

      logger.info('Successfully created address', { 
        correlationId,
        addressId: address.id 
      });
      res.status(201).json(address);
    } catch (error) {
      logger.error('Error in createAddress', {
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

  async updateAddress(req: Request, res: Response): Promise<void> {
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

      const { street_address, city, state, zip_code, country } = req.body;

      logger.debug('Updating address', { correlationId, addressId: id });
      const address = await this.addressService.updateAddress(id, {
        street_address,
        city,
        state,
        zip_code,
        country
      });

      if (!address) {
        logger.info('Address not found for update', { correlationId, addressId: id });
        res.status(404).json({
          message: 'Address not found',
          error: `No address found with ID ${id}`
        });
        return;
      }

      logger.info('Successfully updated address', { correlationId, addressId: id });
      res.json(address);
    } catch (error) {
      logger.error('Error in updateAddress', {
        correlationId,
        addressId: req.params.id,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      res.status(500).json({
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async deleteAddress(req: Request, res: Response): Promise<void> {
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

      logger.debug('Deleting address', { correlationId, addressId: id });
      const deleted = await this.addressService.deleteAddress(id);

      if (!deleted) {
        logger.info('Address not found for deletion', { correlationId, addressId: id });
        res.status(404).json({
          message: 'Address not found',
          error: `No address found with ID ${id}`
        });
        return;
      }

      logger.info('Successfully deleted address', { correlationId, addressId: id });
      res.status(204).send();
    } catch (error) {
      logger.error('Error in deleteAddress', {
        correlationId,
        addressId: req.params.id,
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
