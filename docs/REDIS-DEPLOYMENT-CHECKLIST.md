# Redis Deployment Checklist

Quick reference for deploying the rentals-portal with Redis session store to GKE.

## Pre-Deployment Steps

### 1. Create Google Cloud Memorystore Instance

```bash
# Create the Redis instance
gcloud redis instances create rentals-session-redis \
    --size=1 \
    --region=us-central1 \
    --redis-version=redis_7_0 \
    --tier=standard \
    --network=default \
    --project=properties-portal
```

### 2. Get the Internal IP

```bash
# Get the internal IP address
REDIS_IP=$(gcloud redis instances describe rentals-session-redis \
    --region=us-central1 \
    --project=properties-portal \
    --format="get(host)")

echo "Redis Internal IP: $REDIS_IP"
```

### 3. Update deployment.yaml

Edit `deployment.yaml` and replace the placeholder:

```yaml
- name: REDIS_HOST
  value: "REPLACE_WITH_MEMORYSTORE_INTERNAL_IP"  # Replace with actual IP
```

With your actual IP:

```yaml
- name: REDIS_HOST
  value: "10.x.x.x"  # Your Memorystore internal IP
```

## Deployment

### 1. Commit and Push Changes

```bash
git add deployment.yaml package.json src/app.ts
git commit -m "Add Redis session store with Google Cloud Memorystore"
git push origin main
```

### 2. GitHub Actions Will Automatically:
- Run tests
- Build Docker image
- Push to Google Artifact Registry
- Deploy to GKE
- Apply updated deployment.yaml

### 3. Manual Deployment (if needed)

```bash
# Authenticate
gcloud auth login
gcloud config set project properties-portal

# Get cluster credentials
gcloud container clusters get-credentials rental-portals-service-cluster \
    --zone us-central1 \
    --project properties-portal

# Apply deployment
kubectl apply -f deployment.yaml -n development

# Check status
kubectl get pods -n development
kubectl rollout status deployment/rentals-portal-service -n development
```

## Verification

### 1. Check Pod Status

```bash
kubectl get pods -n development
kubectl logs -f <pod-name> -n development
```

### 2. Test Redis Connection from Pod

```bash
# Get pod name
POD_NAME=$(kubectl get pods -n development -l app=rentals-portal-service -o jsonpath='{.items[0].metadata.name}')

# Test Redis connectivity
kubectl exec -it $POD_NAME -n development -c rentals-portal-service -- sh -c "apt-get update -qq && apt-get install -y -qq redis-tools && redis-cli -h $REDIS_IP ping"
```

Expected output: `PONG`

### 3. Test Application Endpoint

```bash
# Get external IP
EXTERNAL_IP=$(kubectl get ingress rentals-portal-ingress -n development -o jsonpath='{.status.loadBalancer.ingress[0].ip}')

# Test root endpoint
curl -i https://api.gatherhubs.com/

# Test authentication
curl -i https://api.gatherhubs.com/auth/google
```

### 4. Test Session Persistence

```bash
# Make authenticated request and save cookies
curl -c cookies.txt -b cookies.txt -L https://api.gatherhubs.com/auth/google

# Make another request with same cookies (should maintain session)
curl -b cookies.txt https://api.gatherhubs.com/api/homes
```

## Environment Variables Summary

### Local Development (.env)
```env
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
SESSION_SECRET=your-super-secret-session-key-change-this
```

### GKE Production (deployment.yaml)
```yaml
- name: REDIS_HOST
  value: "10.x.x.x"  # Memorystore internal IP
- name: REDIS_PORT
  value: "6379"
- name: SESSION_SECRET
  valueFrom:
    secretKeyRef:
      name: session-credentials
      key: secret
```

## Monitoring

### Check Redis Metrics

```bash
# Via gcloud
gcloud redis instances describe rentals-session-redis \
    --region=us-central1 \
    --project=properties-portal

# Via Console
# Navigate to: Memorystore > Redis > rentals-session-redis > Metrics
```

### Check Application Logs

```bash
# Stream logs from all pods
kubectl logs -f -l app=rentals-portal-service -n development

# Check specific pod
kubectl logs <pod-name> -n development -c rentals-portal-service
```

## Troubleshooting

### Pods Not Starting
```bash
kubectl describe pod <pod-name> -n development
kubectl logs <pod-name> -n development
```

### Redis Connection Issues
```bash
# Check if Redis is running
gcloud redis instances list --region=us-central1 --project=properties-portal

# Verify network connectivity
kubectl run -it --rm redis-test --image=redis --restart=Never -n development -- redis-cli -h $REDIS_IP ping
```

### Session Not Persisting
1. Check Redis connection in application logs
2. Verify `REDIS_HOST` is correct
3. Check VPC/network connectivity
4. Verify session secret is properly set

## Rollback

```bash
# Rollback to previous deployment
kubectl rollout undo deployment/rentals-portal-service -n development

# Check rollout history
kubectl rollout history deployment/rentals-portal-service -n development
```

## Clean Up (if needed)

```bash
# Delete Redis instance
gcloud redis instances delete rentals-session-redis \
    --region=us-central1 \
    --project=properties-portal
```

## Cost Estimate

- **Memorystore Redis (Standard, 1GB)**: ~$100/month
- **Network egress**: Minimal (internal VPC traffic is free)

---

**Key Points:**
- ✅ Redis connection uses internal IP (no public access)
- ✅ All traffic stays within VPC
- ✅ Standard tier provides automatic failover
- ✅ Sessions persist across pod restarts and scaling events
