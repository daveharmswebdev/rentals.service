/// <reference path="../types/express.d.ts" />
import { Request, Response } from 'express';
import { ReceiptsService } from '../services/receipts.service';
import logger from '../utils/logger';
import { getCorrelationId } from '../utils/correlation-id';

export class ReceiptsController {
  private receiptsService: ReceiptsService;

  constructor() {
    this.receiptsService = new ReceiptsService();
  }

  async getAllReceipts(req: Request, res: Response): Promise<void> {
    const correlationId = getCorrelationId(req);
    try {
      const { orderBy, direction } = req.query;

      logger.debug('Fetching all receipts', { correlationId, orderBy, direction });
      const receipts = await this.receiptsService.getAllReceipts(
        orderBy as string,
        direction as 'ASC' | 'DESC'
      );

      logger.info('Successfully retrieved all receipts', {
        correlationId,
        count: receipts.length
      });
      res.json(receipts);
    } catch (error) {
      logger.error('Error in getAllReceipts', {
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

  async getReceiptById(req: Request, res: Response): Promise<void> {
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

      logger.debug('Fetching receipt by ID', { correlationId, receiptId: id });
      const receipt = await this.receiptsService.getReceiptById(id);

      if (!receipt) {
        logger.info('Receipt not found', { correlationId, receiptId: id });
        res.status(404).json({
          message: 'Receipt not found',
          error: `No receipt found with ID ${id}`
        });
        return;
      }

      logger.info('Successfully retrieved receipt', { correlationId, receiptId: id });
      res.json(receipt);
    } catch (error) {
      logger.error('Error in getReceiptById', {
        correlationId,
        receiptId: req.params.id,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      res.status(500).json({
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async getReceiptsByHomeId(req: Request, res: Response): Promise<void> {
    const correlationId = getCorrelationId(req);
    try {
      const homeId = parseInt(req.params.homeId, 10);

      if (isNaN(homeId)) {
        logger.warn('Invalid home ID parameter provided', {
          correlationId,
          providedHomeId: req.params.homeId
        });
        res.status(400).json({
          message: 'Invalid home ID parameter',
          error: 'Home ID must be a valid number'
        });
        return;
      }

      logger.debug('Fetching receipts by home ID', { correlationId, homeId });
      const receipts = await this.receiptsService.getReceiptsByHomeId(homeId);

      logger.info('Successfully retrieved receipts by home ID', {
        correlationId,
        homeId,
        count: receipts.length
      });
      res.json(receipts);
    } catch (error) {
      logger.error('Error in getReceiptsByHomeId', {
        correlationId,
        homeId: req.params.homeId,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      res.status(500).json({
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async getReceiptsByType(req: Request, res: Response): Promise<void> {
    const correlationId = getCorrelationId(req);
    try {
      const type = req.params.type as 'service' | 'store';

      if (!['service', 'store'].includes(type)) {
        logger.warn('Invalid type parameter provided', {
          correlationId,
          providedType: type
        });
        res.status(400).json({
          message: 'Invalid type parameter',
          error: 'Type must be "service" or "store"'
        });
        return;
      }

      logger.debug('Fetching receipts by type', { correlationId, type });
      const receipts = await this.receiptsService.getReceiptsByType(type);

      logger.info('Successfully retrieved receipts by type', {
        correlationId,
        type,
        count: receipts.length
      });
      res.json(receipts);
    } catch (error) {
      logger.error('Error in getReceiptsByType', {
        correlationId,
        type: req.params.type,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      res.status(500).json({
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async getTotalExpensesByHomeId(req: Request, res: Response): Promise<void> {
    const correlationId = getCorrelationId(req);
    try {
      const homeId = parseInt(req.params.homeId, 10);

      if (isNaN(homeId)) {
        logger.warn('Invalid home ID parameter provided', {
          correlationId,
          providedHomeId: req.params.homeId
        });
        res.status(400).json({
          message: 'Invalid home ID parameter',
          error: 'Home ID must be a valid number'
        });
        return;
      }

      logger.debug('Calculating total expenses by home ID', { correlationId, homeId });
      const totalExpenses = await this.receiptsService.getTotalExpensesByHomeId(homeId);

      logger.info('Successfully calculated total expenses', {
        correlationId,
        homeId,
        totalExpenses
      });
      res.json({ homeId, totalExpenses });
    } catch (error) {
      logger.error('Error in getTotalExpensesByHomeId', {
        correlationId,
        homeId: req.params.homeId,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      res.status(500).json({
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async createReceipt(req: Request, res: Response): Promise<void> {
    const correlationId = getCorrelationId(req);
    try {
      const { home_id, total, type, vendor_name, paid_date, description, category, receipt_url } = req.body;

      // Get the user's email from the session if authenticated
      const created_by = req.user?.email;

      logger.debug('Creating new receipt', { correlationId, home_id, vendor_name });
      const receipt = await this.receiptsService.createReceipt({
        home_id,
        total,
        type,
        vendor_name,
        paid_date,
        description,
        category,
        receipt_url,
        created_by
      });

      logger.info('Successfully created receipt', {
        correlationId,
        receiptId: receipt.id
      });
      res.status(201).json(receipt);
    } catch (error) {
      logger.error('Error in createReceipt', {
        correlationId,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });

      // Return 400 for validation errors
      if (error instanceof Error &&
          (error.message.includes('required') ||
           error.message.includes('Invalid') ||
           error.message.includes('must be'))) {
        res.status(400).json({
          message: 'Validation error',
          error: error.message
        });
        return;
      }

      res.status(500).json({
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async updateReceipt(req: Request, res: Response): Promise<void> {
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

      const { home_id, total, type, vendor_name, paid_date, description, category, receipt_url } = req.body;

      // Get the user's email from the session if authenticated
      const updated_by = req.user?.email;

      logger.debug('Updating receipt', { correlationId, receiptId: id });
      const receipt = await this.receiptsService.updateReceipt(id, {
        home_id,
        total,
        type,
        vendor_name,
        paid_date,
        description,
        category,
        receipt_url,
        updated_by
      });

      if (!receipt) {
        logger.info('Receipt not found for update', { correlationId, receiptId: id });
        res.status(404).json({
          message: 'Receipt not found',
          error: `No receipt found with ID ${id}`
        });
        return;
      }

      logger.info('Successfully updated receipt', { correlationId, receiptId: id });
      res.json(receipt);
    } catch (error) {
      logger.error('Error in updateReceipt', {
        correlationId,
        receiptId: req.params.id,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });

      // Return 400 for validation errors
      if (error instanceof Error &&
          (error.message.includes('Invalid') || error.message.includes('must be'))) {
        res.status(400).json({
          message: 'Validation error',
          error: error.message
        });
        return;
      }

      res.status(500).json({
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async deleteReceipt(req: Request, res: Response): Promise<void> {
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

      logger.debug('Deleting receipt', { correlationId, receiptId: id });
      const deleted = await this.receiptsService.deleteReceipt(id);

      if (!deleted) {
        logger.info('Receipt not found for deletion', { correlationId, receiptId: id });
        res.status(404).json({
          message: 'Receipt not found',
          error: `No receipt found with ID ${id}`
        });
        return;
      }

      logger.info('Successfully deleted receipt', { correlationId, receiptId: id });
      res.status(204).send();
    } catch (error) {
      logger.error('Error in deleteReceipt', {
        correlationId,
        receiptId: req.params.id,
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
