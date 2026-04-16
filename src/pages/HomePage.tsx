import React, { useMemo } from 'react';
import { FitnessMetrics } from '../data/types';
import { Trophy, Users, TrendingUp, Target, ArrowRight, Medal, Zap } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface HomePageProps {
    paddlers: FitnessMetrics[];
}

const CUT_STANDARD = { male: 16, female: 14 };
const ELITE = { male: 20, female: 18 };

function getInitials(name: string) {
    return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
}

function getRankBadge(rank: number) {
    if (rank === 1) return <span className="text-amber-500 font-bold text-sm">🥇</span>;
    if (rank === 2) return <span className="text-slate-400 font-bold text-sm">🥈</span>;
    if (rank === 3) return <span className="text-amber-700 font-bold text-sm">🥉</span>;
    return <span className="text-xs font-semibold text-warmgray-400 w-5 text-center">{rank}</span>;
}

export default function HomePage({ paddlers }: HomePageProps) {
    const stats = useMemo(() => {
        const males = paddlers.filter(p => p.gender === 'male');
        const females = paddlers.filter(p => p.gender === 'female');
        const avgTotal = paddlers.reduce((s, p) => s + p.totalPts, 0) / paddlers.length;
        const topPaddler = [...paddlers].sort((a, b) => b.totalPts - a.totalPts)[0];
        const madecut = paddlers.filter(p =>
            p.totalPts >= (p.gender === 'male' ? CUT_STANDARD.male : CUT_STANDARD.female)
        ).length;
        const eliteCount = paddlers.filter(p =>
            p.totalPts >= (p.gender === 'male' ? ELITE.male : ELITE.female)
        ).length;
        const leftPaddlers = paddlers.filter(p => p.paddlingSide === 'left').length;
        const rightPaddlers = paddlers.filter(p => p.paddlingSide === 'right').length;

        return { males, females, avgTotal, topPaddler, madecut, eliteCount, leftPaddlers, rightPaddlers };
    }, [paddlers]);

    const leaderboard = useMemo(() =>
        [...paddlers].sort((a, b) => b.totalPts - a.totalPts).slice(0, 8),
        [paddlers]
    );

    const kpis = [
        {
            label: 'Total Paddlers',
            value: paddlers.length,
            sub: `${stats.males.length}M · ${stats.females.length}F`,
            icon: Users,
            color: 'bg-sage-500/10 text-sage-600',
        },
        {
            label: 'Team Avg Score',
            value: stats.avgTotal.toFixed(1),
            sub: 'out of 20 pts',
            icon: TrendingUp,
            color: 'bg-lavender-200 text-charcoal-700',
        },
        {
            label: 'Made Cut Standard',
            value: stats.madecut,
            sub: `${Math.round(stats.madecut / paddlers.length * 100)}% of team`,
            icon: Target,
            color: 'bg-peach-200 text-charcoal-700',
        },
        {
            label: 'Elite Performers',
            value: stats.eliteCount,
            sub: `≥20 pts (M) / ≥18 pts (F)`,
            icon: Zap,
            color: 'bg-amber-100 text-amber-700',
        },
    ];

    return (
        <div className="flex flex-col h-full overflow-y-auto chat-scroll">
            <div className="max-w-5xl mx-auto w-full px-6 py-8 space-y-8">

                {/* Header */}
                <div>
                    <h1 className="text-2xl font-bold text-charcoal-800 tracking-tight">Team Overview</h1>
                    <p className="text-sm text-warmgray-500 mt-1">True Grit 2026 — Fitness Test Results</p>
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {kpis.map((kpi) => (
                        <div key={kpi.label} className="glass-panel p-4 space-y-3">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${kpi.color}`}>
                                <kpi.icon size={16} />
                            </div>
                            <div>
                                <div className="text-2xl font-bold text-charcoal-800">{kpi.value}</div>
                                <div className="text-xs font-medium text-charcoal-600 mt-0.5">{kpi.label}</div>
                                <div className="text-xs text-warmgray-400 mt-0.5">{kpi.sub}</div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Leaderboard + Paddle Side */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

                    {/* Leaderboard */}
                    <div className="lg:col-span-2 glass-panel p-5">
                        <div className="flex items-center gap-2 mb-4">
                            <Trophy size={16} className="text-amber-500" />
                            <h2 className="text-sm font-bold text-charcoal-800">Overall Leaderboard</h2>
                        </div>
                        <div className="space-y-2">
                            {leaderboard.map((p, i) => {
                                const isElite = p.totalPts >= (p.gender === 'male' ? ELITE.male : ELITE.female);
                                const madeCut = p.totalPts >= (p.gender === 'male' ? CUT_STANDARD.male : CUT_STANDARD.female);
                                const pct = Math.min((p.totalPts / 24) * 100, 100);
                                return (
                                    <div key={p.name} className="flex items-center gap-3">
                                        <div className="w-6 flex-shrink-0 flex justify-center">
                                            {getRankBadge(i + 1)}
                                        </div>
                                        {/* Avatar */}
                                        <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-bold ${p.gender === 'male' ? 'bg-sage-500/15 text-sage-700' : 'bg-lavender-300/50 text-charcoal-700'}`}>
                                            {getInitials(p.name)}
                                        </div>
                                        {/* Name + bar */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-0.5">
                                                <span className="text-xs font-semibold text-charcoal-700 truncate">{p.name}</span>
                                                {isElite && <Badge variant="sage" className="text-[9px] py-0 px-1.5 h-4">Elite</Badge>}
                                                {!madeCut && <Badge variant="outline" className="text-[9px] py-0 px-1.5 h-4 text-coral-500 border-coral-300">Below Cut</Badge>}
                                            </div>
                                            <div className="w-full h-1.5 bg-black/[0.04] rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full transition-all ${isElite ? 'bg-sage-500' : madeCut ? 'bg-sage-400/60' : 'bg-coral-300'}`}
                                                    style={{ width: `${pct}%` }}
                                                />
                                            </div>
                                        </div>
                                        <div className="text-sm font-bold text-charcoal-800 w-10 text-right flex-shrink-0">
                                            {p.totalPts}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Side panel */}
                    <div className="space-y-4">
                        {/* Paddle side */}
                        <div className="glass-panel p-5">
                            <h2 className="text-sm font-bold text-charcoal-800 mb-4">Paddle Side Split</h2>
                            <div className="space-y-3">
                                {[
                                    { label: 'Left', count: stats.leftPaddlers, color: 'bg-sage-400' },
                                    { label: 'Right', count: stats.rightPaddlers, color: 'bg-lavender-400' },
                                ].map(s => (
                                    <div key={s.label}>
                                        <div className="flex justify-between text-xs mb-1">
                                            <span className="text-warmgray-500 font-medium">{s.label} side</span>
                                            <span className="font-bold text-charcoal-700">{s.count}</span>
                                        </div>
                                        <div className="h-2 bg-black/[0.04] rounded-full overflow-hidden">
                                            <div
                                                className={`h-full rounded-full ${s.color}`}
                                                style={{ width: `${(s.count / paddlers.length) * 100}%` }}
                                            />
                                        </div>
                                    </div>
                                ))}
                                <p className="text-[11px] text-warmgray-400 pt-1">
                                    {stats.leftPaddlers > stats.rightPaddlers ? `${stats.leftPaddlers - stats.rightPaddlers} more left paddlers` : `${stats.rightPaddlers - stats.leftPaddlers} more right paddlers`}
                                </p>
                            </div>
                        </div>

                        {/* Gender breakdown */}
                        <div className="glass-panel p-5">
                            <h2 className="text-sm font-bold text-charcoal-800 mb-4">Gender Breakdown</h2>
                            <div className="space-y-3">
                                {[
                                    { label: 'Male', paddlers: stats.males, color: 'bg-sage-400', cut: CUT_STANDARD.male },
                                    { label: 'Female', paddlers: stats.females, color: 'bg-lavender-400', cut: CUT_STANDARD.female },
                                ].map(g => {
                                    const avg = g.paddlers.reduce((s, p) => s + p.totalPts, 0) / (g.paddlers.length || 1);
                                    const cutMakers = g.paddlers.filter(p => p.totalPts >= g.cut).length;
                                    return (
                                        <div key={g.label} className="pb-2 border-b border-black/[0.04] last:border-0 last:pb-0">
                                            <div className="flex justify-between text-xs mb-1">
                                                <span className="font-semibold text-charcoal-700">{g.label}</span>
                                                <span className="text-warmgray-400">{g.paddlers.length} paddlers</span>
                                            </div>
                                            <div className="flex gap-4 text-[11px] text-warmgray-500">
                                                <span>Avg: <strong className="text-charcoal-700">{avg.toFixed(1)}</strong></span>
                                                <span>Cut: <strong className="text-charcoal-700">{cutMakers}/{g.paddlers.length}</strong></span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
