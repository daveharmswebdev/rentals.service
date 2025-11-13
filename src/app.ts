import express, { Request, Response } from 'express';
import { createClient } from 'redis';
import { RedisStore } from 'connect-redis';
import session from 'express-session';
import swaggerUi from 'swagger-ui-express';
import { client, connectToDatabase, closeDatabaseConnection } from './database/postgres';
import { HomesRoutes } from './routes/homes.routes';
import { AddressRoutes } from './routes/address.routes';
import { AuthRoutes } from './routes/auth.routes';
import { correlationIdMiddleware } from './utils/correlation-id';
import { httpLogger, httpErrorLogger, responseTimeMiddleware } from './middleware/logging.middleware';
import logger from './utils/logger';
import passport from './config/passport.config';
import { authConfig, validateAuthConfig } from './config/auth.config';
import { swaggerSpec } from './config/swagger.config';

const app = express();

// Trust first proxy (needed for secure cookies behind load balancer or reverse proxy)
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}
const PORT = process.env.PORT || 3000;

// Validate authentication configuration
try {
  validateAuthConfig();
  logger.info('Authentication configuration validated successfully');
} catch (error) {
  logger.error('Authentication configuration validation failed', { error });
  // In development, we might want to continue without auth
  // In production, you might want to throw the error
  if (process.env.NODE_ENV === 'production') {
    throw error;
  }
}

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

// Session configuration (must be before passport initialization)

// Redis session store setup
const redisClient = createClient({
  socket: {
    host: process.env.REDIS_HOST || 'localhost',
    port: Number(process.env.REDIS_PORT) || 6379,
  },
});

redisClient.connect().catch(console.error);

app.use(
  session({
    store: new RedisStore({ client: redisClient }),
    secret: process.env.SESSION_SECRET || 'your-secret-key-here-change-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000,
      sameSite: 'lax',
    },
  })
);

// Log session and cookie details for debugging
app.use((req, res, next) => {
  if (req.session) {
    logger.info('Session middleware active', {
      sessionID: req.sessionID,
      session: req.session,
      cookies: req.cookies,
      signedCookies: req.signedCookies,
      headers: req.headers,
    });
  } else {
    logger.warn('No session found on request');
  }
  next();
});

// Initialize Passport and restore authentication state from session
app.use(passport.initialize());
app.use(passport.session());

// Ensure root route works
app.get('/', (req: Request, res: Response) => {
  res.status(200).json({ 
    message: 'Hello, World!',
    status: 'Server is running',
    timestamp: new Date().toISOString(),
    authenticated: req.isAuthenticated(),
  });
});

// Swagger documentation route
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Rentals Portal API Documentation',
}));

// Add authentication routes
const authRoutes = new AuthRoutes();
app.use('/auth', authRoutes.getRouter());

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
