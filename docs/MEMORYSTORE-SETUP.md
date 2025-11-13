# Google Cloud Memorystore (Redis) Setup Guide

This guide walks you through setting up Google Cloud Memorystore for Redis to use as a centralized session store for the rentals-portal application.

---

## Prerequisites
- GCP Project: `properties-portal`
- GKE Cluster: `rental-portals-service-cluster`
- Region: `us-central1`
- VPC Network access configured

---

## Step 1: Create Memorystore Redis Instance

### Option A: Using Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **Memorystore > Redis**
3. Click **Create Instance**
4. Configure the instance:
   - **Instance ID**: `rentals-session-redis`
   - **Display Name**: `Rentals Portal Session Store`
   - **Tier**: `Standard` (for production with automatic failover)
   - **Capacity**: `1 GB` (can scale later based on usage)
   - **Region**: `us-central1`
   - **Zone**: `Any` (or specific zone matching your GKE nodes)
   - **Network**: Select your VPC (should be the same VPC as your GKE cluster)
   - **Connection mode**: `Direct peering`
   - **Redis version**: `7.0` (latest stable)
5. Click **Create**

### Option B: Using gcloud CLI

```bash
gcloud redis instances create rentals-session-redis \
    --size=1 \
    --region=us-central1 \
    --redis-version=redis_7_0 \
    --tier=standard \
    --network=default \
    --project=properties-portal
```

---

## Step 2: Get the Internal IP Address

After the instance is created (takes 3-5 minutes):

### Using Console:
1. Go to **Memorystore > Redis**
2. Click on your instance `rentals-session-redis`
3. Copy the **Primary Endpoint** IP address (e.g., `10.x.x.x`)

### Using gcloud CLI:
```bash
gcloud redis instances describe rentals-session-redis \
    --region=us-central1 \
    --project=properties-portal \
    --format="get(host)"
```

---

## Step 3: Update Deployment Configuration

1. Open `deployment.yaml`
2. Find the line with `REDIS_HOST`:
   ```yaml
   - name: REDIS_HOST
     value: "REPLACE_WITH_MEMORYSTORE_INTERNAL_IP"
   ```
3. Replace `REPLACE_WITH_MEMORYSTORE_INTERNAL_IP` with your actual IP (e.g., `10.x.x.x`)

Example:
```yaml
- name: REDIS_HOST
  value: "10.123.45.67"
- name: REDIS_PORT
  value: "6379"
```

---

## Step 4: Verify Network Connectivity

Ensure your GKE cluster can reach Memorystore:

### Check VPC Peering
```bash
gcloud compute networks peerings list \
    --project=properties-portal
```

### Test from a GKE Pod (after deployment)
```bash
# Get a pod name
kubectl get pods -n development

# Test Redis connection
kubectl exec -it <pod-name> -n development -- sh -c "apt-get update && apt-get install -y redis-tools && redis-cli -h <REDIS_IP> ping"
```

Expected response: `PONG`

---

## Step 5: Deploy Updated Configuration

```bash
# Apply the updated deployment
kubectl apply -f deployment.yaml -n development

# Verify the deployment
kubectl get pods -n development
kubectl logs <pod-name> -n development
```

---

## Step 6: Monitor Redis Usage

### Using Console:
1. Go to **Memorystore > Redis**
2. Click on your instance
3. View metrics: CPU, Memory, Connections, Operations

### Using gcloud:
```bash
# View instance details
gcloud redis instances describe rentals-session-redis \
    --region=us-central1 \
    --project=properties-portal
```

---

## Troubleshooting

### Connection Refused
- Verify the GKE cluster and Memorystore are in the same VPC
- Check firewall rules allow traffic on port 6379
- Verify the internal IP is correct

### High Memory Usage
- Monitor session TTL settings (currently 24 hours)
- Consider increasing instance capacity
- Implement session cleanup for expired sessions

### Authentication Errors
- Memorystore Basic tier doesn't require AUTH by default
- If using AUTH, add `REDIS_PASSWORD` environment variable:
  ```yaml
  - name: REDIS_PASSWORD
    valueFrom:
      secretKeyRef:
        name: redis-credentials
        key: password
  ```

---

## Cost Optimization

- **Development**: Use Basic tier (1GB): ~$45/month
- **Production**: Use Standard tier (1GB): ~$100/month
- Scale capacity based on actual usage
- Use monitoring to right-size the instance

---

## Security Best Practices

1. **VPC Private Access**: Memorystore is only accessible within your VPC
2. **No Public IP**: Redis instance has no external IP
3. **AUTH**: Consider enabling AUTH for additional security
4. **Encryption**: Enable in-transit encryption for production
5. **IAM**: Use least-privilege service accounts

---

## Scaling Considerations

### When to Scale Up:
- Memory usage consistently > 80%
- Connection count approaching limits
- Increased latency in session operations

### How to Scale:
```bash
gcloud redis instances update rentals-session-redis \
    --size=2 \
    --region=us-central1 \
    --project=properties-portal
```

---

## Backup and Recovery

Standard tier provides:
- Automatic daily backups
- Point-in-time recovery
- Automatic failover to replica

To create manual backup:
```bash
gcloud redis instances export rentals-session-redis \
    --destination=gs://your-bucket/backup-$(date +%Y%m%d).rdb \
    --region=us-central1 \
    --project=properties-portal
```

---

## Next Steps

1. ✅ Create Memorystore instance
2. ✅ Update `deployment.yaml` with internal IP
3. ✅ Deploy to GKE
4. ✅ Test session persistence across pods
5. Set up monitoring alerts
6. Configure backup retention policy

---

## Reference Commands

```bash
# List all Redis instances
gcloud redis instances list --region=us-central1 --project=properties-portal

# Get instance details
gcloud redis instances describe rentals-session-redis --region=us-central1

# Update instance
gcloud redis instances update rentals-session-redis --size=2 --region=us-central1

# Delete instance (caution!)
gcloud redis instances delete rentals-session-redis --region=us-central1
```

---

**After completing these steps, your application will use Google Cloud Memorystore for centralized session management across all pods in your GKE cluster.**
