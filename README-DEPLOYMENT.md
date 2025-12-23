# Deployment Architecture

This repository is the **backend API server** for the Acquisition Assistant application.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  Frontend (Vercel)                                         │
│  https://rapidacq-frontend-4kht.vercel.app/                │
│  Repo: rapidacq-frontend                                   │
│                                                             │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       │ API Calls
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  Backend API (Cloud Run)                                   │
│  https://acquisition-assistant-266001336704...run.app      │
│  Repo: Acquisition-Assistant (THIS REPO)                   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## This Repository (Backend)

**Purpose**: API server that handles Claude AI requests

**Deployment Target**: Google Cloud Run

**URL**: `https://acquisition-assistant-266001336704.us-central1.run.app`

**Contents**:
- Express.js server (`server.js`)
- API route handlers (`/api` folder)
- Knowledge base files
- MCP server configuration (for local development)

## How to Deploy the Backend

### Quick Deploy

```bash
# Set environment variables
export GCP_PROJECT_ID="your-project-id"
export ANTHROPIC_API_KEY="sk-ant-your-key"

# Deploy to Cloud Run
./deploy-cloudrun.sh
```

### Manual Deploy

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
  --set-env-vars ANTHROPIC_API_KEY=your-key-here
```

## API Endpoints

All endpoints are prefixed with the Cloud Run URL:

- `POST /api/chat` - Main chat with Claude
- `POST /api/mcp` - MCP-enhanced chat
- `POST /api/document-analysis` - Analyze documents
- `POST /api/url-query` - Query content from URLs
- `POST /api/slide-ranger` - Generate slides
- `GET /health` - Health check

## Frontend Repository

The frontend is deployed separately:

**Repo**: https://github.com/jonbmost/rapidacq-frontend
**Deployment**: Vercel
**URL**: https://rapidacq-frontend-4kht.vercel.app/

The frontend makes API calls to this backend API server.

## Environment Variables

### Required

- `ANTHROPIC_API_KEY` - Your Anthropic API key (set in Cloud Run)

### Optional

- `NODE_ENV` - Automatically set to `production`
- `PORT` - Automatically set by Cloud Run to `8080`

## CORS Configuration

The backend accepts requests from:
- `http://localhost:5173` (local development)
- `https://rapidacq-frontend.vercel.app`
- `https://rapidacq-frontend-4kht.vercel.app`
- Any other origin (fallback to `*`)

Configure in `api/_cors.js` if you need to add more origins.

## Monitoring

View logs:
```bash
gcloud run services logs tail acquisition-assistant --region us-central1
```

Check health:
```bash
curl https://acquisition-assistant-266001336704.us-central1.run.app/health
```

## Development Workflow

1. **Local Testing**: Run `npm run dev` (Vite dev server - but this repo is backend-focused)
2. **Backend Testing**: Run `npm start` after building
3. **Deploy Backend**: Use `./deploy-cloudrun.sh`
4. **Update Frontend**: Deploy changes in the `rapidacq-frontend` repo

## Cost

- Cloud Run free tier: 2M requests/month
- Scales to zero when idle
- Typical cost: $0-5/month for low traffic

For detailed deployment instructions, see [CLOUDRUN_DEPLOYMENT.md](CLOUDRUN_DEPLOYMENT.md).
