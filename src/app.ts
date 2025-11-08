import express, { Request, Response } from 'express';
import { client, connectToDatabase, closeDatabaseConnection } from './database/postgres';
import { HomesRoutes } from './routes/homes.routes';
import { AddressRoutes } from './routes/address.routes';

const app = express();
const PORT = process.env.PORT || 3000;

// Connect to database when the app starts
connectToDatabase();

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

// Graceful shutdown to close database connection
process.on('SIGINT', async () => {
  await closeDatabaseConnection();
  process.exit(0);
});

export { app, PORT, client };
