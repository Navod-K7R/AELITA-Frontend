import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useState, useEffect, useRef } from 'react'
import '../CSS/SidePanel.css'
import DeepStudyCreator from './DeepStudyCreator'
import { useChat } from '../context/ChatContext'

const BASE_URL = 'http://127.0.0.1:8000'
const PING_INTERVAL = 5000  // ms

const navItems = [
  {
    path: '/',
    label: 'Home',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z"/>
        <path d="M9 21V12h6v9"/>
      </svg>
    )
  },
  {
    path: '/dashboard',
    label: 'Dashboard',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <rect x="3" y="3" width="7" height="7" rx="1"/>
        <rect x="14" y="3" width="7" height="7" rx="1"/>
        <rect x="3" y="14" width="7" height="7" rx="1"/>
        <rect x="14" y="14" width="7" height="7" rx="1"/>
      </svg>
    )
  },
  {
    path: '/history',
    label: 'History',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <circle cx="12" cy="12" r="10"/>
        <polyline points="12 6 12 12 16 14"/>
      </svg>
    )
  },
  {
    path: '/settings',
    label: 'Settings',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <circle cx="12" cy="12" r="3"/>
        <path d="M19.07 4.93a10 10 0 010 14.14M4.93 4.93a10 10 0 000 14.14"/>
        <path d="M12 2v2M12 20v2M2 12h2M20 12h2"/>
      </svg>
    )
  }
]

// Latency hook 
function useLatency() {
  const [latency, setLatency]   = useState(null)
  const [status,  setStatus]    = useState('connecting')
  const timerRef = useRef(null)

  async function ping() {
    try {
      const t0  = performance.now()
      const res = await fetch(`${BASE_URL}/health`, { cache: 'no-store' })
      const ms  = Math.round(performance.now() - t0)
      if (!res.ok) throw new Error()
      setLatency(ms)
      setStatus(ms < 80 ? 'good' : ms < 200 ? 'ok' : 'slow')
    } catch {
      setLatency(null)
      setStatus('offline')
    }
  }

  useEffect(() => {
    ping()
    timerRef.current = setInterval(ping, PING_INTERVAL)
    return () => clearInterval(timerRef.current)
  }, [])

  return { latency, status }
}

// Status colours 
const STATUS_COLORS = {
  connecting: { dot: '#888',     glow: '#888',     label: 'rgba(255,255,255,0.3)' },
  good:       { dot: '#00e5cc',  glow: '#00e5cc',  label: '#00e5cc'               },
  ok:         { dot: '#5dcaa5',  glow: '#5dcaa5',  label: '#5dcaa5'               },
  slow:       { dot: '#ef9f27',  glow: '#ef9f27',  label: '#ef9f27'               },
  offline:    { dot: '#f87171',  glow: '#f87171',  label: '#f87171'               },
}

// Logo 
function AelitaLogo() {
  return (
    <div className="aelita-logo">
      <div className="logo-orb">
        <div className="orb-core" />
        <div className="orb-ring ring-1" />
        <div className="orb-ring ring-2" />
        <div className="orb-particle p1" />
        <div className="orb-particle p2" />
        <div className="orb-scanline" />
      </div>
      <div className="logo-text">
        <span className="logo-name">AELITA</span>
        <span className="logo-sub">THE ETHEREAL SCHOLAR</span>
      </div>
    </div>
  )
}

// SidePanel 
function SidePanel() {
  const { latency, status } = useLatency()
  const colors = STATUS_COLORS[status]
  const { startDeepProject, startQuickStudy, studyMode } = useChat()
  const navigate  = useNavigate()
  const location  = useLocation()

  const [showCreator, setShowCreator] = useState(false)

  const statusText = status === 'connecting'
    ? 'CONNECTING…'
    : status === 'offline'
    ? 'OFFLINE'
    : `${latency} MS`

  // Deep Study button: open creator 
  function handleDeepStudy() {
    setShowCreator(true)
  }

  // Creator submitted 
  function handleLaunch(config) {
    setShowCreator(false)
    startDeepProject(config)
    // Navigate to home — Home reads the projectConfig from context
    navigate('/')
  }

  //  Quick Study: reset and go home 
  function handleQuickStudy() {
    startQuickStudy()
    navigate('/')
  }

  return (
    <>
      <aside className="side-panel">
        <div className="panel-inner">

          {/* Brand */}
          <div className="brand-section">
            <AelitaLogo />
          </div>

          {/* Nav */}
          <nav className="nav-section">
            {navItems.map((item, i) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/'}
                className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                style={{ animationDelay: `${i * 0.06}s` }}
              >
                <span className="nav-icon">{item.icon}</span>
                <span className="nav-label">{item.label}</span>
                <span className="nav-indicator" />
              </NavLink>
            ))}
          </nav>

          {/* Divider */}
          <div className="panel-divider" />

          {/* Study modes — now wired up */}
          <div className="mode-section">
            <button
              onClick={handleDeepStudy}
              className={`mode-btn mode-deep ${studyMode === 'deep' ? 'mode-active' : ''}`}
            >
              <span className="mode-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="14" height="14">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
                </svg>
              </span>
              <span>Deep Study</span>
              {studyMode === 'deep' && <span className="mode-active-dot" />}
            </button>

            <button
              onClick={handleQuickStudy}
              className={`mode-btn mode-quick ${studyMode === 'quick' ? 'mode-active-quick' : ''}`}
            >
              <span className="mode-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="14" height="14">
                  <circle cx="12" cy="12" r="10"/>
                  <polyline points="12 6 12 12 16 14"/>
                </svg>
              </span>
              <span>Quick Study</span>
              {studyMode === 'quick' && location.pathname === '/' && <span className="mode-active-dot mode-active-dot--quick" />}
            </button>
          </div>

          {/* Footer — live latency */}
          <div className="panel-footer">
            <div
              className="status-dot"
              style={{
                background:  colors.dot,
                boxShadow:   `0 0 6px ${colors.glow}`,
              }}
            />
            <div className="status-info">
              <span className="status-label" style={{ color: colors.label }}>
                {statusText}
              </span>
              <span className="status-sublabel">
                {status === 'offline'
                  ? 'SERVER UNREACHABLE'
                  : status === 'connecting'
                  ? 'CHECKING…'
                  : 'SERVER LATENCY'}
              </span>
            </div>
          </div>

        </div>

        {/* Decorative edge glow */}
        <div className="panel-edge-glow" />
      </aside>

      {/* Deep Study creator modal — rendered outside the aside so it overlays everything */}
      {showCreator && (
        <DeepStudyCreator
          onClose={() => setShowCreator(false)}
          onLaunch={handleLaunch}
        />
      )}
    </>
  )
}

export default SidePanel