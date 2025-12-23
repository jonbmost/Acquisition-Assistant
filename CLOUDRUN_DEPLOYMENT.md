# Cloud Run Deployment Guide

This guide explains how to deploy the Acquisition Assistant to Google Cloud Run.

## Prerequisites

1. Google Cloud Project with Cloud Run API enabled
2. `gcloud` CLI installed and authenticated
3. Docker installed (for local testing)

## Environment Variables

Set the following environment variables in Cloud Run:

```bash
ANTHROPIC_API_KEY=your-api-key-here
NODE_ENV=production
```

## Deployment Steps

### Option 1: Deploy using gcloud

```bash
# Build and deploy to Cloud Run
gcloud run deploy acquisition-assistant \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars ANTHROPIC_API_KEY=your-api-key-here
```

### Option 2: Build Docker image manually

```bash
# Build the Docker image
docker build -t acquisition-assistant .

# Test locally
docker run -p 8080:8080 \
  -e ANTHROPIC_API_KEY=your-api-key-here \
  acquisition-assistant

# Tag and push to Google Container Registry
docker tag acquisition-assistant gcr.io/YOUR_PROJECT_ID/acquisition-assistant
docker push gcr.io/YOUR_PROJECT_ID/acquisition-assistant

# Deploy to Cloud Run
gcloud run deploy acquisition-assistant \
  --image gcr.io/YOUR_PROJECT_ID/acquisition-assistant \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars ANTHROPIC_API_KEY=your-api-key-here
```

## Architecture

The Cloud Run deployment includes:

- **Express server** (`server.js`) that handles:
  - Serving the built Vite frontend from `/dist`
  - API routes at `/api/*`
  - Health checks at `/health` and `/api/health`
- **API handlers** from the `/api` directory
- **CORS configuration** to allow cross-origin requests

## API Endpoints

- `POST /api/chat` - Main chat endpoint
- `POST /api/mcp` - MCP integration
- `POST /api/document-analysis` - Document analysis
- `POST /api/url-query` - URL content queries
- `POST /api/slide-ranger` - Slide generation
- `GET /health` - Health check

## Troubleshooting

### 500 Internal Server Error

1. **Check API Key**: Ensure `ANTHROPIC_API_KEY` is set in Cloud Run environment variables
2. **Check Logs**: View logs in Cloud Run console
   ```bash
   gcloud run services logs tail acquisition-assistant
   ```

### CORS Issues

The CORS configuration in `api/_cors.js` now allows all origins. If you need to restrict origins, update the `applyCors` function.

### Build Failures

Ensure Node.js 24 is being used (specified in `package.json` engines).
