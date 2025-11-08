import { Pool } from 'pg';
import { BaseRepository } from './base.repository';
import { Address } from '../interfaces/address.interface';

export class AddressRepository extends BaseRepository<Address> {
  constructor(pool: Pool) {
    super(pool, 'addresses', [
      'id',
      'street_address',
      'city',
      'state',
      'zip_code',
      'country'
    ]);
  }

  // Add any address-specific methods here if needed
  async findByCity(city: string): Promise<Address[]> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        `SELECT ${this.columns.join(', ')} FROM ${this.tableName} WHERE city = $1`,
        [city]
      );
      return result.rows;
    } finally {
      client.release();
    }
  }
}