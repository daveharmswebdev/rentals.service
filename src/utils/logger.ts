import winston from 'winston';
import { LoggingWinston } from '@google-cloud/logging-winston';

const isProduction = process.env.NODE_ENV === 'production';
const logLevel = process.env.LOG_LEVEL || (isProduction ? 'info' : 'debug');

// Define log format for local development (human-readable with colors)
const localFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...metadata }) => {
    let msg = `${timestamp} [${level}]: ${message}`;
    
    // Add metadata if present
    if (Object.keys(metadata).length > 0) {
      msg += ` ${JSON.stringify(metadata)}`;
    }
    
    return msg;
  })
);

// Define log format for GCP (structured JSON for Cloud Logging)
const gcpFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Configure transports based on environment
const transports: winston.transport[] = [];

if (isProduction) {
  // Use Google Cloud Logging in production
  const loggingWinston = new LoggingWinston({
    projectId: process.env.GCP_PROJECT_ID || 'properties-portal',
    keyFilename: process.env.GCP_KEY_FILE, // Optional: Only needed if not using Workload Identity
    logName: 'rentals-portal-service',
    resource: {
      type: 'k8s_container',
      labels: {
        project_id: process.env.GCP_PROJECT_ID || 'properties-portal',
        location: process.env.GCP_REGION || 'us-central1',
        cluster_name: process.env.GKE_CLUSTER_NAME || 'gke-cluster',
        namespace_name: process.env.K8S_NAMESPACE || 'development',
        pod_name: process.env.HOSTNAME || 'unknown',
        container_name: 'rentals-portal-service'
      }
    },
    serviceContext: {
      service: 'rentals-portal',
      version: process.env.APP_VERSION || '1.0.0'
    }
  });
  
  transports.push(loggingWinston);
} else {
  // Use console transport for local development
  transports.push(
    new winston.transports.Console({
      stderrLevels: ['error']
    })
  );
}

// Create the logger instance
const logger = winston.createLogger({
  level: logLevel,
  format: isProduction ? gcpFormat : localFormat,
  defaultMeta: {
    service: 'rentals-portal',
    environment: process.env.NODE_ENV || 'development'
  },
  transports
});

// Add file transports for local development (optional)
if (!isProduction) {
  logger.add(
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      )
    })
  );
  
  logger.add(
    new winston.transports.File({
      filename: 'logs/combined.log',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      )
    })
  );
}

// Helper function to map Winston levels to GCP severity
export const mapToGcpSeverity = (level: string): string => {
  const mapping: { [key: string]: string } = {
    error: 'ERROR',
    warn: 'WARNING',
    info: 'INFO',
    http: 'INFO',
    verbose: 'DEBUG',
    debug: 'DEBUG',
    silly: 'DEBUG'
  };
  return mapping[level] || 'DEFAULT';
};

export default logger;
