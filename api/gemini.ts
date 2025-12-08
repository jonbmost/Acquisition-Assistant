import { GoogleGenerativeAI, GoogleSearchRetrieval } from '@google/generative-ai';

export const config = {
  runtime: 'edge',
};

export default async function handler(req: Request) {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const { prompt, history, systemInstruction, enableSearch } = await req.json();

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'API key not configured' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const ai = new GoogleGenerativeAI(apiKey);
    
    // Configure model with Google Search grounding if enabled
    const modelConfig: any = {
      model: 'gemini-2.0-flash-exp',
      systemInstruction: systemInstruction,
    };

    // Add Google Search grounding tool
    if (enableSearch) {
      modelConfig.tools = [{
        googleSearchRetrieval: {
          dynamicRetrievalConfig: {
            mode: 'MODE_DYNAMIC',
            dynamicThreshold: 0.3,
          },
        },
      }];
    }

    const model = ai.getGenerativeModel(modelConfig);

    const chat = model.startChat({
      history: history || [],
    });

    const result = await chat.sendMessageStream(prompt);

    // Create a readable stream for the response
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of result.stream) {
            const text = chunk.text();
            
            // Extract grounding metadata (sources) if available
            const groundingMetadata = chunk.candidates?.[0]?.groundingMetadata;
            
            controller.enqueue(encoder.encode(JSON.stringify({ 
              text,
              groundingMetadata 
            }) + '\n'));
          }
          controller.close();
        } catch (error) {
          controller.error(error);
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
      },
    });
  } catch (error: any) {
    console.error('Gemini API error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
