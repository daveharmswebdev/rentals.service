# Ingress and HTTPS Setup Guide

## Overview
This document describes the setup of Kubernetes Ingress with Google-managed SSL certificates for the rentals-portal service, enabling secure HTTPS access via the custom domain `api.gatherhubs.com`.

## Architecture Change

### Before: LoadBalancer Service
- **Type**: LoadBalancer
- **Issue**: Creates separate external IP per service, no built-in HTTPS/TLS termination
- **Limitation**: Not ideal for Google OAuth (requires stable HTTPS endpoints)

### After: Ingress with NodePort Service
- **Type**: NodePort Service + Ingress
- **Benefits**: 
  - Single entry point with host-based routing
  - Automatic HTTPS via Google-managed certificates
  - Better integration with OAuth redirect URIs
  - Cost-effective (one global IP for multiple services)

## Setup Steps Completed

### 1. Reserved Static Global IP
```bash
gcloud compute addresses create rentals-portal-ip \
  --global \
  --ip-version IPV4 \
  --project properties-portal
```

**Result**: `34.36.196.51`

### 2. Updated DNS Configuration
```bash
gcloud dns record-sets update api.gatherhubs.com \
  --type=A \
  --ttl=300 \
  --rrdatas=34.36.196.51 \
  --zone=gatherhubs-com \
  --project=properties-portal
```

**Result**: `api.gatherhubs.com` → `34.36.196.51`

### 3. Updated Kubernetes Deployment

#### Service Changes
Changed from `LoadBalancer` to `NodePort`:
```yaml
apiVersion: v1
kind: Service
metadata:
  name: rentals-portal-service
  namespace: development
spec:
  type: NodePort  # Changed from LoadBalancer
  selector: 
    app: rentals-portal-service
  ports:
    - protocol: TCP
      port: 80
      targetPort: 3000
```

#### Added Ingress Resource
```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: rentals-portal-ingress
  namespace: development
  annotations:
    kubernetes.io/ingress.class: "gce"
    networking.gke.io/managed-certificates: "rentals-portal-cert"
    kubernetes.io/ingress.global-static-ip-name: "rentals-portal-ip"
spec:
  rules:
  - host: api.gatherhubs.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: rentals-portal-service
            port:
              number: 80
```

#### Added Managed Certificate
```yaml
apiVersion: networking.gke.io/v1
kind: ManagedCertificate
metadata:
  name: rentals-portal-cert
  namespace: development
spec:
  domains:
    - api.gatherhubs.com
```

### 4. Applied Configuration
```bash
kubectl apply -f deployment.yaml
```

**Results**:
- Service configured
- Ingress created
- ManagedCertificate created

## Certificate Provisioning

### Monitoring Certificate Status
```bash
kubectl describe managedcertificate rentals-portal-cert -n development
```

**Expected Timeline**: 10-15 minutes for certificate to become Active

**Status Progression**:
1. `Provisioning` - Google is validating domain and issuing certificate
2. `Active` - Certificate is ready, HTTPS is enabled

### Checking Ingress Status
```bash
kubectl get ingress rentals-portal-ingress -n development
```

Wait for the `ADDRESS` field to show the static IP (`34.36.196.51`).

## Testing

### Once Certificate is Active

#### Test API Endpoints via HTTPS
```bash
# Test homes endpoint
curl https://api.gatherhubs.com/api/homes

# Test addresses endpoint
curl https://api.gatherhubs.com/api/addresses

# Test root endpoint
curl https://api.gatherhubs.com/
```

#### Verify SSL Certificate
```bash
# Check certificate details
curl -vI https://api.gatherhubs.com 2>&1 | grep -A 10 "SSL connection"
```

#### DNS Verification
```bash
# Verify DNS resolution
nslookup api.gatherhubs.com

# Should return: 34.36.196.51
```

## Resources Created

| Resource Type | Name | Details |
|--------------|------|---------|
| Global Static IP | `rentals-portal-ip` | `34.36.196.51` |
| DNS A Record | `api.gatherhubs.com` | Points to `34.36.196.51` |
| Kubernetes Service | `rentals-portal-service` | Type: NodePort |
| Kubernetes Ingress | `rentals-portal-ingress` | Host: `api.gatherhubs.com` |
| Managed Certificate | `rentals-portal-cert` | Domain: `api.gatherhubs.com` |

## Next Steps

1. ✅ Wait for certificate to become Active (10-15 minutes)
2. ✅ Test API endpoints via HTTPS
3. Configure Google OAuth with redirect URIs:
   - `https://api.gatherhubs.com/auth/google/callback`
4. Update application configuration to use HTTPS endpoints
5. Consider setting up additional security:
   - CORS policies
   - Rate limiting
   - Authentication middleware

## Troubleshooting

### Certificate Stays in Provisioning
- Verify DNS is resolving correctly: `nslookup api.gatherhubs.com`
- Ensure Ingress has acquired the static IP
- Check that domain ownership is verified in Google Cloud Console
- Wait at least 15 minutes before troubleshooting

### Ingress Not Getting IP Address
```bash
# Check Ingress events
kubectl describe ingress rentals-portal-ingress -n development

# Check backend service health
kubectl get pods -n development
kubectl logs -n development -l app=rentals-portal-service
```

### SSL Certificate Errors
```bash
# View certificate details
kubectl get managedcertificate rentals-portal-cert -n development -o yaml

# Check certificate events
kubectl describe managedcertificate rentals-portal-cert -n development
```

## References

- [GKE Ingress Documentation](https://cloud.google.com/kubernetes-engine/docs/concepts/ingress)
- [Google-managed SSL Certificates](https://cloud.google.com/kubernetes-engine/docs/how-to/managed-certs)
- [GCP Static IP Addresses](https://cloud.google.com/compute/docs/ip-addresses/reserve-static-external-ip-address)
