# GCP Cloud Logging Setup Guide

This guide covers the setup of Google Cloud Logging for the Rentals Portal service running on GKE.

## Overview

The service uses Winston with the `@google-cloud/logging-winston` transport to send structured logs to Google Cloud Logging. In production, logs are automatically forwarded to Cloud Logging with proper metadata and resource labels.

## Prerequisites

- GCP Project: `properties-portal`
- GKE Cluster: Running in `us-central1`
- Kubernetes Namespace: `development`
- Service Account: `gke-service-account`

## Required IAM Permissions

The service account used by your GKE pods needs the following IAM role:

### Option 1: Using Workload Identity (Recommended)

1. **Enable Workload Identity on your GKE cluster** (if not already enabled):
   ```bash
   gcloud container clusters update gke-cluster \
     --region=us-central1 \
     --workload-pool=properties-portal.svc.id.goog
   ```

2. **Create a Google Service Account** for logging:
   ```bash
   gcloud iam service-accounts create rentals-portal-logger \
     --display-name="Rentals Portal Logger Service Account" \
     --project=properties-portal
   ```

3. **Grant Cloud Logging permissions**:
   ```bash
   gcloud projects add-iam-policy-binding properties-portal \
     --member="serviceAccount:rentals-portal-logger@properties-portal.iam.gserviceaccount.com" \
     --role="roles/logging.logWriter"
   ```

4. **Bind Kubernetes Service Account to Google Service Account**:
   ```bash
   # Allow the Kubernetes service account to impersonate the Google service account
   gcloud iam service-accounts add-iam-policy-binding \
     rentals-portal-logger@properties-portal.iam.gserviceaccount.com \
     --role=roles/iam.workloadIdentityUser \
     --member="serviceAccount:properties-portal.svc.id.goog[development/gke-service-account]"
   ```

5. **Annotate the Kubernetes Service Account**:
   ```bash
   kubectl annotate serviceaccount gke-service-account \
     --namespace=development \
     iam.gke.io/gcp-service-account=rentals-portal-logger@properties-portal.iam.gserviceaccount.com
   ```

### Option 2: Using Service Account Keys (Less Secure)

If you cannot use Workload Identity, you can use service account keys:

1. **Create a service account**:
   ```bash
   gcloud iam service-accounts create rentals-portal-logger \
     --display-name="Rentals Portal Logger Service Account" \
     --project=properties-portal
   ```

2. **Grant permissions**:
   ```bash
   gcloud projects add-iam-policy-binding properties-portal \
     --member="serviceAccount:rentals-portal-logger@properties-portal.iam.gserviceaccount.com" \
     --role="roles/logging.logWriter"
   ```

3. **Create and download a key**:
   ```bash
   gcloud iam service-accounts keys create ~/rentals-portal-logger-key.json \
     --iam-account=rentals-portal-logger@properties-portal.iam.gserviceaccount.com
   ```

4. **Create a Kubernetes secret**:
   ```bash
   kubectl create secret generic gcp-logging-key \
     --from-file=key.json=~/rentals-portal-logger-key.json \
     --namespace=development
   ```

5. **Update deployment.yaml** to mount the secret and add environment variable:
   ```yaml
   env:
   - name: GCP_KEY_FILE
     value: /etc/gcp/key.json
   volumeMounts:
   - name: gcp-key
     mountPath: /etc/gcp
     readOnly: true
   volumes:
   - name: gcp-key
     secret:
       secretName: gcp-logging-key
   ```

## Verification

### 1. Check Pod Logs Locally
```bash
kubectl logs -n development -l app=rentals-portal-service --tail=50
```

### 2. View Logs in Cloud Logging Console

Navigate to: https://console.cloud.google.com/logs/query

Use this query to find your service logs:
```
resource.type="k8s_container"
resource.labels.namespace_name="development"
resource.labels.container_name="rentals-portal-service"
```

### 3. Filter by Severity
```
resource.type="k8s_container"
resource.labels.namespace_name="development"
resource.labels.container_name="rentals-portal-service"
severity>="ERROR"
```

### 4. Search by Service
```
jsonPayload.service="rentals-portal"
resource.type="k8s_container"
```

## Log Structure

Logs in Cloud Logging will have the following structure:

```json
{
  "severity": "INFO",
  "timestamp": "2025-11-08T10:30:00.000Z",
  "logName": "projects/properties-portal/logs/rentals-portal-service",
  "resource": {
    "type": "k8s_container",
    "labels": {
      "project_id": "properties-portal",
      "location": "us-central1",
      "cluster_name": "gke-cluster",
      "namespace_name": "development",
      "pod_name": "rentals-portal-service-xyz",
      "container_name": "rentals-portal-service"
    }
  },
  "jsonPayload": {
    "message": "Your log message",
    "service": "rentals-portal",
    "environment": "production",
    "correlation_id": "abc-123"
  }
}
```

## Environment Variables

The following environment variables are configured in `deployment.yaml`:

| Variable | Value | Description |
|----------|-------|-------------|
| `NODE_ENV` | `production` | Enables GCP logging transport |
| `GCP_PROJECT_ID` | `properties-portal` | GCP project identifier |
| `GCP_REGION` | `us-central1` | GCP region |
| `GKE_CLUSTER_NAME` | `gke-cluster` | Kubernetes cluster name |
| `K8S_NAMESPACE` | Dynamic (from pod metadata) | Kubernetes namespace |
| `APP_VERSION` | `1.0.0` | Application version for tracking |
| `LOG_LEVEL` | `info` (default) | Minimum log level (debug, info, warn, error) |
| `GCP_KEY_FILE` | Optional | Path to service account key (only if not using Workload Identity) |

## Log Levels

The service uses the following Winston log levels mapped to GCP severity:

| Winston Level | GCP Severity | Use Case |
|---------------|--------------|----------|
| `error` | ERROR | Application errors, exceptions |
| `warn` | WARNING | Warning conditions |
| `info` | INFO | General informational messages |
| `http` | INFO | HTTP request/response logs |
| `debug` | DEBUG | Detailed debug information |
| `verbose` | DEBUG | Very detailed debug information |

## Best Practices

1. **Use Structured Logging**: Always log as objects with meaningful fields
   ```typescript
   logger.info('User created', { 
     userId: user.id, 
     email: user.email,
     correlation_id: req.correlationId 
   });
   ```

2. **Include Correlation IDs**: Use the correlation ID middleware for request tracking

3. **Set Appropriate Log Levels**: 
   - Production: `info` or `warn`
   - Development: `debug`
   - Debugging issues: `debug` or `verbose`

4. **Avoid Logging Sensitive Data**: Never log passwords, tokens, or PII

5. **Use Labels for Filtering**: Resource labels help filter logs in Cloud Logging

## Troubleshooting

### Logs Not Appearing in Cloud Logging

1. **Check IAM Permissions**:
   ```bash
   gcloud projects get-iam-policy properties-portal \
     --flatten="bindings[].members" \
     --filter="bindings.members:rentals-portal-logger@properties-portal.iam.gserviceaccount.com"
   ```

2. **Verify Workload Identity Binding**:
   ```bash
   kubectl get serviceaccount gke-service-account -n development -o yaml
   ```
   Look for the `iam.gke.io/gcp-service-account` annotation.

3. **Check Pod Environment Variables**:
   ```bash
   kubectl exec -n development deployment/rentals-portal-service -- env | grep -E '(NODE_ENV|GCP_)'
   ```

4. **View Pod Logs for Errors**:
   ```bash
   kubectl logs -n development -l app=rentals-portal-service --tail=100
   ```

5. **Test Service Account Permissions** (from within a pod):
   ```bash
   kubectl exec -n development deployment/rentals-portal-service -- \
     gcloud logging write test-log "Test message" --severity=INFO
   ```

### Common Issues

**Issue**: Logs appear in kubectl but not in Cloud Logging
- **Solution**: Check IAM permissions and Workload Identity configuration

**Issue**: Permission denied errors
- **Solution**: Verify the service account has `roles/logging.logWriter`

**Issue**: Wrong resource labels
- **Solution**: Update environment variables in deployment.yaml

## Cost Optimization

Cloud Logging pricing is based on log volume. To optimize costs:

1. **Adjust Log Levels**: Use `info` or `warn` in production
2. **Set Log Retention**: Configure retention periods in Cloud Logging
3. **Use Exclusion Filters**: Exclude health check logs if needed
   ```
   resource.type="k8s_container"
   jsonPayload.message=~"GET /health"
   ```
4. **Monitor Usage**: Check Cloud Logging usage in the GCP Console

## Additional Resources

- [Google Cloud Logging Documentation](https://cloud.google.com/logging/docs)
- [Workload Identity Documentation](https://cloud.google.com/kubernetes-engine/docs/how-to/workload-identity)
- [Winston Documentation](https://github.com/winstonjs/winston)
- [@google-cloud/logging-winston](https://github.com/googleapis/nodejs-logging-winston)
