import express from 'express';
import OpenAI from 'openai';
import dotenv from 'dotenv';
import { Message } from '../models/Message';
import { File } from '../models/File';

dotenv.config();

const router = express.Router();
const openai = new OpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey: process.env.OPENROUTER_API_KEY,
    defaultHeaders: {
        "HTTP-Referer": "http://localhost:5173",
        "X-Title": "AgentX",
    }
});

// Get chat history
router.get('/:projectId', async (req, res) => {
    try {
        const messages = await Message.find({ projectId: req.params.projectId }).sort({ createdAt: 1 });
        res.json(messages);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching history', error });
    }
});

// Send message & get response
router.post('/', async (req, res) => {
    try {
        const { messages, projectId } = req.body;
        const lastUserMessage = messages[messages.length - 1];

        // 1. Save User Message
        if (lastUserMessage && lastUserMessage.role === 'user') {
            const userMsg = new Message({
                role: 'user',
                content: lastUserMessage.content,
                projectId
            });
            await userMsg.save();
        }

        // 2. Prepare Context (Files)
        const files = await File.find({ projectId });
        let systemContext = "";
        if (files.length > 0) {
            systemContext = "You have access to the following documents:\n" +
                files.map(f => `--- DOCUMENT: ${f.filename} ---\n${f.content}\n--- END DOCUMENT ---`).join("\n") +
                "\n\nAnswer the user's question based on these documents if relevant.\n";
        }

        // Inject context into the first system message or create one
        let finalMessages = [...messages];
        if (systemContext) {
            const systemIndex = finalMessages.findIndex(m => m.role === 'system');
            if (systemIndex >= 0) {
                finalMessages[systemIndex].content += "\n\n" + systemContext;
            } else {
                finalMessages.unshift({ role: 'system', content: systemContext });
            }
        }

        // 3. Get AI Response (Streaming)
        const stream = await openai.chat.completions.create({
            model: "google/gemini-2.0-flash-exp:free",
            messages: finalMessages,
            stream: true,
        });

        // Headers are set only if stream creation succeeds
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        res.setHeader('Transfer-Encoding', 'chunked');

        let aiContent = "";

        for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content || "";
            if (content) {
                res.write(content);
                aiContent += content;
            }
        }

        res.end();

        // 4. Save AI Message (After stream completes)
        if (aiContent) {
            const aiMsg = new Message({
                role: 'assistant',
                content: aiContent,
                projectId
            });
            await aiMsg.save();
        }

    } catch (error: any) {
        console.error('OpenAI Error:', error);

        // If headers haven't been sent yet, send JSON error
        if (!res.headersSent) {
            let status = 500;
            let message = 'Error generating response';

            // Check for specific OpenAI error codes
            if (error.status === 402 || error.code === 402) {
                status = 402;
                message = "Free tier limit exceeded. Please try again later or check your plan.";
            } else if (error.status === 429 || error.code === 429 || error.type === 'insufficient_quota') {
                status = 429;
                message = "Rate limit exceeded. The free tier for this model is temporarily busy.";
            }

            res.status(status).json({ message, details: error.message });
        } else {
            // If stream started, we can't send JSON, so just end it with an error message in the stream
            res.write(`\n\n[Error: ${error.message || 'Connection interrupted'}]`);
            res.end();
        }
    }
});

export default router;
