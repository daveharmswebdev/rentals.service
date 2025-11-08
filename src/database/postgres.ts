import { Client, Pool } from 'pg';
import dotenv from 'dotenv';
import logger from '../utils/logger';

dotenv.config();

// Determine if we're using Cloud SQL Proxy
// Proxy runs on localhost/127.0.0.1 and handles encryption, so SSL is not needed
const isUsingProxy = process.env.DB_HOST === '127.0.0.1' || process.env.DB_HOST === 'localhost';

// Base configuration shared by Client and Pool
const dbConfig = {
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432', 10),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  // Only use SSL for direct connections (not through proxy)
  ...(isUsingProxy ? {} : {
    ssl: {
      rejectUnauthorized: false,
    }
  })
};

// PostgreSQL Client Configuration
const client = new Client(dbConfig);

// PostgreSQL Pool Configuration
const pool = new Pool(dbConfig);

// Database Connection Function
async function connectToDatabase() {
  try {
    const connectionMode = isUsingProxy ? 'Cloud SQL Proxy' : 'Direct SSL';
    logger.info('Attempting to connect to PostgreSQL database', {
      connectionMode,
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      database: process.env.DB_NAME,
      user: process.env.DB_USER
    });
    
    await client.connect();
    logger.info('Successfully connected to PostgreSQL database');
    
    // Optional: Run a simple query to verify connection
    const res = await client.query('SELECT NOW()');
    logger.debug('Database connection verified', {
      currentTime: res.rows[0].now
    });
  } catch (err) {
    logger.error('Error connecting to the database', {
      error: err instanceof Error ? err.message : String(err),
      stack: err instanceof Error ? err.stack : undefined,
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      database: process.env.DB_NAME
    });
    throw err;  // Re-throw to allow caller to handle connection failure
  }
}

// Graceful shutdown function
async function closeDatabaseConnection() {
  try {
    await client.end();
    await pool.end();
    logger.info('Database connections closed successfully');
  } catch (err) {
    logger.error('Error closing database connection', {
      error: err instanceof Error ? err.message : String(err),
      stack: err instanceof Error ? err.stack : undefined
    });
  }
}

export { 
  client, 
  connectToDatabase, 
  closeDatabaseConnection,
  pool
};

// Function to get PostgreSQL pool
function getPostgresPool() {
  return pool;
}

export { getPostgresPool };
