# API Setup Guide

## Security Notice

Your API keys are now secured server-side using Vercel serverless functions. They will never be exposed in the browser.

## Adding Your Claude (Anthropic) API Key

1. **Get your Anthropic API key:**
   - Go to https://console.anthropic.com/
   - Sign in or create an account
   - Navigate to API Keys
   - Click "Create Key"
   - Copy the key (it starts with `sk-ant-`)

2. **For Local Development:**
   - Create a `.env` file in the project root (if it doesn't exist)
   - Add: `ANTHROPIC_API_KEY=sk-ant-your-key-here`

3. **For Vercel Deployment:**
   - Go to your Vercel project dashboard
   - Settings → Environment Variables
   - Add: `ANTHROPIC_API_KEY` with your key
   - **Important:** Do NOT check "Expose to client" - keep it server-side only
   - Copy the key

2. **For Local Development:**
   - In your `.env` file, add: `GEMINI_API_KEY=your-key-here`


## Example .env file

```
ANTHROPIC_API_KEY=sk-ant-api03-abc123xyz...
```

## Using the Model

- The app now uses Claude (Anthropic) by default
- Claude Sonnet 4 provides excellent reasoning and context understanding
- Ideal for complex acquisition tasks and document generation

## Security Features

- ✅ API keys are stored server-side only
- ✅ Keys never exposed in browser/client code
- ✅ Requests proxied through Vercel serverless functions
- ✅ No risk of key theft from browser inspection

## Notes

- You need an Anthropic API key configured
- API keys are stored locally in your `.env` file (never commit this file to git)
- The `.env` file is already in `.gitignore` for security
- For production, keys are set in Vercel dashboard and kept server-side


