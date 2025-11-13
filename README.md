# Rentals Portal API

RESTful API for managing rental properties and addresses, secured with Google OAuth 2.0 authentication.

## Tech Stack

- **Runtime**: Node.js + TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL (Google Cloud SQL)
- **Authentication**: Google OAuth 2.0 (Passport.js)
- **Deployment**: Google Kubernetes Engine (GKE)
- **Infrastructure**: Managed Certificate, Ingress, Cloud SQL Proxy

## Features

- ✅ Google OAuth 2.0 authentication
- ✅ Protected REST API endpoints
- ✅ PostgreSQL database with Cloud SQL
- ✅ Structured logging with Winston
- ✅ Health checks and monitoring
- ✅ Docker containerization
- ✅ Kubernetes deployment
- ✅ HTTPS with managed certificates
- ✅ **Interactive API documentation (Swagger/OpenAPI)**

## API Documentation

Interactive API documentation is available via Swagger UI:

**Local Development**: `http://localhost:3000/api-docs`  
**Production**: `https://your-domain.com/api-docs`

The Swagger UI provides:
- Complete API endpoint documentation
- Request/response schemas
- Try-it-out functionality
- Authentication information
- Example requests and responses

## API Endpoints

### Authentication
- `GET /auth/google` - Initiate Google OAuth login
- `GET /auth/google/callback` - OAuth callback handler
- `GET /auth/logout` - Logout user
- `GET /auth/status` - Check authentication status

### Protected Resources (Require Authentication)

#### Homes
- `GET /api/homes` - Get all homes
- `GET /api/homes/:id` - Get home by ID

#### Addresses
- `GET /api/addresses` - Get all addresses
- `GET /api/addresses/:id` - Get address by ID
- `POST /api/addresses` - Create new address
- `PUT /api/addresses/:id` - Update address
- `DELETE /api/addresses/:id` - Delete address

### Health
- `GET /` - Health check endpoint

## Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL
- Google Cloud account
- Google OAuth 2.0 credentials

### Local Development

1. **Clone and install**:
   ```bash
   npm install
   ```

2. **Configure environment**:
   ```bash
   cp .env.example .env
   # Edit .env with your credentials
   ```

3. **Setup Google OAuth**:
   - See [`docs/google-oauth-setup.md`](docs/google-oauth-setup.md)
   - Create OAuth credentials in Google Cloud Console
   - Add `http://localhost:3000/auth/google/callback` to redirect URIs

4. **Run locally**:
   ```bash
   npm run dev
   ```

5. **Test authentication**:
   - Open browser: `http://localhost:3000/auth/google`
   - Login with Google
   - Access protected endpoints

See [`docs/local-development-oauth.md`](docs/local-development-oauth.md) for detailed local setup.

## Deployment

### Production (GKE)

1. **Build and push Docker image**:
   ```bash
   docker build -t us-central1-docker.pkg.dev/properties-portal/docker-repo/rentals-portal:latest .
   docker push us-central1-docker.pkg.dev/properties-portal/docker-repo/rentals-portal:latest
   ```

2. **Create Kubernetes secrets**:
   ```bash
   # Google OAuth credentials
   kubectl create secret generic google-oauth-credentials \
     --from-literal=client-id='YOUR_CLIENT_ID' \
     --from-literal=client-secret='YOUR_CLIENT_SECRET' \
     -n development

   # Session secret
   kubectl create secret generic session-credentials \
     --from-literal=secret="$(openssl rand -base64 32)" \
     -n development
   ```

3. **Deploy to GKE**:
   ```bash
   kubectl apply -f deployment.yaml
   kubectl rollout status deployment/rentals-portal-service -n development
   ```

See [`docs/google-oauth-setup.md`](docs/google-oauth-setup.md) for complete deployment guide.

## Documentation

- **[Google OAuth Setup](docs/google-oauth-setup.md)** - Complete authentication setup guide
- **[Local Development](docs/local-development-oauth.md)** - Development environment setup
- **[HTTPS/Ingress Setup](docs/ingress-https-setup.md)** - Kubernetes Ingress configuration
- **[Cloud SQL Setup](docs/cloud-sql-config.md)** - Database configuration
- **[CI/CD Setup](docs/ci-cd-setup.md)** - Continuous deployment pipeline

## Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Watch mode
npm run test:watch
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `GOOGLE_CLIENT_ID` | OAuth 2.0 Client ID | Yes |
| `GOOGLE_CLIENT_SECRET` | OAuth 2.0 Client Secret | Yes |
| `GOOGLE_CALLBACK_URL` | OAuth callback URL | Yes |
| `SESSION_SECRET` | Session encryption key | Yes |
| `DB_HOST` | PostgreSQL host | Yes |
| `DB_PORT` | PostgreSQL port | Yes |
| `DB_NAME` | Database name | Yes |
| `DB_USER` | Database username | Yes |
| `DB_PASSWORD` | Database password | Yes |
| `NODE_ENV` | Environment (development/production) | No |
| `PORT` | Application port (default: 3000) | No |

## Architecture

```
┌─────────────┐
│   Client    │
└──────┬──────┘
       │ HTTPS
       ▼
┌─────────────────────┐
│  Ingress (GCE)      │
│  api.gatherhubs.com │
│  Managed Cert       │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│  Service (NodePort) │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│  Pod                                │
│  ┌───────────────┐  ┌─────────────┐│
│  │ Rentals API   │  │ Cloud SQL   ││
│  │ (Express +    │──│ Proxy       ││
│  │  Passport)    │  │             ││
│  └───────────────┘  └─────┬───────┘│
└────────────────────────────┼────────┘
                             │
                             ▼
                    ┌────────────────┐
                    │  Cloud SQL     │
                    │  PostgreSQL    │
                    └────────────────┘
```

## Security

- All API endpoints require Google OAuth authentication
- Sessions encrypted with secret key
- HTTPS enforced in production
- Secure cookies (HttpOnly, SameSite)
- SQL injection protection via parameterized queries
- Secrets managed via Kubernetes secrets

## Monitoring

```bash
# View logs
kubectl logs -f deployment/rentals-portal-service -n development

# Check authentication events
kubectl logs -f deployment/rentals-portal-service -n development | grep -i "auth"

# Monitor certificate status
kubectl describe managedcertificate rentals-portal-cert -n development

# Check ingress status
kubectl describe ingress rentals-portal-ingress -n development
```

## Troubleshooting

See [`docs/google-oauth-setup.md#troubleshooting`](docs/google-oauth-setup.md#troubleshooting) for common issues and solutions.

## License

ISC