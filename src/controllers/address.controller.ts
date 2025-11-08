import { Request, Response } from 'express';
import { AddressService } from '../services/address.service';

export class AddressController {
  private addressService: AddressService;

  constructor() {
    this.addressService = new AddressService();
  }

  async getAllAddresses(req: Request, res: Response): Promise<void> {
    try {
      const addresses = await this.addressService.getAllAddresses();
      res.json(addresses);
    } catch (error) {
      console.error('Error in getAllAddresses:', error);
      res.status(500).json({
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async getAddressById(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);

      if (isNaN(id)) {
        res.status(400).json({
          message: 'Invalid ID parameter',
          error: 'ID must be a valid number'
        });
        return;
      }

      const address = await this.addressService.getAddressById(id);

      if (!address) {
        res.status(404).json({
          message: 'Address not found',
          error: `No address found with ID ${id}`
        });
        return;
      }

      res.json(address);
    } catch (error) {
      console.error('Error in getAddressById:', error);
      res.status(500).json({
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async createAddress(req: Request, res: Response): Promise<void> {
    try {
      const { street_address, city, state, zip_code, country } = req.body;

      // Validation
      if (!street_address || !city || !state || !zip_code) {
        res.status(400).json({
          message: 'Validation error',
          error: 'street_address, city, state, and zip_code are required'
        });
        return;
      }

      const address = await this.addressService.createAddress({
        street_address,
        city,
        state,
        zip_code,
        country
      });

      res.status(201).json(address);
    } catch (error) {
      console.error('Error in createAddress:', error);
      res.status(500).json({
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async updateAddress(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);

      if (isNaN(id)) {
        res.status(400).json({
          message: 'Invalid ID parameter',
          error: 'ID must be a valid number'
        });
        return;
      }

      const { street_address, city, state, zip_code, country } = req.body;

      const address = await this.addressService.updateAddress(id, {
        street_address,
        city,
        state,
        zip_code,
        country
      });

      if (!address) {
        res.status(404).json({
          message: 'Address not found',
          error: `No address found with ID ${id}`
        });
        return;
      }

      res.json(address);
    } catch (error) {
      console.error('Error in updateAddress:', error);
      res.status(500).json({
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async deleteAddress(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);

      if (isNaN(id)) {
        res.status(400).json({
          message: 'Invalid ID parameter',
          error: 'ID must be a valid number'
        });
        return;
      }

      const deleted = await this.addressService.deleteAddress(id);

      if (!deleted) {
        res.status(404).json({
          message: 'Address not found',
          error: `No address found with ID ${id}`
        });
        return;
      }

      res.status(204).send();
    } catch (error) {
      console.error('Error in deleteAddress:', error);
      res.status(500).json({
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}