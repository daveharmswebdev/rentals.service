# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Local Development
```bash
npm run dev          # Run with ts-node (development mode with hot reload)
npm start            # Run production build from dist/
npm run build        # Compile TypeScript to JavaScript (outputs to dist/)
```

### Testing
```bash
npm test                # Run Jest test suite
npm run test:watch      # Run tests in watch mode
npm run test:coverage   # Run tests with coverage report
```

### Docker & Deployment
```bash
# Build and push Docker image
docker build -t us-central1-docker.pkg.dev/properties-portal/docker-repo/rentals-portal:latest .
docker push us-central1-docker.pkg.dev/properties-portal/docker-repo/rentals-portal:latest

# Deploy to GKE
kubectl apply -f deployment.yaml
kubectl rollout status deployment/rentals-portal-service -n development

# View logs
kubectl logs -f deployment/rentals-portal-service -n development
```

## Architecture Overview

### Tech Stack
- **Runtime**: Node.js 18+ with TypeScript
- **Framework**: Express.js 5.x
- **Database**: PostgreSQL (Google Cloud SQL)
- **Session Store**: Redis (Google Cloud Memorystore)
- **Authentication**: Google OAuth 2.0 via Passport.js
- **Documentation**: Swagger/OpenAPI 3.0
- **Logging**: Winston with Google Cloud Logging integration
- **Deployment**: Google Kubernetes Engine (GKE)

### Layered Architecture

The codebase follows a clean layered architecture pattern:

```
Routes → Controllers → Services → Repositories → Database
```

1. **Routes** (`src/routes/`): Define API endpoints with Swagger JSDoc annotations, apply authentication middleware
2. **Controllers** (`src/controllers/`): Handle HTTP request/response, call services
3. **Services** (`src/services/`): Contain business logic
4. **Repositories** (`src/repositories/`): Database access layer using connection pooling
5. **Base Repository** (`src/repositories/base.repository.ts`): Generic CRUD operations with parameterized queries for SQL injection protection

### Key Architectural Patterns

**Repository Pattern**: All database entities extend `BaseRepository<T>` which provides:
- Type-safe CRUD operations
- SQL injection protection via parameterized queries
- Connection pooling via PostgreSQL Pool
- Generic interface (`IRepository<T>`)

**Middleware Pipeline**:
1. Correlation ID (tracking requests across services)
2. Response time tracking
3. HTTP request logging (Winston)
4. JSON parsing
5. Session management (Redis-backed)
6. Passport authentication
7. Route handlers
8. HTTP error logging

### Authentication Flow

**Google OAuth 2.0 with Session Persistence**:
1. User accesses protected endpoint → redirected to `/auth/google`
2. Google OAuth flow initiated via Passport.js
3. Callback at `/auth/google/callback` receives user profile
4. User serialized to Redis-backed session (via connect-redis)
5. Session cookie set (HttpOnly, SameSite=lax, secure in production)
6. Protected routes use `ensureAuthenticated` middleware

**Important**:
- Sessions are stored in Redis (not in-memory) for horizontal scalability
- Cloud SQL Proxy sidecar handles database connections in GKE
- In production, `trust proxy` is enabled for secure cookies behind load balancer

### Database Connection Strategy

**Cloud SQL Proxy vs Direct Connection**:
- **Local Dev**: Direct connection with SSL (`DB_HOST=<cloud-sql-ip>`)
- **GKE Production**: Cloud SQL Proxy sidecar on `127.0.0.1:5432` (no SSL needed)
- Auto-detection logic in `src/database/postgres.ts` based on `DB_HOST` value
- Uses both `Client` (singleton) and `Pool` (connection pooling)

### Logging & Observability

**Winston Logger** (`src/utils/logger.ts`):
- Structured JSON logging
- Google Cloud Logging integration in production
- Correlation IDs for request tracing (`src/utils/correlation-id.ts`)
- Response time tracking middleware
- Logs authentication events, database operations, errors

### API Documentation

**Swagger/OpenAPI 3.0** (`src/config/swagger.config.ts`):
- Interactive UI at `/api-docs`
- JSDoc annotations in route files generate OpenAPI spec
- Schemas defined in swagger config for all entities
- Cookie-based authentication documented

## Environment Configuration

Required environment variables (see `.env.example`):
- **Database**: `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`
- **OAuth**: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_CALLBACK_URL`
- **Session**: `SESSION_SECRET` (generate with `openssl rand -base64 32`)
- **Redis**: `REDIS_HOST`, `REDIS_PORT` (for session storage)

**Environment-Specific Behavior**:
- `NODE_ENV=production` enables: trust proxy, secure cookies, Cloud Logging
- `NODE_ENV=development` allows missing auth config (for testing)

## Project Structure Conventions

```
src/
├── config/           # Configuration files (auth, passport, swagger)
├── controllers/      # HTTP request handlers
├── database/         # Database connection setup
├── interfaces/       # TypeScript interfaces for entities
├── middleware/       # Express middleware (auth, logging)
├── repositories/     # Data access layer (extends BaseRepository)
├── routes/           # API route definitions with Swagger annotations
├── services/         # Business logic layer
├── types/            # TypeScript type augmentations
└── utils/            # Utilities (logger, correlation-id)
```

## Kubernetes Deployment Architecture

**Pod Structure**:
- Main container: Node.js application (port 3000)
- Sidecar: Cloud SQL Proxy (localhost:5432)
- Secrets mounted as environment variables

**Ingress Setup**:
- GCE Ingress with managed certificate (HTTPS)
- Domain: `api.gatherhubs.com`
- NodePort service routes traffic to pods
- Health checks on `/` endpoint

## Important Implementation Details

**Adding New Entities**:
1. Create interface in `src/interfaces/<entity>.interface.ts`
2. Create repository extending `BaseRepository<T>` in `src/repositories/`
3. Create service in `src/services/` with business logic
4. Create controller in `src/controllers/`
5. Create routes in `src/routes/` with Swagger JSDoc annotations
6. Register routes in `src/app.ts`
7. Add schema to `src/config/swagger.config.ts`

**Authentication Middleware**:
- Use `ensureAuthenticated` for protected routes
- Use `optionalAuthentication` for routes that work with/without auth
- Access user via `req.user` (typed in `src/types/express.d.ts`)

**Testing**:
- Jest with ts-jest preset
- Test files: `*.spec.ts` or `*.test.ts`
- Example: `src/services/homes.service.spec.ts`

## Known Production Setup

- **GCP Project**: `properties-portal`
- **GKE Cluster**: `rental-portals-service-cluster` (us-central1)
- **Namespace**: `development`
- **Cloud SQL Instance**: `properties-portal:us-central1:pp-dev`
- **Redis Instance**: `10.45.176.139:6379` (Cloud Memorystore)
- **Domain**: `api.gatherhubs.com`
- **Docker Registry**: `us-central1-docker.pkg.dev/properties-portal/docker-repo`
