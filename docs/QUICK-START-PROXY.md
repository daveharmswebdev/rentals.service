# Quick Start: Cloud SQL Proxy

## Local Development - Two Terminal Setup

### Terminal 1: Start Cloud SQL Proxy
```bash
cloud-sql-proxy properties-portal:us-central1:pp-dev
```

Wait for:
```
✓ Listening on 127.0.0.1:5432
✓ The proxy has started successfully and is ready for new connections!
```

### Terminal 2: Start Application
```bash
npm run dev
```

Look for:
```
Attempting to connect to PostgreSQL database via Cloud SQL Proxy...
Connection details: 127.0.0.1:5432/rentals_db
✅ Successfully connected to PostgreSQL database
```

## That's It!

Your app is now running and connected to the GCP PostgreSQL database through the secure proxy.

## Troubleshooting

**Proxy won't start?**
```bash
gcloud auth application-default login
```

**Connection refused?**
- Make sure proxy is running in Terminal 1
- Check `.env` has `DB_HOST=127.0.0.1`

**Need more help?**
See [cloud-sql-proxy-setup.md](./cloud-sql-proxy-setup.md) for detailed documentation.
