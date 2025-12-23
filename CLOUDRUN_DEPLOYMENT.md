# Cloud Run Deployment Guide

This guide explains how to deploy the Acquisition Assistant to Google Cloud Run with production-ready configuration for multi-user scalability.

## Architecture Overview

This is a **unified containerized deployment** that includes:

- **Express.js server** serving both frontend and backend
- **Vite React frontend** for the UI
- **API routes** for Claude AI integration
- **Production optimizations**: Multi-stage Docker build, non-root user, graceful shutdown
- **Observability**: Structured JSON logging, request IDs, health checks

## Prerequisites

1. **Google Cloud Project** with Cloud Run API enabled
2. **gcloud CLI** installed and authenticated ([Install Guide](https://cloud.google.com/sdk/docs/install))
3. **Anthropic API Key** ([Get one here](https://console.anthropic.com/))
4. *Optional*: Docker installed (for local testing)

## Quick Start Deployment

### Option 1: Automated Deployment (Recommended)

```bash
# Set your environment variables
export GCP_PROJECT_ID="your-project-id"
export ANTHROPIC_API_KEY="sk-ant-your-key-here"

# Run the deployment script
./deploy-cloudrun.sh
```

The script will:
- Validate prerequisites
- Build and deploy to Cloud Run
- Configure auto-scaling (0-10 instances)
- Set up health checks
- Display the service URL

### Option 2: Manual Deployment

```bash
gcloud run deploy acquisition-assistant \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --min-instances 0 \
  --max-instances 10 \
  --memory 1Gi \
  --cpu 1 \
  --timeout 300 \
  --concurrency 80 \
  --set-env-vars NODE_ENV=production,ANTHROPIC_API_KEY=your-key-here
```

## Production Configuration

### Scaling Parameters

The deployment is configured for multi-user scalability:

- **Min Instances**: 0 (scales to zero when idle)
- **Max Instances**: 10 (adjust based on expected load)
- **Concurrency**: 80 requests per instance
- **Memory**: 1Gi per instance
- **CPU**: 1 vCPU per instance
- **Timeout**: 300 seconds (for long AI operations)

### Security Features

- ✅ Non-root user execution
- ✅ Security headers (X-Frame-Options, X-Content-Type-Options, X-XSS-Protection)
- ✅ Request ID tracking
- ✅ Graceful shutdown handling
- ✅ Multi-stage Docker build (smaller attack surface)

### Observability

- **Structured JSON logging** for Cloud Logging integration
- **Request IDs** in all logs and responses (`X-Request-ID` header)
- **Health check endpoints**: `/health` and `/api/health`
- **Request/response duration tracking**

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/chat` | POST | Main chat with Claude |
| `/api/mcp` | POST | MCP-enhanced chat |
| `/api/document-analysis` | POST | Analyze uploaded documents |
| `/api/url-query` | POST | Query content from URLs |
| `/api/slide-ranger` | POST | Generate presentation slides |
| `/health` | GET | Health check (JSON response) |
| `/api/health` | GET | API health check |

All endpoints support CORS for cross-origin requests.

## Local Testing

### Test the Docker build locally:

```bash
# Build the image
docker build -t acquisition-assistant .

# Run locally
docker run -p 8080:8080 \
  -e ANTHROPIC_API_KEY=your-key-here \
  -e NODE_ENV=production \
  acquisition-assistant

# Test the endpoints
curl http://localhost:8080/health
```

## Environment Variables

### Required

- `ANTHROPIC_API_KEY` - Your Anthropic API key

### Optional

- `NODE_ENV` - Set to `production` (auto-set by deployment)
- `PORT` - Server port (auto-set by Cloud Run to 8080)

### Setting Environment Variables After Deployment

```bash
gcloud run services update acquisition-assistant \
  --set-env-vars ANTHROPIC_API_KEY=new-key-here \
  --region us-central1
```

## Monitoring and Logs

### View real-time logs:

```bash
gcloud run services logs tail acquisition-assistant --region us-central1
```

### View in Cloud Console:

```bash
# Get the console URL
echo "https://console.cloud.google.com/run/detail/us-central1/acquisition-assistant/metrics?project=$(gcloud config get-value project)"
```

### Key Metrics to Monitor:

- **Request Count**: Total API calls
- **Request Latency**: Response times (p50, p95, p99)
- **Error Rate**: 4xx and 5xx responses
- **Instance Count**: Auto-scaling behavior
- **Memory Usage**: Per-instance memory consumption

## Troubleshooting

### 500 Internal Server Error

1. **Check API Key**:
   ```bash
   gcloud run services describe acquisition-assistant \
     --region us-central1 \
     --format "value(spec.template.spec.containers[0].env)"
   ```

2. **Check Logs**:
   ```bash
   gcloud run services logs tail acquisition-assistant --region us-central1
   ```

3. **Common Issues**:
   - Missing `ANTHROPIC_API_KEY` environment variable
   - Invalid API key
   - Anthropic API rate limits

### Build Failures

- Ensure Node.js 24 is used (specified in `package.json` engines)
- Check `.gcloudignore` isn't excluding necessary files
- Review build logs: `gcloud builds log <BUILD_ID>`

### Performance Issues

- **Increase instance count**: Adjust `--max-instances`
- **Increase memory**: Use `--memory 2Gi` or higher
- **Reduce cold starts**: Set `--min-instances 1` (costs more)

### CORS Errors

- CORS is configured to accept all origins in `api/_cors.js`
- If you need to restrict origins, modify the `applyCors` function

## Cost Optimization

### Free Tier Eligible
Cloud Run provides generous free tier:
- 2 million requests/month
- 360,000 vCPU-seconds/month
- 180,000 GiB-seconds/month

### Cost Reduction Tips

1. **Scale to zero**: Keep `--min-instances 0` for development
2. **Optimize requests**: Cache responses when possible
3. **Monitor usage**: Set up billing alerts
4. **Use regional endpoints**: Deploy in same region as users

## Scaling for High Traffic

For enterprise workloads with thousands of concurrent users:

```bash
gcloud run deploy acquisition-assistant \
  --source . \
  --platform managed \
  --region us-central1 \
  --min-instances 3 \
  --max-instances 100 \
  --memory 2Gi \
  --cpu 2 \
  --concurrency 100
```

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Deploy to Cloud Run

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - id: auth
        uses: google-github-actions/auth@v1
        with:
          credentials_json: ${{ secrets.GCP_SA_KEY }}

      - name: Deploy to Cloud Run
        uses: google-github-actions/deploy-cloudrun@v1
        with:
          service: acquisition-assistant
          region: us-central1
          env_vars: |
            NODE_ENV=production
            ANTHROPIC_API_KEY=${{ secrets.ANTHROPIC_API_KEY }}
```

## Support

For issues or questions:
1. Check logs: `gcloud run services logs tail acquisition-assistant`
2. Review [Cloud Run documentation](https://cloud.google.com/run/docs)
3. Open an issue in the repository
