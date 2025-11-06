# Cloud SQL Connection Configuration

## Instance Connection Name
**my-project:us-central1:prod-db**

## Sidecar Configuration
- Image: gcr.io/cloud-sql-docker/cloud-sql-proxy:1.33.2
- Port: 5432 (adjust based on DB type)
- Service Account: gke-deployer@my-project.iam.gserviceaccount.com

## Application Connection String
