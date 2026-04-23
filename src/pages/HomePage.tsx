import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { FitnessMetrics } from '../data/types';
import { Users, TrendingUp, Target, Zap, Trophy } from 'lucide-react';

interface HomePageProps {
    paddlers: FitnessMetrics[];
}

const CUT_STANDARD = { male: 16, female: 14 };
const ELITE = { male: 20, female: 18 };

function getInitials(name: string) {
    return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
}

const fadeUp = (delay = 0) => ({
    initial: { opacity: 0, y: 18 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5, ease: [0.23, 1, 0.32, 1] as const, delay },
});

function getTierBadge(pts: number, gender: 'male' | 'female') {
    const elite = gender === 'male' ? ELITE.male : ELITE.female;
    const cut = gender === 'male' ? CUT_STANDARD.male : CUT_STANDARD.female;
    if (pts >= elite) return { label: 'Elite', bg: 'bg-sage-500/18', text: 'text-sage-700', border: 'border-sage-400/30' };
    if (pts >= cut) return { label: 'Qualified', bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-300/40' };
    return { label: 'Below Cut', bg: 'bg-coral-100/80', text: 'text-coral-600', border: 'border-coral-300/30' };
}

export default function HomePage({ paddlers }: HomePageProps) {
    const stats = useMemo(() => {
        const males = paddlers.filter(p => p.gender === 'male');
        const females = paddlers.filter(p => p.gender === 'female');
        const avgTotal = paddlers.reduce((s, p) => s + p.totalPts, 0) / paddlers.length;
        const madecut = paddlers.filter(p =>
            p.totalPts >= (p.gender === 'male' ? CUT_STANDARD.male : CUT_STANDARD.female)
        ).length;
        const eliteCount = paddlers.filter(p =>
            p.totalPts >= (p.gender === 'male' ? ELITE.male : ELITE.female)
        ).length;
        const leftPaddlers = paddlers.filter(p => p.paddlingSide === 'left').length;
        const rightPaddlers = paddlers.filter(p => p.paddlingSide === 'right').length;
        return { males, females, avgTotal, madecut, eliteCount, leftPaddlers, rightPaddlers };
    }, [paddlers]);

    const leaderboard = useMemo(() =>
        [...paddlers].sort((a, b) => b.totalPts - a.totalPts).slice(0, 10),
        [paddlers]
    );

    const kpis = [
        {
            label: 'Total Paddlers',
            value: paddlers.length,
            icon: Users,
            gradient: 'bg-[#98BAA3]',
        },
        {
            label: 'Avg Score',
            value: stats.avgTotal.toFixed(1),
            icon: TrendingUp,
            gradient: 'bg-[#A8A0DE]',
        },
        {
            label: 'Made Cut',
            value: stats.madecut,
            icon: Target,
            gradient: 'bg-[#F29F86]',
        },
        {
            label: 'Elite Tier',
            value: stats.eliteCount,
            icon: Trophy,
            gradient: 'bg-[#F5B387]',
        },
    ];

    return (
        <div className="flex flex-col h-full overflow-y-auto chat-scroll bg-cream-50/20">
            {/* ── Centered Hero ── */}
            <motion.div className="text-center pt-12 pb-8 px-8" {...fadeUp(0)}>
                <p className="text-xs font-bold text-warmgray-400 uppercase tracking-[0.2em] mb-2">True Grit 2026</p>
                <h1 className="text-4xl md:text-5xl font-bold text-charcoal-800 tracking-tight" style={{ fontFamily: 'Playfair Display, serif' }}>
                    Team Overview
                </h1>
            </motion.div>

            <div className="px-6 md:px-10 pb-10 space-y-8 max-w-7xl w-full mx-auto">

                {/* ── KPI Cards ── */}
                <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
                    {kpis.map((kpi, i) => (
                        <motion.div key={kpi.label} {...fadeUp(0.06 + i * 0.05)}>
                            <div className={`relative rounded-xl border border-black/[0.05] ${kpi.gradient} px-6 py-5 shadow-sm hover:shadow-md transition-all duration-200`}>
                                <div className="flex items-center gap-2 mb-3 text-charcoal-800 opacity-90">
                                    <kpi.icon size={22} strokeWidth={1.8} />
                                    <span className="text-[14px] font-medium">{kpi.label}</span>
                                </div>
                                <div className="text-[40px] font-bold text-charcoal-800 tracking-tight leading-none">{kpi.value}</div>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* ── Leaderboard + Right panels ── */}
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

                    {/* Leaderboard */}
                    <motion.div className="xl:col-span-2" {...fadeUp(0.32)}>
                        <div className="bg-white rounded-2xl border border-black/[0.05] shadow-sm overflow-hidden">
                            <div className="px-6 py-5 border-b border-black/[0.04] flex items-center gap-2.5">
                                <Trophy size={16} className="text-amber-500" />
                                <h2 className="text-base font-bold text-charcoal-800 uppercase tracking-wide">Top 10 Leaderboard</h2>
                            </div>
                            <div className="divide-y divide-black/[0.03]">
                                {leaderboard.map((p, i) => {
                                    const tier = getTierBadge(p.totalPts, p.gender);
                                    const pct = Math.min((p.totalPts / 25) * 100, 100);
                                    const rankEmoji = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : null;

                                    return (
                                        <div key={p.name} className="flex items-center gap-4 px-6 py-4 hover:bg-black/[0.01] transition-colors">
                                            {/* Rank */}
                                            <div className="w-8 flex-shrink-0 text-center">
                                                {rankEmoji
                                                    ? <div className="w-6 h-6 mx-auto rounded-full bg-[#EFBF5F] flex items-center justify-center text-xs font-bold text-white shadow-sm border border-white/20">{i + 1}</div>
                                                    : <span className="text-sm font-bold text-warmgray-400">{i + 1}</span>}
                                            </div>
                                            {/* Avatar */}
                                            <div className={`w-9 h-9 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${p.gender === 'male' ? 'bg-sage-500/12 text-sage-700' : 'bg-lavender-300/40 text-charcoal-700'}`}>
                                                {getInitials(p.name)}
                                            </div>
                                            {/* Name */}
                                            <span className="text-sm font-semibold text-charcoal-800 w-40 truncate flex-shrink-0">{p.name}</span>
                                            {/* Tier badge */}
                                            <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border flex-shrink-0 ${tier.bg} ${tier.text} ${tier.border}`}>
                                                {tier.label}
                                            </span>
                                            {/* Bar */}
                                            <div className="flex-1 h-3 bg-[#EEF0F2] rounded-full overflow-hidden">
                                                <div
                                                    className="h-full rounded-full"
                                                    style={{
                                                        width: `${pct}%`,
                                                        backgroundColor: i < 2 ? '#98BAA3' : i < 4 ? '#A8A0DE' : '#F29F86',
                                                        transition: 'width 0.6s cubic-bezier(0.23, 1, 0.32, 1)',
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </motion.div>

                    {/* Right panels */}
                    <motion.div className="space-y-5" {...fadeUp(0.4)}>
                        {/* Paddle Side Split */}
                        <div className="bg-white rounded-2xl border border-black/[0.05] shadow-sm p-6">
                            <h2 className="text-base font-bold text-charcoal-800 mb-5">Paddle Side Split</h2>
                            <div className="space-y-4">
                                {[
                                    { label: 'Left', count: stats.leftPaddlers, color: '#4A9B8E' },
                                    { label: 'Right', count: stats.rightPaddlers, color: '#B8A4E8' },
                                ].map(s => {
                                    const pct = Math.round((s.count / paddlers.length) * 100);
                                    return (
                                        <div key={s.label}>
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-sm font-semibold text-charcoal-700">{s.label}</span>
                                                <span className="text-sm font-bold text-charcoal-700">{pct}%</span>
                                            </div>
                                            <div className="h-3 bg-black/[0.04] rounded-full overflow-hidden">
                                                <div
                                                    className="h-full rounded-full"
                                                    style={{ width: `${pct}%`, backgroundColor: s.color, transition: 'width 0.5s ease' }}
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Gender Breakdown — Male */}
                        {[
                            { label: 'Male', list: stats.males, cut: CUT_STANDARD.male, accent: 'border-t-sage-400' },
                            { label: 'Female', list: stats.females, cut: CUT_STANDARD.female, accent: 'border-t-lavender-400' },
                        ].map(g => {
                            const avg = g.list.reduce((s, p) => s + p.totalPts, 0) / (g.list.length || 1);
                            const cutMakers = g.list.filter(p => p.totalPts >= g.cut).length;
                            return (
                                <div key={g.label} className={`bg-white rounded-2xl border border-black/[0.05] shadow-sm p-6 border-t-[3px] ${g.accent}`}>
                                    <h2 className="text-base font-bold text-charcoal-800 mb-4">Gender Breakdown</h2>
                                    <div className="grid grid-cols-3 gap-4 text-center">
                                        <div>
                                            <div className="text-3xl font-extrabold text-charcoal-800">{g.list.length}</div>
                                            <p className="text-[11px] text-warmgray-400 mt-1">{g.label}</p>
                                        </div>
                                        <div>
                                            <div className="text-3xl font-extrabold text-charcoal-800">{avg.toFixed(1)}</div>
                                            <p className="text-[11px] text-warmgray-400 mt-1">Avg Score</p>
                                        </div>
                                        <div>
                                            <div className="text-3xl font-extrabold text-charcoal-800">{cutMakers}</div>
                                            <p className="text-[11px] text-warmgray-400 mt-1">Made Cut</p>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </motion.div>
                </div>
            </div>
        </div>
    );
}
