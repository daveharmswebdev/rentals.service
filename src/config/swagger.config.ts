import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Rentals Portal API',
      version: '1.0.0',
      description: 'API documentation for the Rentals Portal application',
      contact: {
        name: 'API Support',
      },
    },
    servers: [
      {
        url: process.env.API_BASE_URL || 'http://localhost:3000',
        description: process.env.NODE_ENV === 'production' ? 'Production server' : 'Development server',
      },
    ],
    components: {
      schemas: {
        Home: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              description: 'Unique identifier for the home',
              example: 1,
            },
            name: {
              type: 'string',
              description: 'Name of the home',
              example: 'Cozy Beach House',
            },
            city: {
              type: 'string',
              description: 'City where the home is located',
              example: 'Santa Monica',
            },
            state: {
              type: 'string',
              description: 'State where the home is located',
              example: 'CA',
            },
            photo: {
              type: 'string',
              description: 'URL to the home photo',
              example: 'https://example.com/photo.jpg',
            },
            availableunits: {
              type: 'integer',
              description: 'Number of available units',
              example: 5,
            },
            wifi: {
              type: 'boolean',
              description: 'Whether WiFi is available',
              example: true,
            },
            laundry: {
              type: 'boolean',
              description: 'Whether laundry is available',
              example: true,
            },
          },
        },
        Address: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              description: 'Unique identifier for the address',
              example: 1,
            },
            street: {
              type: 'string',
              description: 'Street address',
              example: '123 Main St',
            },
            city: {
              type: 'string',
              description: 'City',
              example: 'San Francisco',
            },
            state: {
              type: 'string',
              description: 'State',
              example: 'CA',
            },
            zip: {
              type: 'string',
              description: 'ZIP code',
              example: '94102',
            },
          },
        },
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Unique identifier for the user',
              example: '12345',
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'User email address',
              example: 'user@example.com',
            },
            displayName: {
              type: 'string',
              description: 'User display name',
              example: 'John Doe',
            },
          },
        },
        Receipt: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              description: 'Unique identifier for the receipt',
              example: 1,
            },
            home_id: {
              type: 'integer',
              description: 'ID of the home this receipt belongs to',
              example: 1,
            },
            total: {
              type: 'number',
              format: 'float',
              description: 'Total amount on the receipt',
              example: 350.00,
            },
            type: {
              type: 'string',
              enum: ['service', 'store'],
              description: 'Type of receipt: service for services, store for goods',
              example: 'service',
            },
            vendor_name: {
              type: 'string',
              description: 'Name of the vendor or service provider',
              example: 'ABC HVAC Services',
            },
            paid_date: {
              type: 'string',
              format: 'date',
              description: 'Date the receipt was paid',
              example: '2025-01-15',
            },
            description: {
              type: 'string',
              description: 'Optional description of the purchase or service',
              example: 'Annual AC maintenance and filter replacement',
            },
            category: {
              type: 'string',
              description: 'Optional category for organizing receipts',
              example: 'HVAC',
            },
            receipt_url: {
              type: 'string',
              format: 'uri',
              description: 'Optional URL to digital receipt image or PDF',
              example: 'https://example.com/receipts/123.pdf',
            },
            created_at: {
              type: 'string',
              format: 'date-time',
              description: 'Timestamp when the receipt was created',
              example: '2025-01-15T10:30:00Z',
            },
            updated_at: {
              type: 'string',
              format: 'date-time',
              description: 'Timestamp when the receipt was last updated',
              example: '2025-01-15T10:30:00Z',
            },
            created_by: {
              type: 'string',
              description: 'User who created the receipt',
              example: 'admin@example.com',
            },
            updated_by: {
              type: 'string',
              description: 'User who last updated the receipt',
              example: 'admin@example.com',
            },
          },
        },
        Error: {
          type: 'object',
          properties: {
            message: {
              type: 'string',
              description: 'Error message',
              example: 'Internal server error',
            },
            error: {
              type: 'string',
              description: 'Error details',
              example: 'Database connection failed',
            },
          },
        },
      },
      securitySchemes: {
        cookieAuth: {
          type: 'apiKey',
          in: 'cookie',
          name: 'connect.sid',
          description: 'Session cookie authentication',
        },
      },
    },
    security: [
      {
        cookieAuth: [],
      },
    ],
  },
  // Path to the API routes
  apis: [
    './src/routes/*.ts',
    './src/controllers/*.ts',
  ],
};

export const swaggerSpec = swaggerJsdoc(options);
