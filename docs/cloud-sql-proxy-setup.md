# Cloud SQL Proxy Setup Guide

## Overview

This application uses Google Cloud SQL Proxy to securely connect to the PostgreSQL database both locally and in deployment. The proxy handles authentication and encryption, eliminating the need for SSL configuration in the application code.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Local Development                         │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐         ┌──────────────┐                  │
│  │              │         │              │                  │
│  │  Node.js App │────────▶│ Cloud SQL    │                  │
│  │              │         │ Proxy        │                  │
│  │ (port 3000)  │         │ (127.0.0.1:  │                  │
│  │              │         │  5432)       │                  │
│  └──────────────┘         └──────┬───────┘                  │
│                                   │                          │
│                                   │ Encrypted                │
│                                   │ Connection               │
└───────────────────────────────────┼──────────────────────────┘
                                    │
                                    ▼
                        ┌───────────────────────┐
                        │  GCP Cloud SQL        │
                        │  PostgreSQL Instance  │
                        │  pp-dev               │
                        └───────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    GKE Deployment                            │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌────────────────────────────────────────────────────┐     │
│  │                    Pod                              │     │
│  │                                                     │     │
│  │  ┌──────────────┐         ┌──────────────┐        │     │
│  │  │              │         │              │        │     │
│  │  │  Node.js App │────────▶│ Cloud SQL    │        │     │
│  │  │  Container   │         │ Proxy        │        │     │
│  │  │              │         │ Sidecar      │        │     │
│  │  │ (port 3000)  │         │ (127.0.0.1:  │        │     │
│  │  │              │         │  5432)       │        │     │
│  │  └──────────────┘         └──────┬───────┘        │     │
│  │                                   │                │     │
│  └───────────────────────────────────┼────────────────┘     │
│                                      │                       │
│                                      │ Encrypted             │
│                                      │ Connection            │
└──────────────────────────────────────┼───────────────────────┘
                                       │
                                       ▼
                           ┌───────────────────────┐
                           │  GCP Cloud SQL        │
                           │  PostgreSQL Instance  │
                           │  pp-dev               │
                           └───────────────────────┘
```

## Local Development Setup

### Prerequisites

1. **Install Cloud SQL Proxy**
   ```bash
   # macOS (using Homebrew)
   brew install cloud-sql-proxy

   # Or download directly
   curl -o cloud-sql-proxy https://storage.googleapis.com/cloud-sql-connectors/cloud-sql-proxy/v2.7.0/cloud-sql-proxy.darwin.amd64
   chmod +x cloud-sql-proxy
   ```

2. **Authenticate with GCP**
   ```bash
   gcloud auth application-default login
   ```

### Running the Application Locally

1. **Start the Cloud SQL Proxy** (in a separate terminal)
   ```bash
   cloud-sql-proxy properties-portal:us-central1:pp-dev
   ```

   You should see output like:
   ```
   2025/11/06 06:16:41 Authorizing with Application Default Credentials
   2025/11/06 06:16:42 [properties-portal:us-central1:pp-dev] Listening on 127.0.0.1:5432
   2025/11/06 06:16:42 The proxy has started successfully and is ready for new connections!
   ```

2. **Start the Application**
   ```bash
   npm run dev
   ```

   The application will automatically detect it's using the proxy and connect without SSL.

### Environment Configuration

Your `.env` file should be configured for proxy usage:

```env
# Database Configuration for Cloud SQL Proxy
DB_HOST=127.0.0.1
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_password
DB_NAME=rentals_db
INSTANCE_CONNECTION_NAME=properties-portal:us-central1:pp-dev
```

## Deployment Configuration

### Kubernetes/GKE Deployment

The `deployment.yaml` includes a Cloud SQL Proxy sidecar container that runs alongside your application:

```yaml
# Cloud SQL Proxy Sidecar
- name: cloud-sql-proxy
  image: gcr.io/cloud-sql-connectors/cloud-sql-proxy:2.7.0
  command:
    - "/cloud-sql-proxy"
    - "--port=5432"
    - "properties-portal:us-central1:pp-dev"
  securityContext:
    runAsNonRoot: true
```

The application container connects to `127.0.0.1:5432` (the sidecar):

```yaml
env:
- name: DB_HOST
  value: "127.0.0.1"
- name: DB_PORT
  value: "5432"
- name: PGSSLMODE
  value: "disable"
```

## How It Works

### Connection Detection

The application automatically detects whether it's using the Cloud SQL Proxy:

```typescript
// In src/database/postgres.ts
const isUsingProxy = process.env.DB_HOST === '127.0.0.1' || 
                     process.env.DB_HOST === 'localhost';
```

### SSL Configuration

- **With Proxy** (`DB_HOST=127.0.0.1`): No SSL - proxy handles encryption
- **Direct Connection** (`DB_HOST=<IP>`): SSL enabled for security

### Connection Logging

The application logs the connection mode on startup:

```
Attempting to connect to PostgreSQL database via Cloud SQL Proxy...
Connection details: 127.0.0.1:5432/rentals_db
✅ Successfully connected to PostgreSQL database
```

## Troubleshooting

### Common Issues

1. **"Connection refused" error**
   - Ensure Cloud SQL Proxy is running
   - Check that proxy is listening on 127.0.0.1:5432
   - Verify `.env` has `DB_HOST=127.0.0.1`

2. **"Authentication failed" error**
   - Run `gcloud auth application-default login`
   - Verify database credentials in `.env`
   - Check that the GCP service account has Cloud SQL Client role

3. **"Instance not found" error**
   - Verify instance connection name: `properties-portal:us-central1:pp-dev`
   - Ensure you have access to the GCP project

4. **Proxy starts but app can't connect**
   - Check if another service is using port 5432
   - Try specifying a different port in both proxy and `.env`

### Testing the Connection

```bash
# Test proxy connection with psql
psql -h 127.0.0.1 -p 5432 -U postgres -d rentals_db

# Check proxy logs for connection attempts
# The proxy terminal will show accepted connections
```

## Direct Connection (Without Proxy)

If you need to connect directly (not recommended for production):

1. Update `.env`:
   ```env
   DB_HOST=34.135.118.23  # Direct IP
   ```

2. The application will automatically enable SSL for direct connections

3. Ensure your IP is whitelisted in GCP Cloud SQL authorized networks

## Security Notes

- **Never commit** `.env` file with credentials
- Cloud SQL Proxy uses IAM authentication - no need to whitelist IPs
- Proxy encrypts all traffic to the database
- In GKE, use Workload Identity for enhanced security
- Database credentials should be stored in Kubernetes Secrets

## References

- [Cloud SQL Proxy Documentation](https://cloud.google.com/sql/docs/postgres/sql-proxy)
- [Cloud SQL Proxy GitHub](https://github.com/GoogleCloudPlatform/cloud-sql-proxy)
- [Connecting from GKE](https://cloud.google.com/sql/docs/postgres/connect-kubernetes-engine)
