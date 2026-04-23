import { GoogleGenerativeAI } from '@google/generative-ai';
import { createChatbotContext } from '../src/data/gemini';
import paddlersData from '../src/data/paddlers.json';

// Use Edge Runtime for better streaming support and fewer cold start issues on Vercel
export const config = {
  runtime: 'edge'
};

export default async function handler(req: Request) {
    if (req.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
    }

    // Support both in case the Vercel environment variable has VITE_ prefix
    const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
        return new Response(JSON.stringify({ error: 'API key not configured on server' }), { status: 500 });
    }

    let prompt = '';
    let history = [];

    try {
        const body = await req.json();
        prompt = body.prompt;
        history = body.history;
    } catch {
        return new Response(JSON.stringify({ error: 'Invalid JSON body' }), { status: 400 });
    }

    if (!prompt) {
        return new Response(JSON.stringify({ error: 'Prompt is required' }), { status: 400 });
    }

    try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({
            model: 'gemini-3.1-flash-lite-preview',
            systemInstruction: createChatbotContext(paddlersData as any)
        });

        // Transform chat history from frontend format to Gemini format
        const contents = (history || [])
            .filter((msg: any) => msg.role && msg.content)
            .map((msg: any) => ({
                role: msg.role === 'user' ? 'user' : 'model',
                parts: [{ text: msg.content }]
            }));

        const chat = model.startChat({ history: contents });
        const result = await chat.sendMessageStream(prompt);

        // Convert the async iterable to a Web ReadableStream for Edge
        const stream = new ReadableStream({
            async start(controller) {
                const encoder = new TextEncoder();
                try {
                    for await (const chunk of result.stream) {
                        const text = chunk.text();
                        if (text) {
                            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`));
                        }
                    }
                    controller.enqueue(encoder.encode('data: [DONE]\n\n'));
                } catch (err: any) {
                    console.error('Streaming error:', err);
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: err.message || 'Error generating output' })}\n\n`));
                } finally {
                    controller.close();
                }
            }
        });

        return new Response(stream, {
            headers: {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache, no-transform',
                'Connection': 'keep-alive',
                'X-Accel-Buffering': 'no'
            }
        });
    } catch (error: any) {
        console.error('Gemini API error:', error);
        return new Response(JSON.stringify({ error: error.message || 'Failed to generate response' }), { status: 500 });
    }
}
