# Centralizing Session Store with Google Cloud Memorystore (Redis)

This guide provides a detailed step-by-step plan to centralize your session store for a Node.js/Express app deployed on GCP, using Google Cloud Memorystore for Redis. This ensures consistent authentication and session management across multiple pods or instances.

---

## 1. Prerequisites
- GCP project with billing enabled
- Kubernetes Engine (GKE) or Compute Engine setup
- Node.js/Express app using session middleware (e.g., `express-session`)

---

## 2. Provision Google Cloud Memorystore (Redis)

### a. Create a Redis Instance
1. Go to [Google Cloud Console](https://console.cloud.google.com/).
2. Navigate to **Memorystore > Redis**.
3. Click **Create Instance**.
4. Fill in the following:
   - **Name**: e.g., `session-redis`
   - **Region/Zone**: Match your app’s deployment region
   - **Tier**: Select **Standard** for production workloads
   - **Capacity**: Set initial memory size (can be scaled later)
   - **Network**: Select the VPC used by your app
5. Click **Create** and wait for provisioning.

### b. Note the Internal IP Address
- After creation, copy the **internal IP address** of your Redis instance.

---

## 3. Configure Network Access

### a. VPC and Firewall
- Ensure your app’s pods/VMs are in the same VPC as Memorystore.
- Add a firewall rule to allow traffic on port **6379** (default Redis port):
  - Source: Your app’s subnet or tags
  - Destination: Memorystore instance
  - Port: 6379

---

## 4. Update Application Session Middleware

### a. Install Redis Client and Store
```bash
npm install redis connect-redis express-session
```


### b. Configure Session Store in Your App (TypeScript)
Install dependencies:
```bash
npm install ioredis connect-redis express-session
npm install --save-dev @types/connect-redis
```

TypeScript example:
```typescript
import session from 'express-session';
import Redis from 'ioredis';
import connectRedis from 'connect-redis';

const RedisStore = connectRedis.RedisStore;
const redisClient = new Redis({
  host: process.env.REDIS_HOST,
  port: Number(process.env.REDIS_PORT) || 6379,
  // password: process.env.REDIS_PASSWORD, // if set
});

app.use(
  session({
    store: new RedisStore({ client: redisClient }),
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 1 day
      sameSite: 'lax',
    },
  })
);
```
---

## 9. Local Development with Docker

For local development, you cannot connect to GCP Memorystore directly. Instead, run Redis locally using Docker:

### a. Start Redis with Docker
```bash
docker run --name local-redis -p 6379:6379 -d redis
```

### b. Update your `.env` for local development
```env
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
SESSION_SECRET=<your_session_secret>
# REDIS_PASSWORD=<your_redis_password_if_set>
```

### c. Switch to Memorystore in Production
In production, set `REDIS_HOST` to the internal IP of your Memorystore instance and deploy within GCP (GKE, Compute Engine, etc.).

---

### c. Use Environment Variables
- Store sensitive info (Redis host, password, session secret) in environment variables or Kubernetes secrets.

---

## 5. Update Deployment Configuration

### a. Kubernetes (GKE)
- Add environment variables to your deployment YAML:
```yaml
env:
  - name: REDIS_HOST
    value: <INTERNAL_IP>
  - name: SESSION_SECRET
    valueFrom:
      secretKeyRef:
        name: session-secret
        key: secret
```
- Ensure your pods have network access to Memorystore.

### b. Compute Engine
- Set environment variables in your startup scripts or VM config.

---

## 6. Redeploy and Test
- Redeploy your app with updated session configuration.
- Test authentication and session persistence across multiple pods/instances.
- Use tools like `curl` or Postman to verify consistent session behavior.

---

## 7. Monitor and Scale
- Use GCP Monitoring to track Redis performance and health.
- Scale Memorystore instance as needed for traffic and memory requirements.
- Set up alerts for high memory usage or connection issues.

---

## 8. Troubleshooting
- **Session not persisting?**
  - Check network/firewall rules
  - Verify Redis client connection
  - Ensure all pods use the same Redis instance
- **Authentication issues?**
  - Confirm session middleware is correctly configured
  - Check for cookie settings (domain, path, secure flags)

---

## References
- [Google Cloud Memorystore Documentation](https://cloud.google.com/memorystore/docs/redis)
- [connect-redis](https://www.npmjs.com/package/connect-redis)
- [express-session](https://www.npmjs.com/package/express-session)

---

**By centralizing your session store with Memorystore, you ensure reliable, scalable, and consistent session management for your distributed app on GCP.**
