export const config = {
  runtime: 'nodejs',
};

export default async function handler(req: Request) {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const { messages, systemInstruction } = await req.json();

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      console.error('ANTHROPIC_API_KEY not found in environment');
      return new Response(JSON.stringify({ error: 'API key not configured' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    console.log('Calling Anthropic API...');

    // Direct HTTP call to Anthropic API
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01',
        'x-api-key': apiKey,
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 8192,
        system: systemInstruction,
        messages: messages,
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Anthropic API error:', response.status, errorText);
      const errorData = JSON.parse(errorText || '{}');
      return new Response(JSON.stringify({ 
        error: `Anthropic API error: ${errorData.error?.message || response.statusText}`,
        details: errorData 
      }), {
        status: response.status,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    console.log('Anthropic API response received, streaming...');

    // Pass through the stream directly
    return new Response(response.body, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error: any) {
    console.error('Claude API handler error:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'Unknown error',
      stack: error.stack 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
