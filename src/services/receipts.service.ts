import { ReceiptsRepository } from '../repositories/receipts.repository';
import { Receipt, CreateReceiptDto, UpdateReceiptDto } from '../interfaces/receipt.interface';
import { getPostgresPool } from '../database/postgres';
import logger from '../utils/logger';

export class ReceiptsService {
  private repository: ReceiptsRepository;

  constructor() {
    const pool = getPostgresPool();
    this.repository = new ReceiptsRepository(pool);
  }

  async getAllReceipts(orderBy?: string, direction?: 'ASC' | 'DESC'): Promise<Receipt[]> {
    try {
      return await this.repository.getAll(orderBy, direction);
    } catch (error) {
      logger.error('Error fetching receipts', { error });
      throw new Error('Unable to fetch receipts');
    }
  }

  async getReceiptById(id: number): Promise<Receipt | null> {
    try {
      return await this.repository.getById(id);
    } catch (error) {
      logger.error('Error fetching receipt', { error, receiptId: id });
      throw new Error('Unable to fetch receipt');
    }
  }

  async getReceiptsByHomeId(homeId: number): Promise<Receipt[]> {
    try {
      return await this.repository.findByHomeId(homeId);
    } catch (error) {
      logger.error('Error fetching receipts by home ID', { error, homeId });
      throw new Error('Unable to fetch receipts for home');
    }
  }

  async getReceiptsByType(type: 'service' | 'store'): Promise<Receipt[]> {
    try {
      return await this.repository.findByType(type);
    } catch (error) {
      logger.error('Error fetching receipts by type', { error, type });
      throw new Error('Unable to fetch receipts by type');
    }
  }

  async getReceiptsByCategory(category: string): Promise<Receipt[]> {
    try {
      return await this.repository.findByCategory(category);
    } catch (error) {
      logger.error('Error fetching receipts by category', { error, category });
      throw new Error('Unable to fetch receipts by category');
    }
  }

  async getReceiptsByDateRange(startDate: string, endDate: string): Promise<Receipt[]> {
    try {
      // Basic validation
      if (!this.isValidDate(startDate) || !this.isValidDate(endDate)) {
        throw new Error('Invalid date format. Use YYYY-MM-DD');
      }

      return await this.repository.findByDateRange(startDate, endDate);
    } catch (error) {
      logger.error('Error fetching receipts by date range', { error, startDate, endDate });
      throw error;
    }
  }

  async getTotalExpensesByHomeId(homeId: number): Promise<number> {
    try {
      return await this.repository.getTotalExpensesByHomeId(homeId);
    } catch (error) {
      logger.error('Error calculating total expenses', { error, homeId });
      throw new Error('Unable to calculate total expenses');
    }
  }

  async createReceipt(data: CreateReceiptDto): Promise<Receipt> {
    try {
      // Validate required fields
      this.validateReceiptData(data);

      // Validate date format
      if (!this.isValidDate(data.paid_date)) {
        throw new Error('Invalid paid_date format. Use YYYY-MM-DD');
      }

      return await this.repository.create(data);
    } catch (error) {
      logger.error('Error creating receipt', { error, data });
      throw error;
    }
  }

  async updateReceipt(id: number, data: UpdateReceiptDto): Promise<Receipt | null> {
    try {
      // Validate date format if provided
      if (data.paid_date && !this.isValidDate(data.paid_date)) {
        throw new Error('Invalid paid_date format. Use YYYY-MM-DD');
      }

      // Validate type if provided
      if (data.type && !['service', 'store'].includes(data.type)) {
        throw new Error('Invalid type. Must be "service" or "store"');
      }

      // Validate total if provided
      if (data.total !== undefined && data.total < 0) {
        throw new Error('Total must be a positive number');
      }

      return await this.repository.update(id, data);
    } catch (error) {
      logger.error('Error updating receipt', { error, receiptId: id, data });
      throw error;
    }
  }

  async deleteReceipt(id: number): Promise<boolean> {
    try {
      return await this.repository.delete(id);
    } catch (error) {
      logger.error('Error deleting receipt', { error, receiptId: id });
      throw new Error('Unable to delete receipt');
    }
  }

  // Private helper methods

  private validateReceiptData(data: CreateReceiptDto): void {
    if (!data.home_id) {
      throw new Error('home_id is required');
    }

    if (data.total === undefined || data.total < 0) {
      throw new Error('total must be a positive number');
    }

    if (!data.type || !['service', 'store'].includes(data.type)) {
      throw new Error('type must be "service" or "store"');
    }

    if (!data.vendor_name || data.vendor_name.trim() === '') {
      throw new Error('vendor_name is required');
    }

    if (!data.paid_date) {
      throw new Error('paid_date is required');
    }
  }

  private isValidDate(dateString: string): boolean {
    // Check format YYYY-MM-DD
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    if (!regex.test(dateString)) {
      return false;
    }

    // Check if it's a valid date
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date.getTime());
  }
}
