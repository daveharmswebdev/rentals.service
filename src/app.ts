import express, { Request, Response } from 'express';
import { client, connectToDatabase, closeDatabaseConnection } from './database/postgres';
import { HomesRoutes } from './routes/homes.routes';
import { AddressRoutes } from './routes/address.routes';
import { correlationIdMiddleware } from './utils/correlation-id';
import { httpLogger, httpErrorLogger, responseTimeMiddleware } from './middleware/logging.middleware';
import logger from './utils/logger';

const app = express();
const PORT = process.env.PORT || 3000;

// Connect to database when the app starts
connectToDatabase();

// Add correlation ID middleware (must be first)
app.use(correlationIdMiddleware);

// Add response time tracking
app.use(responseTimeMiddleware);

// Add HTTP request logging
app.use(httpLogger);

// Add middleware to parse JSON
app.use(express.json());

// Ensure root route works
app.get('/', (req: Request, res: Response) => {
  res.status(200).json({ 
    message: 'Hello, World!',
    status: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// Add homes routes
const homesRoutes = new HomesRoutes();
app.use('/api/homes', homesRoutes.getRouter());

// Add address routes
const addressRoutes = new AddressRoutes();
app.use('/api/addresses', addressRoutes.getRouter());

// Add HTTP error logging (must be after routes)
app.use(httpErrorLogger);

// Graceful shutdown to close database connection
process.on('SIGINT', async () => {
  logger.info('Received SIGINT signal, shutting down gracefully...');
  console.log('Received SIGINT signal, shutting down gracefully...');
  await closeDatabaseConnection();
  logger.info('Database connection closed');
  console.log('Database connection closed');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  logger.info('Received SIGTERM signal, shutting down gracefully...');
  console.log('Received SIGTERM signal, shutting down gracefully...');
  await closeDatabaseConnection();
  logger.info('Database connection closed');
  process.exit(0);
});

export { app, PORT, client };
