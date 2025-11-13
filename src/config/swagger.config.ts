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
