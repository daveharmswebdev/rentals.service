import { Router } from 'express';
import { AddressController } from '../controllers/address.controller';
import { ensureAuthenticated } from '../middleware/auth.middleware';

/**
 * @swagger
 * tags:
 *   name: Addresses
 *   description: Address management
 */
export class AddressRoutes {
  router: Router;
  private addressController: AddressController;

  constructor() {
    this.router = Router();
    this.addressController = new AddressController();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    /**
     * @swagger
     * /api/addresses:
     *   get:
     *     summary: Get all addresses
     *     description: Retrieve a list of all addresses
     *     tags: [Addresses]
     *     security:
     *       - cookieAuth: []
     *     responses:
     *       200:
     *         description: A list of addresses
     *         content:
     *           application/json:
     *             schema:
     *               type: array
     *               items:
     *                 $ref: '#/components/schemas/Address'
     *       401:
     *         description: Unauthorized - Authentication required
     *       500:
     *         description: Internal server error
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/Error'
     */
    this.router.get('/', ensureAuthenticated, this.addressController.getAllAddresses.bind(this.addressController));
    
    /**
     * @swagger
     * /api/addresses/{id}:
     *   get:
     *     summary: Get an address by ID
     *     description: Retrieve a single address by its ID
     *     tags: [Addresses]
     *     security:
     *       - cookieAuth: []
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: integer
     *         description: The address ID
     *         example: 1
     *     responses:
     *       200:
     *         description: A single address
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/Address'
     *       400:
     *         description: Bad request - Invalid ID parameter
     *       401:
     *         description: Unauthorized - Authentication required
     *       404:
     *         description: Address not found
     *       500:
     *         description: Internal server error
     */
    this.router.get('/:id', ensureAuthenticated, this.addressController.getAddressById.bind(this.addressController));
    
    /**
     * @swagger
     * /api/addresses:
     *   post:
     *     summary: Create a new address
     *     description: Add a new address to the system
     *     tags: [Addresses]
     *     security:
     *       - cookieAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required:
     *               - street
     *               - city
     *               - state
     *               - zip
     *             properties:
     *               street:
     *                 type: string
     *                 example: '123 Main St'
     *               city:
     *                 type: string
     *                 example: 'San Francisco'
     *               state:
     *                 type: string
     *                 example: 'CA'
     *               zip:
     *                 type: string
     *                 example: '94102'
     *     responses:
     *       201:
     *         description: Address created successfully
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/Address'
     *       400:
     *         description: Bad request - Invalid input
     *       401:
     *         description: Unauthorized - Authentication required
     *       500:
     *         description: Internal server error
     */
    this.router.post('/', ensureAuthenticated, this.addressController.createAddress.bind(this.addressController));
    
    /**
     * @swagger
     * /api/addresses/{id}:
     *   put:
     *     summary: Update an address
     *     description: Update an existing address by ID
     *     tags: [Addresses]
     *     security:
     *       - cookieAuth: []
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: integer
     *         description: The address ID
     *         example: 1
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               street:
     *                 type: string
     *                 example: '456 Oak Ave'
     *               city:
     *                 type: string
     *                 example: 'Los Angeles'
     *               state:
     *                 type: string
     *                 example: 'CA'
     *               zip:
     *                 type: string
     *                 example: '90001'
     *     responses:
     *       200:
     *         description: Address updated successfully
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/Address'
     *       400:
     *         description: Bad request - Invalid input
     *       401:
     *         description: Unauthorized - Authentication required
     *       404:
     *         description: Address not found
     *       500:
     *         description: Internal server error
     */
    this.router.put('/:id', ensureAuthenticated, this.addressController.updateAddress.bind(this.addressController));
    
    /**
     * @swagger
     * /api/addresses/{id}:
     *   delete:
     *     summary: Delete an address
     *     description: Remove an address from the system
     *     tags: [Addresses]
     *     security:
     *       - cookieAuth: []
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: integer
     *         description: The address ID
     *         example: 1
     *     responses:
     *       200:
     *         description: Address deleted successfully
     *       400:
     *         description: Bad request - Invalid ID parameter
     *       401:
     *         description: Unauthorized - Authentication required
     *       404:
     *         description: Address not found
     *       500:
     *         description: Internal server error
     */
    this.router.delete('/:id', ensureAuthenticated, this.addressController.deleteAddress.bind(this.addressController));
  }

  getRouter() {
    return this.router;
  }
}
