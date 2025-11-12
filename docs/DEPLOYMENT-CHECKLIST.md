# 🚀 Google OAuth Implementation - Deployment Checklist

## What Was Implemented

✅ **Google OAuth 2.0 authentication** using Passport.js
✅ **Protected API endpoints** - all `/api/*` routes require authentication
✅ **Session management** with encrypted cookies
✅ **Authentication routes** for login/logout
✅ **TypeScript types** for user profiles and sessions
✅ **Kubernetes configuration** with secrets management
✅ **Comprehensive documentation**

## Files Created/Modified

### New Files Created
- `src/config/auth.config.ts` - OAuth & session configuration
- `src/config/passport.config.ts` - Passport Google OAuth strategy
- `src/middleware/auth.middleware.ts` - Authentication middleware
- `src/routes/auth.routes.ts` - Authentication endpoints
- `src/interfaces/user.interface.ts` - User profile interface
- `src/types/express.d.ts` - TypeScript session types
- `docs/google-oauth-setup.md` - Complete setup guide
- `docs/local-development-oauth.md` - Local dev guide
- `.env.example` - Environment variables template

### Modified Files
- `package.json` - Added passport dependencies
- `src/app.ts` - Integrated authentication middleware
- `src/routes/homes.routes.ts` - Added auth protection
- `src/routes/address.routes.ts` - Added auth protection
- `deployment.yaml` - Added OAuth environment variables
- `README.md` - Updated documentation

## Deployment Steps (in Order)

### Step 1: Create Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Select project: `properties-portal`
3. Click **CREATE CREDENTIALS > OAuth client ID**
4. **Application type**: Web application
5. **Name**: Rentals Portal API
6. **Authorized redirect URIs**:
   ```
   https://api.gatherhubs.com/auth/google/callback
   ```
7. Click **CREATE** and save:
   - Client ID: `YOUR_CLIENT_ID.apps.googleusercontent.com`
   - Client Secret: `YOUR_CLIENT_SECRET`

### Step 2: Create Kubernetes Secrets

```bash
# 1. Create Google OAuth secret
kubectl create secret generic google-oauth-credentials \
  --from-literal=client-id='YOUR_CLIENT_ID.apps.googleusercontent.com' \
  --from-literal=client-secret='YOUR_CLIENT_SECRET' \
  -n development

# 2. Generate and create session secret
SESSION_SECRET=$(openssl rand -base64 32)
kubectl create secret generic session-credentials \
  --from-literal=secret="$SESSION_SECRET" \
  -n development

# 3. Verify secrets were created
kubectl get secrets -n development | grep -E "google-oauth|session"
```

### Step 3: Build and Deploy

```bash
# 1. Ensure you're in the project directory
cd /Users/walterharms/workspace/rentals-portal

# 2. Build Docker image
docker build -t us-central1-docker.pkg.dev/properties-portal/docker-repo/rentals-portal:latest .

# 3. Push to registry
docker push us-central1-docker.pkg.dev/properties-portal/docker-repo/rentals-portal:latest

# 4. Apply deployment
kubectl apply -f deployment.yaml

# 5. Watch rollout
kubectl rollout status deployment/rentals-portal-service -n development
```

### Step 4: Verify Deployment

```bash
# 1. Check pod status
kubectl get pods -n development

# 2. Check pod logs (look for "Authentication configuration validated successfully")
kubectl logs -f deployment/rentals-portal-service -n development -c rentals-portal-service

# 3. Test health endpoint
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

### Step 5: Test Authentication

```bash
# 1. Test unauthenticated access (should fail with 401)
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

```bash
# 2. Open browser and login
# Navigate to: https://api.gatherhubs.com/auth/google
# Complete Google OAuth flow
```

```bash
# 3. After login, test protected endpoints work (in browser or with cookie)
# Navigate to: https://api.gatherhubs.com/api/homes
```

## Quick Command Reference

### View Logs
```bash
# All logs
kubectl logs -f deployment/rentals-portal-service -n development

# Auth-related logs only
kubectl logs -f deployment/rentals-portal-service -n development | grep -i "auth\|user\|login"
```

### Check Secrets
```bash
# List secrets
kubectl get secrets -n development

# Describe OAuth secret (without showing values)
kubectl describe secret google-oauth-credentials -n development

# Get secret values (for debugging)
kubectl get secret google-oauth-credentials -n development -o jsonpath='{.data.client-id}' | base64 -d
```

### Restart Deployment
```bash
kubectl rollout restart deployment/rentals-portal-service -n development
```

### Delete Secrets (if you need to recreate)
```bash
kubectl delete secret google-oauth-credentials -n development
kubectl delete secret session-credentials -n development
```

## Testing Checklist

- [ ] Health endpoint works: `https://api.gatherhubs.com/`
- [ ] Unauthenticated requests blocked: `https://api.gatherhubs.com/api/homes` returns 401
- [ ] Login flow works: `https://api.gatherhubs.com/auth/google`
- [ ] After login, can access homes: `https://api.gatherhubs.com/api/homes`
- [ ] After login, can access addresses: `https://api.gatherhubs.com/api/addresses`
- [ ] Logout works: `https://api.gatherhubs.com/auth/logout`
- [ ] Status endpoint works: `https://api.gatherhubs.com/auth/status`

## Troubleshooting

### "Missing required authentication environment variables"
```bash
# Check if secrets exist
kubectl get secret google-oauth-credentials -n development
kubectl get secret session-credentials -n development

# Check if pod can access secrets
kubectl describe pod <pod-name> -n development
```

### "redirect_uri_mismatch"
- Verify `https://api.gatherhubs.com/auth/google/callback` is in Google Console
- Check `GOOGLE_CALLBACK_URL` in deployment.yaml matches

### Pod fails to start
```bash
# Check pod events
kubectl describe pod <pod-name> -n development

# Check logs
kubectl logs <pod-name> -n development -c rentals-portal-service
```

### Session not persisting
- Ensure HTTPS certificate is active
- Check browser cookies are enabled
- Verify `SESSION_SECRET` exists in Kubernetes

## Next Actions After Deployment

1. **Test the OAuth flow** in a browser
2. **Monitor logs** for any errors
3. **Update frontend** to use new auth endpoints
4. **Set up monitoring** for authentication metrics
5. **Add more test users** to OAuth consent screen

## Rollback Plan (if needed)

If authentication causes issues, you can quickly rollback:

```bash
# Option 1: Temporarily disable auth in routes
# Comment out `ensureAuthenticated` middleware in routes files

# Option 2: Rollback to previous deployment
kubectl rollout undo deployment/rentals-portal-service -n development

# Option 3: Scale down and debug
kubectl scale deployment/rentals-portal-service --replicas=0 -n development
# Fix issues, then scale back up
kubectl scale deployment/rentals-portal-service --replicas=2 -n development
```

## Documentation Links

- **Full setup guide**: [`docs/google-oauth-setup.md`](docs/google-oauth-setup.md)
- **Local development**: [`docs/local-development-oauth.md`](docs/local-development-oauth.md)
- **API documentation**: [`README.md`](../README.md)

## Security Reminders

- ✅ Never commit OAuth credentials to git
- ✅ Rotate session secret periodically
- ✅ Use HTTPS in production
- ✅ Monitor auth logs for suspicious activity
- ✅ Limit OAuth scopes to necessary permissions

---

**Status**: Ready for deployment! 🎉

Follow the steps above in order, and you'll have Google OAuth authentication running on your API.
