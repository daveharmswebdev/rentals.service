# CI/CD Setup Guide

This guide will walk you through setting up automated CI/CD for the Rentals Portal using GitHub Actions and Google Cloud Platform.

## Overview

The CI/CD pipeline will:
1. Run tests on every push and pull request
2. Build a Docker image on merge to `main`
3. Push the image to Google Artifact Registry
4. Deploy the new image to GKE
5. Verify the deployment succeeded

## Prerequisites

- GitHub repository with admin access
- GCP project with billing enabled
- GKE cluster already running
- `gcloud` CLI installed and authenticated

## Step 1: Set Up Workload Identity Federation

Workload Identity Federation allows GitHub Actions to authenticate to GCP without using long-lived service account keys.

### 1.1 Enable Required APIs

```bash
gcloud services enable iamcredentials.googleapis.com \
  --project=properties-portal

gcloud services enable cloudresourcemanager.googleapis.com \
  --project=properties-portal

gcloud services enable sts.googleapis.com \
  --project=properties-portal
```

### 1.2 Create Workload Identity Pool

```bash
gcloud iam workload-identity-pools create "github-pool" \
  --project="properties-portal" \
  --location="global" \
  --display-name="GitHub Actions Pool"
```

### 1.3 Create Workload Identity Provider

Replace `YOUR_GITHUB_ORG` and `YOUR_REPO_NAME` with your actual GitHub organization/username and repository name:

```bash
gcloud iam workload-identity-pools providers create-oidc "github-provider" \
  --project="properties-portal" \
  --location="global" \
  --workload-identity-pool="github-pool" \
  --display-name="GitHub Provider" \
  --attribute-mapping="google.subject=assertion.sub,attribute.actor=assertion.actor,attribute.repository=assertion.repository,attribute.repository_owner=assertion.repository_owner" \
  --attribute-condition="assertion.repository_owner == 'YOUR_GITHUB_ORG'" \
  --issuer-uri="https://token.actions.githubusercontent.com"
```

**Important:** Replace `YOUR_GITHUB_ORG` with your GitHub username or organization name (e.g., `daveharmswebdev`).

### 1.4 Get the Workload Identity Provider Resource Name

```bash
gcloud iam workload-identity-pools providers describe "github-provider" \
  --project="properties-portal" \
  --location="global" \
  --workload-identity-pool="github-pool" \
  --format="value(name)"
```

Save this output - you'll need it for GitHub secrets. It will look like:
```
projects/PROJECT_NUMBER/locations/global/workloadIdentityPools/github-pool/providers/github-provider
```

the output was `projects/1063578736683/locations/global/workloadIdentityPools/github-pool/providers/github-provider`

## Step 2: Create Service Account

### 2.1 Create the Service Account

```bash
gcloud iam service-accounts create github-actions-sa \
  --project=properties-portal \
  --display-name="GitHub Actions Service Account"
```

### 2.2 Grant Required Permissions

```bash
# Permission to push to Artifact Registry
gcloud projects add-iam-policy-binding properties-portal \
  --member="serviceAccount:github-actions-sa@properties-portal.iam.gserviceaccount.com" \
  --role="roles/artifactregistry.writer"

# Permission to deploy to GKE
gcloud projects add-iam-policy-binding properties-portal \
  --member="serviceAccount:github-actions-sa@properties-portal.iam.gserviceaccount.com" \
  --role="roles/container.developer"

# Permission to get GKE credentials
gcloud projects add-iam-policy-binding properties-portal \
  --member="serviceAccount:github-actions-sa@properties-portal.iam.gserviceaccount.com" \
  --role="roles/container.clusterViewer"
```

### 2.3 Allow GitHub to Impersonate the Service Account

Replace `YOUR_GITHUB_ORG` and `YOUR_REPO_NAME`:

```bash
gcloud iam service-accounts add-iam-policy-binding \
  github-actions-sa@properties-portal.iam.gserviceaccount.com \
  --project=properties-portal \
  --role="roles/iam.workloadIdentityUser" \
  --member="principalSet://iam.googleapis.com/projects/PROJECT_NUMBER/locations/global/workloadIdentityPools/github-pool/attribute.repository/YOUR_GITHUB_ORG/YOUR_REPO_NAME"
```

**Note:** You'll need to replace `PROJECT_NUMBER` with your actual GCP project number. Get it with:
```bash
gcloud projects describe properties-portal --format="value(projectNumber)"
```

## Step 3: Configure GitHub Repository Secrets

Go to your GitHub repository → Settings → Secrets and variables → Actions → New repository secret

Add the following secrets:

### 3.1 WIF_PROVIDER
Value: The full workload identity provider resource name from Step 1.4
```
projects/PROJECT_NUMBER/locations/global/workloadIdentityPools/github-pool/providers/github-provider
```

### 3.2 WIF_SERVICE_ACCOUNT
Value:
```
github-actions-sa@properties-portal.iam.gserviceaccount.com
```

## Step 4: Verify GKE Cluster Name

The workflow assumes your cluster is named `pp-dev-cluster` in zone `us-central1`. Verify this:

```bash
gcloud container clusters list --project=properties-portal
```

If your cluster has a different name or zone, update the environment variables in `.github/workflows/deploy.yml`:
- `GKE_CLUSTER`
- `GKE_ZONE`

## Step 5: Test the Pipeline

### 5.1 Commit and Push the Workflow

```bash
git add .github/workflows/deploy.yml deployment.yaml
git commit -m "Add CI/CD pipeline"
git push origin main
```

### 5.2 Monitor the Workflow

1. Go to your GitHub repository
2. Click on the "Actions" tab
3. You should see the workflow running
4. Click on the workflow run to see detailed logs

### 5.3 Verify Deployment

Once the workflow completes successfully:

```bash
# Check the deployment status
kubectl get deployments -n development

# Check the pods
kubectl get pods -n development

# Get the service external IP
kubectl get service rentals-portal-service -n development
```

## How It Works

### On Pull Request
- Runs tests only
- Does not build or deploy
- Provides fast feedback on code changes

### On Push to Main
1. **Test Job**: Runs all tests with coverage
2. **Build and Deploy Job** (only if tests pass):
   - Authenticates to GCP using Workload Identity
   - Builds Docker image with commit SHA tag
   - Pushes image to Google Artifact Registry
   - Updates Kubernetes deployment with new image
   - Waits for rollout to complete (5 minute timeout)
   - Verifies deployment and outputs service info

### Rolling Update Strategy
- `maxSurge: 1` - Can create 1 extra pod during update
- `maxUnavailable: 0` - Always maintains minimum replicas
- Health checks ensure new pods are ready before old ones terminate
- Zero downtime deployments

## Troubleshooting

### Workflow fails at authentication
- Verify the WIF_PROVIDER secret is correct
- Verify the WIF_SERVICE_ACCOUNT secret is correct
- Check that the service account has the workloadIdentityUser role

### Workflow fails at "Push Docker image to GAR"
- Verify the service account has `roles/artifactregistry.writer`
- Check that the Artifact Registry repository exists

### Workflow fails at "Deploy to GKE"
- Verify the service account has `roles/container.developer`
- Check that the GKE cluster name and zone are correct
- Verify the namespace exists: `kubectl get namespace development`

### Deployment rollout times out
- Check pod logs: `kubectl logs -n development -l app=rentals-portal-service`
- Check pod status: `kubectl describe pod -n development -l app=rentals-portal-service`
- Verify health check endpoints are working

## Security Best Practices

✅ **What we're doing right:**
- Using Workload Identity Federation (no long-lived keys)
- Minimal IAM permissions (principle of least privilege)
- Secrets stored in GitHub (not in code)
- Image tags use commit SHA for traceability

✅ **Additional recommendations:**
- Enable branch protection on `main`
- Require pull request reviews before merging
- Enable GitHub's Dependabot for security updates
- Consider adding SAST/DAST security scanning

## Next Steps

1. **Add staging environment**: Create a separate workflow for staging deployments
2. **Add manual approval**: Use GitHub Environments for production deployments
3. **Add notifications**: Configure Slack/email notifications for deployment status
4. **Add rollback capability**: Create a workflow to rollback to previous versions
5. **Add performance testing**: Run load tests after deployment

## Useful Commands

```bash
# View workflow runs
gh run list

# View specific run logs
gh run view <run-id> --log

# Manually trigger workflow (if you add workflow_dispatch)
gh workflow run deploy.yml

# Check deployment history
kubectl rollout history deployment/rentals-portal-service -n development

# Rollback to previous version
kubectl rollout undo deployment/rentals-portal-service -n development
