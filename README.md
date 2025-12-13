# Acquisition-Assistant

An intelligent procurement assistant to support federal acquisition teams. Powered by Anthropic Claude Sonnet 4 (2025-05-14).

## Features

- **Claude-Powered Guidance**: Uses Anthropic `claude-sonnet-4-20250514` for procurement assistance
- **Knowledge Base**: Upload and manage custom documents
- **Persistent Storage**: Chat history and documents saved locally
- **Streaming Responses**: Real-time AI responses

## Setup

1. Clone the repository
2. Install dependencies: `npm install`
3. Copy `.env.example` to `.env`
4. Add your API key:
   - `ANTHROPIC_API_KEY` - Create in the Anthropic console (server-side only)
5. Run the app: `npm run dev`

> Use **Node 24**. Production builds on Vercel use `npm ci` followed by `npm run build`, matching this setup. Run `nvm use` in the repo root to pick up the pinned Node version from `.nvmrc`; set the same version (24.x) in the Vercel project settings if it differs.

## Troubleshooting

- **"API key not configured"**: Verify the key exists for the exact Vercel environment you're deploying (Production **and** Preview are independent). You can set a global `ANTHROPIC_API_KEY` or add environment-specific overrides (`ANTHROPIC_API_KEY_PREVIEW`, `ANTHROPIC_API_KEY_PROD`). After adding or editing the variable, redeploy so the serverless functions pick up the change.
- **Model errors mentioning `claude-4`**: Clear any custom `ANTHROPIC_MODEL` value in your environment variables. The serverless routes default to `claude-sonnet-4-20250514` and will remap legacy aliases (`claude-4`, `claude-4.0`) automatically on deploy.

## Usage

- Select your preferred AI model from the dropdown
- Upload documents to the knowledge base via the sidebar
- Chat with the AI assistant
- Download chat history anytime

## Deployment quick tip (Vercel)

- Push to `main` to deploy automatically.
- If GitHub shows merge conflicts on your PR, resolve them locally and push the merge before Vercel can build; once fixed, trigger a fresh deploy if needed with `vercel --prod --force`.
- If Vercel ever looks stuck on an old build, run `vercel --prod --force` from the repo root to trigger a fresh production build using the `vercel.json` settings.

## What to Do Next

If you're recovering the working Vercel deployment or want a checklist for keeping GitHub in sync, see [NEXT_STEPS.md](./NEXT_STEPS.md) for a concise, step-by-step guide. The pull request alone won't copy the live Vercel build back into GitHub—you need to run the steps in that guide to pull the production snapshot and push it to your repo.
