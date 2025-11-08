import { Router } from 'express';
import { AddressController } from '../controllers/address.controller';

export class AddressRoutes {
  router: Router;
  private addressController: AddressController;

  constructor() {
    this.router = Router();
    this.addressController = new AddressController();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.get('/', this.addressController.getAllAddresses.bind(this.addressController));
    this.router.get('/:id', this.addressController.getAddressById.bind(this.addressController));
    this.router.post('/', this.addressController.createAddress.bind(this.addressController));
    this.router.put('/:id', this.addressController.updateAddress.bind(this.addressController));
    this.router.delete('/:id', this.addressController.deleteAddress.bind(this.addressController));
  }

  getRouter() {
    return this.router;
  }
}