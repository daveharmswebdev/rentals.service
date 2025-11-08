import { Pool } from 'pg';
import { Home } from '../interfaces/homes.interface';
import { getPostgresPool } from '../database/postgres';

export class HomesService {
  private pool: Pool;

  constructor() {
    this.pool = getPostgresPool();
  }

  async getAllHomes(): Promise<Home[]> {
    try {
      const client = await this.pool.connect();
      const result = await client.query(`
        SELECT 
          h.id, 
          a.street_address as "streetAddress",
          a.city,
          a.state,
          a.zip_code as "zipCode",
          h.square_feet as "squareFeet", 
          h.bedrooms, 
          h.fullbath as "fullBath", 
          h.halfbath as "halfBath",
          h.garage_spaces as "garageSpaces"
        FROM homes h
        JOIN addresses a ON h.address_id = a.id
      `);
      client.release();
      return result.rows;
    } catch (error) {
      console.error('Error fetching homes:', error);
      throw new Error('Unable to fetch homes');
    }
  }

  async getHomeById(id: number): Promise<Home | null> {
    try {
      const client = await this.pool.connect();
      const result = await client.query(`
        SELECT 
          h.id, 
          a.street_address as "streetAddress",
          a.city,
          a.state,
          a.zip_code as "zipCode",
          h.square_feet as "squareFeet", 
          h.bedrooms, 
          h.fullbath as "fullBath", 
          h.halfbath as "halfBath",
          h.garage_spaces as "garageSpaces"
        FROM homes h
        JOIN addresses a ON h.address_id = a.id
        WHERE h.id = $1
      `, [id]);
      client.release();
      return result.rows.length > 0 ? result.rows[0] : null;
    } catch (error) {
      console.error('Error fetching home by id:', error);
      throw new Error('Unable to fetch home');
    }
  }
}
