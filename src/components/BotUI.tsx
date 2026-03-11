import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, User, Bot, Upload, X, Save, Download, ShieldCheck } from 'lucide-react';
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
            setMessages(prev => [...prev, { role: 'bot', content: '...' }]);
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
        <div className="flex flex-col h-[600px] w-full glass-panel overflow-hidden shadow-lg">
            {/* Header */}
            <div className="px-5 py-4 border-b border-black/5 flex justify-between items-center bg-white/50">
                <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-sage-500/15 flex items-center justify-center">
                        <Bot size={16} className="text-sage-600" />
                    </div>
                    <div>
                        <span className="font-semibold text-sm text-charcoal-800">The Ready Bot</span>
                        {isAdmin && <ShieldCheck size={14} className="text-sage-500 inline ml-1.5" />}
                    </div>
                    <span className="w-2 h-2 rounded-full bg-sage-500 animate-soft-pulse" />
                </div>
                <div className="flex gap-2">
                    {isAdmin && (
                        <>
                            <input
                                type="password"
                                placeholder="API Key Override"
                                className="bg-cream-200/60 border border-black/8 rounded-lg px-3 py-1.5 text-xs outline-none focus:border-sage-500/50 text-charcoal-800"
                                value={apiKey}
                                onChange={(e) => setApiKey(e.target.value)}
                            />
                            <button
                                onClick={() => setShowIntake(true)}
                                className="bg-sage-500/12 text-sage-600 text-xs px-3 py-1.5 rounded-full border border-sage-500/20 hover:bg-sage-500/20 transition-all flex items-center gap-1 font-medium"
                            >
                                <Upload size={13} /> Intake
                            </button>
                            <button
                                onClick={exportJSON}
                                className="bg-lavender-300/30 text-lavender-400 text-xs px-3 py-1.5 rounded-full border border-lavender-300/40 hover:bg-lavender-300/50 transition-all flex items-center gap-1 font-medium"
                            >
                                <Download size={13} /> Export
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4 chat-scroll">
                {messages.map((m, i) => (
                    <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.25 }}
                        key={i}
                        className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                        <div className={`flex gap-3 max-w-[80%] ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                                m.role === 'user'
                                    ? 'bg-sage-500/15 text-sage-600'
                                    : 'bg-coral-300/40 text-coral-500'
                            }`}>
                                {m.role === 'user' ? <User size={15} /> : <Bot size={15} />}
                            </div>
                            <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                                m.role === 'user'
                                    ? 'bg-sage-500 text-white rounded-tr-sm shadow-sm'
                                    : 'bg-cream-200/70 text-charcoal-800 rounded-tl-sm border border-black/5'
                            }`}>
                                {m.content}
                            </div>
                        </div>
                    </motion.div>
                ))}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="px-4 py-3 border-t border-black/5 bg-white/50 flex gap-2.5">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                    placeholder="Ask a question about the team..."
                    className="flex-1 bg-cream-100/80 border border-black/6 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-sage-500/40 focus:ring-2 focus:ring-sage-500/10 transition-all text-charcoal-800 placeholder-warmgray-400"
                />
                <button
                    onClick={handleSend}
                    className="bg-sage-500 text-white p-3 rounded-xl hover:bg-sage-600 transition-colors shadow-sm"
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
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal-900/30 backdrop-blur-sm"
                    >
                        <motion.div
                            initial={{ scale: 0.95, y: 12 }}
                            animate={{ scale: 1, y: 0 }}
                            className="bg-white rounded-2xl shadow-xl w-full max-w-2xl p-8 space-y-4 border border-black/5"
                        >
                            <div className="flex justify-between items-center">
                                <h3 className="text-xl font-bold flex items-center gap-2 text-charcoal-800">
                                    <Upload className="text-sage-500" /> Smart Data Intake
                                </h3>
                                <button onClick={() => setShowIntake(false)} className="text-warmgray-400 hover:text-charcoal-700 bg-transparent border-none p-1">
                                    <X />
                                </button>
                            </div>
                            <p className="text-warmgray-500 text-sm">Paste raw text notes for a single paddler. The parser will extract all 2026 standardized metrics.</p>
                            <textarea
                                value={rawIntake}
                                onChange={(e) => setRawIntake(e.target.value)}
                                className="w-full h-48 bg-cream-100 border border-black/8 rounded-xl p-4 text-sm font-mono focus:outline-none focus:border-sage-500/50 focus:ring-2 focus:ring-sage-500/10 text-charcoal-800 resize-none"
                                placeholder="Mobility - Hip Flexion: Bonus... Total: 18 pts"
                            />
                            <div className="flex justify-end gap-3 pt-2">
                                <button onClick={() => setShowIntake(false)} className="px-6 py-2.5 rounded-xl border border-black/8 text-warmgray-500 hover:bg-cream-100 bg-transparent transition-colors text-sm">
                                    Cancel
                                </button>
                                <button
                                    onClick={handleIntakeSave}
                                    className="px-6 py-2.5 rounded-xl bg-sage-500 text-white font-semibold hover:bg-sage-600 flex items-center gap-2 transition-colors shadow-sm text-sm"
                                >
                                    <Save size={16} /> Parse & Save
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
