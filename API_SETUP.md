# API Setup Guide

## Security Notice

API keys should remain server-side. The app's serverless routes read `process.env.ANTHROPIC_API_KEY` and do **not** expose keys to the browser.

## Add Your Anthropic API Key

1. **Get your Anthropic API key:**
   - Go to https://console.anthropic.com/
   - Sign in or create an account
   - Navigate to **API Keys** and click **Create Key**
   - Copy the key (it starts with `sk-ant-`)

2. **For Local Development:**
   - Create a `.env` file in the project root (if it doesn't exist)
   - Add: `ANTHROPIC_API_KEY=sk-ant-your-key-here`

3. **For Deployment (Vercel, GitHub Actions, etc.):**
   - Open your deployment platform's environment variables settings
   - Add a variable named `ANTHROPIC_API_KEY` with your key value
   - Redeploy your application so the serverless functions can read the new key

## Example .env file

```
ANTHROPIC_API_KEY=sk-ant-api03-abc123xyz...
```

## Using the Model

- The app uses Claude Sonnet 4 for all responses.
- Requests are proxied through `/api/chat` and `/api/chat-with-mcp`, which both read `process.env.ANTHROPIC_API_KEY`.

## Notes

- API keys are **not** exposed in client-side code.
- The `.env` file is in `.gitignore` and should never be committed.
- For production deployments, configure `ANTHROPIC_API_KEY` in your platform's dashboard and redeploy.
