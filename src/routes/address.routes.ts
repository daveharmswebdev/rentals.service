import { Router } from 'express';
import { AddressController } from '../controllers/address.controller';
import { ensureAuthenticated } from '../middleware/auth.middleware';

export class AddressRoutes {
  router: Router;
  private addressController: AddressController;

  constructor() {
    this.router = Router();
    this.addressController = new AddressController();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    // Protect all routes with authentication
    this.router.get('/', ensureAuthenticated, this.addressController.getAllAddresses.bind(this.addressController));
    this.router.get('/:id', ensureAuthenticated, this.addressController.getAddressById.bind(this.addressController));
    this.router.post('/', ensureAuthenticated, this.addressController.createAddress.bind(this.addressController));
    this.router.put('/:id', ensureAuthenticated, this.addressController.updateAddress.bind(this.addressController));
    this.router.delete('/:id', ensureAuthenticated, this.addressController.deleteAddress.bind(this.addressController));
  }

  getRouter() {
    return this.router;
  }
}