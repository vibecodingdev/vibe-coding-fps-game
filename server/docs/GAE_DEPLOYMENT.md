# Google App Engine Deployment Guide

This guide explains how to deploy the Doom Protocol Server to Google App Engine while preserving the existing PM2 configuration for local development.

## Prerequisites

1. **Google Cloud SDK**: Install and configure gcloud CLI

   ```bash
   # Install Google Cloud SDK
   curl https://sdk.cloud.google.com | bash
   exec -l $SHELL

   # Initialize and login
   gcloud init
   gcloud auth login
   ```

2. **Google Cloud Project**: Create a project and enable App Engine

   ```bash
   # Create a new project (optional)
   gcloud projects create YOUR_PROJECT_ID

   # Set the project
   gcloud config set project YOUR_PROJECT_ID

   # Enable App Engine
   gcloud app create --region=us-central
   ```

## Configuration

### 1. Environment Variables

Update the `app.yaml` file with your specific configuration:

```yaml
env_variables:
  NODE_ENV: "production"
  CLIENT_URL: "https://your-client-domain.com" # Update this
  # Add other environment variables as needed
```

### 2. Service Configuration

The server is configured as a service named `doom-server`. You can access it at:

```
https://doom-server-dot-YOUR_PROJECT_ID.appspot.com
```

## Deployment Commands

### Production Deployment

```bash
# Build and deploy to production
npm run gae:deploy
```

### Staging Deployment

```bash
# Deploy to staging without promoting to live traffic
npm run gae:deploy:staging
```

### Monitor Logs

```bash
# View real-time logs
npm run gae:logs
```

### Open in Browser

```bash
# Open the deployed service in browser
npm run gae:browse
```

## Health Checks

The server includes health check endpoints for App Engine:

- **Custom Health Check**: `GET /health`
  - Returns detailed server status including active rooms and players
- **App Engine Health Check**: `GET /_ah/health`
  - Simple OK response for App Engine monitoring

## Scaling Configuration

The `app.yaml` includes automatic scaling configuration:

```yaml
automatic_scaling:
  min_instances: 1
  max_instances: 10
  target_cpu_utilization: 0.6
```

Adjust these values based on your expected traffic.

## Socket.IO Configuration

Special handling for Socket.IO connections:

```yaml
handlers:
  - url: /socket.io/.*
    script: auto
    secure: always
```

This ensures WebSocket connections are properly routed.

## Local Development vs App Engine

### Local Development (PM2)

- Uses port 3001 (configurable in ecosystem.config.js)
- Full logging to local files
- PM2 process management
- Uses all PM2 scripts: `npm run pm2:start`, `npm run pm2:logs`, etc.

### App Engine Deployment

- Uses port from `process.env.PORT` (automatically set by App Engine)
- Google Cloud Logging
- Automatic scaling and health monitoring
- Uses GAE scripts: `npm run gae:deploy`, `npm run gae:logs`, etc.

## Migration Notes

The existing PM2 configuration is **preserved**:

- `ecosystem.config.js` - PM2 configuration (excluded from App Engine deployment)
- `start-pm2.sh` - PM2 startup script (excluded from App Engine deployment)
- All PM2 npm scripts continue to work

## Files Created/Modified

### New Files:

- `app.yaml` - App Engine configuration
- `.gcloudignore` - Deployment exclusions
- `docs/GAE_DEPLOYMENT.md` - This guide

### Modified Files:

- `src/index.ts` - Added health check endpoints and App Engine compatibility
- `package.json` - Added Google App Engine deployment scripts

## Troubleshooting

### Common Issues:

1. **Socket.IO Connection Issues**

   - Ensure `session_affinity: true` in app.yaml
   - Check CORS configuration in client

2. **Health Check Failures**

   - Verify `/health` endpoint returns 200 status
   - Check App Engine logs: `npm run gae:logs`

3. **Deployment Failures**
   - Ensure build completes successfully: `npm run build`
   - Check `.gcloudignore` for excluded files
   - Verify Google Cloud quotas and billing

### Commands for Debugging:

```bash
# Check service status
gcloud app services list

# View specific version
gcloud app versions list --service=doom-server

# SSH into instance (for debugging)
gcloud app ssh --service=doom-server

# Check deployment logs
gcloud app logs tail --service=doom-server
```

## Security Considerations

1. **Environment Variables**: Store sensitive data in Google Secret Manager instead of app.yaml
2. **CORS Configuration**: Restrict CLIENT_URL to your actual domain in production
3. **Authentication**: Consider adding authentication for admin endpoints
4. **Rate Limiting**: Implement rate limiting for production use

## Cost Optimization

1. **Scaling**: Adjust min/max instances based on usage patterns
2. **Instance Class**: Use `F1` or `F2` instance classes for lower costs
3. **Monitoring**: Set up billing alerts and monitoring dashboards
