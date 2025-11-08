# CI/CD Quick Start

This is a condensed version of the setup guide. For detailed explanations, see [ci-cd-setup.md](./ci-cd-setup.md).

## Prerequisites
- `gcloud` CLI authenticated
- GitHub repository admin access
- Your GitHub username/org name
- Your repository name

## Quick Setup Commands

### 1. Get Your Project Number
```bash
export PROJECT_NUMBER=$(gcloud projects describe properties-portal --format="value(projectNumber)")
echo "Project Number: $PROJECT_NUMBER"
```

### 2. Set Your GitHub Info
```bash
export GITHUB_ORG="YOUR_GITHUB_USERNAME"  # Replace with your GitHub username
export REPO_NAME="YOUR_REPO_NAME"         # Replace with your repo name (e.g., rentals.service)
```

### 3. Enable APIs
```bash
gcloud services enable iamcredentials.googleapis.com \
  cloudresourcemanager.googleapis.com \
  sts.googleapis.com \
  --project=properties-portal
```

### 4. Create Workload Identity Pool & Provider
```bash
# Create pool
gcloud iam workload-identity-pools create "github-pool" \
  --project="properties-portal" \
  --location="global" \
  --display-name="GitHub Actions Pool"

# Create provider
gcloud iam workload-identity-pools providers create-oidc "github-provider" \
  --project="properties-portal" \
  --location="global" \
  --workload-identity-pool="github-pool" \
  --display-name="GitHub Provider" \
  --attribute-mapping="google.subject=assertion.sub,attribute.actor=assertion.actor,attribute.repository=assertion.repository,attribute.repository_owner=assertion.repository_owner" \
  --attribute-condition="assertion.repository_owner == '${GITHUB_ORG}'" \
  --issuer-uri="https://token.actions.githubusercontent.com"
```

### 5. Get WIF Provider Name (Save This!)
```bash
gcloud iam workload-identity-pools providers describe "github-provider" \
  --project="properties-portal" \
  --location="global" \
  --workload-identity-pool="github-pool" \
  --format="value(name)"
```
**Copy this output - you'll need it for GitHub secrets!**

### 6. Create Service Account
```bash
gcloud iam service-accounts create github-actions-sa \
  --project=properties-portal \
  --display-name="GitHub Actions Service Account"
```

### 7. Grant Permissions
```bash
# Artifact Registry
gcloud projects add-iam-policy-binding properties-portal \
  --member="serviceAccount:github-actions-sa@properties-portal.iam.gserviceaccount.com" \
  --role="roles/artifactregistry.writer"

# GKE Deploy
gcloud projects add-iam-policy-binding properties-portal \
  --member="serviceAccount:github-actions-sa@properties-portal.iam.gserviceaccount.com" \
  --role="roles/container.developer"

# GKE View
gcloud projects add-iam-policy-binding properties-portal \
  --member="serviceAccount:github-actions-sa@properties-portal.iam.gserviceaccount.com" \
  --role="roles/container.clusterViewer"
```

### 8. Allow GitHub to Impersonate Service Account
```bash
gcloud iam service-accounts add-iam-policy-binding \
  github-actions-sa@properties-portal.iam.gserviceaccount.com \
  --project=properties-portal \
  --role="roles/iam.workloadIdentityUser" \
  --member="principalSet://iam.googleapis.com/projects/${PROJECT_NUMBER}/locations/global/workloadIdentityPools/github-pool/attribute.repository/${GITHUB_ORG}/${REPO_NAME}"
```

### 9. Verify Cluster Name
```bash
gcloud container clusters list --project=properties-portal
```
If your cluster name is NOT `pp-dev-cluster` or zone is NOT `us-central1`, update `.github/workflows/deploy.yml`.

## GitHub Secrets Setup

Go to: `https://github.com/${GITHUB_ORG}/${REPO_NAME}/settings/secrets/actions`

Add these two secrets:

### Secret 1: WIF_PROVIDER
Value from Step 5 (format):
```
projects/PROJECT_NUMBER/locations/global/workloadIdentityPools/github-pool/providers/github-provider
```

### Secret 2: WIF_SERVICE_ACCOUNT
Value:
```
github-actions-sa@properties-portal.iam.gserviceaccount.com
```

## Test It!

```bash
# Commit and push
git add .github/workflows/deploy.yml deployment.yaml docs/
git commit -m "Add CI/CD pipeline"
git push origin main

# Watch it run
# Go to: https://github.com/${GITHUB_ORG}/${REPO_NAME}/actions
```

## Verify Deployment

```bash
kubectl get deployments -n development
kubectl get pods -n development
kubectl get service rentals-portal-service -n development
```

## Common Issues

**Authentication fails?**
- Double-check GitHub secrets are correct
- Verify `GITHUB_ORG` matches your actual GitHub username/org

**Can't push to GAR?**
- Verify Artifact Registry repository exists
- Check service account has `artifactregistry.writer` role

**Can't deploy to GKE?**
- Verify cluster name and zone in workflow
- Check namespace exists: `kubectl get namespace development`

## What Happens Now?

Every time you push to `main`:
1. ✅ Tests run
2. ✅ Docker image builds
3. ✅ Image pushes to GAR
4. ✅ Deployment updates
5. ✅ Changes go live!

Time from push to live: ~3-5 minutes

## Useful Commands

```bash
# View recent workflow runs
gh run list --limit 5

# Watch a specific run
gh run watch

# Check deployment status
kubectl rollout status deployment/rentals-portal-service -n development

# View pod logs
kubectl logs -n development -l app=rentals-portal-service --tail=50

# Rollback if needed
kubectl rollout undo deployment/rentals-portal-service -n development
```

## Next Steps

- Enable branch protection on `main`
- Add pull request reviews
- Set up staging environment
- Add Slack notifications

For more details, see [ci-cd-setup.md](./ci-cd-setup.md).
