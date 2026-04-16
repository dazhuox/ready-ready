import React, { useState, useMemo } from 'react';
import { FitnessMetrics } from '../data/types';
import { Search, ChevronDown, ChevronUp, X, ArrowUpDown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
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

function ScorePill({ pts, max = 4 }: { pts: number | null | undefined, max?: number }) {
    if (pts === null || pts === undefined) return <span className="text-warmgray-300 text-xs">—</span>;
    const pct = (pts / max) * 100;
    const color = pts >= 3.5 ? '#4A9B8E' : pts >= 2.5 ? '#6AB8A5' : pts >= 1.5 ? '#F5C9A8' : '#F4A4A4';
    return (
        <div className="flex items-center gap-1.5">
            <div className="w-12 h-1.5 bg-black/[0.05] rounded-full overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
            </div>
            <span className="text-xs font-semibold text-charcoal-700 w-5">{pts}</span>
        </div>
    );
}

function MobilityBadge({ val }: { val: 'Pass' | 'Fail' | 'Bonus' | null }) {
    if (!val) return <span className="text-warmgray-300 text-[10px]">—</span>;
    const cls = val === 'Bonus' ? 'sage' : val === 'Pass' ? 'secondary' : 'destructive';
    return <Badge variant={cls as any} className="text-[9px] h-4 px-1.5">{val}</Badge>;
}

function PaddlerCard({ p, expanded, onToggle }: { p: FitnessMetrics, expanded: boolean, onToggle: () => void }) {
    const cut = p.gender === 'male' ? 16 : 14;
    const elite = p.gender === 'male' ? 20 : 18;
    const isElite = p.totalPts >= elite;
    const madeCut = p.totalPts >= cut;
    const pct = Math.min((p.totalPts / 24) * 100, 100);

    return (
        <div
            className={cn(
                'glass-panel overflow-hidden transition-all duration-200',
                expanded ? 'ring-1 ring-sage-400/30' : ''
            )}
        >
            {/* Card Header — always visible */}
            <button
                onClick={onToggle}
                className="w-full text-left p-4 flex items-center gap-3 hover:bg-black/[0.015] transition-colors"
            >
                {/* Avatar */}
                <div className={cn(
                    'w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0',
                    p.gender === 'male' ? 'bg-sage-500/15 text-sage-700' : 'bg-lavender-300/50 text-charcoal-700'
                )}>
                    {getInitials(p.name)}
                </div>

                {/* Name + meta */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm text-charcoal-800 truncate">{p.name}</span>
                        {isElite && <Badge variant="sage" className="text-[9px] h-4 px-1.5">Elite</Badge>}
                        {!madeCut && <Badge variant="outline" className="text-[9px] h-4 px-1.5 text-coral-500 border-coral-300">Below Cut</Badge>}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[11px] text-warmgray-400 capitalize">{p.gender} · {p.paddlingSide} side</span>
                        {p.bodyWeight && <span className="text-[11px] text-warmgray-400">{p.bodyWeight}lb</span>}
                    </div>
                </div>

                {/* Total score */}
                <div className="flex-shrink-0 text-right mr-1">
                    <div className={cn(
                        'text-xl font-bold',
                        isElite ? 'text-sage-600' : madeCut ? 'text-charcoal-800' : 'text-coral-500'
                    )}>
                        {p.totalPts}
                    </div>
                    <div className="text-[10px] text-warmgray-400">pts</div>
                </div>

                {expanded ? <ChevronUp size={15} className="text-warmgray-400 flex-shrink-0" /> : <ChevronDown size={15} className="text-warmgray-400 flex-shrink-0" />}
            </button>

            {/* Score bar */}
            <div className="px-4 pb-3">
                <div className="h-1.5 bg-black/[0.04] rounded-full overflow-hidden">
                    <div
                        className={cn('h-full rounded-full transition-all', isElite ? 'bg-sage-500' : madeCut ? 'bg-peach-300' : 'bg-coral-300')}
                        style={{ width: `${pct}%` }}
                    />
                </div>
            </div>

            {/* Expanded Detail */}
            {expanded && (
                <div className="border-t border-black/[0.04] px-4 py-4 space-y-4">
                    {/* Mobility/Stability */}
                    <div className="grid grid-cols-2 gap-3 text-xs">
                        <div>
                            <span className="text-warmgray-400 block mb-1">Hip Flexion</span>
                            <MobilityBadge val={p.mobilityHipFlexion} />
                        </div>
                        <div>
                            <span className="text-warmgray-400 block mb-1">Rotator Cuff</span>
                            <MobilityBadge val={p.stabilityRotatorCuff} />
                        </div>
                    </div>

                    {/* Deadlift */}
                    {p.deadlift && (
                        <div className="text-xs">
                            <span className="text-warmgray-400 block mb-1">Deadlift (pass/fail)</span>
                            <span className={cn('font-medium', p.deadlift.isBonus ? 'text-sage-600' : 'text-charcoal-700')}>
                                {p.deadlift.weight}lb × {p.deadlift.reps} reps{p.deadlift.isBonus ? ' ★ Bonus' : ''}
                            </span>
                            {p.hangCleans && (
                                <span className="text-warmgray-400 ml-2">· Hang cleans: {p.hangCleans.weight}lb</span>
                            )}
                        </div>
                    )}

                    {/* Core */}
                    {p.core && (
                        <div className="text-xs">
                            <span className="text-warmgray-400 block mb-1">Core</span>
                            <span className="text-charcoal-700 font-medium">Level {p.core.level} — {p.core.exercise}</span>
                            {p.core.reps && <span className="text-warmgray-400 ml-1">× {p.core.reps}</span>}
                            {p.core.holdTime && <span className="text-warmgray-400 ml-1">({p.core.holdTime}s)</span>}
                        </div>
                    )}

                    {/* Scored metrics */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {[
                            { label: 'Pull-ups', data: p.pullups, detail: p.pullups ? `${p.pullups.reps ?? (p.pullups.holdTime + 's')} ${p.pullups.type}` : null },
                            { label: 'Bench Press', data: p.benchPress, detail: p.benchPress ? `${p.benchPress.lbs}lb${p.benchPress.time ? ` · ${p.benchPress.time}s` : ''}` : null },
                            { label: 'HSR', data: p.hsr, detail: p.hsr?.reps != null ? `${p.hsr.reps} reps` : null },
                            { label: 'Push/Dips', data: p.pushupsDips, detail: p.pushupsDips ? `${p.pushupsDips.reps} ${p.pushupsDips.type}` : null },
                            { label: 'Cardio', data: p.cardio, detail: p.cardio?.details ?? null },
                        ].map(({ label, data, detail }) => (
                            <div key={label} className="flex items-center justify-between py-1.5 border-b border-black/[0.04] last:border-0">
                                <div>
                                    <span className="text-xs font-medium text-charcoal-700">{label}</span>
                                    {detail && <span className="text-[11px] text-warmgray-400 ml-1.5">{detail}</span>}
                                </div>
                                <ScorePill pts={(data as any)?.pts} />
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

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

    return (
        <div className="flex flex-col h-full overflow-y-auto chat-scroll">
            <div className="max-w-4xl mx-auto w-full px-6 py-8 space-y-6">

                {/* Header */}
                <div>
                    <h1 className="text-2xl font-bold text-charcoal-800 tracking-tight">Roster</h1>
                    <p className="text-sm text-warmgray-500 mt-1">{filtered.length} of {paddlers.length} paddlers</p>
                </div>

                {/* Filters row */}
                <div className="flex flex-wrap gap-3 items-center">
                    {/* Search */}
                    <div className="relative flex-1 min-w-48 max-w-64">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-warmgray-400" />
                        <input
                            type="text"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Search paddler..."
                            className="w-full pl-8 pr-8 py-2 text-sm bg-white border border-black/[0.08] rounded-xl outline-none focus:border-sage-400/60 focus:ring-2 focus:ring-sage-400/20 text-charcoal-800 placeholder:text-warmgray-300 transition-all"
                        />
                        {search && (
                            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-warmgray-400 hover:text-charcoal-600">
                                <X size={13} />
                            </button>
                        )}
                    </div>

                    {/* Gender filter */}
                    <div className="flex gap-1 p-1 bg-black/[0.04] rounded-xl">
                        {(['all', 'male', 'female'] as GenderFilter[]).map(g => (
                            <button
                                key={g}
                                onClick={() => setGender(g)}
                                className={cn(
                                    'px-3 py-1.5 rounded-lg text-xs font-medium transition-all capitalize',
                                    gender === g ? 'bg-white text-charcoal-800 shadow-sm' : 'text-warmgray-500 hover:text-charcoal-700'
                                )}
                            >
                                {g}
                            </button>
                        ))}
                    </div>

                    {/* Side filter */}
                    <div className="flex gap-1 p-1 bg-black/[0.04] rounded-xl">
                        {(['all', 'left', 'right'] as SideFilter[]).map(s => (
                            <button
                                key={s}
                                onClick={() => setSide(s)}
                                className={cn(
                                    'px-3 py-1.5 rounded-lg text-xs font-medium transition-all capitalize',
                                    side === s ? 'bg-white text-charcoal-800 shadow-sm' : 'text-warmgray-500 hover:text-charcoal-700'
                                )}
                            >
                                {s}
                            </button>
                        ))}
                    </div>

                    {/* Sort */}
                    <div className="relative">
                        <ArrowUpDown size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-warmgray-400 pointer-events-none" />
                        <select
                            value={sort}
                            onChange={e => setSort(e.target.value as SortOrder)}
                            className="pl-7 pr-3 py-2 text-xs bg-white border border-black/[0.08] rounded-xl outline-none focus:border-sage-400/60 text-charcoal-700 appearance-none cursor-pointer"
                        >
                            <option value="total-desc">Score: High → Low</option>
                            <option value="total-asc">Score: Low → High</option>
                            <option value="name-asc">Name: A → Z</option>
                            <option value="name-desc">Name: Z → A</option>
                        </select>
                    </div>
                </div>

                {/* Paddler cards */}
                {filtered.length === 0 ? (
                    <div className="text-center py-16 text-warmgray-400 text-sm">No paddlers match your filters.</div>
                ) : (
                    <div className="space-y-2">
                        {filtered.map(p => (
                            <PaddlerCard
                                key={p.name}
                                p={p}
                                expanded={expandedId === p.name}
                                onToggle={() => setExpandedId(prev => prev === p.name ? null : p.name)}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
