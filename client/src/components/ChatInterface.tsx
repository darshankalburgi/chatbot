import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import api from '../api';

interface Message {
    role: 'user' | 'assistant' | 'system';
    content: string;
}

interface ChatInterfaceProps {
    projectId: string;
    prompts: { content: string }[];
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ projectId, prompts }) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    // Fetch history on mount
    useEffect(() => {
        if (projectId) {
            api.get(`/chat/${projectId}`)
                .then(res => {
                    // Filter out system messages if you don't want to show them, or keep them.
                    // Assuming DB returns all messages.
                    setMessages(res.data);
                })
                .catch(err => console.error("Failed to fetch chat history", err));
        }
    }, [projectId]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const sendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim()) return;

        const userMessage: Message = { role: 'user', content: input };

        // Construct context from prompts
        const systemMessages: Message[] = prompts.map(p => ({ role: 'system', content: p.content }));
        const conversationHistory = [...messages, userMessage];

        // Full payload
        const payloadMessages = [...systemMessages, ...conversationHistory];

        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setLoading(true);

        try {
            const res = await api.post('/chat', { messages: payloadMessages, projectId });
            setMessages(prev => [...prev, res.data.message]);
        } catch (err) {
            console.error(err);
            setMessages(prev => [...prev, { role: 'assistant', content: 'Error: Could not get response.' }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-[700px] glass-card rounded-2xl overflow-hidden shadow-2xl animate-slide-up border border-white/5 relative">
            {/* Header/Status Bar */}
            <div className="p-4 border-b border-white/10 bg-white/5 backdrop-blur-md flex items-center justify-between">
                <div className="flex items-center space-x-2">
                    <div className={`w-3 h-3 rounded-full ${loading ? 'bg-yellow-400 animate-pulse' : 'bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.5)]'}`} />
                    <span className="text-sm font-medium text-gray-300">
                        {loading ? 'Agent thinking...' : 'Agent Online'}
                    </span>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
                {messages.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full text-center space-y-4 opacity-50">
                        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-2xl blur-lg opacity-50" />
                        <p className="text-lg font-light tracking-wide text-gray-300">Initialize conversation...</p>
                    </div>
                )}
                {messages.map((msg, idx) => (
                    msg.role !== 'system' && (
                        <div
                            key={idx}
                            className={`flex w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}
                        >
                            <div
                                className={`max-w-[85%] px-6 py-4 shadow-lg backdrop-blur-sm transition-all duration-300 ${msg.role === 'user'
                                        ? 'bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-2xl rounded-tr-none border border-blue-400/20'
                                        : 'glass text-gray-100 rounded-2xl rounded-tl-none border-white/5 prose prose-invert prose-sm max-w-none'
                                    }`}
                            >
                                {msg.role === 'user' ? (
                                    <span className="font-sans leading-relaxed">{msg.content}</span>
                                ) : (
                                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                                )}
                            </div>
                        </div>
                    )
                ))}
                {loading && (
                    <div className="flex justify-start animate-fade-in">
                        <div className="glass px-6 py-4 rounded-2xl rounded-tl-none flex items-center space-x-2 border border-white/5">
                            <span className="sr-only">Loading</span>
                            <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                            <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" />
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            <form onSubmit={sendMessage} className="p-4 border-t border-white/10 bg-black/20 backdrop-blur-xl">
                <div className="flex items-center space-x-3 bg-white/5 border border-white/10 rounded-xl px-2 py-2 focus-within:ring-2 focus-within:ring-blue-500/50 transition-all duration-300">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        className="flex-1 bg-transparent border-none px-4 py-2 text-white placeholder-gray-500 focus:outline-none"
                        placeholder="Type your message..."
                        disabled={loading}
                    />
                    <button
                        type="submit"
                        disabled={loading || !input.trim()}
                        className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2.5 rounded-lg font-medium shadow-lg shadow-blue-500/20 transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
                    >
                        Send
                    </button>
                </div>
            </form>
        </div>
    );
};

export default ChatInterface;
