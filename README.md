# Acquisition-Assistant

An intelligent procurement assistant to support federal acquisition teams. Powered by Anthropic Claude Sonnet 4.

## Features

- **Claude-Powered Guidance**: Uses Anthropic Claude Sonnet 4 for procurement assistance
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

## Usage

- Select your preferred AI model from the dropdown
- Upload documents to the knowledge base via the sidebar
- Chat with the AI assistant
- Download chat history anytime

## What to Do Next

If you're recovering the working Vercel deployment or want a checklist for keeping GitHub in sync, see [NEXT_STEPS.md](./NEXT_STEPS.md) for a concise, step-by-step guide. The pull request alone won't copy the live Vercel build back into GitHub—you need to run the steps in that guide to pull the production snapshot and push it to your repo.
