import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { useState, useRef, useEffect } from 'react'
import SidePanel from './Components/SidePanel'
import Home from './Components/Home'
import Dashboard from './Components/Dashboard'
import History from './Components/History'
import Settings from './Components/Settings'
import Auth from './Components/Auth'
import { useAuth } from './context/AuthContext'
import { ChatProvider } from './context/ChatContext'
import './App.css'

function ProtectedRoute({ children }) {
    const { user, loading } = useAuth()
    if (loading) return <div style={{color:"white",display:"flex",alignItems:"center",justifyContent:"center",height:"100vh"}}>Loading...</div>
    if (!user) return <Navigate to="/auth" />
    return children
}

// Avatar 
function UserAvatar({ user, size = 30 }) {
    const initials = (user?.username || user?.name || "?").slice(0, 2).toUpperCase()

    if (user?.picture || user?.avatar) {
        return (
            <img
                src={user.picture || user.avatar}
                alt="avatar"
                style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
            />
        )
    }
    return (
        <div className="tr-avatar" style={{ width: size, height: size }}>
            {initials}
        </div>
    )
}

// Top-right user button + dropdown 
function TopRightUser() {
    const { user, logout } = useAuth()
    const navigate = useNavigate()
    const [open, setOpen] = useState(false)
    const ref = useRef(null)

    useEffect(() => {
        function handler(e) {
            if (ref.current && !ref.current.contains(e.target)) setOpen(false)
        }
        if (open) document.addEventListener('mousedown', handler)
        return () => document.removeEventListener('mousedown', handler)
    }, [open])

    if (!user) return null

    const displayName  = user?.username || user?.name || "Scholar"
    const displayEmail = user?.email || ""

    function go(path) { navigate(path); setOpen(false) }
    function handleLogout() { logout(); navigate('/auth'); setOpen(false) }

    return (
        <div className="tr-user-wrap" ref={ref}>
            <button
                className={`tr-user-btn ${open ? 'open' : ''}`}
                onClick={() => setOpen(v => !v)}
                title={displayName}
            >
                <UserAvatar user={user} size={28} />
                <span className="tr-user-name">{displayName}</span>
                <svg
                    className={`tr-chevron ${open ? 'rotated' : ''}`}
                    viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                    width="13" height="13"
                >
                    <polyline points="6 9 12 15 18 9"/>
                </svg>
            </button>

            {open && (
                <div className="tr-dropdown">
                    <div className="tr-dd-profile">
                        <UserAvatar user={user} size={36} />
                        <div className="tr-dd-profile-text">
                            <span className="tr-dd-name">{displayName}</span>
                            {displayEmail && <span className="tr-dd-email">{displayEmail}</span>}
                        </div>
                    </div>

                    <div className="tr-dd-divider" />

                    <button className="tr-dd-item" onClick={() => go('/settings')}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" width="14" height="14">
                            <circle cx="12" cy="12" r="3"/>
                            <path d="M19.07 4.93a10 10 0 010 14.14M4.93 4.93a10 10 0 000 14.14M12 2v2M12 20v2M2 12h2M20 12h2"/>
                        </svg>
                        Settings
                    </button>

                    <button className="tr-dd-item" onClick={() => go('/settings?tab=account')}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" width="14" height="14">
                            <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
                            <circle cx="12" cy="7" r="4"/>
                        </svg>
                        Account
                    </button>

                    <button className="tr-dd-item" onClick={() => go('/settings?tab=memory')}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" width="14" height="14">
                            <ellipse cx="12" cy="5" rx="9" ry="3"/>
                            <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/>
                            <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>
                        </svg>
                        Memory &amp; Data
                    </button>

                    <button className="tr-dd-item" onClick={() => go('/settings?tab=appearance')}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" width="14" height="14">
                            <circle cx="12" cy="12" r="10"/>
                            <path d="M12 2a10 10 0 000 20M12 2v20M2 12h20"/>
                        </svg>
                        Appearance
                    </button>

                    <div className="tr-dd-divider" />

                    <button className="tr-dd-item tr-dd-danger" onClick={handleLogout}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" width="14" height="14">
                            <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
                            <polyline points="16 17 21 12 16 7"/>
                            <line x1="21" y1="12" x2="9" y2="12"/>
                        </svg>
                        Sign out
                    </button>
                </div>
            )}
        </div>
    )
}

// App Shell (wrapped in ChatProvider so state persists across route changes) 
function AppShell() {
    return (
        // ChatProvider lives INSIDE the router so it has access to navigation,
        // and OUTSIDE the route switch so state survives route changes.
        <ChatProvider>
            <div className="app-shell">
                <SidePanel />
                <main className="main-content">
                    <TopRightUser />
                    <Routes>
                        <Route path="/" element={<Home />} />
                        <Route path="/dashboard" element={<Dashboard />} />
                        <Route path="/history" element={<History />} />
                        <Route path="/settings" element={<Settings />} />
                    </Routes>
                </main>
            </div>
        </ChatProvider>
    )
}

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/auth" element={<Auth />} />
                <Route path="/*" element={
                    <ProtectedRoute>
                        <AppShell />
                    </ProtectedRoute>
                } />
            </Routes>
        </Router>
    )
}

export default App