import React from 'react'
import BotUI from './components/BotUI'
import { Info, Shield, Zap, TrendingUp } from 'lucide-react'

function App() {
    return (
        <div className="min-h-screen p-8 text-white">
            <header className="max-w-7xl mx-auto mb-12 flex justify-between items-end">
                <div>
                    <h1 className="text-5xl font-extrabold mb-2 premium-gradient-text tracking-tighter">READY READY</h1>
                    <p className="text-gray-400 font-medium flex items-center gap-2">
                        <Shield size={16} className="text-red-500" /> True Grit 2026 Performance Engine
                    </p>
                </div>
                <div className="text-right hidden md:block">
                    <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">Status</p>
                    <div className="flex items-center gap-2 justify-end">
                        <div className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_10px_#e63946]" />
                        <span className="text-sm font-bold text-gray-300">PRE-CUTS PHASE</span>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto grid grid-cols-1 xl:grid-cols-12 gap-10">
                {/* Main Chat Area */}
                <section className="xl:col-span-8 flex flex-col gap-6">
                    <BotUI />

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="glass-panel p-4 flex items-center gap-4 bg-white/[0.02]">
                            <div className="p-3 bg-red-600/20 rounded-xl text-red-500">
                                <Zap size={20} />
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 uppercase">Min Requirement</p>
                                <p className="text-lg font-bold">10 Points</p>
                            </div>
                        </div>
                        <div className="glass-panel p-4 flex items-center gap-4 bg-white/[0.02]">
                            <div className="p-3 bg-blue-600/20 rounded-xl text-blue-500">
                                <TrendingUp size={20} />
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 uppercase">Competitive Target</p>
                                <p className="text-lg font-bold">16+ Points</p>
                            </div>
                        </div>
                        <div className="glass-panel p-4 flex items-center gap-4 bg-white/[0.02]">
                            <div className="p-3 bg-green-600/20 rounded-xl text-green-500">
                                <Shield size={20} />
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 uppercase">Mobility</p>
                                <p className="text-lg font-bold">Pass / Fail</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Sidebar / Standards Reference */}
                <aside className="xl:col-span-4 space-y-6">
                    <div className="glass-panel p-6 space-y-6 border-white/5 bg-gradient-to-br from-white/[0.05] to-transparent">
                        <h3 className="text-lg font-bold flex items-center gap-2 mb-4">
                            <Info size={18} className="text-red-500" /> 2026 Standards
                        </h3>

                        <div className="space-y-4">
                            <div className="pb-4 border-b border-white/5">
                                <p className="text-sm font-bold text-gray-300 mb-1">Deadlift</p>
                                <p className="text-xs text-gray-500">♂: 225 or 1.5xBW (1s lockout)</p>
                                <p className="text-xs text-gray-500">♀: 135 or 1.0xBW</p>
                            </div>

                            <div className="pb-4 border-b border-white/5">
                                <p className="text-sm font-bold text-gray-300 mb-1">Pull-Ups (4 pts)</p>
                                <p className="text-xs text-gray-500">♂: ≥ 35 reps</p>
                                <p className="text-xs text-gray-500">♀: ≥ 15 reps</p>
                            </div>

                            <div className="pb-4 border-b border-white/5">
                                <p className="text-sm font-bold text-gray-300 mb-1">Bench Press (4 pts)</p>
                                <p className="text-xs text-gray-500">♂: ≥ 245 lbs (5 reps &lt; 10s)</p>
                                <p className="text-xs text-gray-500">♀: ≥ 135 lbs</p>
                            </div>

                            <div className="pb-4 border-b border-white/5">
                                <p className="text-sm font-bold text-gray-300 mb-1">Run 12min (4 pts)</p>
                                <p className="text-xs text-gray-500">♂: ≥ 3250 m (1% incline)</p>
                                <p className="text-xs text-gray-500">♀: ≥ 2900 m</p>
                            </div>
                        </div>

                        <div className="p-4 bg-red-600/10 rounded-xl border border-red-600/20">
                            <p className="text-xs text-red-500 font-bold uppercase mb-1 italic">Pro Tip</p>
                            <p className="text-xs text-gray-400 leading-relaxed">
                                Use the <span className="text-white font-bold">Intake</span> button above to paste raw test notes. The AI will learn each paddler automatically.
                            </p>
                        </div>
                    </div>
                </aside>
            </main>

            <footer className="max-w-7xl mx-auto mt-16 pt-8 border-t border-white/5 text-center text-gray-500 text-xs">
                &copy; 2026 Ready Ready Analytics. Powered by True Grit Paddlers.
            </footer>
        </div>
    )
}

export default App
