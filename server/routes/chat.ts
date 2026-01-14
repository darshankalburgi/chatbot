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

        // 3. Get AI Response
        const completion = await openai.chat.completions.create({
            model: "meta-llama/llama-3.2-3b-instruct:free",
            messages: finalMessages,
        });

        const aiContent = completion.choices[0].message.content || "";

        // 3. Save AI Message
        const aiMsg = new Message({
            role: 'assistant',
            content: aiContent,
            projectId
        });
        await aiMsg.save();

        res.json({ message: { role: 'assistant', content: aiContent } });
    } catch (error) {
        console.error('OpenAI Error:', error);
        res.status(500).json({ message: 'Error generating response', details: error instanceof Error ? error.message : String(error) });
    }
});

export default router;
