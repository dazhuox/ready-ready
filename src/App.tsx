import React, { useState } from 'react'
import BotUI from './components/BotUI'
import {
    MessageSquare, Home, BarChart3, Users, Settings,
    ChevronLeft, ChevronRight, Zap, TrendingUp, Shield, Info,
    PanelLeftOpen, PanelLeftClose
} from 'lucide-react'

const sidebarNavItems = [
    { icon: MessageSquare, label: 'AI Chat', id: 'chat', active: true },
    { icon: Home, label: 'Home', id: 'home' },
    { icon: BarChart3, label: 'Analytics', id: 'analytics' },
    { icon: Users, label: 'Roster', id: 'roster' },
]

function App() {
    const [sidebarOpen, setSidebarOpen] = useState(true)
    const [activeTab, setActiveTab] = useState('chat')

    return (
        <div className="flex min-h-screen">
            {/* ── Sidebar ────────────────────────────────── */}
            <aside
                className={`
                    flex flex-col bg-white/70 backdrop-blur-lg border-r border-black/5
                    transition-all duration-300 ease-in-out shrink-0
                    ${sidebarOpen ? 'w-60' : 'w-[68px]'}
                `}
            >
                {/* Logo */}
                <div className={`p-5 flex items-center ${sidebarOpen ? 'justify-between' : 'justify-center'}`}>
                    {sidebarOpen && (
                        <h1 className="text-xl font-extrabold tracking-tight premium-gradient-text">
                            Ready Ready
                        </h1>
                    )}
                    <button
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                        className="p-2 rounded-lg hover:bg-sage-500/10 text-warmgray-500 transition-colors bg-transparent border-none"
                        title={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
                    >
                        {sidebarOpen ? <PanelLeftClose size={18} /> : <PanelLeftOpen size={18} />}
                    </button>
                </div>

                {/* Nav Items */}
                <nav className="flex-1 px-3 space-y-1 mt-2">
                    {sidebarNavItems.map(item => (
                        <button
                            key={item.id}
                            onClick={() => setActiveTab(item.id)}
                            className={`
                                w-full sidebar-nav-item bg-transparent border-none
                                ${activeTab === item.id ? 'active' : ''}
                                ${!sidebarOpen ? 'justify-center px-0' : ''}
                            `}
                            title={item.label}
                        >
                            <item.icon size={20} />
                            {sidebarOpen && <span>{item.label}</span>}
                        </button>
                    ))}
                </nav>

                {/* Recent Sessions (collapsed = hidden) */}
                {sidebarOpen && (
                    <div className="px-4 pb-2 mt-4">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-warmgray-400 mb-3">
                            Recent Sessions
                        </p>
                        <div className="space-y-2">
                            {[
                                { label: 'General checkup', date: 'Today', dot: 'bg-sage-500' },
                                { label: 'Sprint analysis', date: 'Yesterday', dot: 'bg-sage-400' },
                                { label: 'Erg comparison', date: 'Mar 8', dot: 'bg-coral-400' },
                            ].map((s, i) => (
                                <div key={i} className="flex items-center gap-2 cursor-pointer group">
                                    <div className={`w-2 h-2 rounded-full ${s.dot}`} />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs text-charcoal-700 truncate group-hover:text-sage-500 transition-colors">
                                            {s.label}
                                        </p>
                                        <p className="text-[10px] text-warmgray-400">{s.date}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Settings at bottom */}
                <div className="px-3 pb-4 mt-auto">
                    <button
                        className={`
                            w-full sidebar-nav-item bg-transparent border-none
                            ${!sidebarOpen ? 'justify-center px-0' : ''}
                        `}
                        title="Settings"
                    >
                        <Settings size={20} />
                        {sidebarOpen && <span>Settings</span>}
                    </button>
                </div>
            </aside>

            {/* ── Main Content ───────────────────────────── */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Header bar */}
                <header className="px-8 py-5 flex justify-between items-end border-b border-black/5 bg-white/40 backdrop-blur-sm">
                    <div>
                        <h2 className="text-2xl font-bold text-charcoal-800 tracking-tight">
                            {activeTab === 'chat' ? 'AI Performance Assistant' : activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
                        </h2>
                        <p className="text-warmgray-500 text-sm flex items-center gap-2 mt-1">
                            <span className="inline-flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-sage-500 animate-soft-pulse" />
                                <span className="text-sage-600 font-medium text-xs uppercase tracking-wider">Active Session</span>
                            </span>
                        </p>
                    </div>
                    <div className="hidden md:flex items-center gap-2">
                        <span className="text-[10px] text-warmgray-400 uppercase tracking-widest">Status</span>
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-sage-500/10 text-sage-600 text-xs font-semibold rounded-full">
                            <span className="w-1.5 h-1.5 rounded-full bg-sage-500" />
                            Pre-Cuts Phase
                        </span>
                    </div>
                </header>

                {/* Content Area */}
                <main className="flex-1 overflow-y-auto p-6 md:p-8">
                    <div className="max-w-6xl mx-auto grid grid-cols-1 xl:grid-cols-12 gap-8">
                        {/* Chat + stat cards */}
                        <section className="xl:col-span-8 flex flex-col gap-6">
                            <BotUI />

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="glass-panel flex items-center gap-4">
                                    <div className="p-3 bg-coral-300/40 rounded-xl text-coral-500">
                                        <Zap size={20} />
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-warmgray-500 uppercase tracking-wide font-medium">Min Requirement</p>
                                        <p className="text-lg font-bold text-charcoal-800">10 Points</p>
                                    </div>
                                </div>
                                <div className="glass-panel flex items-center gap-4">
                                    <div className="p-3 bg-sage-400/20 rounded-xl text-sage-500">
                                        <TrendingUp size={20} />
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-warmgray-500 uppercase tracking-wide font-medium">Competitive Target</p>
                                        <p className="text-lg font-bold text-charcoal-800">16+ Points</p>
                                    </div>
                                </div>
                                <div className="glass-panel flex items-center gap-4">
                                    <div className="p-3 bg-lavender-300/30 rounded-xl text-lavender-400">
                                        <Shield size={20} />
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-warmgray-500 uppercase tracking-wide font-medium">Mobility</p>
                                        <p className="text-lg font-bold text-charcoal-800">Pass / Fail</p>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Sidebar – Standards */}
                        <aside className="xl:col-span-4 space-y-6">
                            <div className="glass-panel space-y-5">
                                <h3 className="text-base font-bold flex items-center gap-2 text-charcoal-800">
                                    <Info size={18} className="text-sage-500" /> 2026 Standards
                                </h3>

                                <div className="space-y-4">
                                    {[
                                        { name: 'Deadlift', m: '225 or 1.5xBW (1s lockout)', f: '135 or 1.0xBW' },
                                        { name: 'Pull-Ups (4 pts)', m: '≥ 35 reps', f: '≥ 15 reps' },
                                        { name: 'Bench Press (4 pts)', m: '≥ 245 lbs (5 reps < 10s)', f: '≥ 135 lbs' },
                                        { name: 'Run 12min (4 pts)', m: '≥ 3250 m (1% incline)', f: '≥ 2900 m' },
                                    ].map((s, i) => (
                                        <div key={i} className="pb-4 border-b border-black/5 last:border-b-0 last:pb-0">
                                            <p className="text-sm font-semibold text-charcoal-700 mb-1">{s.name}</p>
                                            <p className="text-xs text-warmgray-500">♂: {s.m}</p>
                                            <p className="text-xs text-warmgray-500">♀: {s.f}</p>
                                        </div>
                                    ))}
                                </div>

                                <div className="p-4 bg-sage-500/8 rounded-xl border border-sage-500/15">
                                    <p className="text-xs text-sage-600 font-bold uppercase mb-1">Pro Tip</p>
                                    <p className="text-xs text-warmgray-600 leading-relaxed">
                                        Use the <span className="text-charcoal-800 font-semibold">Intake</span> button above to paste raw test notes. The AI will learn each paddler automatically.
                                    </p>
                                </div>
                            </div>
                        </aside>
                    </div>
                </main>

                <footer className="px-8 py-4 border-t border-black/5 text-center text-warmgray-400 text-xs bg-white/30">
                    &copy; 2026 Ready Ready Analytics. Powered by True Grit Paddlers.
                </footer>
            </div>
        </div>
    )
}

export default App
