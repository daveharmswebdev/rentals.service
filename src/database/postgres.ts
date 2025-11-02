import { Client, Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// PostgreSQL Client Configuration
const client = new Client({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432', 10),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: {
    rejectUnauthorized: false,  // Important for GCP SQL
    // If you have a specific CA certificate, you can provide it here
  }
});

// PostgreSQL Pool Configuration
const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432', 10),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: {
    rejectUnauthorized: false,
  }
});

// Database Connection Function
async function connectToDatabase() {
  try {
    console.log('Attempting to connect to PostgreSQL database...');
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
