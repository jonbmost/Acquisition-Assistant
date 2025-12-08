# API Setup Guide

## Adding Your OpenAI API Key

1. **Get your OpenAI API key:**
   - Go to https://platform.openai.com/api-keys
   - Sign in or create an account
   - Click "Create new secret key"
   - Copy the key (it starts with `sk-`)

2. **Add it to your environment:**
   - Create a `.env` file in the project root (if it doesn't exist)
   - Add: `VITE_OPENAI_API_KEY=sk-your-key-here`

3. **Restart the app:**
   - Stop the development server (Ctrl+C)
   - Run `npm run dev` again

## Adding Your Gemini API Key

1. **Get your Gemini API key:**
   - Go to https://makersuite.google.com/app/apikey
   - Sign in with your Google account
   - Click "Create API Key"
   - Copy the key

2. **Add it to your environment:**
   - In your `.env` file, add: `VITE_GEMINI_API_KEY=your-key-here`

3. **Restart the app**

## Example .env file

```
VITE_GEMINI_API_KEY=AIzaSyDyRN90RYtxB9zsjp7_1GP_GfgF1qEQ0nI
VITE_OPENAI_API_KEY=sk-proj-abc123xyz...
```

## Using the Models

- Once configured, select your preferred model from the dropdown at the top of the chat
- The app will remember your selection
- You can switch between models at any time
- Each model has its own strengths:
  - **Gemini**: Fast, cost-effective, good for general queries
  - **ChatGPT (GPT-4o)**: More advanced reasoning, better for complex tasks

## Notes

- You need at least one API key configured
- API keys are stored locally in your `.env` file (never commit this file to git)
- The `.env` file is already in `.gitignore` for security
