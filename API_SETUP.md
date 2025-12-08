# API Setup Guide

## Security Notice

Your API keys are now secured server-side using Vercel serverless functions. They will never be exposed in the browser.

## Adding Your OpenAI API Key

1. **Get your OpenAI API key:**
   - Go to https://platform.openai.com/api-keys
   - Sign in or create an account
   - Click "Create new secret key"
   - Copy the key (it starts with `sk-`)

2. **For Local Development:**
   - Create a `.env` file in the project root (if it doesn't exist)
   - Add: `OPENAI_API_KEY=sk-your-key-here`

3. **For Vercel Deployment:**
   - Go to your Vercel project dashboard
   - Settings → Environment Variables
   - Add: `OPENAI_API_KEY` with your key
   - **Important:** Do NOT check "Expose to client" - keep it server-side only

## Adding Your Gemini API Key

1. **Get your Gemini API key:**
   - Go to https://makersuite.google.com/app/apikey
   - Sign in with your Google account
   - Click "Create API Key"
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

