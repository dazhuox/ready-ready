import React, { useState, useMemo } from 'react';
import { FitnessMetrics } from '../data/types';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartTooltip,
    ResponsiveContainer, Cell, RadarChart, Radar, PolarGrid, PolarAngleAxis, Legend
} from 'recharts';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TableIcon, BarChart2, RadarIcon, ChevronUp, ChevronDown, FilterIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AnalyticsPageProps {
    paddlers: FitnessMetrics[];
}

type SortKey = 'name' | 'totalPts' | 'pullups' | 'benchPress' | 'hsr' | 'pushupsDips' | 'cardio';
type GenderFilter = 'all' | 'male' | 'female';

// ── Cell color by score ─────────────────────────────────
function scoreCellClass(pts: number | null | undefined): string {
    if (pts === null || pts === undefined) return 'bg-transparent text-warmgray-300';
    if (pts >= 4) return 'bg-sage-500/20 text-sage-700 font-semibold';
    if (pts >= 3) return 'bg-sage-300/20 text-sage-600 font-semibold';
    if (pts >= 2) return 'bg-peach-200/60 text-charcoal-700';
    if (pts >= 1) return 'bg-coral-200/70 text-coral-600';
    return 'bg-red-100 text-red-600 font-semibold';
}

function totalCellClass(pts: number, gender: 'male' | 'female'): string {
    const elite = gender === 'male' ? 20 : 18;
    const cut = gender === 'male' ? 16 : 14;
    if (pts >= elite) return 'bg-sage-500/25 text-sage-700 font-bold';
    if (pts >= cut) return 'bg-peach-200/70 text-charcoal-700 font-semibold';
    return 'bg-coral-200/60 text-coral-600 font-semibold';
}

const METRIC_COLS = [
    { key: 'pullups' as SortKey, label: 'Pull-ups', short: 'Pull' },
    { key: 'benchPress' as SortKey, label: 'Bench Press', short: 'Bench' },
    { key: 'hsr' as SortKey, label: 'HSR', short: 'HSR' },
    { key: 'pushupsDips' as SortKey, label: 'Push/Dips', short: 'Push' },
    { key: 'cardio' as SortKey, label: 'Cardio', short: 'Cardio' },
];

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
        case 'pullups': return p.pullups ? `${p.pullups.reps ?? p.pullups.holdTime + 's'} ${p.pullups.type}` : '—';
        case 'benchPress': return p.benchPress ? `${p.benchPress.lbs}lbs` : '—';
        case 'hsr': return p.hsr ? `${p.hsr.reps} reps` : '—';
        case 'pushupsDips': return p.pushupsDips ? `${p.pushupsDips.reps} ${p.pushupsDips.type}` : '—';
        case 'cardio': return p.cardio?.details ?? '—';
        default: return '—';
    }
}

// Custom bar chart tooltip
const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
        const d = payload[0].payload;
        return (
            <div className="bg-white border border-black/[0.06] rounded-xl shadow-lg px-3 py-2 text-xs">
                <p className="font-semibold text-charcoal-800 mb-1">{d.name}</p>
                <p className="text-warmgray-500">{payload[0].name}: <strong className="text-charcoal-700">{d.pts}</strong></p>
                {d.detail && <p className="text-warmgray-400">{d.detail}</p>}
            </div>
        );
    }
    return null;
};

// ── Spreadsheet View ────────────────────────────────────
function SpreadsheetView({ paddlers }: { paddlers: FitnessMetrics[] }) {
    const [sortKey, setSortKey] = useState<SortKey>('totalPts');
    const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

    const sorted = useMemo(() => {
        return [...paddlers].sort((a, b) => {
            let va: number, vb: number;
            if (sortKey === 'name') {
                return sortDir === 'asc'
                    ? a.name.localeCompare(b.name)
                    : b.name.localeCompare(a.name);
            } else if (sortKey === 'totalPts') {
                va = a.totalPts; vb = b.totalPts;
            } else {
                va = getMetricPts(a, sortKey) ?? -1;
                vb = getMetricPts(b, sortKey) ?? -1;
            }
            return sortDir === 'asc' ? va - vb : vb - va;
        });
    }, [paddlers, sortKey, sortDir]);

    function handleSort(key: SortKey) {
        if (sortKey === key) {
            setSortDir(d => d === 'asc' ? 'desc' : 'asc');
        } else {
            setSortKey(key);
            setSortDir('desc');
        }
    }

    function SortIcon({ col }: { col: SortKey }) {
        if (sortKey !== col) return <ChevronUp size={11} className="text-warmgray-300" />;
        return sortDir === 'desc'
            ? <ChevronDown size={11} className="text-charcoal-600" />
            : <ChevronUp size={11} className="text-charcoal-600" />;
    }

    const ColHeader = ({ col, label }: { col: SortKey, label: string }) => (
        <th
            onClick={() => handleSort(col)}
            className="px-3 py-3 text-left cursor-pointer select-none hover:bg-black/[0.03] transition-colors"
        >
            <div className="flex items-center gap-1 text-[11px] font-semibold text-warmgray-500 uppercase tracking-wide whitespace-nowrap">
                {label} <SortIcon col={col} />
            </div>
        </th>
    );

    return (
        <div className="overflow-auto rounded-xl border border-black/[0.06] bg-white shadow-sm">
            <table className="w-full border-collapse text-xs" style={{ minWidth: 700 }}>
                <thead className="sticky top-0 z-10 bg-cream-50/95 backdrop-blur-sm border-b border-black/[0.06]">
                    <tr>
                        <ColHeader col="name" label="Paddler" />
                        <th className="px-3 py-3 text-left text-[11px] font-semibold text-warmgray-500 uppercase tracking-wide whitespace-nowrap">Side</th>
                        <th className="px-3 py-3 text-left text-[11px] font-semibold text-warmgray-500 uppercase tracking-wide whitespace-nowrap">Deadlift</th>
                        <th className="px-3 py-3 text-left text-[11px] font-semibold text-warmgray-500 uppercase tracking-wide whitespace-nowrap">Core</th>
                        {METRIC_COLS.map(c => <ColHeader key={c.key} col={c.key} label={c.short} />)}
                        <ColHeader col="totalPts" label="Total" />
                    </tr>
                </thead>
                <tbody>
                    {sorted.map((p, i) => (
                        <tr key={p.name} className={cn('border-b border-black/[0.03] hover:bg-black/[0.015] transition-colors', i % 2 === 0 ? '' : 'bg-cream-50/30')}>
                            {/* Name */}
                            <td className="px-3 py-2.5">
                                <div className="flex items-center gap-2">
                                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold flex-shrink-0 ${p.gender === 'male' ? 'bg-sage-500/15 text-sage-700' : 'bg-lavender-300/50 text-charcoal-700'}`}>
                                        {p.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                                    </div>
                                    <span className="font-medium text-charcoal-800 whitespace-nowrap">{p.name}</span>
                                </div>
                            </td>
                            {/* Side */}
                            <td className="px-3 py-2.5">
                                <span className="text-[11px] text-warmgray-500 capitalize">{p.paddlingSide === 'left' ? 'L' : 'R'}</span>
                            </td>
                            {/* Deadlift */}
                            <td className="px-3 py-2.5">
                                {p.deadlift ? (
                                    <span className={cn('px-1.5 py-0.5 rounded text-[11px]', p.deadlift.isBonus ? 'bg-sage-500/15 text-sage-600' : 'bg-cream-200 text-charcoal-600')}>
                                        {p.deadlift.weight}lb{p.deadlift.isBonus ? ' ★' : ''}
                                    </span>
                                ) : <span className="text-warmgray-300">—</span>}
                            </td>
                            {/* Core */}
                            <td className="px-3 py-2.5">
                                {p.core ? (
                                    <span className="text-[11px] text-charcoal-600">Lv {p.core.level}</span>
                                ) : <span className="text-warmgray-300">—</span>}
                            </td>
                            {/* Metric columns */}
                            {METRIC_COLS.map(c => {
                                const pts = getMetricPts(p, c.key);
                                return (
                                    <td key={c.key} className="px-2 py-2.5">
                                        <div className="group relative">
                                            <span className={cn('px-2 py-0.5 rounded text-[11px] block text-center', scoreCellClass(pts))}>
                                                {pts !== null ? pts : '—'}
                                            </span>
                                        </div>
                                    </td>
                                );
                            })}
                            {/* Total */}
                            <td className="px-3 py-2.5">
                                <span className={cn('px-2 py-0.5 rounded text-[12px] block text-center w-12', totalCellClass(p.totalPts, p.gender))}>
                                    {p.totalPts}
                                </span>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

// ── Bar Chart View ──────────────────────────────────────
const CHART_METRICS = [
    { key: 'totalPts', label: 'Total Score', max: 24 },
    { key: 'pullups', label: 'Pull-ups', max: 4 },
    { key: 'benchPress', label: 'Bench Press', max: 4 },
    { key: 'hsr', label: 'HSR', max: 4 },
    { key: 'pushupsDips', label: 'Push-ups / Dips', max: 4 },
    { key: 'cardio', label: 'Cardio', max: 4 },
];

function BarChartView({ paddlers }: { paddlers: FitnessMetrics[] }) {
    const [metric, setMetric] = useState('totalPts');

    const data = useMemo(() => {
        const metricDef = CHART_METRICS.find(m => m.key === metric)!;
        return [...paddlers]
            .map(p => {
                const pts = metric === 'totalPts'
                    ? p.totalPts
                    : getMetricPts(p, metric);
                const detail = metric !== 'totalPts' ? getMetricDetail(p, metric) : undefined;
                return { name: p.name, pts: pts ?? null, gender: p.gender, detail };
            })
            .filter(d => d.pts !== null)
            .sort((a, b) => (b.pts ?? 0) - (a.pts ?? 0));
    }, [paddlers, metric]);

    const metricDef = CHART_METRICS.find(m => m.key === metric)!;

    return (
        <div className="space-y-4">
            {/* Metric selector */}
            <div className="flex flex-wrap gap-2">
                {CHART_METRICS.map(m => (
                    <Button
                        key={m.key}
                        variant={metric === m.key ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setMetric(m.key)}
                        className="h-7 text-xs rounded-lg"
                    >
                        {m.label}
                    </Button>
                ))}
            </div>

            {/* Chart */}
            <div className="bg-white border border-black/[0.06] rounded-xl p-4 shadow-sm">
                <h3 className="text-sm font-semibold text-charcoal-800 mb-1">{metricDef.label} Rankings</h3>
                <p className="text-xs text-warmgray-400 mb-4">
                    {data.length} paddlers · sorted by score
                    {metric === 'hsr' && <span className="ml-2 text-sage-600">★ Most sport-specific metric</span>}
                </p>
                <ResponsiveContainer width="100%" height={Math.max(300, data.length * 32)}>
                    <BarChart data={data} layout="vertical" margin={{ left: 100, right: 40, top: 4, bottom: 4 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.04)" horizontal={false} />
                        <XAxis
                            type="number"
                            domain={[0, metricDef.max]}
                            tick={{ fontSize: 11, fill: '#A0A0A0' }}
                            tickLine={false}
                            axisLine={false}
                        />
                        <YAxis
                            type="category"
                            dataKey="name"
                            width={96}
                            tick={{ fontSize: 11, fill: '#4A4A4A' }}
                            tickLine={false}
                            axisLine={false}
                        />
                        <RechartTooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.02)' }} />
                        <Bar dataKey="pts" radius={[0, 6, 6, 0]} maxBarSize={20}>
                            {data.map((entry, index) => (
                                <Cell
                                    key={index}
                                    fill={entry.gender === 'male' ? '#4A9B8E' : '#B8A4E8'}
                                />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
                {/* Legend */}
                <div className="flex gap-4 mt-3 justify-end">
                    <div className="flex items-center gap-1.5 text-xs text-warmgray-500">
                        <div className="w-3 h-3 rounded-sm bg-sage-500" /> Male
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-warmgray-500">
                        <div className="w-3 h-3 rounded-sm bg-lavender-400" /> Female
                    </div>
                </div>
            </div>
        </div>
    );
}

// ── Radar Chart View ────────────────────────────────────
function RadarView({ paddlers }: { paddlers: FitnessMetrics[] }) {
    const [selectedNames, setSelectedNames] = useState<string[]>(() => {
        const sorted = [...paddlers].sort((a, b) => b.totalPts - a.totalPts);
        return sorted.slice(0, 3).map(p => p.name);
    });

    const COLORS = ['#4A9B8E', '#B8A4E8', '#F5C9A8', '#6AB8A5', '#D4C5F0'];

    function togglePaddler(name: string) {
        setSelectedNames(prev =>
            prev.includes(name)
                ? prev.filter(n => n !== name)
                : prev.length < 5 ? [...prev, name] : prev
        );
    }

    const radarData = [
        { axis: 'Pull-ups', key: 'pullups' },
        { axis: 'Bench', key: 'benchPress' },
        { axis: 'HSR', key: 'hsr' },
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

    const sortedByTotal = useMemo(() => [...paddlers].sort((a, b) => b.totalPts - a.totalPts), [paddlers]);

    return (
        <div className="space-y-4">
            <div className="bg-white border border-black/[0.06] rounded-xl p-4 shadow-sm">
                <h3 className="text-sm font-semibold text-charcoal-800 mb-1">Paddler Comparison Radar</h3>
                <p className="text-xs text-warmgray-400 mb-4">Select up to 5 paddlers to compare across all scored metrics</p>

                {/* Paddler selector */}
                <div className="flex flex-wrap gap-1.5 mb-5">
                    {sortedByTotal.map((p, i) => {
                        const selected = selectedNames.includes(p.name);
                        const colorIdx = selectedNames.indexOf(p.name);
                        return (
                            <button
                                key={p.name}
                                onClick={() => togglePaddler(p.name)}
                                className={cn(
                                    'text-xs px-2.5 py-1 rounded-full border transition-all',
                                    selected
                                        ? 'border-transparent text-white font-medium'
                                        : 'border-black/[0.08] text-warmgray-500 hover:border-black/[0.15] hover:text-charcoal-700 bg-white'
                                )}
                                style={selected ? { backgroundColor: COLORS[colorIdx] } : {}}
                            >
                                {p.name.split(' ')[0]}
                            </button>
                        );
                    })}
                </div>

                {selectedNames.length > 0 ? (
                    <ResponsiveContainer width="100%" height={340}>
                        <RadarChart data={radarData} margin={{ top: 10, right: 30, bottom: 10, left: 30 }}>
                            <PolarGrid stroke="rgba(0,0,0,0.06)" />
                            <PolarAngleAxis
                                dataKey="axis"
                                tick={{ fontSize: 11, fill: '#636E72' }}
                            />
                            {selectedNames.map((name, i) => (
                                <Radar
                                    key={name}
                                    name={name}
                                    dataKey={name}
                                    stroke={COLORS[i]}
                                    fill={COLORS[i]}
                                    fillOpacity={0.12}
                                    strokeWidth={2}
                                    dot={{ r: 3, fill: COLORS[i] }}
                                />
                            ))}
                            <Legend
                                formatter={(v) => <span style={{ fontSize: 11, color: '#4A4A4A' }}>{v}</span>}
                            />
                        </RadarChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="h-40 flex items-center justify-center text-warmgray-400 text-sm">
                        Select at least one paddler above
                    </div>
                )}
            </div>
        </div>
    );
}

// ── Main Page ───────────────────────────────────────────
export default function AnalyticsPage({ paddlers }: AnalyticsPageProps) {
    const [genderFilter, setGenderFilter] = useState<GenderFilter>('all');
    const [view, setView] = useState<'table' | 'bar' | 'radar'>('table');

    const filtered = useMemo(() =>
        genderFilter === 'all' ? paddlers : paddlers.filter(p => p.gender === genderFilter),
        [paddlers, genderFilter]
    );

    return (
        <div className="flex flex-col h-full overflow-y-auto chat-scroll">
            <div className="max-w-6xl mx-auto w-full px-6 py-8 space-y-6">

                {/* Header */}
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-charcoal-800 tracking-tight">Analytics</h1>
                        <p className="text-sm text-warmgray-500 mt-1">True Grit 2026 · {filtered.length} paddlers</p>
                    </div>

                    {/* Controls */}
                    <div className="flex flex-wrap items-center gap-3">
                        {/* Gender filter */}
                        <div className="flex gap-1 p-1 bg-black/[0.04] rounded-xl">
                            {(['all', 'male', 'female'] as GenderFilter[]).map(g => (
                                <button
                                    key={g}
                                    onClick={() => setGenderFilter(g)}
                                    className={cn(
                                        'px-3 py-1.5 rounded-lg text-xs font-medium transition-all capitalize',
                                        genderFilter === g
                                            ? 'bg-white text-charcoal-800 shadow-sm'
                                            : 'text-warmgray-500 hover:text-charcoal-700'
                                    )}
                                >
                                    {g}
                                </button>
                            ))}
                        </div>

                        {/* View toggle */}
                        <div className="flex gap-1 p-1 bg-black/[0.04] rounded-xl">
                            <button
                                onClick={() => setView('table')}
                                title="Spreadsheet"
                                className={cn('p-1.5 rounded-lg transition-all', view === 'table' ? 'bg-white shadow-sm text-charcoal-800' : 'text-warmgray-400 hover:text-charcoal-700')}
                            >
                                <TableIcon size={15} />
                            </button>
                            <button
                                onClick={() => setView('bar')}
                                title="Bar chart"
                                className={cn('p-1.5 rounded-lg transition-all', view === 'bar' ? 'bg-white shadow-sm text-charcoal-800' : 'text-warmgray-400 hover:text-charcoal-700')}
                            >
                                <BarChart2 size={15} />
                            </button>
                            <button
                                onClick={() => setView('radar')}
                                title="Radar comparison"
                                className={cn('p-1.5 rounded-lg transition-all', view === 'radar' ? 'bg-white shadow-sm text-charcoal-800' : 'text-warmgray-400 hover:text-charcoal-700')}
                            >
                                <RadarIcon size={15} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Score Legend */}
                {view === 'table' && (
                    <div className="flex flex-wrap gap-2 items-center">
                        <span className="text-xs text-warmgray-400">Score key:</span>
                        {[
                            { label: '4 pts', cls: 'bg-sage-500/20 text-sage-700' },
                            { label: '3 pts', cls: 'bg-sage-300/20 text-sage-600' },
                            { label: '2 pts', cls: 'bg-peach-200/60 text-charcoal-700' },
                            { label: '1 pt', cls: 'bg-coral-200/70 text-coral-600' },
                            { label: '0 pts', cls: 'bg-red-100 text-red-600' },
                        ].map(l => (
                            <span key={l.label} className={cn('text-[11px] font-medium px-2 py-0.5 rounded', l.cls)}>{l.label}</span>
                        ))}
                        <span className="text-[11px] text-warmgray-300 ml-2">— = no data</span>
                    </div>
                )}

                {/* Views */}
                {view === 'table' && <SpreadsheetView paddlers={filtered} />}
                {view === 'bar' && <BarChartView paddlers={filtered} />}
                {view === 'radar' && <RadarView paddlers={filtered} />}
            </div>
        </div>
    );
}
