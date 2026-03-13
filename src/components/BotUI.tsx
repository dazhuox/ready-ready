import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, User, Bot, Upload, X, Save, Download, ShieldCheck, ArrowUp } from 'lucide-react';
import { FitnessMetrics } from '../data/types';
import { parseRawFitnessData } from '../utils/parser';
import { getGeminiStream, createChatbotContext } from '../data/gemini';
import initialPaddlers from '../data/paddlers.json';

/* ── Typing Indicator Component ──────────────────── */
const TypingIndicator = () => (
    <div className="flex items-center gap-1 px-1 py-1">
        <span className="typing-dot" />
        <span className="typing-dot" />
        <span className="typing-dot" />
    </div>
);

const MessageBubble = ({ role, content, isLoading }: { role: 'user' | 'bot'; content: string; isLoading?: boolean }) => {
    const isUser = role === 'user';

    return (
        <motion.div
            data-role={role}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
            className={`flex w-full scroll-mt-6 ${isUser ? 'justify-end' : 'justify-start'}`}
            style={{ marginBottom: isUser ? '32px' : '100px' }}
        >
            <div className={`flex gap-4 w-full ${isUser ? 'justify-end' : 'max-w-3xl'}`}>
                {/* Bubble */}
                {isUser ? (
                    <div
                        className="bg-[#F3F2EB] rounded-2xl max-w-[75%] shadow-sm"
                        style={{ padding: '8px 12px' }}
                    >
                        <div className="msg-prose text-[15px] text-[#2D3436] leading-[1.6] whitespace-pre-wrap">
                            {content}
                        </div>
                    </div>
                ) : (
                    <div className="msg-prose text-[15px] leading-[1.6] whitespace-pre-wrap text-charcoal-800 pt-1 flex-1">
                        {isLoading ? <TypingIndicator /> : content}
                    </div>
                )}
            </div>
        </motion.div>
    );
};

/* ── Main BotUI Component ────────────────────────── */
const BotUI = () => {
    const [messages, setMessages] = useState<{ role: 'user' | 'bot'; content: string }[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [paddlers, setPaddlers] = useState<FitnessMetrics[]>(initialPaddlers as FitnessMetrics[]);
    const [showIntake, setShowIntake] = useState(false);
    const [rawIntake, setRawIntake] = useState('');
    const [apiKey, setApiKey] = useState(import.meta.env.VITE_GEMINI_API_KEY || '');
    const [isAdmin, setIsAdmin] = useState(false);
    const [isSmallScreen, setIsSmallScreen] = useState(window.innerWidth < 640);
    const [isLargeScreen, setIsLargeScreen] = useState(window.innerWidth > 1440);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        const handleResize = () => {
            const width = window.innerWidth;
            setIsSmallScreen(width < 640);
            setIsLargeScreen(width > 1440);
        };
        window.addEventListener('resize', handleResize);
        const params = new URLSearchParams(window.location.search);
        if (params.get('mode') === 'admin') setIsAdmin(true);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const scrollToLatestQuery = () => {
        const userElements = document.querySelectorAll('[data-role="user"]');
        const latestUserElement = userElements[userElements.length - 1];

        if (latestUserElement) {
            latestUserElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
        }
    };

    const userMessageCount = messages.filter(m => m.role === 'user').length;

    useEffect(() => {
        // Only trigger the auto-scroll when a new USER message is added.
        // This prevents the scroll-to-top logic from recalculating and jittering 
        // when the bot's answer is printed.
        if (userMessageCount > 0) {
            const timeout = setTimeout(() => {
                scrollToLatestQuery();
            }, 50);
            return () => clearTimeout(timeout);
        }
    }, [userMessageCount]);

    // Auto-resize textarea
    useEffect(() => {
        if (inputRef.current) {
            inputRef.current.style.height = 'auto';
            inputRef.current.style.height = Math.min(inputRef.current.scrollHeight, 160) + 'px';
        }
    }, [input]);

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;

        const userMsg = input.trim();
        setInput('');

        // Save the history state specifically needed for Gemini before we add the placeholder bot message
        const currentHistory: { role: 'user' | 'bot'; content: string }[] = [
            ...messages,
            { role: 'user', content: userMsg }
        ];

        // Append the user's message AND an empty bot placeholder to strictly preserve the DOM node
        setMessages(prev => [
            ...prev,
            { role: 'user', content: userMsg },
            { role: 'bot', content: '' }
        ]);
        setIsLoading(true);

        if (!apiKey) {
            setMessages(prev => {
                const updated = [...prev];
                updated[updated.length - 1] = { role: 'bot', content: 'API Key is missing. Please check your .env configuration.' };
                return updated;
            });
            setIsLoading(false);
            return;
        }

        try {
            const stream = await getGeminiStream(apiKey, userMsg, currentHistory, paddlers);

            let fullText = '';
            let isFirstChunk = true;
            for await (const chunk of stream) {
                if (isFirstChunk) {
                    setIsLoading(false);
                    isFirstChunk = false;
                }
                // Distribute the chunk character-by-character for a smooth typing effect
                for (let i = 0; i < chunk.length; i++) {
                    fullText += chunk[i];
                    setMessages(prev => {
                        const updated = [...prev];
                        updated[updated.length - 1] = { role: 'bot', content: fullText };
                        return updated;
                    });
                    // 10ms per character = ~100 characters per second. Extremely smooth.
                    await new Promise(resolve => setTimeout(resolve, 8));
                }
            }
        } catch (error) {
            setMessages(prev => {
                const updated = [...prev];
                updated[updated.length - 1] = { role: 'bot', content: 'Something went wrong. Please check your API key and try again.' };
                return updated;
            });
            setIsLoading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleIntakeSave = () => {
        const newPaddler = parseRawFitnessData(rawIntake, `Paddler ${paddlers.length + 1}`);
        setPaddlers(prev => [...prev, newPaddler]);
        setRawIntake('');
        setShowIntake(false);
        setMessages(prev => [...prev, { role: 'bot', content: `Parsed ${newPaddler.name} successfully. Use the Export button to save the updated dataset.` }]);
    };

    const exportJSON = () => {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(paddlers, null, 2));
        const a = document.createElement('a');
        a.setAttribute("href", dataStr);
        a.setAttribute("download", "paddlers.json");
        document.body.appendChild(a);
        a.click();
        a.remove();
    };

    const renderInput = (isCentered: boolean) => (
        <motion.div
            layoutId="search-container"
            style={{
                maxWidth: isLargeScreen ? 820 : 720,
                margin: '0 auto',
                width: '100%',
                padding: isCentered ? (isSmallScreen ? '0 16px' : '0') : '0'
            }}
        >
            <div style={{
                display: 'flex',
                alignItems: 'flex-end',
                gap: 12,
                background: isCentered ? '#ffffff' : '#f8f9fa',
                border: '1px solid rgba(0,0,0,0.08)',
                borderRadius: 22,
                padding: isLargeScreen ? '14px 16px 14px 20px' : '8px 12px 8px 16px',
                boxShadow: isCentered ? '0 8px 32px rgba(0,0,0,0.06)' : 'none',
                transition: 'all 0.3s ease',
            }}>
                <textarea
                    ref={isCentered ? null : inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Message Ready Ready..."
                    rows={1}
                    style={{
                        flex: 1,
                        background: 'transparent',
                        border: 'none',
                        outline: 'none',
                        resize: 'none',
                        fontSize: isLargeScreen ? 16 : 15,
                        color: '#2D3436',
                        lineHeight: 1.5,
                        padding: '8px 0',
                        maxHeight: 200,
                        fontFamily: 'inherit',
                    }}
                />
                <button
                    onClick={handleSend}
                    disabled={!input.trim() || isLoading}
                    style={{
                        flexShrink: 0,
                        width: isLargeScreen ? 40 : 36,
                        height: isLargeScreen ? 40 : 36,
                        borderRadius: 12,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: input.trim() && !isLoading ? '#2D3436' : '#F3F4F6',
                        color: input.trim() && !isLoading ? '#ffffff' : '#BCBCBC',
                        cursor: input.trim() && !isLoading ? 'pointer' : 'not-allowed',
                        transition: 'all 0.2s ease',
                    }}
                >
                    <ArrowUp size={isLargeScreen ? 18 : 16} strokeWidth={2.5} />
                </button>
            </div>
        </motion.div>
    );

    const hasMessages = messages.length > 0;

    // Group messages into conversational turns so we can apply min-height to the last turn.
    // This allows the last query to smoothly hit the top of the page without creating excess scrollable void.
    const groupedTurns: { user: any, bots: any[] }[] = [];
    let currentTurn: { user: any, bots: any[] } | null = null;

    messages.forEach(m => {
        if (m.role === 'user') {
            currentTurn = { user: m, bots: [] };
            groupedTurns.push(currentTurn);
        } else if (currentTurn) {
            currentTurn.bots.push(m);
        } else {
            // Edge case: Bot message without a leading user message
            groupedTurns.push({ user: null, bots: [m] });
        }
    });

    return (
        <div className="flex flex-col h-full bg-cream-50/30">
            {/* ── Admin Bar (only in admin mode) ─────────── */}
            {isAdmin && (
                <div className="flex flex-wrap items-center gap-2 px-5 py-2 bg-cream-100/60 border-b border-black/[0.04]">
                    <ShieldCheck size={14} className="text-charcoal-500" />
                    <span className="text-[11px] text-warmgray-500 font-medium">Admin</span>
                    <div className="flex-1 md:flex-none" />
                    <input
                        type="password"
                        placeholder="API Key"
                        className="bg-white/70 border border-black/[0.06] rounded-md px-2.5 py-1 text-[11px] outline-none focus:border-charcoal-300 text-charcoal-700 w-full sm:w-40"
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                    />
                    <div className="flex gap-2">
                        <button
                            onClick={() => setShowIntake(true)}
                            className="text-[11px] font-medium text-charcoal-700 hover:text-black px-2.5 py-1 rounded-md hover:bg-black/[0.04]"
                        >
                            <Upload size={12} className="inline mr-1" />Intake
                        </button>
                        <button
                            onClick={exportJSON}
                            className="text-[11px] font-medium text-warmgray-500 hover:text-charcoal-700 px-2.5 py-1 rounded-md hover:bg-black/[0.04]"
                        >
                            <Download size={12} className="inline mr-1" />Export
                        </button>
                    </div>
                </div>
            )}

            {/* ── Messages Area ──────────────────────────── */}
            <div
                className="flex-1 overflow-y-auto chat-scroll flex flex-col items-center justify-start relative z-0"
                style={{ scrollPaddingTop: '5vh', overflowAnchor: 'none' }}
            >
                {!hasMessages ? (
                    /* ── Welcome State: Centered Input ─────── */
                    <div className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 max-w-4xl w-full select-none" style={{ marginTop: isSmallScreen ? '0' : '-60px' }}>
                        <div className={`rounded-2xl bg-black/[0.04] flex items-center justify-center mb-6 ${isLargeScreen ? 'w-16 h-16' : 'w-12 h-12'}`}>
                            <Bot size={isLargeScreen ? 32 : 22} className="text-charcoal-600" strokeWidth={1.6} />
                        </div>
                        <h2 className={`${isLargeScreen ? 'text-4xl' : 'text-xl sm:text-2xl'} font-bold text-charcoal-800 mb-6 sm:mb-8 tracking-tight text-center`}>
                            Ready Ready
                        </h2>

                        {/* Centered Input Area */}
                        <div className="w-full mb-8 max-w-lg sm:max-w-none">
                            {renderInput(true)}
                        </div>

                        {/* Suggestions row below input */}
                        <div className="flex flex-wrap justify-center gap-2 max-w-2xl px-2">
                            {[
                                'Who has the highest deadlift?',
                                'Compare the top 5 paddlers',
                                'Who needs to improve their run?',
                                'Show the 2026 cut standards',
                            ].map((q, i) => (
                                <button
                                    key={i}
                                    onClick={() => setInput(q)}
                                    style={{
                                        textAlign: 'left',
                                        padding: '6px 14px',
                                        borderRadius: 20,
                                        border: '1px solid rgba(0,0,0,0.08)',
                                        background: 'rgba(255,255,255,0.6)',
                                        fontSize: 12,
                                        color: '#636E72',
                                        cursor: 'pointer',
                                        transition: 'all 0.15s',
                                        fontFamily: 'inherit',
                                    }}
                                    onMouseEnter={e => {
                                        const btn = e.currentTarget as HTMLButtonElement;
                                        btn.style.background = '#ffffff';
                                        btn.style.borderColor = 'rgba(0,0,0,0.15)';
                                        btn.style.color = '#2D3436';
                                    }}
                                    onMouseLeave={e => {
                                        const btn = e.currentTarget as HTMLButtonElement;
                                        btn.style.background = 'rgba(255,255,255,0.6)';
                                        btn.style.borderColor = 'rgba(0,0,0,0.08)';
                                        btn.style.color = '#636E72';
                                    }}
                                >
                                    {q}
                                </button>
                            ))}
                        </div>
                    </div>
                ) : (
                    /* ── Message List ─────────────────────── */
                    <div
                        className="w-full px-4 sm:px-6 flex flex-col mx-auto pt-[5vh] pb-4"
                        style={{ maxWidth: isLargeScreen ? 600 : 420 }}
                    >
                        {groupedTurns.map((turn, index) => {
                            const isLastTurn = index === groupedTurns.length - 1;
                            return (
                                <div
                                    key={index}
                                    className="flex flex-col w-full"
                                    style={{ minHeight: isLastTurn ? 'calc(100vh - 150px)' : 'auto' }}
                                >
                                    {turn.user && (
                                        <MessageBubble role="user" content={turn.user.content} />
                                    )}
                                    {turn.bots.map((botMsg, i) => {
                                        // The bot message is 'loading' only if it's the very last one, its content is empty, and the app is officially in a loading state
                                        const isBotLoading = isLoading && isLastTurn && i === turn.bots.length - 1 && botMsg.content === '';
                                        return (
                                            <MessageBubble
                                                key={i}
                                                role="bot"
                                                content={botMsg.content}
                                                isLoading={isBotLoading}
                                            />
                                        );
                                    })}
                                </div>
                            );
                        })}
                        {/* Bottom spacer ensures the last message isn't hidden behind the fixed input box */}
                        <div ref={messagesEndRef} className="h-[150px] w-full shrink-0" />
                    </div>
                )}
            </div>

            {/* ── Bottom Input Area (only if has messages) ── */}
            {hasMessages && (
                <div style={{
                    flexShrink: 0,
                    padding: isSmallScreen ? '8px 12px 16px' : '8px 24px 32px',
                    width: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    background: 'linear-gradient(180deg, transparent 0%, rgba(250, 246, 240, 0.8) 20%, rgba(250, 246, 240, 1) 100%)',
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    zIndex: 10
                }}>
                    <div style={{ width: '100%', maxWidth: isLargeScreen ? 600 : 420 }}>
                        {renderInput(false)}
                    </div>
                    <p style={{
                        textAlign: 'center',
                        fontSize: 8,
                        color: '#BCBCBC',
                        marginTop: 8,
                        userSelect: 'none',
                    }}>
                        Powered by Gemini · True Grit 2026 Performance Data
                    </p>
                </div>
            )}

            {/* ── Intake Modal ───────────────────────────── */}
            <AnimatePresence>
                {showIntake && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm"
                    >
                        <motion.div
                            initial={{ scale: 0.97, y: 8 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.97, opacity: 0 }}
                            className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 space-y-4 border border-black/[0.04]"
                        >
                            <div className="flex justify-between items-center">
                                <h3 className="text-base font-bold flex items-center gap-2 text-charcoal-800">
                                    <Upload size={18} className="text-sage-500" /> Smart Data Intake
                                </h3>
                                <button onClick={() => setShowIntake(false)} className="text-warmgray-400 hover:text-charcoal-700 p-1 rounded-md hover:bg-black/[0.04]">
                                    <X size={18} />
                                </button>
                            </div>
                            <p className="text-warmgray-500 text-[13px] leading-relaxed">
                                Paste raw text notes for a single paddler. The parser will extract all 2026 standardized metrics.
                            </p>
                            <textarea
                                value={rawIntake}
                                onChange={(e) => setRawIntake(e.target.value)}
                                className="w-full h-40 bg-cream-50 border border-black/[0.06] rounded-xl p-3.5 text-[13px] font-mono focus:outline-none focus:border-sage-500/40 focus:ring-2 focus:ring-sage-500/8 text-charcoal-700 resize-none"
                                placeholder="Mobility - Hip Flexion: Bonus... Total: 18 pts"
                            />
                            <div className="flex justify-end gap-2.5 pt-1">
                                <button
                                    onClick={() => setShowIntake(false)}
                                    className="px-4 py-2 rounded-lg border border-black/[0.06] text-warmgray-500 hover:bg-cream-100 text-[13px] font-medium"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleIntakeSave}
                                    className="px-4 py-2 rounded-lg bg-sage-500 text-white font-semibold hover:bg-sage-600 flex items-center gap-1.5 shadow-sm text-[13px]"
                                >
                                    <Save size={14} /> Parse & Save
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
