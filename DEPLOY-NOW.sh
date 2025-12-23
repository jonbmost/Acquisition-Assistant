#!/bin/bash

# Quick deployment script - just run this!

echo "🚀 Deploying backend API to Cloud Run..."
echo ""

# Check if you have the Anthropic API key
if [ -z "$ANTHROPIC_API_KEY" ]; then
    echo "⚠️  Please set your Anthropic API key:"
    echo "export ANTHROPIC_API_KEY='sk-ant-your-actual-key-here'"
    echo ""
    echo "Then run this script again: ./DEPLOY-NOW.sh"
    exit 1
fi

# Deploy to Cloud Run
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
  --set-env-vars NODE_ENV=production,ANTHROPIC_API_KEY="$ANTHROPIC_API_KEY"

echo ""
echo "✅ Deployment complete!"
echo ""
echo "Test it:"
echo "curl https://acquisition-assistant-266001336704.us-central1.run.app/health"
