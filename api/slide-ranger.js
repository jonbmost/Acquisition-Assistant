import { applyCors, handleOptions } from './_cors.js';

export const runtime = 'nodejs';

export const config = {
  maxDuration: 60
};

const DEFAULT_MODEL = 'claude-sonnet-4-20250514';
const SLIDE_PROMPT =
  'Turn the following mission notes into a formatted presentation with 5–10 PowerPoint-style slides. Each slide should include a clear title, bullet points, and a slide-level design. Return structured JSON shaped like [{title: "...", bullets: ["...", "..."], themeColor: "#0ea5e9", accentColor: "#0f172a", icon: "🚀"}, ...]. Provide contrasting hex colors for themeColor and accentColor that work on dark backgrounds. Do not include any text outside the JSON array.';

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

function extractTextFromResponse(data) {
  if (Array.isArray(data?.content)) {
    const joined = data.content
      .map((part) => (typeof part?.text === 'string' ? part.text : ''))
      .filter(Boolean)
      .join('\n\n');

    if (joined.trim()) return joined.trim();
  }

  if (typeof data?.error === 'string' && data.error.trim()) return data.error.trim();
  return '';
}

function parseSlides(rawText) {
  if (!rawText?.trim()) return [];
  const text = rawText.trim();

  const tryParse = (value) => {
    try {
      return JSON.parse(value);
    } catch (err) {
      return null;
    }
  };

  let parsed = tryParse(text);

  if (!parsed) {
    const match = text.match(/\[.*\]/s);
    if (match) {
      parsed = tryParse(match[0]);
    }
  }

  if (!Array.isArray(parsed)) return [];

  const isHexColor = (value) => typeof value === 'string' && /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(value.trim());

  return parsed
    .filter((item) => item && typeof item === 'object')
    .map((item) => ({
      title: typeof item.title === 'string' ? item.title.trim() : 'Slide',
      bullets: Array.isArray(item.bullets)
        ? item.bullets.filter((b) => typeof b === 'string' && b.trim()).map((b) => b.trim())
        : [],
      themeColor: isHexColor(item.themeColor) ? item.themeColor.trim() : '#0f172a',
      accentColor: isHexColor(item.accentColor) ? item.accentColor.trim() : '#22d3ee',
      icon: typeof item.icon === 'string' && item.icon.trim() ? item.icon.trim() : ''
    }));
}

export default async function handler(req, res) {
  if (handleOptions(req, res)) return;

  applyCors(req, res);

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const userInput = typeof req.body?.input === 'string' ? req.body.input.trim() : '';

  if (!userInput) {
    return res.status(400).json({ error: 'Input is required.' });
  }

  try {
    const { apiKey, activeEnv } = resolveApiKey();
    if (!apiKey) {
      console.error('ANTHROPIC_API_KEY missing for slide-ranger route', {
        vercelEnv: process.env.VERCEL_ENV,
        nodeEnv: process.env.NODE_ENV
      });

      const envSpecific = activeEnv === 'preview'
        ? ' (or ANTHROPIC_API_KEY_PREVIEW for Preview deployments)'
        : activeEnv === 'production'
          ? ' (or ANTHROPIC_API_KEY_PROD)'
          : '';

      return res.status(500).json({
        error: 'API key not configured',
        hint: `Add ANTHROPIC_API_KEY${envSpecific} to the ${activeEnv} environment and redeploy.`
      });
    }

    const model = resolveModelName();
    const prompt = `${SLIDE_PROMPT}\n\n${userInput}`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        model,
        max_tokens: 4096,
        system: 'You are a slide creation assistant. Always return only valid JSON with title and bullets for each slide.',
        messages: [
          { role: 'user', content: prompt }
        ]
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const upstream =
        (errorData && (errorData.error?.message || errorData.error)) ||
        response.statusText ||
        'Anthropic API request failed';
      console.error('Anthropic API error (slide-ranger):', { errorData, modelUsed: model });
      return res.status(response.status).json({ error: upstream, details: errorData });
    }

    const data = await response.json();
    const rawText = extractTextFromResponse(data);
    const slides = parseSlides(rawText);

    if (!slides.length) {
      return res.status(502).json({ error: 'Unable to parse slide content from the AI response.' });
    }

    return res.status(200).json({ slides });
  } catch (error) {
    console.error('Slide ranger server error:', error);
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
}
