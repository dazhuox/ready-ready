import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, Upload, X, Save, Download, ShieldCheck, ArrowUp } from 'lucide-react';
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
                <Button
                    onClick={handleSend}
                    disabled={!input.trim() || isLoading}
                    size="icon"
                    variant={input.trim() && !isLoading ? 'default' : 'secondary'}
                    className="shrink-0 rounded-xl"
                    style={{
                        width: isLargeScreen ? 40 : 36,
                        height: isLargeScreen ? 40 : 36,
                    }}
                    aria-label="Send message"
                >
                    <ArrowUp size={isLargeScreen ? 18 : 16} strokeWidth={2.5} />
                </Button>
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
                                <Button
                                    key={i}
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setInput(q)}
                                    className="rounded-full text-xs text-warmgray-600 hover:text-charcoal-800 h-7"
                                >
                                    {q}
                                </Button>
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
