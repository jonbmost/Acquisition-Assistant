# Acquisition-Assistant

An intelligent procurement assistant to support federal acquisition teams. Supports both Google Gemini and OpenAI ChatGPT models.

## Features

- **Multi-Model Support**: Choose between Google Gemini and OpenAI ChatGPT
- **Knowledge Base**: Upload and manage custom documents
- **Persistent Storage**: Chat history and documents saved locally
- **Streaming Responses**: Real-time AI responses

## Setup

1. Clone the repository
2. Install dependencies: `npm install`
3. Copy `.env.example` to `.env`
4. Add your API keys:
   - `VITE_GEMINI_API_KEY` - Get from [Google AI Studio](https://makersuite.google.com/app/apikey)
   - `VITE_OPENAI_API_KEY` - Get from [OpenAI Platform](https://platform.openai.com/api-keys)
5. Run the app: `npm run dev`

## Usage

- Select your preferred AI model from the dropdown
- Upload documents to the knowledge base via the sidebar
- Chat with the AI assistant
- Download chat history anytime
