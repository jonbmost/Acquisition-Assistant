// api/chat-with-mcp.js
// This is a Vercel serverless function that handles MCP integration

// Explicitly declare the supported runtime; node version is enforced via engines/project settings
export const runtime = 'nodejs';

export const config = {
  maxDuration: 60
};

export default async function handler(req, res) {
  // Only accept POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { messages, system } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Invalid request: messages required' });
    }

    // Get API key from environment variable
    const apiKey = process.env.ANTHROPIC_API_KEY?.trim();
    if (!apiKey) {
      return res.status(500).json({
        error: 'API key not configured',
        hint:
          'Add ANTHROPIC_API_KEY in your environment (local .env or Vercel project settings for Production and Preview) and redeploy.'
      });
    }

    // Call Anthropic API with MCP configuration
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20240620',
        max_tokens: 4096,
        system: system || 'You are a helpful AI assistant.',
        messages: messages,
        
        // MCP server configuration - works server-side
        mcp_servers: [
          {
            type: 'url',
            url: 'https://aitbot-tau.vercel.app/sse',
            name: 'federal-acquisition'
          }
        ]
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const upstreamMessage =
        (errorData && (errorData.error?.message || errorData.error)) ||
        response.statusText ||
        'Anthropic API request failed';

      console.error('Anthropic API error:', errorData);
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
