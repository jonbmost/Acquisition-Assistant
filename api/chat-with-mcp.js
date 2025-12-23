// api/chat-with-mcp.js
// This is a Vercel serverless function that handles MCP integration

// Explicitly declare the supported runtime; node version is enforced via engines/project settings
import { applyCors, handleOptions } from './_cors.js';

export const runtime = 'nodejs';

export const config = {
  maxDuration: 60
};

const DEFAULT_MODEL = 'claude-sonnet-4-20250514';

function resolveApiKey() {
  const activeEnv = process.env.VERCEL_ENV || process.env.NODE_ENV || 'production';
  const candidates = [
    process.env.ANTHROPIC_API_KEY,
    activeEnv === 'production' ? process.env.ANTHROPIC_API_KEY_PROD : undefined,
    activeEnv === 'production' ? process.env.ANTHROPIC_API_KEY_PRODUCTION : undefined,
    activeEnv === 'preview' ? process.env.ANTHROPIC_API_KEY_PREVIEW : undefined,
    activeEnv === 'development' ? process.env.ANTHROPIC_API_KEY_DEV : undefined,
    process.env.ANTHROPIC_API_KEY_DEFAULT
  ];

  const trimmed = candidates
    .filter((key) => typeof key === 'string')
    .map((key) => key.trim())
    .find((key) => key.length > 0);

  return { apiKey: trimmed || '', activeEnv };
}

function resolveModelName() {
  const configured = (process.env.ANTHROPIC_MODEL || '').trim();

  if (configured === 'claude-4' || configured === 'claude-4.0') {
    return DEFAULT_MODEL;
  }

  return configured || DEFAULT_MODEL;
}

function sanitizeMessages(rawMessages) {
  if (!Array.isArray(rawMessages)) return [];

  return rawMessages
    .filter((msg) => typeof msg?.content === 'string' && msg.content.trim().length > 0)
    .map((msg) => ({
      ...msg,
      content: msg.content.trim(),
    }));
}

export default async function handler(req, res) {
  // Only accept POST requests
  if (handleOptions(req, res)) return;

  applyCors(req, res);

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { messages, system } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Invalid request: messages required' });
    }

    const sanitizedMessages = sanitizeMessages(messages);

    if (sanitizedMessages.length === 0) {
      return res.status(400).json({ error: 'Invalid request: messages must include non-empty content' });
    }

    const { apiKey, activeEnv } = resolveApiKey();

    if (!apiKey) {
      console.error('ANTHROPIC_API_KEY missing in runtime environment', {
        vercelEnv: process.env.VERCEL_ENV,
        nodeEnv: process.env.NODE_ENV,
        availableKeys: Object.keys(process.env || {}).filter(key => key.includes('ANTHROPIC'))
      });

      const envSpecific = activeEnv === 'preview'
        ? ' (or ANTHROPIC_API_KEY_PREVIEW for Preview deployments)'
        : activeEnv === 'production'
          ? ' (or ANTHROPIC_API_KEY_PROD)'
          : '';

      return res.status(500).json({
        error: 'API key not configured',
        hint:
          `Add ANTHROPIC_API_KEY${envSpecific} to the ${activeEnv} environment (local .env or Vercel Project Settings → Environment Variables) and redeploy.`
      });
    }

    const model = resolveModelName();

    // Call Anthropic API
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model,
        max_tokens: 4096,
        system: system || 'You are a helpful AI assistant.',
        messages: sanitizedMessages
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const upstreamMessage =
        (errorData && (errorData.error?.message || errorData.error)) ||
        response.statusText ||
        'Anthropic API request failed';

      console.error('Anthropic API error:', { errorData, modelUsed: model });
      return res.status(response.status).json({
        error: upstreamMessage,
        details: errorData
      });
    }

    const data = await response.json();
    return res.status(200).json(data);

  } catch (error) {
    console.error('Server error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
}
