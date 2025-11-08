# Technical Context: Rentals Portal

## Technology Stack Overview

### Core Technologies

**Runtime & Language**
- **Node.js**: v18 (LTS)
- **TypeScript**: v5.9.3
  - Strict type checking enabled
  - ES2020 target
  - Module resolution: Node
  - Source maps for debugging

**Web Framework**
- **Express.js**: v5.1.0
  - RESTful API design
  - JSON middleware for request parsing
  - Class-based route handlers
  - Modular router configuration

**Database**
- **PostgreSQL**: v17
- **pg (node-postgres)**: v8.16.3
  - Native PostgreSQL client
  - Connection pooling support
  - Parameterized queries for security
  - SSL/TLS support

**Cloud Infrastructure**
- **Google Cloud Platform (GCP)**
  - Cloud SQL for PostgreSQL
  - Cloud Run (deployment target)
  - Secret Manager (for credentials)
  - Container Registry (for images)

**Containerization**
- **Docker**
  - Multi-stage builds
  - Alpine Linux base (node:18-alpine)
  - Health check integration
  - Environment variable configuration

## Development Environment

### Local Development Setup

**Required Tools:**
- Node.js 18+
- npm (comes with Node.js)
- Docker Desktop (for containerization)
- PostgreSQL client (psql) for database access
- Git for version control
- VS Code (recommended IDE)

**Development Scripts:**
```json
{
  "dev": "ts-node src/index.ts",      // Hot reload development
  "build": "tsc",                      // Compile TypeScript
  "start": "node dist/index.js",       // Run production build
  "test": "jest",                      // Run tests
  "test:watch": "jest --watch",        // Watch mode
  "test:coverage": "jest --coverage"   // Coverage report
}
```

**Environment Variables (.env):**
```
DB_HOST=34.133.251.99 or 127.0.0.1
DB_PORT=5432
DB_NAME=rentals_db
DB_USER=postgres
DB_PASSWORD=<secret>
PORT=3000
```

### Testing Infrastructure

**Jest Configuration:**
- **Test Framework**: Jest v30.2.0
- **TypeScript Support**: ts-jest v29.4.5
- **Test Environment**: Node.js
- **Coverage**: Enabled with path ignoring for node_modules and dist
- **File Patterns**: `*.spec.ts` and `*.test.ts`

**Current Test Coverage:**
- Services: Partial (homes.service.spec.ts)
- Controllers: 0%
- Repositories: 0%
- Integration: 0%

**Testing Patterns:**
- Mock-based unit tests
- Jest mocks for database connections
- Isolated service testing
- No database dependency in unit tests

## Architecture Decisions

### API Design Philosophy

**Current Implementation:**
- **All Operations**: RESTful HTTP/JSON
- **Write Operations**: POST, PUT, DELETE
- **Read Operations**: GET

**Original Design Intent:**
- **Write Operations**: Express.js REST endpoints
- **Read Operations**: WebSockets for real-time updates
- **Status**: WebSockets not yet implemented

**Why REST Currently:**
- Simpler to implement and test
- Standard HTTP caching
- Stateless and scalable
- Well-understood by developers
- Easy to document and consume

**Future WebSocket Benefits:**
- Real-time property updates
- Reduced polling overhead
- Bidirectional communication
- Lower latency for reads

### Database Connection Strategy

**Dual-Mode Connection Support:**

```typescript
// Automatic detection
const isUsingProxy = DB_HOST === '127.0.0.1' || DB_HOST === 'localhost';

// Configuration
const config = {
  host: DB_HOST,
  port: DB_PORT,
  user: DB_USER,
  password: DB_PASSWORD,
  database: DB_NAME,
  // SSL only for direct connections
  ...(isUsingProxy ? {} : {
    ssl: { rejectUnauthorized: false }
  })
};
```

**Connection Modes:**

1. **Direct Connection (Production)**
   - Connects directly to GCP Cloud SQL IP
   - Requires SSL/TLS encryption
   - IP must be whitelisted in GCP
   - Used in production deployments

2. **Cloud SQL Proxy (Development)**
   - Proxy runs on localhost:5432
   - Handles encryption automatically
   - No SSL configuration needed
   - Easier local development

**Connection Pooling:**
- **Client**: Single connection for app initialization
- **Pool**: Connection pool for all requests
- **Benefits**: Reusable connections, better performance
- **Pattern**: Acquire → Use → Release

### TypeScript Configuration

**Key Settings:**
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "moduleResolution": "node"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "**/*.spec.ts"]
}
```

**Benefits:**
- Strict type checking catches errors early
- ES2020 features (optional chaining, nullish coalescing)
- CommonJS for Node.js compatibility
- Separate source and build directories

## Containerization Strategy

### Docker Multi-Stage Build

**Stage 1: Builder**
```dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
```

**Stage 2: Production**
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY --from=builder /app/dist ./dist
EXPOSE 3000
CMD ["node", "dist/index.js"]
```

**Benefits:**
- Small image size (~150-200MB)
- No source code in production image
- No dev dependencies in production
- Faster deployment and startup
- Better security posture

### Health Check Configuration

```dockerfile
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/', (r) => { process.exit(r.statusCode === 200 ? 0 : 1); })"
```

**Purpose:**
- Container orchestration (Kubernetes, Cloud Run)
- Automatic restart on failure
- Load balancer integration
- Monitoring and alerting

## Dependencies Deep Dive

### Production Dependencies

**express (v5.1.0)**
- Web application framework
- Middleware support
- Routing capabilities
- JSON parsing built-in

**pg (v8.16.3)**
- PostgreSQL client for Node.js
- Connection pooling
- Prepared statements
- SSL/TLS support
- Promise-based API

**dotenv (v17.2.3)**
- Environment variable management
- .env file parsing
- Zero dependencies
- Development convenience

### Development Dependencies

**TypeScript Ecosystem:**
- `typescript`: Compiler and type checker
- `ts-node`: TypeScript execution for development
- `@types/*`: Type definitions for JavaScript libraries

**Testing Ecosystem:**
- `jest`: Test framework and runner
- `ts-jest`: TypeScript preprocessor for Jest
- `@types/jest`: Jest type definitions

**Why These Choices:**
- Minimal dependencies for security
- Well-maintained packages
- Strong community support
- TypeScript-first approach

## Deployment Architecture

### Deployment Options

**1. GCP Cloud Run (Recommended)**
- Serverless container platform
- Automatic scaling (0 to N)
- Pay per use
- Built-in load balancing
- HTTPS out of the box
- Easy CI/CD integration

**2. Google Kubernetes Engine (GKE)**
- Full container orchestration
- Manual scaling control
- Advanced networking
- Multi-container pods
- Service mesh support
- Higher operational complexity

**3. Docker Compose (Local/Dev)**
- Multi-container development
- Service dependencies
- Volume management
- Network isolation
- Quick local setup

**4. Compute Engine VMs**
- Traditional VM deployment
- Docker on Ubuntu/Debian
- Manual scaling
- Full control
- Higher maintenance

### CI/CD Considerations

**Potential Pipeline (Not Yet Implemented):**
1. **Source**: GitHub repository
2. **Build**: GitHub Actions or Cloud Build
3. **Test**: Run Jest tests
4. **Build Image**: Docker build
5. **Push**: Container Registry
6. **Deploy**: Cloud Run or GKE
7. **Verify**: Health checks

**Required Setup:**
- GitHub Actions workflow
- GCP service account
- Container Registry permissions
- Cloud Run deployment config
- Environment variable management

## Performance Considerations

### Current Optimizations

**Connection Pooling:**
- Reusable database connections
- Reduced connection overhead
- Better resource utilization
- Configurable pool size

**Docker Image:**
- Multi-stage build reduces size
- Alpine Linux base (minimal)
- Only production dependencies
- Faster pull and startup

**TypeScript Compilation:**
- Compiled to JavaScript
- No runtime compilation overhead
- Optimized for Node.js

### Future Optimizations

**Caching Layer:**
- Redis for frequently accessed data
- Reduce database load
- Faster response times
- Session management

**Database Optimization:**
- Indexes on frequently queried columns
- Query optimization
- Connection pool tuning
- Read replicas for scaling

**Application Performance:**
- Response compression (gzip)
- Request rate limiting
- Query result pagination
- Lazy loading strategies

## Security Considerations

### Current Security Measures

**Database:**
- Parameterized queries (SQL injection prevention)
- SSL/TLS encryption in transit
- GCP Cloud SQL security features
- No credentials in code

**Application:**
- Environment variable configuration
- No secrets in Docker images
- TypeScript type safety
- Input validation in controllers

### Missing Security Features

**Authentication & Authorization:**
- No user authentication
- No API keys
- No rate limiting
- Public endpoints

**Recommended Additions:**
- JWT authentication
- Role-based access control (RBAC)
- API key management
- Request rate limiting
- Input sanitization middleware
- Helmet.js for HTTP headers
- CORS configuration

## Monitoring & Observability

### Current Capabilities

**Health Checks:**
- Docker health check endpoint
- Basic availability monitoring
- Container restart on failure

**Logging:**
- Console.log for errors
- Basic error messages
- No structured logging

### Recommended Additions

**Logging:**
- Winston or Pino for structured logs
- Log levels (debug, info, warn, error)
- Request/response logging
- Error stack traces
- Correlation IDs

**Monitoring:**
- GCP Cloud Monitoring
- Application metrics
- Database performance metrics
- Error rate tracking
- Response time monitoring

**Tracing:**
- OpenTelemetry integration
- Distributed tracing
- Request flow visualization
- Performance bottleneck identification

## Future Technical Roadmap

### Short-term (Next Sprint)
- Add Winston/Pino logging
- Implement input validation middleware
- Create Swagger/OpenAPI documentation
- Add more comprehensive tests
- Set up pre-commit hooks (Husky)

### Medium-term (Next Quarter)
- Implement WebSocket support
- Add Redis caching layer
- Set up CI/CD pipeline
- Implement authentication (JWT)
- Add database migration system (Flyway/Liquibase)
- Configure monitoring and alerting

### Long-term (Next Year)
- Microservices architecture
- Event-driven architecture (Pub/Sub)
- GraphQL API layer
- Multi-region deployment
- Advanced caching strategies
- Machine learning integration
