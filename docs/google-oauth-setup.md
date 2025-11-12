# Google OIDC Authentication Setup Guide

This guide explains how to configure Google OAuth 2.0 authentication for the Rentals Portal API.

## Architecture Overview

The API now requires Google OAuth authentication for all protected endpoints:
- **Authentication Routes**: `/auth/*` - Public routes for OAuth flow
- **Protected Routes**: `/api/homes/*`, `/api/addresses/*` - Require authentication
- **Health Check**: `/` - Public route, shows authentication status

## Prerequisites

- Google Cloud Project with OAuth consent screen configured
- Access to GKE cluster and kubectl
- Domain: `api.gatherhubs.com` with SSL certificate active

## Part 1: Google Cloud Console Setup

### 1. Create OAuth 2.0 Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Select your project: `properties-portal`
3. Navigate to **APIs & Services > Credentials**
4. Click **+ CREATE CREDENTIALS > OAuth client ID**

### 2. Configure OAuth Consent Screen (if not already done)

1. Go to **APIs & Services > OAuth consent screen**
2. Choose **External** user type (or Internal if using Google Workspace)
3. Fill in required fields:
   - **App name**: Rentals Portal
   - **User support email**: Your email
   - **Developer contact**: Your email
4. Add scopes:
   - `email`
   - `profile`
   - `openid`
5. Add test users (for development)
6. Save and continue

### 3. Create OAuth Client ID

1. **Application type**: Web application
2. **Name**: Rentals Portal API
3. **Authorized JavaScript origins**:
   ```
   https://api.gatherhubs.com
   ```
4. **Authorized redirect URIs**:
   ```
   https://api.gatherhubs.com/auth/google/callback
   ```
5. Click **CREATE**
6. **Save the credentials**:
   - Client ID: `YOUR_CLIENT_ID.apps.googleusercontent.com`
   - Client Secret: `YOUR_CLIENT_SECRET`

## Part 2: Kubernetes Secrets Setup

### 1. Create Google OAuth Secret

```bash
# Create the secret with your credentials
kubectl create secret generic google-oauth-credentials \
  --from-literal=client-id='YOUR_CLIENT_ID.apps.googleusercontent.com' \
  --from-literal=client-secret='YOUR_CLIENT_SECRET' \
  -n development
```

### 2. Create Session Secret

```bash
# Generate a random session secret
SESSION_SECRET=$(openssl rand -base64 32)

# Create the secret
kubectl create secret generic session-credentials \
  --from-literal=secret="$SESSION_SECRET" \
  -n development
```

### 3. Verify Secrets

```bash
# List secrets
kubectl get secrets -n development

# Verify google-oauth-credentials
kubectl describe secret google-oauth-credentials -n development

# Verify session-credentials
kubectl describe secret session-credentials -n development
```

## Part 3: Deploy Application

### 1. Build and Push Docker Image

```bash
# Build the image
docker build -t us-central1-docker.pkg.dev/properties-portal/docker-repo/rentals-portal:latest .

# Push to registry
docker push us-central1-docker.pkg.dev/properties-portal/docker-repo/rentals-portal:latest
```

### 2. Apply Deployment

```bash
# Apply the updated deployment
kubectl apply -f deployment.yaml

# Watch rollout status
kubectl rollout status deployment/rentals-portal-service -n development

# Check pods
kubectl get pods -n development
```

### 3. Verify Deployment

```bash
# Check pod logs
kubectl logs -f deployment/rentals-portal-service -n development -c rentals-portal-service

# Look for successful startup messages:
# - "Authentication configuration validated successfully"
# - "Connected to PostgreSQL"
# - "Server listening on port 3000"
```

## Part 4: Testing Authentication Flow

### 1. Check Health Endpoint

```bash
curl https://api.gatherhubs.com/
```

Expected response:
```json
{
  "message": "Hello, World!",
  "status": "Server is running",
  "timestamp": "2025-11-09T...",
  "authenticated": false
}
```

### 2. Test Unauthenticated Access (Should Fail)

```bash
curl https://api.gatherhubs.com/api/homes
```

Expected response:
```json
{
  "error": "Unauthorized",
  "message": "You must be logged in to access this resource",
  "loginUrl": "/auth/google"
}
```

### 3. Test Authentication Flow (Browser Required)

1. **Initiate Login**:
   - Open browser to: `https://api.gatherhubs.com/auth/google`
   - You'll be redirected to Google login
   
2. **Sign In**:
   - Choose a Google account
   - Grant permissions (email, profile)
   
3. **Callback**:
   - After successful auth, redirected to `/auth/google/callback`
   - Response shows user info:
   ```json
   {
     "success": true,
     "message": "Authentication successful",
     "user": {
       "id": "...",
       "email": "user@example.com",
       "displayName": "User Name",
       "firstName": "User",
       "lastName": "Name",
       "photo": "https://..."
     }
   }
   ```

4. **Check Auth Status**:
   ```bash
   curl https://api.gatherhubs.com/auth/status \
     -H "Cookie: connect.sid=YOUR_SESSION_COOKIE"
   ```

5. **Access Protected Endpoints**:
   ```bash
   curl https://api.gatherhubs.com/api/homes \
     -H "Cookie: connect.sid=YOUR_SESSION_COOKIE"
   ```

### 4. Test Logout

```bash
curl https://api.gatherhubs.com/auth/logout \
  -H "Cookie: connect.sid=YOUR_SESSION_COOKIE"
```

## Environment Variables Reference

The application requires these environment variables:

| Variable | Description | Source |
|----------|-------------|--------|
| `GOOGLE_CLIENT_ID` | OAuth 2.0 Client ID | Kubernetes Secret |
| `GOOGLE_CLIENT_SECRET` | OAuth 2.0 Client Secret | Kubernetes Secret |
| `GOOGLE_CALLBACK_URL` | OAuth callback URL | deployment.yaml |
| `SESSION_SECRET` | Session encryption key | Kubernetes Secret |
| `NODE_ENV` | Environment (production/development) | deployment.yaml |

## Authentication Endpoints

| Endpoint | Method | Description | Auth Required |
|----------|--------|-------------|---------------|
| `/auth/google` | GET | Initiate Google OAuth flow | No |
| `/auth/google/callback` | GET | OAuth callback handler | No |
| `/auth/logout` | GET | Logout user | No |
| `/auth/status` | GET | Check authentication status | No |
| `/auth/failure` | GET | OAuth failure handler | No |

## Protected API Endpoints

All endpoints under `/api/*` now require authentication:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/homes` | GET | Get all homes |
| `/api/homes/:id` | GET | Get home by ID |
| `/api/addresses` | GET | Get all addresses |
| `/api/addresses/:id` | GET | Get address by ID |
| `/api/addresses` | POST | Create address |
| `/api/addresses/:id` | PUT | Update address |
| `/api/addresses/:id` | DELETE | Delete address |

## Monitoring

### Check Authentication Logs

```bash
# View authentication events
kubectl logs -f deployment/rentals-portal-service -n development \
  | grep -i "auth\|user\|login\|logout"
```

### Common Log Messages

- `Authentication configuration validated successfully` - Config OK
- `User authenticated via Google` - Successful login
- `User logged out` - Successful logout
- `Unauthenticated access attempt` - Protected endpoint accessed without auth

## Troubleshooting

### Issue: "Missing required authentication environment variables"

**Solution**: Verify Kubernetes secrets exist and are properly mounted:
```bash
kubectl get secret google-oauth-credentials -n development
kubectl get secret session-credentials -n development
```

### Issue: OAuth callback fails with redirect_uri_mismatch

**Solution**: 
1. Verify callback URL in Google Cloud Console matches exactly:
   ```
   https://api.gatherhubs.com/auth/google/callback
   ```
2. Ensure `GOOGLE_CALLBACK_URL` environment variable matches

### Issue: Session not persisting

**Possible causes**:
1. **Cookie not being set**: Check browser dev tools > Application > Cookies
2. **HTTPS required**: Sessions with `secure: true` only work over HTTPS
3. **SameSite issues**: Check cookie SameSite attribute

**Solution**: Verify HTTPS is working and cookie settings are correct

### Issue: "Authentication failed" on callback

**Check**:
1. Client ID and Secret are correct
2. User is authorized (check OAuth consent screen test users)
3. Scopes match (profile, email)

### Issue: Pod fails to start

**Check logs**:
```bash
kubectl logs deployment/rentals-portal-service -n development
```

**Common issues**:
- Missing secrets
- Invalid credentials
- Database connection problems

## Security Best Practices

1. **Never commit secrets**: Keep OAuth credentials in Kubernetes secrets only
2. **Rotate secrets regularly**: Update session secret periodically
3. **Use HTTPS only**: OAuth requires secure connections
4. **Limit OAuth scopes**: Only request profile and email
5. **Monitor auth logs**: Watch for suspicious activity
6. **Set session expiry**: Current: 24 hours (configurable in `auth.config.ts`)

## Development vs Production

### Development Setup

For local development without HTTPS:

```typescript
// In src/config/auth.config.ts
export const authConfig: AuthConfig = {
  google: {
    callbackURL: 'http://localhost:3000/auth/google/callback',
  },
  // ... rest of config
};
```

Add to Google Console authorized redirect URIs:
```
http://localhost:3000/auth/google/callback
```

### Environment-Specific Behavior

The app automatically adjusts based on `NODE_ENV`:

**Development** (`NODE_ENV !== 'production'`):
- Continues running even if auth config is missing (logs warning)
- Session cookies work without HTTPS

**Production** (`NODE_ENV === 'production'`):
- Fails to start if auth config is missing
- Requires HTTPS for session cookies

## Next Steps

1. **Database User Storage** (Optional):
   - Create `users` table to persist user data
   - Update `passport.config.ts` to save/load from database
   
2. **Role-Based Access Control** (Future):
   - Add user roles (admin, user, etc.)
   - Implement authorization middleware
   
3. **API Key Authentication** (Alternative):
   - For service-to-service communication
   - Complement OAuth for different use cases

4. **Frontend Integration**:
   - Build UI with login button
   - Handle OAuth redirect flow
   - Store and send session cookies

## Support

For issues or questions:
- Check pod logs: `kubectl logs -f deployment/rentals-portal-service -n development`
- Review Google Cloud Console OAuth settings
- Verify DNS and SSL certificate status
- Check GKE cluster health

## References

- [Passport.js Documentation](http://www.passportjs.org/)
- [Google OAuth 2.0 Guide](https://developers.google.com/identity/protocols/oauth2)
- [Express Session Documentation](https://github.com/expressjs/session)
