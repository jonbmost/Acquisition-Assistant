# API Setup Guide

## Security Notice

Your API key is configured for client-side use. For production, consider additional security measures.

## Adding Your Claude (Anthropic) API Key

1. **Get your Anthropic API key:**
   - Go to https://console.anthropic.com/
   - Sign in or create an account
   - Navigate to API Keys
   - Click "Create Key"
   - Copy the key (it starts with `sk-ant-`)

2. **For Local Development:**
   - Create a `.env` file in the project root (if it doesn't exist)
   - Add: `VITE_ANTHROPIC_API_KEY=sk-ant-your-key-here`

3. **For Deployment (Vercel, Netlify, etc.):**
   - Go to your deployment platform's dashboard
   - Navigate to Environment Variables settings
   - Add: `VITE_ANTHROPIC_API_KEY` with your key value
   - Redeploy your application

## Example .env file

```
VITE_ANTHROPIC_API_KEY=sk-ant-api03-abc123xyz...
```

## Using the Model

- The app uses Claude Sonnet 4 for all responses
- Claude provides excellent reasoning and context understanding
- Ideal for complex acquisition tasks and document generation

## Notes

- API key is embedded in the build (exposed to client)
- The `.env` file is in `.gitignore` and never committed
- For production deployments, set `VITE_ANTHROPIC_API_KEY` in your platform's environment variables

   - Copy the key

2. **For Local Development:**
   - In your `.env` file, add: `GEMINI_API_KEY=your-key-here`

3. **For Vercel Deployment:**
   - Go to your Vercel project dashboard
   - Settings → Environment Variables
   - Add: `GEMINI_API_KEY` with your key
   - **Important:** Do NOT check "Expose to client" - keep it server-side only

## Example .env file

```
GEMINI_API_KEY=AIzaSyDyRN90RYtxB9zsjp7_1GP_GfgF1qEQ0nI
OPENAI_API_KEY=sk-proj-abc123xyz...
```

## Using the Models

- Once configured, select your preferred model from the dropdown at the top of the chat
- The app will remember your selection
- You can switch between models at any time
- Each model has its own strengths:
  - **Gemini**: Fast, cost-effective, good for general queries
  - **ChatGPT (GPT-4o)**: More advanced reasoning, better for complex tasks

## Security Features

- ✅ API keys are stored server-side only
- ✅ Keys never exposed in browser/client code
- ✅ Requests proxied through Vercel serverless functions
- ✅ No risk of key theft from browser inspection

## Notes

- You need at least one API key configured
- API keys are stored locally in your `.env` file (never commit this file to git)
- The `.env` file is already in `.gitignore` for security
- For production, keys are set in Vercel dashboard and kept server-side

