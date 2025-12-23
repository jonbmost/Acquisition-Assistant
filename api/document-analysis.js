import { applyCors, handleOptions } from './_cors';

export const runtime = 'nodejs';

export const config = {
  maxDuration: 60,
};

const MODEL_NAME = 'claude-sonnet-4-20250514';

function sanitizeAnswerText(text) {
  if (typeof text !== 'string') return '';

  const stripped = text.replace(/<invoke name="mcp">[\s\S]*?<\/invoke>/gi, '').trim();

  return stripped.length > 0 ? stripped : '';
}

function resolveApiKey() {
  const activeEnv = process.env.VERCEL_ENV || process.env.NODE_ENV || 'production';
  const candidates = [
    process.env.ANTHROPIC_API_KEY,
    activeEnv === 'production' ? process.env.ANTHROPIC_API_KEY_PROD : undefined,
    activeEnv === 'production' ? process.env.ANTHROPIC_API_KEY_PRODUCTION : undefined,
    activeEnv === 'preview' ? process.env.ANTHROPIC_API_KEY_PREVIEW : undefined,
    activeEnv === 'development' ? process.env.ANTHROPIC_API_KEY_DEV : undefined,
    process.env.ANTHROPIC_API_KEY_DEFAULT,
  ];

  const trimmed = candidates
    .filter((key) => typeof key === 'string')
    .map((key) => key.trim())
    .find((key) => key.length > 0);

  return { apiKey: trimmed || '', activeEnv };
}

function extractAnswer(data) {
  if (Array.isArray(data?.content)) {
    const merged = data.content
      .map((part) => (typeof part?.text === 'string' ? part.text : ''))
      .filter(Boolean)
      .join('\n\n');

    if (merged.trim().length > 0) {
      const sanitized = sanitizeAnswerText(merged);
      if (sanitized.length > 0) {
        return sanitized;
      }
    }
  }

  if (typeof data?.answer === 'string' && data.answer.trim().length > 0) {
    const sanitized = sanitizeAnswerText(data.answer);
    if (sanitized.length > 0) {
      return sanitized;
    }
  }

  if (typeof data?.error === 'string' && data.error.trim().length > 0) {
    return data.error.trim();
  }

  return '';
}

export default async function handler(req, res) {
  if (handleOptions(req, res)) return;

  applyCors(req, res);

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { filename, question, content } = req.body || {};

  if (typeof question !== 'string' || !question.trim()) {
    return res.status(400).json({ error: 'Invalid request: question is required.' });
  }

  if (typeof content !== 'string' || !content.trim()) {
    return res.status(400).json({ error: 'Invalid request: document content is required.' });
  }

  const safeFilename = typeof filename === 'string' && filename.trim().length > 0 ? filename.trim() : 'uploaded document';
  const trimmedQuestion = question.trim();

  const { apiKey, activeEnv } = resolveApiKey();

  if (!apiKey) {
    console.error('ANTHROPIC_API_KEY missing for document-analysis endpoint', {
      vercelEnv: process.env.VERCEL_ENV,
      nodeEnv: process.env.NODE_ENV,
    });

    const envSpecific = activeEnv === 'preview'
      ? ' (or ANTHROPIC_API_KEY_PREVIEW for Preview deployments)'
      : activeEnv === 'production'
        ? ' (or ANTHROPIC_API_KEY_PROD)'
        : '';

    return res.status(500).json({
      error: 'API key not configured',
      hint: `Add ANTHROPIC_API_KEY${envSpecific} to the ${activeEnv} environment and redeploy.`,
    });
  }

  const systemPrompt = `You are an acquisition expert assistant. You have been provided the contents of a user-uploaded document ("${safeFilename}"). Base your answer only on this document. If the question cannot be answered from the document, say so clearly and note what additional detail would be needed.`;

  const userMessage = `Document content ("${safeFilename}"):\n${content}\n\nUser question: ${trimmedQuestion}`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL_NAME,
        max_tokens: 1024,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: userMessage,
          },
        ],
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      const upstreamMessage =
        (data && (data.error?.message || data.error)) ||
        response.statusText ||
        'Anthropic API request failed';

      console.error('Anthropic API error on document-analysis:', { data, modelUsed: MODEL_NAME });
      return res.status(response.status).json({
        error: typeof upstreamMessage === 'string' ? upstreamMessage : 'Upstream request failed',
        details: data,
      });
    }

    const answer = extractAnswer(data);
    return res.status(200).json({ answer, raw: data });
  } catch (error) {
    console.error('Server error on document-analysis:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error?.message || 'Unexpected error occurred',
    });
  }
}
