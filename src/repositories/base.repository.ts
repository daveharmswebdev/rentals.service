import { Pool, QueryResult } from 'pg';

export interface IRepository<T> {
  getAll(orderBy?: string, direction?: 'ASC' | 'DESC'): Promise<T[]>;
  getById(id: number): Promise<T | null>;
  create(data: Partial<T>): Promise<T>;
  update(id: number, data: Partial<T>): Promise<T | null>;
  delete(id: number): Promise<boolean>;
}

export abstract class BaseRepository<T> implements IRepository<T> {
  protected pool: Pool;
  protected tableName: string;
  protected columns: string[];

  constructor(pool: Pool, tableName: string, columns: string[]) {
    this.pool = pool;
    this.tableName = tableName;
    this.columns = columns;
  }

  async getAll(orderBy = 'id', direction: 'ASC' | 'DESC' = 'ASC'): Promise<T[]> {
    const client = await this.pool.connect();
    try {
      // Validate orderBy column exists in columns array to prevent SQL injection
      const safeOrderBy = this.columns.includes(orderBy) ? orderBy : 'id';
      
      const result = await client.query(
        `SELECT ${this.columns.join(', ')} FROM ${this.tableName} ORDER BY ${safeOrderBy} ${direction}`
      );
      return result.rows;
    } finally {
      client.release();
    }
  }

  async getById(id: number): Promise<T | null> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        `SELECT ${this.columns.join(', ')} FROM ${this.tableName} WHERE id = $1`,
        [id]
      );
      return result.rows.length > 0 ? result.rows[0] : null;
    } finally {
      client.release();
    }
  }

  async create(data: Partial<T>): Promise<T> {
    const client = await this.pool.connect();
    try {
      const keys = Object.keys(data);
      const values = Object.values(data);
      const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
      
      const result = await client.query(
        `INSERT INTO ${this.tableName} (${keys.join(', ')}) 
         VALUES (${placeholders}) 
         RETURNING ${this.columns.join(', ')}`,
        values
      );
      return result.rows[0];
    } finally {
      client.release();
    }
  }

  async update(id: number, data: Partial<T>): Promise<T | null> {
    const client = await this.pool.connect();
    try {
      const keys = Object.keys(data);
      const values = Object.values(data);
      const setClause = keys.map((key, i) => `${key} = $${i + 2}`).join(', ');
      
      const result = await client.query(
        `UPDATE ${this.tableName} 
         SET ${setClause} 
         WHERE id = $1 
         RETURNING ${this.columns.join(', ')}`,
        [id, ...values]
      );
      return result.rows.length > 0 ? result.rows[0] : null;
    } finally {
      client.release();
    }
  }

  async delete(id: number): Promise<boolean> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        `DELETE FROM ${this.tableName} WHERE id = $1`,
        [id]
      );
      return result.rowCount !== null && result.rowCount > 0;
    } finally {
      client.release();
    }
  }
}