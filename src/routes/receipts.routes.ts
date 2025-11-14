import { Router } from 'express';
import { ReceiptsController } from '../controllers/receipts.controller';
import { ensureAuthenticated } from '../middleware/auth.middleware';

/**
 * @swagger
 * tags:
 *   name: Receipts
 *   description: Receipt management for home maintenance and purchases
 */
export class ReceiptsRoutes {
  router: Router;
  private receiptsController: ReceiptsController;

  constructor() {
    this.router = Router();
    this.receiptsController = new ReceiptsController();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    /**
     * @swagger
     * /api/receipts:
     *   get:
     *     summary: Get all receipts
     *     description: Retrieve a list of all receipts with optional sorting
     *     tags: [Receipts]
     *     security:
     *       - cookieAuth: []
     *     parameters:
     *       - in: query
     *         name: orderBy
     *         schema:
     *           type: string
     *           default: id
     *         description: Field to order by
     *         example: paid_date
     *       - in: query
     *         name: direction
     *         schema:
     *           type: string
     *           enum: [ASC, DESC]
     *           default: ASC
     *         description: Sort direction
     *     responses:
     *       200:
     *         description: A list of receipts
     *         content:
     *           application/json:
     *             schema:
     *               type: array
     *               items:
     *                 $ref: '#/components/schemas/Receipt'
     *       401:
     *         description: Unauthorized - Authentication required
     *       500:
     *         description: Internal server error
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/Error'
     */
    this.router.get('/', ensureAuthenticated, this.receiptsController.getAllReceipts.bind(this.receiptsController));

    /**
     * @swagger
     * /api/receipts/{id}:
     *   get:
     *     summary: Get a receipt by ID
     *     description: Retrieve a single receipt by its ID
     *     tags: [Receipts]
     *     security:
     *       - cookieAuth: []
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: integer
     *         description: The receipt ID
     *         example: 1
     *     responses:
     *       200:
     *         description: A single receipt
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/Receipt'
     *       400:
     *         description: Bad request - Invalid ID parameter
     *       401:
     *         description: Unauthorized - Authentication required
     *       404:
     *         description: Receipt not found
     *       500:
     *         description: Internal server error
     */
    this.router.get('/:id', ensureAuthenticated, this.receiptsController.getReceiptById.bind(this.receiptsController));

    /**
     * @swagger
     * /api/receipts/home/{homeId}:
     *   get:
     *     summary: Get receipts by home ID
     *     description: Retrieve all receipts for a specific home
     *     tags: [Receipts]
     *     security:
     *       - cookieAuth: []
     *     parameters:
     *       - in: path
     *         name: homeId
     *         required: true
     *         schema:
     *           type: integer
     *         description: The home ID
     *         example: 1
     *     responses:
     *       200:
     *         description: A list of receipts for the specified home
     *         content:
     *           application/json:
     *             schema:
     *               type: array
     *               items:
     *                 $ref: '#/components/schemas/Receipt'
     *       400:
     *         description: Bad request - Invalid home ID parameter
     *       401:
     *         description: Unauthorized - Authentication required
     *       500:
     *         description: Internal server error
     */
    this.router.get('/home/:homeId', ensureAuthenticated, this.receiptsController.getReceiptsByHomeId.bind(this.receiptsController));

    /**
     * @swagger
     * /api/receipts/home/{homeId}/total:
     *   get:
     *     summary: Get total expenses for a home
     *     description: Calculate and retrieve the total expenses for a specific home
     *     tags: [Receipts]
     *     security:
     *       - cookieAuth: []
     *     parameters:
     *       - in: path
     *         name: homeId
     *         required: true
     *         schema:
     *           type: integer
     *         description: The home ID
     *         example: 1
     *     responses:
     *       200:
     *         description: Total expenses for the home
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 homeId:
     *                   type: integer
     *                   example: 1
     *                 totalExpenses:
     *                   type: number
     *                   format: float
     *                   example: 2250.75
     *       400:
     *         description: Bad request - Invalid home ID parameter
     *       401:
     *         description: Unauthorized - Authentication required
     *       500:
     *         description: Internal server error
     */
    this.router.get('/home/:homeId/total', ensureAuthenticated, this.receiptsController.getTotalExpensesByHomeId.bind(this.receiptsController));

    /**
     * @swagger
     * /api/receipts/type/{type}:
     *   get:
     *     summary: Get receipts by type
     *     description: Retrieve all receipts of a specific type (service or store)
     *     tags: [Receipts]
     *     security:
     *       - cookieAuth: []
     *     parameters:
     *       - in: path
     *         name: type
     *         required: true
     *         schema:
     *           type: string
     *           enum: [service, store]
     *         description: The receipt type
     *         example: service
     *     responses:
     *       200:
     *         description: A list of receipts of the specified type
     *         content:
     *           application/json:
     *             schema:
     *               type: array
     *               items:
     *                 $ref: '#/components/schemas/Receipt'
     *       400:
     *         description: Bad request - Invalid type parameter
     *       401:
     *         description: Unauthorized - Authentication required
     *       500:
     *         description: Internal server error
     */
    this.router.get('/type/:type', ensureAuthenticated, this.receiptsController.getReceiptsByType.bind(this.receiptsController));

    /**
     * @swagger
     * /api/receipts:
     *   post:
     *     summary: Create a new receipt
     *     description: Add a new receipt to the system
     *     tags: [Receipts]
     *     security:
     *       - cookieAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required:
     *               - home_id
     *               - total
     *               - type
     *               - vendor_name
     *               - paid_date
     *             properties:
     *               home_id:
     *                 type: integer
     *                 description: ID of the home this receipt belongs to
     *                 example: 1
     *               total:
     *                 type: number
     *                 format: float
     *                 description: Total amount on the receipt
     *                 example: 350.00
     *               type:
     *                 type: string
     *                 enum: [service, store]
     *                 description: Type of receipt
     *                 example: service
     *               vendor_name:
     *                 type: string
     *                 description: Name of the vendor or service provider
     *                 example: ABC HVAC Services
     *               paid_date:
     *                 type: string
     *                 format: date
     *                 description: Date the receipt was paid (YYYY-MM-DD)
     *                 example: 2025-01-15
     *               description:
     *                 type: string
     *                 description: Optional description of the purchase or service
     *                 example: Annual AC maintenance and filter replacement
     *               category:
     *                 type: string
     *                 description: Optional category for organizing receipts
     *                 example: HVAC
     *               receipt_url:
     *                 type: string
     *                 format: uri
     *                 description: Optional URL to digital receipt image/PDF
     *                 example: https://example.com/receipts/123.pdf
     *     responses:
     *       201:
     *         description: Receipt created successfully
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/Receipt'
     *       400:
     *         description: Bad request - Invalid input or validation error
     *       401:
     *         description: Unauthorized - Authentication required
     *       500:
     *         description: Internal server error
     */
    this.router.post('/', ensureAuthenticated, this.receiptsController.createReceipt.bind(this.receiptsController));

    /**
     * @swagger
     * /api/receipts/{id}:
     *   put:
     *     summary: Update a receipt
     *     description: Update an existing receipt by ID
     *     tags: [Receipts]
     *     security:
     *       - cookieAuth: []
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: integer
     *         description: The receipt ID
     *         example: 1
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               home_id:
     *                 type: integer
     *                 example: 1
     *               total:
     *                 type: number
     *                 format: float
     *                 example: 375.00
     *               type:
     *                 type: string
     *                 enum: [service, store]
     *                 example: service
     *               vendor_name:
     *                 type: string
     *                 example: ABC HVAC Services
     *               paid_date:
     *                 type: string
     *                 format: date
     *                 example: 2025-01-15
     *               description:
     *                 type: string
     *                 example: Updated description
     *               category:
     *                 type: string
     *                 example: HVAC
     *               receipt_url:
     *                 type: string
     *                 format: uri
     *                 example: https://example.com/receipts/123.pdf
     *     responses:
     *       200:
     *         description: Receipt updated successfully
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/Receipt'
     *       400:
     *         description: Bad request - Invalid input or validation error
     *       401:
     *         description: Unauthorized - Authentication required
     *       404:
     *         description: Receipt not found
     *       500:
     *         description: Internal server error
     */
    this.router.put('/:id', ensureAuthenticated, this.receiptsController.updateReceipt.bind(this.receiptsController));

    /**
     * @swagger
     * /api/receipts/{id}:
     *   delete:
     *     summary: Delete a receipt
     *     description: Remove a receipt from the system
     *     tags: [Receipts]
     *     security:
     *       - cookieAuth: []
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: integer
     *         description: The receipt ID
     *         example: 1
     *     responses:
     *       204:
     *         description: Receipt deleted successfully
     *       400:
     *         description: Bad request - Invalid ID parameter
     *       401:
     *         description: Unauthorized - Authentication required
     *       404:
     *         description: Receipt not found
     *       500:
     *         description: Internal server error
     */
    this.router.delete('/:id', ensureAuthenticated, this.receiptsController.deleteReceipt.bind(this.receiptsController));
  }

  getRouter() {
    return this.router;
  }
}
