# Redis Session Store Migration Summary

## Changes Made

### 1. Application Code (`src/app.ts`)
- ✅ Switched from `ioredis` to official `redis` package
- ✅ Changed import from `connectRedis` function to `RedisStore` class
- ✅ Updated Redis client initialization to use `createClient()`
- ✅ Added `redisClient.connect()` call
- ✅ Added fallback for `SESSION_SECRET` environment variable

### 2. Dependencies (`package.json`)
- ✅ Removed `ioredis: ^5.8.2`
- ✅ Added `redis: ^5.9.0` (already included as transitive dependency)
- ✅ Added `@types/redis` as dev dependency

### 3. Deployment Configuration (`deployment.yaml`)
- ✅ Added `REDIS_HOST` environment variable (needs IP update)
- ✅ Added `REDIS_PORT` environment variable (6379)

### 4. Documentation
- ✅ Created `docs/MEMORYSTORE-SETUP.md` - Complete setup guide
- ✅ Created `docs/REDIS-DEPLOYMENT-CHECKLIST.md` - Quick reference

## What Works Now

### Local Development ✅
```bash
# Start local Redis
docker run --name local-redis -p 6379:6379 -d redis

# Run app
npm run dev
```

Environment:
- `REDIS_HOST=127.0.0.1`
- `REDIS_PORT=6379`
- Sessions stored in local Docker Redis

### Production Deployment (After Memorystore Setup)

After creating Memorystore instance and updating the IP in `deployment.yaml`:

```bash
git add .
git commit -m "Add Redis session store configuration"
git push origin main
```

GitHub Actions will automatically:
1. Run tests
2. Build Docker image
3. Deploy to GKE
4. Sessions will be stored in Google Cloud Memorystore

## Next Steps for Production

1. **Create Memorystore Instance** (~5 minutes)
   ```bash
   gcloud redis instances create rentals-session-redis \
       --size=1 \
       --region=us-central1 \
       --redis-version=redis_7_0 \
       --tier=standard \
       --network=default \
       --project=properties-portal
   ```

2. **Get Internal IP**
   ```bash
   gcloud redis instances describe rentals-session-redis \
       --region=us-central1 \
       --project=properties-portal \
       --format="get(host)"
   ```

3. **Update deployment.yaml**
   
   Replace this line:
   ```yaml
   value: "REPLACE_WITH_MEMORYSTORE_INTERNAL_IP"
   ```
   
   With actual IP:
   ```yaml
   value: "10.x.x.x"
   ```

4. **Commit and Deploy**
   ```bash
   git add deployment.yaml
   git commit -m "Configure Memorystore Redis IP for production"
   git push origin main
   ```

## Benefits

### Before (No Session Store)
- ❌ Sessions lost on pod restart
- ❌ Inconsistent authentication across pods
- ❌ Users logged out during deployments

### After (Redis Session Store)
- ✅ Sessions persist across pod restarts
- ✅ Consistent authentication across all pods
- ✅ Zero-downtime deployments
- ✅ Horizontal scaling without session loss
- ✅ Automatic failover (Standard tier)

## Testing

### Local
```bash
# Start Redis
docker run --name local-redis -p 6379:6379 -d redis

# Start app
npm run dev

# Test session persistence (in browser or Postman)
# 1. Login via /auth/google
# 2. Make API request to /api/homes
# 3. Restart app
# 4. Session should still be valid
```

### Production (After Deployment)
```bash
# Test from pod
kubectl exec -it <pod-name> -n development -- redis-cli -h <REDIS_IP> ping

# Should return: PONG
```

## Monitoring

- **Redis Metrics**: Cloud Console → Memorystore → Redis → rentals-session-redis
- **Application Logs**: `kubectl logs -f -l app=rentals-portal-service -n development`
- **Pod Health**: `kubectl get pods -n development`

## Cost

- **Development/Testing**: Basic tier (1GB) - ~$45/month
- **Production**: Standard tier (1GB) - ~$100/month
  - Includes automatic failover
  - High availability
  - Recommended for production

## Files Modified

```
modified:   src/app.ts
modified:   package.json
modified:   deployment.yaml
new:        docs/MEMORYSTORE-SETUP.md
new:        docs/REDIS-DEPLOYMENT-CHECKLIST.md
new:        docs/REDIS-MIGRATION-SUMMARY.md
```

## Important Notes

⚠️ **Before pushing to production:**
- Create Memorystore instance
- Update `REDIS_HOST` in `deployment.yaml` with actual IP
- Verify VPC connectivity
- Test in development namespace first

✅ **Safe to deploy locally:**
- All changes are backward compatible
- Works with local Docker Redis
- No breaking changes

---

**For detailed instructions, see:**
- [MEMORYSTORE-SETUP.md](./MEMORYSTORE-SETUP.md) - Complete setup guide
- [REDIS-DEPLOYMENT-CHECKLIST.md](./REDIS-DEPLOYMENT-CHECKLIST.md) - Quick reference
