import { app, PORT } from './app';
import logger from './utils/logger';

const server = app.listen(PORT, () => {
  console.log(`listening on port ${PORT}`);
  logger.info(`Server started successfully`, {
    port: PORT,
    environment: process.env.NODE_ENV || 'development',
    nodeVersion: process.version
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (error: Error) => {
  console.log('error', error);
  logger.error('Uncaught Exception', {
    error: error.message,
    stack: error.stack
  });
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
  console.log('unhandled rejection', reason);
  logger.error('Unhandled Rejection', {
    reason: reason,
    promise: promise
  });
  process.exit(1);
});

export default server;
