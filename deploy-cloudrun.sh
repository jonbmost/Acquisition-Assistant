#!/bin/bash
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
PROJECT_ID=${GCP_PROJECT_ID:-""}
REGION=${GCP_REGION:-"us-central1"}
SERVICE_NAME=${SERVICE_NAME:-"acquisition-assistant"}
MIN_INSTANCES=${MIN_INSTANCES:-0}
MAX_INSTANCES=${MAX_INSTANCES:-10}
MEMORY=${MEMORY:-"1Gi"}
CPU=${CPU:-1}

echo -e "${GREEN}=== Cloud Run Deployment Script ===${NC}"
echo ""

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo -e "${RED}Error: gcloud CLI is not installed${NC}"
    echo "Install it from: https://cloud.google.com/sdk/docs/install"
    exit 1
fi

# Check if PROJECT_ID is set
if [ -z "$PROJECT_ID" ]; then
    echo -e "${YELLOW}GCP_PROJECT_ID not set. Attempting to get from gcloud config...${NC}"
    PROJECT_ID=$(gcloud config get-value project 2>/dev/null)

    if [ -z "$PROJECT_ID" ]; then
        echo -e "${RED}Error: Could not determine GCP project ID${NC}"
        echo "Set it with: export GCP_PROJECT_ID=your-project-id"
        echo "Or run: gcloud config set project your-project-id"
        exit 1
    fi
fi

echo -e "${GREEN}Project ID:${NC} $PROJECT_ID"
echo -e "${GREEN}Region:${NC} $REGION"
echo -e "${GREEN}Service Name:${NC} $SERVICE_NAME"
echo ""

# Check if ANTHROPIC_API_KEY is set
if [ -z "$ANTHROPIC_API_KEY" ]; then
    echo -e "${YELLOW}Warning: ANTHROPIC_API_KEY environment variable is not set${NC}"
    echo "The deployment will proceed, but the API won't work without this key."
    echo "You can set it later with:"
    echo "  gcloud run services update $SERVICE_NAME --set-env-vars ANTHROPIC_API_KEY=your-key --region $REGION"
    echo ""
    read -p "Continue anyway? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

echo -e "${GREEN}Starting deployment...${NC}"
echo ""

# Deploy to Cloud Run
gcloud run deploy $SERVICE_NAME \
  --source . \
  --platform managed \
  --region $REGION \
  --project $PROJECT_ID \
  --allow-unauthenticated \
  --min-instances $MIN_INSTANCES \
  --max-instances $MAX_INSTANCES \
  --memory $MEMORY \
  --cpu $CPU \
  --timeout 300 \
  --concurrency 80 \
  --set-env-vars NODE_ENV=production \
  ${ANTHROPIC_API_KEY:+--set-env-vars ANTHROPIC_API_KEY=$ANTHROPIC_API_KEY}

echo ""
echo -e "${GREEN}=== Deployment Complete! ===${NC}"
echo ""

# Get the service URL
SERVICE_URL=$(gcloud run services describe $SERVICE_NAME \
  --platform managed \
  --region $REGION \
  --project $PROJECT_ID \
  --format 'value(status.url)')

echo -e "${GREEN}Service URL:${NC} $SERVICE_URL"
echo ""
echo -e "${GREEN}Next steps:${NC}"
echo "1. Test the health endpoint: curl $SERVICE_URL/health"
echo "2. If ANTHROPIC_API_KEY wasn't set, update it:"
echo "   gcloud run services update $SERVICE_NAME --set-env-vars ANTHROPIC_API_KEY=your-key --region $REGION"
echo ""
echo -e "${GREEN}View logs:${NC}"
echo "  gcloud run services logs tail $SERVICE_NAME --region $REGION"
echo ""
echo -e "${GREEN}View in console:${NC}"
echo "  https://console.cloud.google.com/run/detail/$REGION/$SERVICE_NAME/metrics?project=$PROJECT_ID"
