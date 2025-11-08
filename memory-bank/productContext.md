# Product Context: Rentals Portal

## Project Purpose

A comprehensive property management service designed to handle rental property data with a modern, scalable architecture. The service provides RESTful APIs for managing homes and addresses, with plans to extend to real-time data access via WebSockets.

## Core Value Proposition

**What it does:**
- Manages rental property information (homes and addresses)
- Provides CRUD operations for property data
- Maintains normalized data relationships
- Offers flexible deployment options (Docker, Cloud Run, Kubernetes)

**Problems it solves:**
- Centralized property data management
- Consistent API for property information access
- Scalable architecture for growing property portfolios
- Separation of concerns between property details and locations

**Target Users:**
- Property management companies
- Real estate platforms
- Rental listing services
- Property data aggregators

## Current Implementation Status

### Fully Implemented Features

**1. Address Management API**
- Complete CRUD operations (Create, Read, Update, Delete)
- Search addresses by city
- Input validation and error handling
- RESTful endpoint: `/api/addresses`

**2. Homes Viewing API**
- View all homes with address details
- View individual home by ID
- Denormalized data (combines home + address info)
- RESTful endpoint: `/api/homes`

**3. Database Architecture**
- Normalized schema with foreign key relationships
- PostgreSQL 17 on GCP Cloud SQL
- Connection pooling for performance
- Support for direct SSL and Cloud SQL Proxy connections

**4. Production Infrastructure**
- Docker containerization with multi-stage builds
- Health check monitoring
- Environment-based configuration
- Production-ready deployment

### Partially Implemented Features

**1. Homes Management**
- ✅ Read operations (GET)
- ❌ Create operations (POST)
- ❌ Update operations (PUT)
- ❌ Delete operations (DELETE)

**2. Testing Coverage**
- ✅ Unit test infrastructure (Jest)
- ✅ One service test (homes.service.spec.ts)
- ❌ Controller tests
- ❌ Repository tests
- ❌ Integration tests

### Not Yet Implemented

**1. WebSocket Support**
- Original design called for WebSockets for read operations
- Currently all operations use REST
- Future enhancement for real-time data

**2. Authentication & Authorization**
- No user authentication
- No role-based access control
- Public API endpoints

**3. Advanced Features**
- Caching layer (Redis)
- Rate limiting
- API documentation (Swagger/OpenAPI)
- Logging infrastructure (Winston/Pino)
- Database migrations
- CI/CD pipeline

## User Experience Goals

### API Consumers

**Ease of Use:**
- RESTful conventions for predictable endpoints
- Consistent error responses with clear messages
- JSON request/response format
- Proper HTTP status codes

**Reliability:**
- Connection pooling for performance
- Graceful error handling
- Health check endpoints for monitoring
- Containerized for consistent deployment

**Data Quality:**
- Input validation at controller layer
- Foreign key constraints in database
- Normalized data to prevent duplication
- Type safety via TypeScript interfaces

## System Capabilities

### Current Capabilities

**Data Operations:**
- Store and retrieve property information
- Maintain address-home relationships
- Search properties by various criteria
- Update address information independently

**Deployment Options:**
- Docker containers
- GCP Cloud Run (serverless)
- Google Kubernetes Engine
- Traditional VMs with Docker

**Development Experience:**
- TypeScript for type safety
- Hot reload with ts-node
- Comprehensive test framework
- Modular architecture for maintainability

### Planned Capabilities

**Enhanced Data Access:**
- Real-time updates via WebSockets
- Advanced search and filtering
- Bulk operations
- Data export capabilities

**Security & Compliance:**
- User authentication (JWT)
- Role-based access control
- Audit logging
- Data encryption at rest

**Performance & Scale:**
- Redis caching layer
- Database query optimization
- Horizontal scaling support
- Load balancing

**Developer Experience:**
- API documentation (Swagger)
- SDK generation
- Comprehensive test coverage
- CI/CD automation

## Technical Constraints

### Current Constraints

**Database:**
- PostgreSQL 17 on GCP Cloud SQL
- Single database instance
- Manual schema management
- No migration system

**Architecture:**
- Monolithic service (not microservices)
- Synchronous operations only
- No message queue
- No event-driven architecture

**Infrastructure:**
- GCP-specific deployment
- Manual deployment process
- No automated scaling
- No multi-region support

### Design Decisions

**Why REST for writes, WebSockets for reads?**
- REST: Standard, cacheable, stateless for mutations
- WebSockets: Real-time updates, efficient for frequent reads
- Current: All REST (WebSockets planned)

**Why normalized database?**
- Eliminates data duplication
- Single source of truth for addresses
- Easier to maintain data consistency
- Supports future features (multiple homes per address)

**Why layered architecture?**
- Clear separation of concerns
- Easier testing and maintenance
- Flexible to swap implementations
- Industry best practice

**Why TypeScript?**
- Type safety reduces runtime errors
- Better IDE support and autocomplete
- Self-documenting code
- Easier refactoring

## Future Vision

### Short-term (Next Sprint)
- Complete CRUD operations for homes
- Implement comprehensive test coverage
- Add input validation middleware
- Create API documentation

### Medium-term (Next Quarter)
- Implement WebSocket support for reads
- Add authentication and authorization
- Set up CI/CD pipeline
- Implement caching layer
- Add database migrations

### Long-term (Next Year)
- Multi-tenant support
- Advanced search capabilities
- Analytics and reporting
- Mobile SDK
- Third-party integrations
- Multi-region deployment
