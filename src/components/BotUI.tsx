import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, Upload, X, Save, Download, ShieldCheck, ArrowUp, Send } from 'lucide-react';
import { FitnessMetrics } from '../data/types';
import { parseRawFitnessData } from '../utils/parser';
import { getGeminiStream, streamFromProxy } from '../data/gemini';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';


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
                        className="bg-sage-600 text-white shadow-sm"
                        style={{ padding: '12px 18px', borderRadius: '20px 20px 6px 20px' }}
                    >
                        <div className="msg-prose text-[15px] leading-[1.6] whitespace-pre-wrap">
                            {content}
                        </div>
                    </div>
                ) : (
                    <div className="flex-1">
                        {/* Ready Bot label */}
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-6 h-6 rounded-md bg-sage-500/10 flex items-center justify-center">
                                <Bot size={14} className="text-sage-600" />
                            </div>
                            <span className="text-sm font-bold text-charcoal-800">Ready Bot</span>
                        </div>
                        <div className="msg-prose text-[15px] leading-[1.6] whitespace-pre-wrap text-charcoal-800">
                            {isLoading ? <TypingIndicator /> : content}
                        </div>
                    </div>
                )}
            </div>
        </motion.div>
    );
};

interface BotUIProps {
    messages: { role: 'user' | 'bot'; content: string }[];
    setMessages: React.Dispatch<React.SetStateAction<{ role: 'user' | 'bot'; content: string }[]>>;
    paddlers: FitnessMetrics[];
    setPaddlers: React.Dispatch<React.SetStateAction<FitnessMetrics[]>>;
}

/* ── Main BotUI Component ────────────────────────── */
const BotUI = ({ messages, setMessages, paddlers, setPaddlers }: BotUIProps) => {

    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showIntake, setShowIntake] = useState(false);
    const [rawIntake, setRawIntake] = useState('');
    // Local dev fallback: use VITE_GEMINI_API_KEY if available, otherwise proxy through /api/chat
    const localApiKey = import.meta.env.VITE_GEMINI_API_KEY || '';
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
        
        return () => {
            window.removeEventListener('resize', handleResize);
        };
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

        const currentHistory: { role: 'user' | 'bot'; content: string }[] = [
            ...messages,
            { role: 'user', content: userMsg }
        ];

        setMessages(prev => [
            ...prev,
            { role: 'user', content: userMsg },
            { role: 'bot', content: '' }
        ]);
        setIsLoading(true);

        try {
            const stream = localApiKey
                ? getGeminiStream(localApiKey, userMsg, currentHistory, paddlers)
                : streamFromProxy(userMsg, currentHistory);

            let fullText = '';
            let isFirstChunk = true;
            for await (const chunk of stream) {
                if (isFirstChunk) {
                    setIsLoading(false);
                    isFirstChunk = false;
                }
                for (let i = 0; i < chunk.length; i++) {
                    fullText += chunk[i];
                    setMessages(prev => {
                        const updated = [...prev];
                        updated[updated.length - 1] = { role: 'bot', content: fullText };
                        return updated;
                    });
                    await new Promise(resolve => setTimeout(resolve, 8));
                }
            }
        } catch (error) {
            setMessages(prev => {
                const updated = [...prev];
                updated[updated.length - 1] = { role: 'bot', content: 'Something went wrong. Please try again.' };
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

    const SUGGESTIONS = [
        'Who has the highest score?',
        'Compare team defense stats',
        'Identify top performers',
        'Analyze paddler metrics',
    ];

    const renderInput = (isCentered: boolean) => (
        <motion.div
            layoutId="search-container"
            style={{
                maxWidth: 720,
                margin: '0 auto',
                width: '100%',
                padding: isCentered ? (isSmallScreen ? '0 16px' : '0') : '0'
            }}
        >
            <div style={{
                display: 'flex',
                alignItems: 'flex-end',
                gap: 10,
                background: '#ffffff',
                border: '1px solid rgba(0,0,0,0.06)',
                borderRadius: 24,
                padding: '10px 14px 10px 20px',
                boxShadow: isCentered ? '0 12px 40px rgba(0,0,0,0.06)' : '0 4px 20px rgba(0,0,0,0.04)',
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
                        fontSize: 15,
                        color: '#2D3436',
                        lineHeight: 1.5,
                        padding: '6px 0',
                        maxHeight: 200,
                        fontFamily: 'inherit',
                    }}
                />
                {/* Upload button */}
                <button
                    onClick={() => setShowIntake(true)}
                    className="shrink-0 w-9 h-9 flex items-center justify-center rounded-xl text-warmgray-400 hover:text-charcoal-600 hover:bg-black/[0.04] transition-all"
                    title="Upload data"
                >
                    <Upload size={16} />
                </button>
                {/* Send button */}
                <button
                    onClick={handleSend}
                    disabled={!input.trim() || isLoading}
                    className={`shrink-0 w-9 h-9 flex items-center justify-center rounded-xl transition-all ${
                        input.trim() && !isLoading
                            ? 'bg-sage-600 text-white shadow-sm hover:bg-sage-700'
                            : 'bg-black/[0.05] text-warmgray-300 cursor-not-allowed'
                    }`}
                    aria-label="Send message"
                >
                    <Send size={16} />
                </button>
            </div>
        </motion.div>
    );

    const hasMessages = messages.length > 0;

    const groupedTurns: { user: any, bots: any[] }[] = [];
    let currentTurn: { user: any, bots: any[] } | null = null;

    messages.forEach(m => {
        if (m.role === 'user') {
            currentTurn = { user: m, bots: [] };
            groupedTurns.push(currentTurn);
        } else if (currentTurn) {
            currentTurn.bots.push(m);
        } else {
            groupedTurns.push({ user: null, bots: [m] });
        }
    });

    return (
        <div className="flex flex-col h-full bg-cream-50/30">
            {/* ── Admin Bar (only in admin mode) ─────────── */}
            {isAdmin && (
                <div className="flex flex-wrap items-center gap-2 px-5 py-2 bg-cream-100/60 border-b border-black/[0.04]">
                    <ShieldCheck size={14} className="text-charcoal-500" />
                    <Badge variant="secondary" className="text-[10px] py-0 px-2">Admin</Badge>
                    <div className="flex-1 md:flex-none" />
                    <div className="flex gap-1.5">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowIntake(true)}
                            className="h-7 text-[11px] text-charcoal-700 gap-1"
                        >
                            <Upload size={12} />Intake
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={exportJSON}
                            className="h-7 text-[11px] text-warmgray-500 gap-1"
                        >
                            <Download size={12} />Export
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                                if (window.confirm('Are you sure you want to clear the entire chat history?')) {
                                    setMessages([]);
                                }
                            }}
                            className="h-7 text-[11px] text-red-500/80 hover:text-red-700 hover:bg-red-500/[0.08] gap-1"
                        >
                            <X size={12} />Clear Chat
                        </Button>
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
                    <div className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 max-w-4xl w-full select-none" style={{ marginTop: isSmallScreen ? '0' : '-40px' }}>
                        <h2 className="text-3xl md:text-4xl font-bold text-charcoal-800 mb-8 tracking-tight text-center"
                            style={{ fontFamily: 'Playfair Display, serif' }}>
                            Current Chat
                        </h2>

                        {/* Centered Input Area */}
                        <div className="w-full mb-6 max-w-lg sm:max-w-none">
                            {renderInput(true)}
                        </div>

                        {/* Suggestions row below input */}
                        <div className="flex flex-wrap justify-center gap-2 max-w-2xl px-2">
                            {SUGGESTIONS.map((q, i) => (
                                <button
                                    key={i}
                                    onClick={() => setInput(q)}
                                    className="px-4 py-2 rounded-full text-xs font-medium border border-black/[0.08] text-warmgray-500 hover:text-charcoal-800 hover:border-sage-400/40 hover:bg-sage-50/50 transition-all"
                                >
                                    {q}
                                </button>
                            ))}
                        </div>
                    </div>
                ) : (
                    /* ── Message List ─────────────────────── */
                    <>
                        {/* Title above messages */}
                        <div className="w-full pt-8 pb-4 text-center">
                            <h2 className="text-2xl font-bold text-charcoal-800 tracking-tight"
                                style={{ fontFamily: 'Playfair Display, serif' }}>
                                Current Chat
                            </h2>
                        </div>
                        <div
                            className="w-full px-4 sm:px-6 flex flex-col mx-auto pb-4"
                            style={{ maxWidth: 720 }}
                        >
                            {groupedTurns.map((turn, index) => {
                                const isLastTurn = index === groupedTurns.length - 1;
                                return (
                                    <div
                                        key={index}
                                        className="flex flex-col w-full"
                                        style={{ minHeight: isLastTurn ? 'calc(100vh - 200px)' : 'auto' }}
                                    >
                                        {turn.user && (
                                            <MessageBubble role="user" content={turn.user.content} />
                                        )}
                                        {turn.bots.map((botMsg: any, i: number) => {
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
                            {/* Bottom spacer */}
                            <div ref={messagesEndRef} className="h-[150px] w-full shrink-0" />
                        </div>
                    </>
                )}
            </div>

            {/* ── Bottom Input Area (only if has messages) ── */}
            {hasMessages && (
                <div style={{
                    flexShrink: 0,
                    padding: isSmallScreen ? '8px 12px 16px' : '8px 24px 24px',
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
                    {/* Suggestion chips row */}
                    <div className="flex flex-wrap justify-center gap-2 mb-3 max-w-2xl">
                        {SUGGESTIONS.map((q, i) => (
                            <button
                                key={i}
                                onClick={() => setInput(q)}
                                className="px-3 py-1.5 rounded-full text-[11px] font-medium border border-black/[0.06] text-warmgray-400 hover:text-charcoal-700 hover:border-sage-400/40 hover:bg-white transition-all"
                            >
                                {q}
                            </button>
                        ))}
                    </div>
                    <div style={{ width: '100%', maxWidth: 720 }}>
                        {renderInput(false)}
                    </div>
                    <p style={{
                        textAlign: 'center',
                        fontSize: 10,
                        color: '#BCBCBC',
                        marginTop: 10,
                        userSelect: 'none',
                    }}>
                        Powered by Gemini · True Grit 2026 Performance Data
                    </p>
                </div>
            )}

            {/* ── Intake Modal (shadcn Dialog) ────────────── */}
            <Dialog open={showIntake} onOpenChange={setShowIntake}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Upload size={18} className="text-sage-500" /> Smart Data Intake
                        </DialogTitle>
                        <DialogDescription>
                            Paste raw text notes for a single paddler. The parser will extract all 2026 standardized metrics.
                        </DialogDescription>
                    </DialogHeader>

                    <Textarea
                        value={rawIntake}
                        onChange={(e) => setRawIntake(e.target.value)}
                        className="h-40 bg-cream-50 font-mono text-[13px]"
                        placeholder="Mobility - Hip Flexion: Bonus... Total: 18 pts"
                    />

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setShowIntake(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="sage"
                            onClick={handleIntakeSave}
                            className="gap-1.5"
                        >
                            <Save size={14} /> Parse & Save
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default BotUI;
