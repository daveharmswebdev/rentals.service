# Swagger/OpenAPI Documentation Guide

## Overview

This project uses Swagger/OpenAPI 3.0 for interactive API documentation. The documentation is automatically generated from JSDoc comments in the route files and a central configuration file.

## Accessing Swagger UI

### Local Development
```
http://localhost:3000/api-docs
```

### Production
```
https://api.gatherhubs.com/api-docs
```

## Features

- **Interactive Interface**: Try out API endpoints directly from the browser
- **Schema Definitions**: Complete request/response models
- **Authentication**: Documents OAuth authentication requirements
- **Examples**: Sample requests and responses for each endpoint
- **Auto-generated**: Documentation stays in sync with code

## Project Structure

### Configuration
- **`src/config/swagger.config.ts`**: Main Swagger configuration
  - OpenAPI 3.0 specification
  - Schema definitions (Home, Address, User, Error)
  - Security schemes (cookie-based session auth)
  - Server configuration

### Route Documentation
JSDoc comments in route files automatically generate endpoint documentation:
- **`src/routes/homes.routes.ts`**: Homes API endpoints
- **`src/routes/address.routes.ts`**: Address CRUD operations
- **`src/routes/auth.routes.ts`**: Authentication endpoints

## Adding Documentation to New Endpoints

### 1. Basic Endpoint Documentation

```typescript
/**
 * @swagger
 * /api/your-endpoint:
 *   get:
 *     summary: Brief description
 *     description: Detailed description of what this endpoint does
 *     tags: [TagName]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Success response
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/YourSchema'
 */
this.router.get('/your-endpoint', handler);
```

### 2. Endpoint with Parameters

```typescript
/**
 * @swagger
 * /api/items/{id}:
 *   get:
 *     summary: Get item by ID
 *     tags: [Items]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The item ID
 *         example: 1
 *     responses:
 *       200:
 *         description: Item found
 *       404:
 *         description: Item not found
 */
```

### 3. POST/PUT with Request Body

```typescript
/**
 * @swagger
 * /api/items:
 *   post:
 *     summary: Create new item
 *     tags: [Items]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - description
 *             properties:
 *               name:
 *                 type: string
 *                 example: 'Item name'
 *               description:
 *                 type: string
 *                 example: 'Item description'
 *     responses:
 *       201:
 *         description: Item created
 */
```

## Adding New Schemas

Edit `src/config/swagger.config.ts` to add new data models:

```typescript
components: {
  schemas: {
    YourNewModel: {
      type: 'object',
      properties: {
        id: {
          type: 'integer',
          description: 'Unique identifier',
          example: 1,
        },
        name: {
          type: 'string',
          description: 'Name field',
          example: 'Example Name',
        },
        // ... more properties
      },
    },
  },
}
```

## Tags

Organize endpoints by functionality:
- **Homes**: Rental property endpoints
- **Addresses**: Address management
- **Authentication**: OAuth and session management

Add new tags in route files:

```typescript
/**
 * @swagger
 * tags:
 *   name: YourTag
 *   description: Description of this group of endpoints
 */
```

## Common Response Codes

- `200` - OK (successful GET, PUT, DELETE)
- `201` - Created (successful POST)
- `400` - Bad Request (invalid input)
- `401` - Unauthorized (authentication required)
- `404` - Not Found (resource doesn't exist)
- `500` - Internal Server Error

## Security Documentation

All protected endpoints use cookie-based session authentication:

```typescript
security:
  - cookieAuth: []
```

This is configured in the main swagger config as:

```typescript
securitySchemes: {
  cookieAuth: {
    type: 'apiKey',
    in: 'cookie',
    name: 'connect.sid',
    description: 'Session cookie authentication',
  },
}
```

## Customization

### Swagger UI Options

In `src/app.ts`, you can customize the Swagger UI:

```typescript
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Rentals Portal API Documentation',
  // Add more options here
}));
```

### Environment-Specific Servers

The server URL adapts based on the environment:

```typescript
servers: [
  {
    url: process.env.API_BASE_URL || 'http://localhost:3000',
    description: process.env.NODE_ENV === 'production' 
      ? 'Production server' 
      : 'Development server',
  },
]
```

## Best Practices

1. **Keep Documentation Updated**: Update JSDoc comments when changing endpoints
2. **Use Examples**: Provide realistic example values
3. **Be Descriptive**: Write clear summaries and descriptions
4. **Document Errors**: Include all possible error responses
5. **Reference Schemas**: Use `$ref` to reference schema definitions
6. **Group Logically**: Use tags to organize related endpoints

## Testing the Documentation

1. Start the server:
   ```bash
   npm run dev
   ```

2. Open Swagger UI:
   ```
   http://localhost:3000/api-docs
   ```

3. Verify:
   - All endpoints are listed
   - Schemas are properly defined
   - Examples are accurate
   - Try out functionality works

## Troubleshooting

### Documentation Not Updating

- Restart the development server (`npm run dev`)
- Check for syntax errors in JSDoc comments
- Ensure route files are included in `apis` array in `swagger.config.ts`

### Schema References Not Working

- Verify schema name matches exactly (case-sensitive)
- Check schema is defined in `components.schemas` section
- Use proper `$ref` syntax: `$ref: '#/components/schemas/SchemaName'`

### Endpoints Not Appearing

- Confirm route file path is in the `apis` array
- Check JSDoc comment syntax is correct
- Ensure the route is actually registered in the Express app

## Resources

- [OpenAPI Specification](https://swagger.io/specification/)
- [Swagger UI Documentation](https://swagger.io/docs/open-source-tools/swagger-ui/)
- [swagger-jsdoc](https://github.com/Surnet/swagger-jsdoc)
- [swagger-ui-express](https://github.com/scottie1984/swagger-ui-express)
