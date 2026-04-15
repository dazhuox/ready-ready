import { GoogleGenerativeAI } from '@google/generative-ai';
import { createChatbotContext } from '../src/data/gemini';
import paddlersData from '../src/data/paddlers.json';

// Vercel Serverless Function — keeps the API key server-side
export default async function handler(req: any, res: any) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        return res.status(500).json({ error: 'API key not configured on server' });
    }

    const { prompt, history } = req.body;

    if (!prompt) {
        return res.status(400).json({ error: 'Prompt is required' });
    }

    // Set up Server-Sent Events for streaming
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');

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

        for await (const chunk of result.stream) {
            const text = chunk.text();
            if (text) {
                res.write(`data: ${JSON.stringify({ text })}\n\n`);
            }
        }

        res.write('data: [DONE]\n\n');
        res.end();
    } catch (error: any) {
        console.error('Gemini API error:', error);
        res.write(`data: ${JSON.stringify({ error: error.message || 'Failed to generate response' })}\n\n`);
        res.end();
    }
}
