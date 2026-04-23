import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { FitnessMetrics } from '../data/types';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartTooltip,
    ResponsiveContainer, Cell,
    RadarChart, Radar, PolarGrid, PolarAngleAxis, Legend
} from 'recharts';
import { TableIcon, BarChart2, Radar as RadarIcon, ChevronUp, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AnalyticsPageProps {
    paddlers: FitnessMetrics[];
}

type SortKey = 'name' | 'totalPts' | 'pullups' | 'benchPress' | 'hsr' | 'pushupsDips' | 'cardio';
type GenderFilter = 'all' | 'male' | 'female';

function scoreCellClass(pts: number | null | undefined): string {
    if (pts === null || pts === undefined) return 'text-warmgray-300';
    if (pts >= 4) return 'bg-[#98BAA3] text-white font-bold';
    if (pts >= 3) return 'bg-[#B5CDBE] text-charcoal-800 font-semibold';
    if (pts >= 2) return 'bg-[#F5B487] text-white font-semibold';
    if (pts >= 1) return 'bg-[#F29F86] text-white font-semibold';
    return 'bg-[#E57373] text-white font-bold';
}

function totalCellClass(pts: number, gender: 'male' | 'female'): string {
    const elite = gender === 'male' ? 20 : 18;
    const cut = gender === 'male' ? 16 : 14;
    if (pts >= elite) return 'bg-[#98BAA3] text-white font-extrabold';
    if (pts >= cut) return 'bg-[#A8A0DE] text-white font-bold';
    return 'bg-[#F29F86] text-white font-bold';
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

function getMetricDetail(p: FitnessMetrics, key: string): string {
    switch (key) {
        case 'pullups': return p.pullups ? `${p.pullups.reps ?? (p.pullups.holdTime + 's')} ${p.pullups.type}` : '—';
        case 'benchPress': return p.benchPress ? `${p.benchPress.lbs}lbs` : '—';
        case 'hsr': return p.hsr ? `${p.hsr.reps} reps` : '—';
        case 'pushupsDips': return p.pushupsDips ? `${p.pushupsDips.reps} ${p.pushupsDips.type}` : '—';
        case 'cardio': return p.cardio?.details ?? '—';
        default: return '—';
    }
}

function getInitials(name: string) {
    return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
}

const METRIC_COLS = [
    { key: 'pullups' as SortKey, label: 'Pull-ups', short: 'Pull-ups' },
    { key: 'benchPress' as SortKey, label: 'Bench Press', short: 'Bench' },
    { key: 'hsr' as SortKey, label: 'HSR', short: 'HSR' },
    { key: 'pushupsDips' as SortKey, label: 'Push/Dips', short: 'Push/Dips' },
    { key: 'cardio' as SortKey, label: 'Cardio', short: 'Cardio' },
];

const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
        const d = payload[0].payload;
        return (
            <div className="bg-white border border-black/[0.07] rounded-xl shadow-lg px-4 py-3 text-xs">
                <p className="font-bold text-charcoal-800 mb-1">{d.fullName || d.name}</p>
                <p className="text-warmgray-500">{payload[0].name}: <strong className="text-charcoal-700 text-sm">{d.pts}</strong></p>
                {d.detail && <p className="text-warmgray-400 mt-0.5">{d.detail}</p>}
            </div>
        );
    }
    return null;
};

/* ── Spreadsheet View ─────────────────────── */
function SpreadsheetView({ paddlers }: { paddlers: FitnessMetrics[] }) {
    const [sortKey, setSortKey] = useState<SortKey>('totalPts');
    const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

    const sorted = useMemo(() => {
        return [...paddlers].sort((a, b) => {
            if (sortKey === 'name') {
                return sortDir === 'asc' ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
            }
            const va = sortKey === 'totalPts' ? a.totalPts : getMetricPts(a, sortKey) ?? -1;
            const vb = sortKey === 'totalPts' ? b.totalPts : getMetricPts(b, sortKey) ?? -1;
            return sortDir === 'asc' ? va - vb : vb - va;
        });
    }, [paddlers, sortKey, sortDir]);

    function handleSort(key: SortKey) {
        if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
        else { setSortKey(key); setSortDir('desc'); }
    }

    const ColHeader = ({ col, label, align = 'left' }: { col: SortKey, label: string, align?: string }) => (
        <th onClick={() => handleSort(col)} className="px-3 py-3 cursor-pointer select-none hover:bg-black/[0.02] transition-colors">
            <div className={`flex items-center gap-1 text-[11px] font-bold text-warmgray-400 uppercase tracking-wide whitespace-nowrap ${align === 'center' ? 'justify-center' : ''}`}>
                {label}
                {sortKey === col
                    ? (sortDir === 'desc' ? <ChevronDown size={11} className="text-charcoal-500" /> : <ChevronUp size={11} className="text-charcoal-500" />)
                    : <ChevronDown size={10} className="text-warmgray-200" />}
            </div>
        </th>
    );

    return (
        <div className="rounded-2xl border border-black/[0.06] bg-white shadow-sm overflow-hidden">
            {/* Score legend */}
            <div className="px-5 py-2.5 border-b border-black/[0.04] flex items-center gap-3 flex-wrap bg-cream-50/60">
                <span className="text-[11px] font-semibold text-warmgray-400">Score:</span>
                {[
                    { label: '4', cls: 'bg-[#98BAA3] text-white' },
                    { label: '3', cls: 'bg-[#B5CDBE] text-charcoal-800' },
                    { label: '2', cls: 'bg-[#F5B487] text-white' },
                    { label: '1', cls: 'bg-[#F29F86] text-white' },
                    { label: '0', cls: 'bg-[#E57373] text-white' },
                ].map(l => (
                    <span key={l.label} className={cn('text-[11px] w-7 h-5 flex items-center justify-center rounded font-bold shadow-sm', l.cls)}>{l.label}</span>
                ))}
                <span className="text-[11px] text-warmgray-300 ml-1">— = no data</span>
            </div>
            <div className="overflow-auto" style={{ maxHeight: 'calc(100vh - 220px)' }}>
                <table className="w-full border-collapse text-xs" style={{ minWidth: 780 }}>
                    <thead className="sticky top-0 z-10 bg-cream-50/98 backdrop-blur-sm border-b border-black/[0.06]">
                        <tr>
                            <th className="px-3 py-3 text-[11px] font-bold text-warmgray-400 uppercase tracking-wide text-center w-12">Rank</th>
                            <ColHeader col="name" label="Athlete Name" />
                            <th className="px-3 py-3 text-[11px] font-bold text-warmgray-400 uppercase tracking-wide text-center w-16">Gender</th>
                            {METRIC_COLS.map(c => <ColHeader key={c.key} col={c.key} label={c.short} align="center" />)}
                            <ColHeader col="totalPts" label="Total" align="center" />
                        </tr>
                    </thead>
                    <tbody>
                        {sorted.map((p, i) => (
                            <tr key={p.name} className={cn(
                                'border-b border-black/[0.03] hover:bg-black/[0.015] transition-colors',
                                i % 2 !== 0 ? 'bg-cream-50/25' : ''
                            )}>
                                {/* Rank */}
                                <td className="px-3 py-3 text-center">
                                    <span className="text-xs font-bold text-warmgray-400">{i + 1}</span>
                                </td>
                                {/* Name + avatar */}
                                <td className="px-3 py-3">
                                    <div className="flex items-center gap-2.5">
                                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[9px] font-bold flex-shrink-0 ${p.gender === 'male' ? 'bg-sage-500/12 text-sage-700' : 'bg-lavender-300/40 text-charcoal-700'}`}>
                                            {getInitials(p.name)}
                                        </div>
                                        <span className="font-semibold text-charcoal-800 whitespace-nowrap">{p.name}</span>
                                    </div>
                                </td>
                                {/* Gender badge */}
                                <td className="px-3 py-3 text-center">
                                    <span className={cn(
                                        'inline-flex items-center justify-center w-6 h-6 rounded-full text-[10px] font-bold',
                                        p.gender === 'male' ? 'bg-sage-500/15 text-sage-700' : 'bg-lavender-300/40 text-lavender-600'
                                    )}>
                                        {p.gender === 'male' ? 'M' : 'F'}
                                    </span>
                                </td>
                                {/* Metric cells */}
                                {METRIC_COLS.map(c => {
                                    const pts = getMetricPts(p, c.key);
                                    return (
                                        <td key={c.key} className="px-2 py-3 text-center">
                                            <span className={cn('inline-block px-2.5 py-0.5 rounded-md text-[11px] min-w-[30px] text-center', scoreCellClass(pts))}>
                                                {pts !== null ? pts : '—'}
                                            </span>
                                        </td>
                                    );
                                })}
                                {/* Total */}
                                <td className="px-3 py-3 text-center">
                                    <span className={cn('inline-block px-3 py-0.5 rounded-lg text-[12px]', totalCellClass(p.totalPts, p.gender))}>
                                        {p.totalPts}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

/* ── Bar Chart View ─────────────────────────── */
const CHART_METRICS = [
    { key: 'totalPts', label: 'Total Score', max: 25 },
    { key: 'hsr', label: 'HSR ★', max: 4 },
    { key: 'pullups', label: 'Pull-ups', max: 4 },
    { key: 'benchPress', label: 'Bench Press', max: 4 },
    { key: 'pushupsDips', label: 'Push/Dips', max: 4 },
    { key: 'cardio', label: 'Cardio', max: 4 },
];

function BarChartView({ paddlers }: { paddlers: FitnessMetrics[] }) {
    const [metric, setMetric] = useState('totalPts');

    const data = useMemo(() => {
        return [...paddlers]
            .map(p => ({
                name: p.name.split(' ')[0],
                fullName: p.name,
                pts: metric === 'totalPts' ? p.totalPts : getMetricPts(p, metric),
                detail: metric !== 'totalPts' ? getMetricDetail(p, metric) : undefined,
                gender: p.gender,
            }))
            .filter(d => d.pts !== null)
            .sort((a, b) => (b.pts ?? 0) - (a.pts ?? 0));
    }, [paddlers, metric]);

    const metricDef = CHART_METRICS.find(m => m.key === metric)!;

    return (
        <div className="space-y-5">
            {/* Metric selector */}
            <div className="bg-white rounded-2xl border border-black/[0.05] shadow-sm p-6">
                <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
                    <div>
                        <h3 className="text-base font-bold text-charcoal-800">{metricDef.label} Rankings</h3>
                        <p className="text-xs text-warmgray-400 mt-0.5">{data.length} paddlers ranked by score</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-warmgray-400 font-medium mr-1">Metric:</span>
                        <select
                            value={metric}
                            onChange={e => setMetric(e.target.value)}
                            className="px-3 py-1.5 text-xs bg-white border border-black/[0.1] rounded-xl outline-none focus:border-sage-400/60 text-charcoal-700 cursor-pointer font-semibold"
                        >
                            {CHART_METRICS.map(m => (
                                <option key={m.key} value={m.key}>{m.label}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Legend */}
                <div className="flex gap-5 mb-4">
                    <div className="flex items-center gap-2 text-xs text-warmgray-500">
                        <div className="w-3.5 h-3.5 rounded bg-sage-500" /> Male
                    </div>
                    <div className="flex items-center gap-2 text-xs text-warmgray-500">
                        <div className="w-3.5 h-3.5 rounded bg-lavender-400" /> Female
                    </div>
                </div>

                <ResponsiveContainer width="100%" height={Math.max(360, data.length * 28)}>
                    <BarChart data={data} layout="vertical" margin={{ left: 8, right: 48, top: 4, bottom: 4 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.04)" horizontal={false} />
                        <XAxis
                            type="number"
                            domain={[0, metricDef.max]}
                            tick={{ fontSize: 11, fill: '#BCBCBC' }}
                            tickLine={false}
                            axisLine={false}
                        />
                        <YAxis
                            type="category"
                            dataKey="name"
                            width={80}
                            tick={{ fontSize: 12, fill: '#4A4A4A', fontWeight: '500' }}
                            tickLine={false}
                            axisLine={false}
                        />
                        <RechartTooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.02)' }} />
                        <Bar dataKey="pts" radius={[0, 8, 8, 0]} maxBarSize={18}>
                            {data.map((entry, index) => (
                                <Cell key={index} fill={entry.gender === 'male' ? '#4A9B8E' : '#B8A4E8'} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}

/* ── Radar Comparison View ─────────────────── */
function RadarView({ paddlers }: { paddlers: FitnessMetrics[] }) {
    const sorted = useMemo(() => [...paddlers].sort((a, b) => b.totalPts - a.totalPts), [paddlers]);
    const [selectedNames, setSelectedNames] = useState<string[]>(sorted.slice(0, 3).map(p => p.name));
    const COLORS = ['#4A9B8E', '#B8A4E8', '#F5A623', '#6AB8A5', '#F4A4A4'];

    function togglePaddler(name: string) {
        setSelectedNames(prev =>
            prev.includes(name) ? prev.filter(n => n !== name) : prev.length < 5 ? [...prev, name] : prev
        );
    }

    const radarData = [
        { axis: 'Pull-ups', key: 'pullups' },
        { axis: 'Bench', key: 'benchPress' },
        { axis: 'HSR ★', key: 'hsr' },
        { axis: 'Push/Dips', key: 'pushupsDips' },
        { axis: 'Cardio', key: 'cardio' },
    ].map(({ axis, key }) => {
        const entry: any = { axis };
        selectedNames.forEach(name => {
            const p = paddlers.find(x => x.name === name);
            entry[name] = p ? (getMetricPts(p, key) ?? 0) : 0;
        });
        return entry;
    });

    return (
        <div className="bg-white rounded-2xl border border-black/[0.05] shadow-sm p-6">
            <div className="mb-5">
                <h3 className="text-base font-bold text-charcoal-800">Paddler Comparison</h3>
                <p className="text-xs text-warmgray-400 mt-0.5">Select up to 5 paddlers to compare across scored metrics</p>
            </div>

            {/* Paddler selector chips */}
            <div className="flex flex-wrap gap-2 mb-6 max-h-24 overflow-y-auto">
                {sorted.map(p => {
                    const selected = selectedNames.includes(p.name);
                    const colorIdx = selectedNames.indexOf(p.name);
                    return (
                        <button
                            key={p.name}
                            onClick={() => togglePaddler(p.name)}
                            className={cn(
                                'text-xs px-3 py-1.5 rounded-full border transition-all font-medium',
                                selected ? 'text-white border-transparent shadow-sm' : 'border-black/[0.08] text-warmgray-500 hover:border-black/[0.15] hover:text-charcoal-700 bg-white'
                            )}
                            style={selected ? { backgroundColor: COLORS[colorIdx] } : {}}
                        >
                            {p.name.split(' ')[0]}
                        </button>
                    );
                })}
            </div>

            {selectedNames.length > 0 ? (
                <div className="flex flex-col lg:flex-row gap-6 items-start">
                    <div className="flex-1 min-w-0">
                        <ResponsiveContainer width="100%" height={380}>
                            <RadarChart data={radarData} margin={{ top: 24, right: 40, bottom: 24, left: 40 }}>
                                <PolarGrid stroke="rgba(0,0,0,0.07)" />
                                <PolarAngleAxis dataKey="axis" tick={{ fontSize: 12, fill: '#636E72', fontWeight: '500' }} />
                                {selectedNames.map((name, i) => (
                                    <Radar key={name} name={name} dataKey={name}
                                        stroke={COLORS[i]} fill={COLORS[i]} fillOpacity={0.08} strokeWidth={2}
                                        dot={{ r: 4, fill: COLORS[i], strokeWidth: 0 }}
                                    />
                                ))}
                                <Legend formatter={v => <span style={{ fontSize: 12, color: '#4A4A4A', fontWeight: '500' }}>{v}</span>} />
                            </RadarChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Score Breakdown panel */}
                    <div className="w-full lg:w-64 shrink-0">
                        <div className="rounded-xl border border-black/[0.06] overflow-hidden">
                            <div className="bg-cream-50/80 px-4 py-2.5 border-b border-black/[0.05]">
                                <p className="text-[11px] font-bold text-warmgray-400 uppercase tracking-wide">Score Breakdown</p>
                            </div>
                            {selectedNames.map((name, colorIdx) => {
                                const p = paddlers.find(x => x.name === name)!;
                                if (!p) return null;
                                return (
                                    <div key={name} className="px-4 py-3 border-b border-black/[0.04] last:border-0">
                                        <div className="flex items-center gap-2 mb-2.5">
                                            <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[colorIdx] }} />
                                            <span className="text-xs font-bold text-charcoal-800 truncate">{name}</span>
                                            <span className="text-sm font-extrabold text-charcoal-800 ml-auto">{p.totalPts}</span>
                                        </div>
                                        {[
                                            { label: 'Pull-ups', key: 'pullups' },
                                            { label: 'Bench Press', key: 'benchPress' },
                                            { label: 'HSR', key: 'hsr' },
                                            { label: 'Push/Dips', key: 'pushupsDips' },
                                            { label: 'Cardio', key: 'cardio' },
                                        ].map(m => {
                                            const pts = getMetricPts(p, m.key);
                                            const pct = pts !== null ? (pts / 4) * 100 : 0;
                                            const barColor = pts !== null && pts >= 3.5 ? '#4A9B8E' : pts !== null && pts >= 2 ? '#F5CE7C' : '#F4A4A4';
                                            return (
                                                <div key={m.key} className="flex items-center gap-2 mb-1.5">
                                                    <span className="text-[10px] text-warmgray-400 w-16 shrink-0">{m.label}</span>
                                                    <div className="flex-1 h-2 bg-black/[0.04] rounded-full overflow-hidden">
                                                        <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: barColor, transition: 'width 0.4s ease' }} />
                                                    </div>
                                                    <span className={cn('text-[10px] font-bold w-5 text-right',
                                                        pts !== null && pts >= 3.5 ? 'text-sage-600' : pts !== null && pts >= 2 ? 'text-charcoal-700' : 'text-coral-500'
                                                    )}>
                                                        {pts ?? '—'}
                                                    </span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            ) : (
                <div className="h-52 flex items-center justify-center text-warmgray-400 text-sm">
                    Select at least one paddler above
                </div>
            )}
        </div>
    );
}

/* ── Main Analytics Page ───────────────────── */
export default function AnalyticsPage({ paddlers }: AnalyticsPageProps) {
    const [genderFilter, setGenderFilter] = useState<GenderFilter>('all');
    const [view, setView] = useState<'table' | 'bar' | 'radar'>('table');

    const filtered = useMemo(() =>
        genderFilter === 'all' ? paddlers : paddlers.filter(p => p.gender === genderFilter),
        [paddlers, genderFilter]
    );

    const viewOptions = [
        { id: 'table' as const, icon: TableIcon, label: 'Spreadsheet' },
        { id: 'bar' as const, icon: BarChart2, label: 'Bar Chart' },
        { id: 'radar' as const, icon: RadarIcon, label: 'Radar' },
    ];

    return (
        <div className="flex flex-col h-full overflow-y-auto chat-scroll bg-cream-50/20">
            {/* ── Header ── */}
            <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-sm border-b border-black/[0.04] px-6 md:px-10 py-5">
                <div className="max-w-7xl mx-auto">
                    <div className="flex items-end justify-between gap-6 flex-wrap">
                        <h1 className="text-3xl md:text-4xl font-bold text-charcoal-800 tracking-tight" style={{ fontFamily: 'Playfair Display, serif' }}>
                            Analytics
                        </h1>

                        <div className="flex items-center gap-4 flex-wrap">
                            {/* Gender toggle */}
                            <div className="flex items-center gap-1">
                                <span className="text-xs text-warmgray-400 font-medium mr-1">Gender</span>
                                <div className="flex p-1 bg-[#EEF0F2] rounded-full">
                                    {(['all', 'male', 'female'] as GenderFilter[]).map(g => (
                                        <button key={g} onClick={() => setGenderFilter(g)}
                                            className={cn('px-4 py-1.5 rounded-full text-xs font-semibold transition-all capitalize',
                                                genderFilter === g ? 'bg-white text-charcoal-800 shadow-sm border border-black/5' : 'text-warmgray-500 hover:text-charcoal-700')}>
                                            {g}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* View toggle */}
                            <div className="flex p-1 bg-[#EEF0F2] rounded-full">
                                {viewOptions.map(({ id, icon: Icon, label }) => (
                                    <button key={id} onClick={() => setView(id)} title={label}
                                        className={cn(
                                            'flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold transition-all',
                                            view === id ? 'bg-white text-charcoal-800 shadow-sm border border-black/5' : 'text-warmgray-500 hover:text-charcoal-700'
                                        )}>
                                        <Icon size={14} />
                                        <span>{label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Content ── */}
            <motion.div
                className="px-6 md:px-10 py-6 max-w-7xl mx-auto w-full"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
            >
                {view === 'table' && <SpreadsheetView paddlers={filtered} />}
                {view === 'bar' && <BarChartView paddlers={filtered} />}
                {view === 'radar' && <RadarView paddlers={filtered} />}
            </motion.div>
        </div>
    );
}
