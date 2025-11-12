# Local Development with Google OAuth

Quick guide for running the application locally with Google OAuth authentication.

## Prerequisites

- Node.js installed
- Google OAuth credentials created (see `google-oauth-setup.md`)
- PostgreSQL running locally or access to Cloud SQL

## Setup Steps

### 1. Environment Variables

Create a `.env` file in the project root:

```bash
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=rentals_db
DB_USER=your_db_user
DB_PASSWORD=your_db_password
PGSSLMODE=disable

# Google OAuth Configuration
GOOGLE_CLIENT_ID=your_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_client_secret
GOOGLE_CALLBACK_URL=http://localhost:3000/auth/google/callback

# Session Configuration
SESSION_SECRET=your-super-secret-session-key-change-this
NODE_ENV=development
PORT=3000
```

### 2. Update Google OAuth Redirect URI

Add localhost to your Google Cloud Console OAuth credentials:

1. Go to [Google Cloud Console > Credentials](https://console.cloud.google.com/apis/credentials)
2. Edit your OAuth 2.0 Client ID
3. Add to **Authorized redirect URIs**:
   ```
   http://localhost:3000/auth/google/callback
   ```
4. Save

### 3. Install Dependencies

```bash
npm install
```

### 4. Build TypeScript

```bash
npm run build
```

### 5. Run Application

**Development mode with auto-reload:**
```bash
npm run dev
```

**Production mode:**
```bash
npm start
```

## Testing Authentication Locally

### 1. Check Server Status

```bash
curl http://localhost:3000/
```

### 2. Test Unauthenticated Access

```bash
curl http://localhost:3000/api/homes
```

Should return 401 Unauthorized.

### 3. Login Flow (Browser Required)

1. Open browser to: `http://localhost:3000/auth/google`
2. Sign in with Google
3. Grant permissions
4. You'll be redirected to callback with user info

### 4. Access Protected Endpoints

After login, your browser has a session cookie. You can:

1. **Use browser dev tools**:
   - Open Network tab
   - Copy `Cookie` header with `connect.sid`
   
2. **Use curl with cookie**:
   ```bash
   curl http://localhost:3000/api/homes \
     -H "Cookie: connect.sid=s%3A..."
   ```

### 5. Check Auth Status

```bash
curl http://localhost:3000/auth/status \
  -H "Cookie: connect.sid=s%3A..."
```

## Development Tips

### Skip Authentication (Temporary)

If you need to disable auth temporarily for testing:

**Option 1**: Comment out auth middleware in routes:
```typescript
// src/routes/homes.routes.ts
private initializeRoutes(): void {
  // Temporarily disable auth
  this.router.get('/', /* ensureAuthenticated, */ this.homesController.getAllHomes...);
}
```

**Option 2**: Create development-only bypass:
```typescript
// src/middleware/auth.middleware.ts
export function ensureAuthenticated(req: Request, res: Response, next: NextFunction): void {
  // DEVELOPMENT ONLY - Remove in production!
  if (process.env.NODE_ENV === 'development' && process.env.SKIP_AUTH === 'true') {
    return next();
  }
  
  if (req.isAuthenticated()) {
    return next();
  }
  // ... rest of middleware
}
```

Then set in `.env`:
```bash
SKIP_AUTH=true
```

**⚠️ WARNING**: Never deploy with auth disabled!

### Using Postman/Insomnia

To test with API clients:

1. **Enable interceptor/proxy** to capture browser cookies
2. **Login via browser** first
3. **Copy session cookie** from browser
4. **Add cookie to requests**:
   - Header: `Cookie`
   - Value: `connect.sid=s%3A...`

### Testing Session Expiry

Sessions expire after 24 hours by default. To test shorter expiry:

```typescript
// src/config/auth.config.ts
export const authConfig: AuthConfig = {
  // ...
  session: {
    secret: process.env.SESSION_SECRET || 'dev-secret',
    maxAge: 5 * 60 * 1000, // 5 minutes for testing
  },
};
```

## Troubleshooting

### "Missing required authentication environment variables"

**Solution**: Check your `.env` file has all required variables:
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `SESSION_SECRET`

### "redirect_uri_mismatch"

**Solution**: Verify `http://localhost:3000/auth/google/callback` is added to Google Console authorized redirect URIs.

### Session not persisting

**Check**:
1. Browser cookies enabled
2. No browser extensions blocking cookies
3. `.env` has `NODE_ENV=development` (allows non-HTTPS cookies)

### Database connection fails

**For local PostgreSQL**:
```bash
# Check if PostgreSQL is running
pg_isready

# Connect manually to verify
psql -h localhost -U your_user -d rentals_db
```

**For Cloud SQL**:
```bash
# Use Cloud SQL Proxy
./cloud-sql-proxy properties-portal:us-central1:pp-dev
```

Then update `.env`:
```bash
DB_HOST=127.0.0.1
```

## Running Tests

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Watch mode
npm run test:watch
```

## Hot Reload Setup (Optional)

Install nodemon for auto-restart:

```bash
npm install --save-dev nodemon
```

Update `package.json`:
```json
{
  "scripts": {
    "dev": "nodemon --watch src --exec ts-node src/index.ts"
  }
}
```

## Common Development Workflows

### Workflow 1: Test New Feature Without Auth

1. Comment out `ensureAuthenticated` middleware
2. Make changes and test
3. Re-enable auth before committing

### Workflow 2: Test Auth Flow

1. Clear browser cookies
2. Navigate to `http://localhost:3000/auth/google`
3. Complete OAuth flow
4. Test protected endpoints

### Workflow 3: Test as Different Users

1. Logout: `http://localhost:3000/auth/logout`
2. Clear cookies or use incognito mode
3. Login with different Google account

## Next Steps

- Add unit tests for auth middleware
- Create mock authentication for tests
- Add refresh token support
- Implement remember me functionality
