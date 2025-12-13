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
   - On Vercel, set it for the specific environment you deploy (Production and Preview are separate scopes)
   - If you keep different keys per scope, you can also add `ANTHROPIC_API_KEY_PREVIEW` or `ANTHROPIC_API_KEY_PROD`; the API routes will pick the key that matches `VERCEL_ENV`
   - Redeploy your application so the serverless functions can read the new key

## Example .env file

```
ANTHROPIC_API_KEY=sk-ant-api03-abc123xyz...
```

## Using the Model

- The app uses `claude-sonnet-4-20250514` for all responses.
- Requests are proxied through `/api/chat` and `/api/chat-with-mcp`, which both read `process.env.ANTHROPIC_API_KEY` (or environment-specific overrides like `ANTHROPIC_API_KEY_PREVIEW` / `ANTHROPIC_API_KEY_PROD`).

## Notes

- API keys are **not** exposed in client-side code.
- The `.env` file is in `.gitignore` and should never be committed.
- For production deployments, configure `ANTHROPIC_API_KEY` in your platform's dashboard and redeploy.
- If you receive "API key not configured", double-check that the key exists for the environment you are deploying (local `.env`, Vercel Production, or Vercel Preview). You can set `ANTHROPIC_API_KEY` globally or use per-scope overrides (`ANTHROPIC_API_KEY_PREVIEW` / `ANTHROPIC_API_KEY_PROD`). After updating, **redeploy** so the serverless functions pick it up. For Vercel, also confirm the key is set under the correct environment tab (Production vs Preview).
