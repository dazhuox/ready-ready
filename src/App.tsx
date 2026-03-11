import React, { useState, useEffect } from 'react'
import BotUI from './components/BotUI'
import {
    MessageSquare, Home, BarChart3, Users, Settings,
    PanelLeftOpen, PanelLeftClose, Plus, Menu
} from 'lucide-react'

const sidebarNavItems = [
    { icon: MessageSquare, label: 'AI Chat', id: 'chat' },
    { icon: Home, label: 'Home', id: 'home' },
    { icon: BarChart3, label: 'Analytics', id: 'analytics' },
    { icon: Users, label: 'Roster', id: 'roster' },
]

const recentSessions = [
    { label: 'General checkup', date: 'Today' },
    { label: 'Sprint analysis', date: 'Yesterday' },
    { label: 'Erg comparison', date: 'Mar 8' },
]

function App() {
    const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth > 1024)
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768)
    const [isLargeScreen, setIsLargeScreen] = useState(window.innerWidth > 1440)
    const [activeTab, setActiveTab] = useState('chat')

    useEffect(() => {
        const handleResize = () => {
            const width = window.innerWidth
            setIsMobile(width < 768)
            setIsLargeScreen(width > 1440)
            if (width < 768) {
                setSidebarOpen(false)
            } else if (width > 1024) {
                setSidebarOpen(true)
            }
        }
        window.addEventListener('resize', handleResize)
        return () => window.removeEventListener('resize', handleResize)
    }, [])

    const sidebarWidth = sidebarOpen ? (isLargeScreen ? 280 : 248) : (isMobile ? 0 : 64)

    return (
        <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', position: 'relative' }}>

            {/* ── Sidebar Overlay (Mobile only) ────────────── */}
            {isMobile && sidebarOpen && (
                <div 
                    onClick={() => setSidebarOpen(false)}
                    style={{
                        position: 'absolute',
                        inset: 0,
                        backgroundColor: 'rgba(0,0,0,0.2)',
                        backdropFilter: 'blur(2px)',
                        zIndex: 40,
                    }}
                />
            )}

            {/* ── Sidebar ─────────────────────────────────── */}
            <aside style={{
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
                width: sidebarWidth,
                flexShrink: 0,
                borderRight: '1px solid rgba(0,0,0,0.04)',
                background: 'rgba(255,255,255,0.95)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                overflow: 'hidden',
                position: isMobile ? 'absolute' : 'relative',
                zIndex: 50,
                left: 0,
            }}>

                {/* Logo row */}
                <div style={{
                    height: 56,
                    display: 'flex',
                    alignItems: 'center',
                    padding: sidebarOpen ? '0 12px 0 16px' : '0',
                    justifyContent: sidebarOpen ? 'space-between' : 'center',
                    flexShrink: 0,
                }}>
                    {sidebarOpen && (
                        <h1 className="premium-gradient-text" style={{
                            fontSize: 17,
                            fontWeight: 800,
                            letterSpacing: '-0.03em',
                            lineHeight: 1,
                        }}>
                            Ready Ready
                        </h1>
                    )}
                    <button
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                        style={{
                            padding: '6px',
                            borderRadius: 8,
                            color: '#A0A0A0',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                        className="hover:bg-black/[0.04] hover:text-charcoal-600"
                        title={sidebarOpen ? 'Collapse' : 'Expand'}
                    >
                        {sidebarOpen ? <PanelLeftClose size={17} /> : <PanelLeftOpen size={17} />}
                    </button>
                </div>

                {/* New Conv button */}
                {sidebarOpen && (
                    <div style={{ padding: '0 10px 8px' }}>
                        <button style={{
                            width: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            padding: '8px 12px',
                            borderRadius: 10,
                            border: '1px solid rgba(0,0,0,0.07)',
                            background: 'rgba(255,255,255,0.85)',
                            color: '#4A4A4A',
                            fontSize: 13,
                            fontWeight: 500,
                            cursor: 'pointer',
                            transition: 'all 0.15s',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                        }}
                        className="hover:bg-white"
                        >
                            <Plus size={14} style={{ color: '#A0A0A0', flexShrink: 0 }} />
                            New conversation
                        </button>
                    </div>
                )}

                {/* Nav items */}
                <nav style={{ flex: 1, padding: sidebarOpen ? '4px 8px 0' : '4px 6px 0' }}>
                    {sidebarNavItems.map(item => (
                        <button
                            key={item.id}
                            onClick={() => {
                                setActiveTab(item.id)
                                if (isMobile) setSidebarOpen(false)
                            }}
                            title={item.label}
                            className={`sidebar-nav-item ${activeTab === item.id ? 'active' : ''}`}
                            style={{
                                width: '100%',
                                justifyContent: (sidebarOpen || isMobile) ? 'flex-start' : 'center',
                                paddingLeft: sidebarOpen ? undefined : 0,
                                paddingRight: sidebarOpen ? undefined : 0,
                                gap: sidebarOpen ? undefined : 0,
                            }}
                        >
                            <item.icon size={18} strokeWidth={activeTab === item.id ? 2.2 : 1.8} />
                            {(sidebarOpen || (isMobile && sidebarOpen)) && <span>{item.label}</span>}
                        </button>
                    ))}
                </nav>

                {/* Recent */}
                {sidebarOpen && (
                    <div style={{
                        padding: '12px 16px',
                        borderTop: '1px solid rgba(0,0,0,0.04)',
                    }}>
                        <p style={{
                            fontSize: 10,
                            fontWeight: 600,
                            textTransform: 'uppercase',
                            letterSpacing: '0.12em',
                            color: '#A0A0A0',
                            marginBottom: 8,
                        }}>
                            Recent
                        </p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            {recentSessions.map((s, i) => (
                                <div key={i} style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 10,
                                    padding: '5px 6px',
                                    borderRadius: 6,
                                    cursor: 'pointer',
                                }}
                                onClick={() => { if (isMobile) setSidebarOpen(false) }}
                                className="hover:bg-black/[0.03] group"
                                >
                                    <div style={{
                                        width: 6,
                                        height: 6,
                                        borderRadius: '50%',
                                        background: '#C0C0C0',
                                        flexShrink: 0,
                                    }} />
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <p style={{
                                            fontSize: 12,
                                            color: '#4A4A4A',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap',
                                            lineHeight: 1.3,
                                        }}>{s.label}</p>
                                        <p style={{ fontSize: 10, color: '#A0A0A0', lineHeight: 1.2 }}>{s.date}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Settings */}
                <div style={{
                    padding: sidebarOpen ? '8px 8px 12px' : '8px 6px 12px',
                    borderTop: '1px solid rgba(0,0,0,0.04)',
                }}>
                    <button
                        className="sidebar-nav-item"
                        title="Settings"
                        style={{
                            width: '100%',
                            justifyContent: sidebarOpen ? 'flex-start' : 'center',
                            paddingLeft: sidebarOpen ? undefined : 0,
                            paddingRight: sidebarOpen ? undefined : 0,
                            gap: sidebarOpen ? undefined : 0,
                        }}
                    >
                        <Settings size={18} strokeWidth={1.8} />
                        {sidebarOpen && <span>Settings</span>}
                    </button>
                </div>
            </aside>

            {/* ── Main Content ───────────────────────────── */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', position: 'relative' }}>
                
                {/* Mobile Header Toggle */}
                {isMobile && !sidebarOpen && (
                    <button 
                        onClick={() => setSidebarOpen(true)}
                        style={{
                            position: 'absolute',
                            top: 12,
                            left: 12,
                            zIndex: 30,
                            padding: '8px',
                            background: 'white',
                            borderRadius: '10px',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                            border: '1px solid rgba(0,0,0,0.05)',
                        }}
                    >
                        <Menu size={20} className="text-charcoal-600" />
                    </button>
                )}

                <BotUI />
            </div>
        </div>
    )
}

export default App
