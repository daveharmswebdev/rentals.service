import { Pool } from 'pg';
import { BaseRepository } from './base.repository';
import { Receipt } from '../interfaces/receipt.interface';

export class ReceiptsRepository extends BaseRepository<Receipt> {
  constructor(pool: Pool) {
    super(pool, 'receipts', [
      'id',
      'home_id',
      'total',
      'type',
      'vendor_name',
      'paid_date',
      'description',
      'category',
      'receipt_url',
      'created_at',
      'updated_at',
      'created_by',
      'updated_by'
    ]);
  }

  // Add receipt-specific methods here if needed

  /**
   * Find all receipts for a specific home
   * @param homeId - The ID of the home
   * @returns Array of receipts for the specified home
   */
  async findByHomeId(homeId: number): Promise<Receipt[]> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        `SELECT ${this.columns.join(', ')} FROM ${this.tableName} WHERE home_id = $1 ORDER BY paid_date DESC`,
        [homeId]
      );
      return result.rows;
    } finally {
      client.release();
    }
  }

  /**
   * Find receipts by type (service or store)
   * @param type - The type of receipt ('service' or 'store')
   * @returns Array of receipts of the specified type
   */
  async findByType(type: 'service' | 'store'): Promise<Receipt[]> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        `SELECT ${this.columns.join(', ')} FROM ${this.tableName} WHERE type = $1 ORDER BY paid_date DESC`,
        [type]
      );
      return result.rows;
    } finally {
      client.release();
    }
  }

  /**
   * Find receipts by category
   * @param category - The category of receipts
   * @returns Array of receipts in the specified category
   */
  async findByCategory(category: string): Promise<Receipt[]> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        `SELECT ${this.columns.join(', ')} FROM ${this.tableName} WHERE category = $1 ORDER BY paid_date DESC`,
        [category]
      );
      return result.rows;
    } finally {
      client.release();
    }
  }

  /**
   * Find receipts within a date range
   * @param startDate - Start date (ISO string)
   * @param endDate - End date (ISO string)
   * @returns Array of receipts within the date range
   */
  async findByDateRange(startDate: string, endDate: string): Promise<Receipt[]> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        `SELECT ${this.columns.join(', ')} FROM ${this.tableName}
         WHERE paid_date BETWEEN $1 AND $2
         ORDER BY paid_date DESC`,
        [startDate, endDate]
      );
      return result.rows;
    } finally {
      client.release();
    }
  }

  /**
   * Get total expenses for a specific home
   * @param homeId - The ID of the home
   * @returns Total amount spent on the home
   */
  async getTotalExpensesByHomeId(homeId: number): Promise<number> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        `SELECT COALESCE(SUM(total), 0) as total_expenses FROM ${this.tableName} WHERE home_id = $1`,
        [homeId]
      );
      return parseFloat(result.rows[0].total_expenses);
    } finally {
      client.release();
    }
  }
}
