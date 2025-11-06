import { Client, Pool } from 'pg';
import dotenv from 'dotenv';

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
    console.log(`Attempting to connect to PostgreSQL database via ${connectionMode}...`);
    console.log(`Connection details: ${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`);
    
    await client.connect();
    console.log('✅ Successfully connected to PostgreSQL database');
    
    // Optional: Run a simple query to verify connection
    const res = await client.query('SELECT NOW()');
    console.log('🕒 Current database time:', res.rows[0].now);
  } catch (err) {
    console.error('❌ Error connecting to the database:', err);
    throw err;  // Re-throw to allow caller to handle connection failure
  }
}

// Graceful shutdown function
async function closeDatabaseConnection() {
  try {
    await client.end();
    console.log('Database connection closed successfully');
  } catch (err) {
    console.error('Error closing database connection:', err);
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
