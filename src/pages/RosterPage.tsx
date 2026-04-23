import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FitnessMetrics } from '../data/types';
import { Search, ChevronDown, X, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RosterPageProps {
    paddlers: FitnessMetrics[];
}

type SortOrder = 'total-desc' | 'total-asc' | 'name-asc' | 'name-desc';
type GenderFilter = 'all' | 'male' | 'female';
type SideFilter = 'all' | 'left' | 'right';

function getInitials(name: string) {
    return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
}

function tierConfig(totalPts: number, gender: 'male' | 'female') {
    const elite = gender === 'male' ? 20 : 18;
    const cut = gender === 'male' ? 16 : 14;
    if (totalPts >= elite) return { border: 'border-l-[#4A9B8E]', label: 'Elite', isElite: true, isCut: true, color: '#4A9B8E', bg: 'bg-[#4A9B8E]' };
    if (totalPts >= cut) return { border: 'border-l-[#F5B387]', label: 'Qualified', isElite: false, isCut: true, color: '#F5B387', bg: 'bg-[#F5B387]' };
    return { border: 'border-l-[#F29F86]', label: 'Below Cut', isElite: false, isCut: false, color: '#F29F86', bg: 'bg-[#F29F86]' };
}

function getMetricPts(p: FitnessMetrics, key: string): number | null {
    switch (key) {
        case 'pullups': return p.pullups?.pts ?? null;
        case 'benchPress': return p.benchPress?.pts ?? null;
        case 'hsr': return p.hsr?.pts ?? null;
        case 'pushupsDips': return p.pushupsDips?.pts ?? null;
        case 'cardio': return p.cardio?.pts ?? null;
        default: return null;
    }
}

/* ── Ready Score Bar ── */
function ReadyScoreBar({ pts, max = 25, color }: { pts: number; max?: number; color: string }) {
    const pct = Math.min((pts / max) * 100, 100);
    return (
        <div className="flex items-center gap-3 w-full">
            <div className="relative flex-1 h-[22px] bg-black/[0.04] rounded-full overflow-hidden min-w-[200px]">
                <div
                    className="h-full rounded-full flex items-center px-3"
                    style={{ width: `${pct}%`, backgroundColor: color, transition: 'width 0.5s ease', minWidth: '95px' }}
                >
                    <span className="text-[11px] font-bold text-white whitespace-nowrap">Ready Score: {pts}</span>
                </div>
            </div>
            <span className="text-[26px] font-bold text-charcoal-800 tracking-tight leading-none shrink-0 w-8">{pts}</span>
        </div>
    );
}

/* ── Score Bar (for expanded metrics) ── */
function MetricScoreBar({ pts, max = 4 }: { pts: number | null | undefined; max?: number }) {
    if (pts === null || pts === undefined) return <span className="text-warmgray-300 text-xs">—</span>;
    const pct = (pts / max) * 100;
    const barColor = pts >= 3.5 ? '#4A9B8E' : pts >= 2.5 ? '#6AB8A5' : pts >= 1.5 ? '#F5CE7C' : '#F4A4A4';
    return (
        <div className="flex items-center gap-2">
            <div className="flex-1 h-2.5 bg-black/[0.04] rounded-full overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: barColor, transition: 'width 0.4s ease' }} />
            </div>
            <span className={cn('text-xs font-bold w-6 text-right',
                pts >= 3.5 ? 'text-sage-600' : pts >= 2 ? 'text-charcoal-700' : 'text-coral-500'
            )}>{pts}</span>
        </div>
    );
}

/* ── Paddler Card ── */
function PaddlerCard({ p, expanded, onToggle }: { p: FitnessMetrics; expanded: boolean; onToggle: () => void }) {
    const tier = tierConfig(p.totalPts, p.gender);

    return (
        <div className={cn(
            'bg-white rounded-[16px] border border-black/[0.08] shadow-sm overflow-hidden transition-all duration-200',
            'hover:shadow-md',
            'border-l-[6px] border-r-0', tier.border,
            expanded ? 'ring-1 ring-black/[0.05]' : ''
        )}>
            {/* Collapsed header */}
            <button onClick={onToggle} className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-black/[0.01] transition-colors">
                {/* Avatar */}
                <div className={cn(
                    'w-12 h-12 rounded-full flex items-center justify-center text-sm font-extrabold shrink-0 border-2',
                    p.gender === 'male'
                        ? 'bg-sage-500/10 text-sage-700 border-sage-400/30'
                        : 'bg-lavender-200/40 text-lavender-600 border-lavender-400/30'
                )}>
                    {getInitials(p.name)}
                </div>

                {/* Name + meta */}
                <div className="flex-1 min-w-0 pr-4">
                    <div className="flex items-center gap-2 mb-0.5">
                        <span className="font-bold text-[17px] text-charcoal-800" style={{ fontFamily: 'Playfair Display, serif' }}>{p.name}</span>
                        {tier.isElite && <div className="w-5 h-5 rounded-full bg-[#4A9B8E] flex items-center justify-center text-white"><CheckCircle2 size={13} strokeWidth={3} /></div>}
                    </div>
                    <div className="text-[13px] text-charcoal-700 font-medium mb-3">
                        {p.gender === 'male' ? 'M' : 'F'} | {p.paddlingSide === 'left' ? 'L' : 'R'}-Side{p.bodyWeight ? ` | ${p.bodyWeight} lbs` : ''}
                    </div>
                    {/* Ready Score bar */}
                    <div className="max-w-[320px]">
                        <ReadyScoreBar pts={p.totalPts} color={tier.color} />
                    </div>
                </div>

                <ChevronDown size={16} className={cn(
                    'text-warmgray-300 shrink-0 transition-transform duration-200 ml-1',
                    expanded ? 'rotate-180' : ''
                )} />
            </button>

            {/* Expanded detail — Two-column layout */}
            <AnimatePresence initial={false}>
                {expanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
                        className="overflow-hidden"
                    >
                        <div className="border-t border-black/[0.04] bg-cream-50/30">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-0 md:divide-x md:divide-black/[0.04]">

                                {/* ── Left Column ── */}
                                <div className="px-6 py-5 space-y-5">
                                    {/* Header */}
                                    <div className="flex items-center gap-3">
                                        <div className={cn(
                                            'w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold shrink-0',
                                            p.gender === 'male' ? 'bg-sage-500/10 text-sage-700' : 'bg-lavender-200/40 text-lavender-600'
                                        )}>
                                            {getInitials(p.name)}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-3">
                                                <span className="font-bold text-[17px] text-charcoal-800" style={{ fontFamily: 'Playfair Display, serif' }}>{p.name}</span>
                                                {tier.isElite && (
                                                    <span className="text-[10px] font-bold bg-[#4A9B8E] text-white px-2.5 py-0.5 rounded-full -ml-1">
                                                        Elite Tier Badge
                                                    </span>
                                                )}
                                            </div>
                                            <div className="text-[13px] text-charcoal-700 font-medium mt-0.5 mb-3">
                                                {p.gender === 'male' ? 'M' : 'F'} | {p.paddlingSide === 'left' ? 'L' : 'R'}-Side{p.bodyWeight ? ` | ${p.bodyWeight} lbs` : ''}
                                            </div>
                                        </div>
                                    </div>
 
                                    {/* Ready Score bar (repeated in detail) */}
                                    <div className="max-w-[320px]">
                                        <ReadyScoreBar pts={p.totalPts} color={tier.color} />
                                    </div>

                                    {/* Mobility & Strength */}
                                    <div>
                                        <h4 className="text-xs font-bold text-charcoal-800 mb-2.5">Mobility & Strength</h4>
                                        <div className="flex flex-wrap gap-2">
                                            {[
                                                { label: 'Hip Mobility', val: p.mobilityHipFlexion },
                                                { label: 'Shoulder Stability', val: p.stabilityRotatorCuff },
                                            ].map(({ label, val }) => (
                                                <span key={label} className={cn(
                                                    'text-[11px] font-semibold px-3 py-1 rounded-full border',
                                                    val === 'Bonus' ? 'bg-sage-500/12 text-sage-700 border-sage-400/30' :
                                                    val === 'Pass' ? 'bg-black/[0.03] text-charcoal-600 border-black/[0.08]' :
                                                    val === 'Fail' ? 'bg-coral-100/80 text-coral-600 border-coral-300/30' :
                                                    'bg-black/[0.02] text-warmgray-400 border-black/[0.06]'
                                                )}>
                                                    {label}
                                                </span>
                                            ))}
                                            {p.core && (
                                                <span className="text-[11px] font-semibold px-3 py-1 rounded-full border bg-black/[0.03] text-charcoal-600 border-black/[0.08]">
                                                    Core Strength
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Deadlift + Core */}
                                    <div>
                                        <h4 className="text-xs font-bold text-charcoal-800 mb-3">Deadlift + Core</h4>
                                        <div className="flex gap-6">
                                            {/* Mini bar chart visualization */}
                                            <div className="flex items-end gap-2 h-16">
                                                {/* Deadlift bar */}
                                                <div className="flex flex-col items-center gap-1">
                                                    <div
                                                        className="w-8 rounded-t-md bg-sage-500/80"
                                                        style={{ height: p.deadlift ? Math.max(16, (p.deadlift.weight / 400) * 56) : 0 }}
                                                    />
                                                    <span className="text-[8px] text-warmgray-400">DL</span>
                                                </div>
                                                {/* Core bars */}
                                                {p.core && [1, 2, 3, 4].map(lvl => (
                                                    <div key={lvl} className="flex flex-col items-center gap-1">
                                                        <div
                                                            className={cn('w-5 rounded-t-md', lvl <= p.core!.level ? 'bg-sage-500/60' : 'bg-black/[0.06]')}
                                                            style={{ height: 12 + lvl * 10 }}
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                            <div className="text-[11px] text-warmgray-500 space-y-1 pt-1">
                                                <div>Deadlift: <span className="font-semibold text-charcoal-700">{p.deadlift ? `${p.deadlift.weight} lbs` : '—'}</span></div>
                                                <div>Core: <span className="font-semibold text-charcoal-700">{p.core ? `Lv ${p.core.level}` : '—'}</span></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* ── Right Column ── */}
                                <div className="px-6 py-5 space-y-5">
                                    {/* Deadlift + Core (larger chart) */}
                                    <div>
                                        <h4 className="text-xs font-bold text-charcoal-800 mb-3">Deadlift + Core</h4>
                                        <div className="flex items-end gap-3 h-24 mb-3">
                                            {/* Deadlift bar */}
                                            <div className="flex flex-col items-center gap-1 flex-1">
                                                <div
                                                    className="w-full max-w-10 rounded-t-lg bg-gradient-to-t from-sage-600 to-sage-400"
                                                    style={{ height: p.deadlift ? Math.max(20, (p.deadlift.weight / 400) * 80) : 0 }}
                                                />
                                            </div>
                                            {/* Core level bars */}
                                            {p.core && [1, 2, 3, 4].map(lvl => (
                                                <div key={lvl} className="flex flex-col items-center gap-1 flex-1">
                                                    <div
                                                        className={cn('w-full max-w-8 rounded-t-lg', lvl <= p.core!.level ? 'bg-gradient-to-t from-sage-500/70 to-sage-400/50' : 'bg-black/[0.06]')}
                                                        style={{ height: 16 + lvl * 16 }}
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                        <div className="flex gap-6 text-xs text-warmgray-500">
                                            <span>Deadlift: <strong className="text-charcoal-700">{p.deadlift ? `${p.deadlift.weight} lbs` : '—'}</strong></span>
                                            <span>Core: <strong className="text-charcoal-700">{p.core ? `${p.core.level}/4` : '—'}</strong></span>
                                        </div>
                                    </div>

                                    {/* Scored Metrics */}
                                    <div>
                                        <h4 className="text-xs font-bold text-charcoal-800 mb-3">Scored Metrics</h4>
                                        <div className="space-y-3">
                                            {[
                                                { label: 'Pull-ups', key: 'pullups', detail: p.pullups ? `${p.pullups.reps ?? (p.pullups.holdTime + 's')} ${p.pullups.type}` : null },
                                                { label: 'Bench Press', key: 'benchPress', detail: p.benchPress ? `${p.benchPress.lbs}lb` : null },
                                                { label: 'HSR ★', key: 'hsr', detail: p.hsr ? `${p.hsr.reps} reps` : null },
                                                { label: 'Push/Dips', key: 'pushupsDips', detail: p.pushupsDips ? `${p.pushupsDips.reps} ${p.pushupsDips.type}` : null },
                                                { label: 'Cardio', key: 'cardio', detail: p.cardio?.details ?? null },
                                            ].map(({ label, key, detail }) => {
                                                const pts = getMetricPts(p, key);
                                                return (
                                                    <div key={key} className="flex items-center gap-3">
                                                        <span className="text-xs font-medium text-warmgray-500 w-20 shrink-0">{label}</span>
                                                        <div className="flex-1">
                                                            <MetricScoreBar pts={pts} />
                                                        </div>
                                                        {detail && <span className="text-[10px] text-warmgray-400 shrink-0 w-16 text-right truncate">{detail}</span>}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

/* ── Main Roster Page ── */
export default function RosterPage({ paddlers }: RosterPageProps) {
    const [search, setSearch] = useState('');
    const [gender, setGender] = useState<GenderFilter>('all');
    const [side, setSide] = useState<SideFilter>('all');
    const [sort, setSort] = useState<SortOrder>('total-desc');
    const [expandedId, setExpandedId] = useState<string | null>(null);

    const filtered = useMemo(() => {
        let result = [...paddlers];
        if (gender !== 'all') result = result.filter(p => p.gender === gender);
        if (side !== 'all') result = result.filter(p => p.paddlingSide === side);
        if (search) {
            const q = search.toLowerCase();
            result = result.filter(p => p.name.toLowerCase().includes(q));
        }
        result.sort((a, b) => {
            switch (sort) {
                case 'total-desc': return b.totalPts - a.totalPts;
                case 'total-asc': return a.totalPts - b.totalPts;
                case 'name-asc': return a.name.localeCompare(b.name);
                case 'name-desc': return b.name.localeCompare(a.name);
            }
        });
        return result;
    }, [paddlers, gender, side, search, sort]);

    const summary = useMemo(() => ({
        elite: filtered.filter(p => p.totalPts >= (p.gender === 'male' ? 20 : 18)).length,
        cut: filtered.filter(p => p.totalPts >= (p.gender === 'male' ? 16 : 14)).length,
        avg: filtered.length ? (filtered.reduce((s, p) => s + p.totalPts, 0) / filtered.length).toFixed(1) : '—',
    }), [filtered]);

    return (
        <div className="flex flex-col h-full overflow-y-auto chat-scroll bg-cream-50/20">
            {/* ── Sticky header ── */}
            <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-sm border-b border-black/[0.04] px-6 md:px-10 py-5">
                <div className="max-w-5xl mx-auto">
                    <div className="flex items-end justify-between mb-5 flex-wrap gap-4">
                        <h1 className="text-3xl md:text-4xl font-bold text-charcoal-800 tracking-tight" style={{ fontFamily: 'Playfair Display, serif' }}>
                            Roster
                        </h1>
                        {/* Quick stats */}
                        <div className="flex gap-6 items-baseline">
                            <div className="text-right">
                                <span className="text-sm font-semibold text-warmgray-400">Avg Score: </span>
                                <span className="text-lg font-extrabold text-charcoal-800">{summary.avg}</span>
                            </div>
                            <div className="text-right">
                                <span className="text-sm font-semibold text-warmgray-400">Elite Count: </span>
                                <span className="text-lg font-extrabold text-charcoal-800">{summary.elite}</span>
                            </div>
                        </div>
                    </div>

                    {/* Filter bar */}
                    <div className="flex flex-wrap gap-3 items-center">
                        {/* Search */}
                        <div className="relative flex-1 min-w-48 max-w-md">
                            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-warmgray-300" />
                            <input
                                type="text" value={search} onChange={e => setSearch(e.target.value)}
                                placeholder="Search athletes..."
                                className="w-full pl-9 pr-8 py-2.5 text-sm bg-white border border-black/[0.08] rounded-xl outline-none focus:border-sage-400/60 focus:ring-2 focus:ring-sage-400/15 text-charcoal-800 placeholder:text-warmgray-300 transition-all"
                            />
                            {search && (
                                <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-warmgray-300 hover:text-charcoal-600 transition-colors">
                                    <X size={13} />
                                </button>
                            )}
                        </div>

                        {/* Gender dropdown */}
                        <div className="relative">
                            <select value={gender} onChange={e => setGender(e.target.value as GenderFilter)}
                                className="pl-3 pr-8 py-2.5 text-sm bg-white border border-black/[0.08] rounded-xl outline-none focus:border-sage-400/60 text-charcoal-700 appearance-none cursor-pointer font-medium min-w-32">
                                <option value="all">Gender: All</option>
                                <option value="male">Gender: Male</option>
                                <option value="female">Gender: Female</option>
                            </select>
                            <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-warmgray-400 pointer-events-none" />
                        </div>

                        {/* Side dropdown */}
                        <div className="relative">
                            <select value={side} onChange={e => setSide(e.target.value as SideFilter)}
                                className="pl-3 pr-8 py-2.5 text-sm bg-white border border-black/[0.08] rounded-xl outline-none focus:border-sage-400/60 text-charcoal-700 appearance-none cursor-pointer font-medium min-w-28">
                                <option value="all">Side: All</option>
                                <option value="left">Side: Left</option>
                                <option value="right">Side: Right</option>
                            </select>
                            <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-warmgray-400 pointer-events-none" />
                        </div>

                        {/* Sort dropdown */}
                        <div className="relative ml-auto">
                            <select value={sort} onChange={e => setSort(e.target.value as SortOrder)}
                                className="pl-3 pr-8 py-2.5 text-sm bg-white border border-black/[0.08] rounded-xl outline-none focus:border-sage-400/60 text-charcoal-700 appearance-none cursor-pointer font-medium min-w-40">
                                <option value="total-desc">Sort by: Highest Score</option>
                                <option value="total-asc">Sort by: Lowest Score</option>
                                <option value="name-asc">Sort by: Name A–Z</option>
                                <option value="name-desc">Sort by: Name Z–A</option>
                            </select>
                            <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-warmgray-400 pointer-events-none" />
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Card list ── */}
            <div className="px-6 md:px-10 py-6 max-w-5xl mx-auto w-full">
                {filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <div className="w-14 h-14 rounded-2xl bg-black/[0.04] flex items-center justify-center mb-3">
                            <Search size={24} className="text-warmgray-300" />
                        </div>
                        <p className="text-sm font-semibold text-charcoal-600">No paddlers found</p>
                        <p className="text-xs text-warmgray-400 mt-1">Try adjusting your filters</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {filtered.map((p, i) => (
                            <motion.div
                                key={p.name}
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3, delay: Math.min(i * 0.02, 0.4), ease: [0.23, 1, 0.32, 1] }}
                            >
                                <PaddlerCard
                                    p={p}
                                    expanded={expandedId === p.name}
                                    onToggle={() => setExpandedId(prev => prev === p.name ? null : p.name)}
                                />
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
