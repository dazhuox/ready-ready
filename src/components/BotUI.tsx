import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, User, Bot, Upload, X, Check, Save, Info, Download, ShieldCheck } from 'lucide-react';
import { FitnessMetrics } from '../data/types';
import { parseRawFitnessData } from '../utils/parser';
import { getGeminiResponse, createChatbotContext } from '../data/gemini';
import initialPaddlers from '../data/paddlers.json';

const BotUI = () => {
    const [messages, setMessages] = useState<{ role: 'user' | 'bot', content: string }[]>([
        { role: 'bot', content: 'Ready to analyze your dragonboat team. How can I help you with the fitness data today?' }
    ]);
    const [input, setInput] = useState('');
    const [paddlers, setPaddlers] = useState<FitnessMetrics[]>(initialPaddlers as FitnessMetrics[]);
    const [showIntake, setShowIntake] = useState(false);
    const [rawIntake, setRawIntake] = useState('');
    const [apiKey, setApiKey] = useState(import.meta.env.VITE_GEMINI_API_KEY || '');
    const [isAdmin, setIsAdmin] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Check for admin mode in URL
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        if (params.get('mode') === 'admin') {
            setIsAdmin(true);
            setMessages(prev => [...prev, { role: 'bot', content: '🛡️ Admin Mode activated. Intake tools are now visible.' }]);
        }
    }, []);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim()) return;

        const userMsg = input.trim();
        setInput('');
        setMessages(prev => [...prev, { role: 'user', content: userMsg }]);

        if (!apiKey) {
            setMessages(prev => [...prev, { role: 'bot', content: '❌ API Key missing. If you are a developer, please check your .env file.' }]);
            return;
        }

        try {
            setMessages(prev => [...prev, { role: 'bot', content: '...' }]); // Loading state
            const response = await getGeminiResponse(apiKey, userMsg, [...messages, { role: 'user', content: userMsg }], paddlers);

            setMessages(prev => {
                const newMsgs = [...prev];
                newMsgs[newMsgs.length - 1] = { role: 'bot', content: response };
                return newMsgs;
            });
        } catch (error) {
            setMessages(prev => {
                const newMsgs = [...prev];
                newMsgs[newMsgs.length - 1] = { role: 'bot', content: 'Error communicating with Gemini. Ensure your API Key is valid.' };
                return newMsgs;
            });
        }
    };

    const handleIntakeSave = () => {
        const newPaddler = parseRawFitnessData(rawIntake, `Paddler ${paddlers.length + 1}`);
        setPaddlers(prev => [...prev, newPaddler]);
        setRawIntake('');
        setShowIntake(false);
        setMessages(prev => [...prev, { role: 'bot', content: `✅ Parsed ${newPaddler.name}. Don't forget to Export the JSON when you're done!` }]);
    };

    const exportJSON = () => {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(paddlers, null, 2));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", "paddlers.json");
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
    };

    return (
        <div className="flex flex-col h-[600px] w-full max-w-4xl mx-auto glass-panel overflow-hidden border-none shadow-2xl">
            {/* Header */}
            <div className="p-4 border-b border-white/10 flex justify-between items-center bg-white/5">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    <span className="font-semibold text-sm uppercase tracking-widest text-gray-400">The Ready Bot</span>
                    {isAdmin && <span title="Admin Mode"><ShieldCheck size={16} className="text-red-500" /></span>}
                </div>
                <div className="flex gap-2">
                    {isAdmin && (
                        <>
                            <input
                                type="password"
                                placeholder="API Key Override"
                                className="bg-black/20 border border-white/10 rounded px-2 py-1 text-xs outline-none focus:border-red-500/50"
                                value={apiKey}
                                onChange={(e) => setApiKey(e.target.value)}
                            />
                            <button
                                onClick={() => setShowIntake(true)}
                                className="bg-red-600/20 text-red-500 text-xs px-3 py-1 rounded-full border border-red-600/30 hover:bg-red-600/30 transition-all flex items-center gap-1"
                            >
                                <Upload size={14} /> Intake
                            </button>
                            <button
                                onClick={exportJSON}
                                className="bg-blue-600/20 text-blue-500 text-xs px-3 py-1 rounded-full border border-blue-600/30 hover:bg-blue-600/30 transition-all flex items-center gap-1"
                            >
                                <Download size={14} /> Export
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {messages.map((m, i) => (
                    <motion.div
                        initial={{ opacity: 0, x: m.role === 'user' ? 20 : -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        key={i}
                        className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                        <div className={`flex gap-3 max-w-[80%] ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${m.role === 'user' ? 'bg-blue-600/30' : 'bg-red-600/30'}`}>
                                {m.role === 'user' ? <User size={16} /> : <Bot size={16} />}
                            </div>
                            <div className={`p-4 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${m.role === 'user' ? 'bg-blue-600/20 rounded-tr-none' : 'bg-white/5 rounded-tl-none border border-white/5'}`}>
                                {m.content}
                            </div>
                        </div>
                    </motion.div>
                ))}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-white/10 bg-white/5 flex gap-2">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                    placeholder="Ask a question about the team..."
                    className="flex-1 bg-transparent border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-red-500/50 transition-colors"
                />
                <button
                    onClick={handleSend}
                    className="bg-red-600 text-white p-3 rounded-xl hover:bg-red-700 transition-colors"
                >
                    <Send size={18} />
                </button>
            </div>

            {/* Intake Modal */}
            <AnimatePresence>
                {showIntake && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            className="glass-panel w-full max-w-2xl border-white/20 p-8 space-y-4"
                        >
                            <div className="flex justify-between items-center">
                                <h3 className="text-xl font-bold flex items-center gap-2">
                                    <Upload className="text-red-500" /> Smart Data Intake
                                </h3>
                                <button onClick={() => setShowIntake(false)} className="text-gray-400 hover:text-white">
                                    <X />
                                </button>
                            </div>
                            <p className="text-gray-400 text-sm">Paste raw text notes for a single paddler. The parser will extract all 2026 standardized metrics.</p>
                            <textarea
                                value={rawIntake}
                                onChange={(e) => setRawIntake(e.target.value)}
                                className="w-full h-48 bg-black/40 border border-white/10 rounded-xl p-4 text-sm font-mono focus:outline-none focus:border-red-500/50 text-white"
                                placeholder="Mobility - Hip Flexion: Bonus... Total: 18 pts"
                            />
                            <div className="flex justify-end gap-3 pt-4">
                                <button onClick={() => setShowIntake(false)} className="px-6 py-2 rounded-xl border border-white/10 text-gray-400 hover:bg-white/5">Cancel</button>
                                <button
                                    onClick={handleIntakeSave}
                                    className="px-6 py-2 rounded-xl bg-red-600 text-white font-semibold hover:bg-red-700 flex items-center gap-2"
                                >
                                    <Save size={18} /> Parse & Save
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default BotUI;
