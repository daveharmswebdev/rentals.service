# System Patterns: Rentals Portal Architecture

## Database Configuration
- Database Type: PostgreSQL 17
- Connection Strategy: Direct connection with pg client
- SSL Configuration: Required for GCP SQL instance
- ORM Consideration: Potential use of TypeORM or Prisma (currently using raw pg client)

## Data Model Patterns
### Homes Table
- Primary Key: Auto-incrementing SERIAL
- Constraint: All fields required
- Potential future extensions:
  - Add timestamps (created_at, updated_at)
  - Add soft delete mechanism
  - Consider indexing for performance

## Naming Conventions
- Database: snake_case (`rentals_db`)
- Tables: plural, snake_case (`homes`)
- Columns: snake_case
- TypeScript: camelCase for variables/functions, PascalCase for classes/interfaces
- Files: kebab-case for routes/controllers, camelCase for services

## Containerization Patterns

### Multi-Stage Docker Build
**Pattern**: Separate build and runtime environments
- **Builder Stage**: Contains all build tools and dependencies
  - Full node_modules (including devDependencies)
  - TypeScript compiler
  - Source code compilation
- **Production Stage**: Minimal runtime environment
  - Only production dependencies
  - Compiled JavaScript only
  - No build tools or source code

**Benefits**:
- Smaller final image size (~150-200MB vs 500MB+)
- Improved security (fewer attack vectors)
- Faster deployment and startup times

### Environment Configuration Pattern
**Pattern**: 12-Factor App methodology for configuration
- All configuration via environment variables
- No secrets in code or Docker image
- .env file for local development
- Cloud-native secret management for production (GCP Secret Manager)

### Health Check Pattern
**Pattern**: Built-in container health monitoring
- HTTP endpoint check on root path
- 30-second intervals
- 3-second timeout
- 3 retries before marking unhealthy
- Enables automatic container restart and load balancer integration

## Application Architecture Patterns

### Modular Structure
```
src/
├── app.ts           # Express app configuration
├── index.ts         # Server entry point
├── controllers/     # Request handlers
├── services/        # Business logic
├── routes/          # Route definitions
├── interfaces/      # TypeScript interfaces
└── database/        # Database connection
```

### Separation of Concerns
- **app.ts**: Express configuration, middleware, routes
- **index.ts**: Server startup, port binding
- **controllers**: HTTP request/response handling
- **services**: Business logic, data manipulation
- **database**: Connection management, queries

**Benefits**:
- Easier testing (can test app without starting server)
- Clear responsibility boundaries
- Improved maintainability
