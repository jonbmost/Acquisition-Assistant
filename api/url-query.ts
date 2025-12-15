// api/url-query.ts
export const runtime = 'nodejs';

export const config = {
  maxDuration: 60,
};

const MODEL_NAME = 'claude-sonnet-4-20250514';

function sanitizeAnswerText(text: string): string {
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

function extractAnswer(data: any): string {
  if (Array.isArray(data?.content)) {
    const merged = data.content
      .map((part: any) => (typeof part?.text === 'string' ? part.text : ''))
      .filter(Boolean)
      .join('\n\n');

    if (merged.trim().length > 0) {
      const sanitized = sanitizeAnswerText(merged);
      if (sanitized.length > 0) {
        return sanitized;
      }
    }
  }

  if (typeof data?.error === 'string' && data.error.trim().length > 0) {
    const sanitized = sanitizeAnswerText(data.error);
    if (sanitized.length > 0) {
      return sanitized;
    }
  }

  return '';
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { mcpUrl, question } = req.body || {};

  if (typeof mcpUrl !== 'string' || !mcpUrl.trim() || typeof question !== 'string' || !question.trim()) {
    return res.status(400).json({ error: 'Invalid request: mcpUrl and question are required.' });
  }

  try {
    // Validate URL format
    new URL(mcpUrl);
  } catch (err) {
    return res.status(400).json({ error: 'Invalid URL provided. Please supply a valid public URL.' });
  }

  const { apiKey, activeEnv } = resolveApiKey();

  if (!apiKey) {
    console.error('ANTHROPIC_API_KEY missing for url-query endpoint', {
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

  const systemPrompt = `You are an acquisition expert assistant.
You have access to the following MCP resource:
${mcpUrl}

Use this document as the source of truth to answer the user's question.
If the question cannot be answered based on the document, say so clearly.
If a more specific subpage would provide better grounded detail (for example, a particular FAR part, section, or DFARS clause), identify the exact deeper URL and present it as "Suggested URL to copy/paste: <link>" so the user can paste it into the URL field.`;

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
            content: question.trim(),
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

      console.error('Anthropic API error on url-query:', { data, modelUsed: MODEL_NAME });
      return res.status(response.status).json({
        error: typeof upstreamMessage === 'string' ? upstreamMessage : 'Upstream request failed',
        details: data,
      });
    }

    const answer = extractAnswer(data);
    return res.status(200).json({ answer, raw: data });
  } catch (error: any) {
    console.error('Server error on url-query:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error?.message || 'Unexpected error occurred',
    });
  }
}
