# System Patterns: Rentals Portal Architecture

## Layered Architecture Pattern

The application follows a strict layered architecture with clear separation of concerns:

```
┌─────────────────────────────────────┐
│         Routes Layer                │  Route definitions & HTTP routing
│  (homes.routes.ts, address.routes) │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│       Controllers Layer             │  Request/Response handling
│  (homes.controller, address.ctrl)   │  Input validation, HTTP status codes
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│        Services Layer               │  Business logic
│  (homes.service, address.service)   │  Data transformation
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│      Repositories Layer             │  Data access abstraction
│  (base.repository, address.repo)    │  SQL query construction
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│       Database Layer                │  Connection management
│      (postgres.ts, Pool)            │  Connection pooling
└─────────────────────────────────────┘
```

### Layer Responsibilities

**Routes Layer**
- Define HTTP endpoints
- Bind controller methods to routes
- Encapsulate router configuration
- Pattern: Class-based with `getRouter()` method

**Controllers Layer**
- Handle HTTP request/response cycle
- Parse and validate request parameters
- Call appropriate service methods
- Format responses with proper status codes
- Error handling and user-facing error messages

**Services Layer**
- Implement business logic
- Coordinate between repositories
- Handle data transformation
- Manage transactions (future)
- Error handling with technical details

**Repositories Layer**
- Abstract database operations
- Construct SQL queries
- Manage database connections
- Provide type-safe data access
- Handle connection pooling

## Repository Pattern Implementation

### Generic Base Repository

```typescript
BaseRepository<T> implements IRepository<T>
├── getAll(orderBy?, direction?)
├── getById(id)
├── create(data)
├── update(id, data)
└── delete(id)
```

**Key Features:**
- Generic type parameter for type safety
- Parameterized queries for SQL injection protection
- Automatic connection management (acquire/release)
- Column validation for ORDER BY clauses
- RETURNING clause for immediate data retrieval

**Design Benefits:**
- DRY principle: Write once, use for all entities
- Type safety: TypeScript generics ensure correct types
- Security: Parameterized queries prevent SQL injection
- Consistency: All entities have same base operations
- Extensibility: Easy to add entity-specific methods

### Entity-Specific Repositories

```typescript
AddressRepository extends BaseRepository<Address>
└── findByCity(city: string): Promise<Address[]>
```

**Pattern:**
1. Extend BaseRepository with entity type
2. Pass table name and columns to super()
3. Add entity-specific query methods
4. Maintain same connection management pattern

## Database Connection Patterns

### Dual Connection Mode Support

```typescript
const isUsingProxy = DB_HOST === '127.0.0.1' || DB_HOST === 'localhost';

Config = {
  ...baseConfig,
  ...(isUsingProxy ? {} : { ssl: { rejectUnauthorized: false } })
}
```

**Modes:**
1. **Direct Connection**: SSL enabled for GCP SQL
2. **Cloud SQL Proxy**: No SSL (proxy handles encryption)

**Benefits:**
- Flexible deployment options
- Local development with proxy
- Production with direct SSL
- No code changes needed

### Connection Pooling Strategy

**Two Connection Objects:**
1. **Client**: Single connection for app initialization
   - Used in `connectToDatabase()` for startup verification
   - Closed on graceful shutdown

2. **Pool**: Connection pool for request handling
   - Used by all repositories and services
   - Automatic connection management
   - Reusable connections for performance

**Pattern:**
```typescript
const client = await pool.connect();
try {
  // Execute queries
} finally {
  client.release(); // Always release
}
```

## Data Model Patterns

### Normalized Database Schema

```
addresses (1) ──────< (N) homes
    │                      │
    ├─ id (PK)            ├─ id (PK)
    ├─ street_address     ├─ address_id (FK)
    ├─ city               ├─ square_feet
    ├─ state              ├─ bedrooms
    ├─ zip_code           ├─ fullbath
    └─ country            ├─ halfbath
                          └─ garage_spaces
```

**Normalization Benefits:**
- Eliminates data duplication
- Single source of truth for addresses
- Easier address updates
- Supports multiple homes per address (future)

### Data Transformation Pattern

**Database → API Transformation:**
```sql
SELECT 
  h.square_feet as "squareFeet",  -- snake_case → camelCase
  a.street_address as "streetAddress"
FROM homes h
JOIN addresses a ON h.address_id = a.id
```

**Transformation Locations:**
1. **In SQL Queries**: Column aliases (HomesService)
2. **In Repository**: Return type mapping (future)
3. **In Service**: Manual transformation (future)

**Current Inconsistency:**
- Home interface: camelCase (API-focused)
- Address interface: snake_case (DB-focused)
- Recommendation: Standardize on camelCase for all interfaces

## Error Handling Patterns

### Multi-Layer Error Handling

**Repository Layer:**
```typescript
try {
  // Database operation
} finally {
  client.release(); // Always cleanup
}
```

**Service Layer:**
```typescript
try {
  return await repository.method();
} catch (error) {
  console.error('Technical details:', error);
  throw new Error('User-friendly message');
}
```

**Controller Layer:**
```typescript
try {
  const result = await service.method();
  res.json(result);
} catch (error) {
  res.status(500).json({
    message: 'User message',
    error: error.message
  });
}
```

**Pattern Benefits:**
- Technical errors logged at service layer
- User-friendly errors at controller layer
- Proper HTTP status codes
- Consistent error response format

## Naming Conventions

### Database Layer
- Database: `snake_case` (`rentals_db`)
- Tables: plural, `snake_case` (`homes`, `addresses`)
- Columns: `snake_case` (`street_address`, `zip_code`)
- Foreign Keys: `{table}_id` (`address_id`)

### TypeScript Layer
- Classes: `PascalCase` (`HomesController`, `AddressService`)
- Interfaces: `PascalCase` (`Home`, `Address`)
- Variables/Functions: `camelCase` (`getAllHomes`, `streetAddress`)
- Files: `kebab-case` (`homes.controller.ts`, `address.routes.ts`)
- Constants: `UPPER_SNAKE_CASE` (`PORT`, `DB_HOST`)

### API Layer
- Endpoints: `kebab-case` (`/api/homes`, `/api/addresses`)
- JSON Properties: `camelCase` (`streetAddress`, `squareFeet`)
- HTTP Methods: Standard REST verbs (GET, POST, PUT, DELETE)

## Testing Patterns

### Unit Testing with Mocks

**Pattern:**
```typescript
jest.mock('../database/postgres');

const mockClient = {
  query: jest.fn(),
  release: jest.fn()
};

const mockPool = {
  connect: jest.fn().mockResolvedValue(mockClient)
};
```

**Benefits:**
- Isolated unit tests
- No database dependency
- Fast test execution
- Predictable test data

**Current Coverage:**
- Services: Partial (homes.service.spec.ts only)
- Controllers: None
- Repositories: None
- Integration: None

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
├── repositories/    # Data access layer
├── interfaces/      # TypeScript interfaces
└── database/        # Connection management
```

### Separation of Concerns
- **app.ts**: Express configuration, middleware, routes
- **index.ts**: Server startup, port binding
- **controllers**: HTTP request/response handling
- **services**: Business logic, data manipulation
- **repositories**: Database abstraction
- **database**: Connection management, pooling

**Benefits**:
- Easier testing (can test app without starting server)
- Clear responsibility boundaries
- Improved maintainability
- Better code organization

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
