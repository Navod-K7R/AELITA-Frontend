import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import '../CSS/Dashboard.css'

// Static data 

const PATCH_NOTES = [
  {
    version: 'v0.5.0',
    date: null,
    tag: 'upcoming',
    tagColor: '#ef9f27',
    changes: [
      { type: 'new',     text: 'Zen Focus Mode — distraction-free, minimised UI for deep, precise learning sessions' },
      { type: 'new',     text: 'Agent Select v1.5 — smarter personality routing with enhanced context awareness' },
      { type: 'new',     text: 'Emotion Synthesiser Engine (Beta) — adaptive tone and pacing based on your study state' },
      { type: 'fix',     text: 'Reduced memory footprint during extended chat sessions' },
      { type: 'fix',     text: 'Sidebar scroll position now preserved on navigation' },
      { type: 'improve', text: 'Faster model response initialisation across all study modes' },
    ],
  },
  {
    version: 'v0.4.0',
    date: 'May 8, 2026',
    tag: 'latest',
    tagColor: '#5dcaa5',
    changes: [
      { type: 'new', text: 'File attachments — send PDFs, text files & images to Aelita' },
      { type: 'new', text: 'Deep Study & Quick Study modes with model fallback chains' },
      { type: 'fix', text: 'Session history now loads instantly from the sidebar' },
      { type: 'fix', text: 'Streaming no longer cuts off on long responses' },
    ],
  },
  {
    version: 'v0.3.0',
    date: 'Apr 20, 2026',
    tag: 'stable',
    tagColor: '#7c6fcd',
    changes: [
      { type: 'new', text: 'Persistent chat sessions saved to Supabase' },
      { type: 'new', text: 'Personality system — Apollo, Lyra, Cipher, and more' },
      { type: 'improve', text: 'Settings page with AI model selector' },
      { type: 'fix', text: 'Auth token refresh no longer logs users out unexpectedly' },
    ],
  },
  {
    version: 'v0.2.0',
    date: 'Apr 1, 2026',
    tag: null,
    tagColor: null,
    changes: [
      { type: 'new', text: 'Streaming chat with OpenRouter integration' },
      { type: 'new', text: 'User authentication with JWT' },
      { type: 'improve', text: 'Animated greeting rotates by time of day' },
    ],
  },
]

const ZEN_FEATURES = [
  {
    icon: '🎯',
    title: 'Precision Focus',
    desc: 'Collapses the sidebar, dims non-essential UI, and locks your view to the active session.',
  },
  {
    icon: '🌫️',
    title: 'Ambient Minimiser',
    desc: 'Background glows, animations, and decorative elements are paused to reduce visual noise.',
  },
  {
    icon: '⚖️',
    title: 'Workload Balance',
    desc: 'Smart pacing nudges you to take breaks and tracks your deep-focus streaks over time.',
  },
  {
    icon: '🔕',
    title: 'Distraction Shield',
    desc: 'Suppresses non-urgent notifications and system alerts while a session is active.',
  },
]

const COMING_SOON = [
  {
    icon: '🗓️',
    title: 'Study Planner',
    desc: 'Build revision schedules and track your progress across subjects.',
    color: '#5dcaa5',
  },
  {
    icon: '🃏',
    title: 'Flashcard Engine',
    desc: 'Auto-generate spaced repetition cards from any conversation.',
    color: '#7c6fcd',
  },
  {
    icon: '📊',
    title: 'Progress Analytics',
    desc: `Visualise what you've studied, streaks, and knowledge gaps.`,
    color: '#ef9f27',
  },
  {
    icon: '🤝',
    title: 'Study Rooms',
    desc: 'Collaborative sessions — study with friends, powered by Aelita.',
    color: '#f87171',
  },
  {
    icon: '🎙️',
    title: 'Voice Mode',
    desc: 'Talk to Aelita hands-free while you work or commute.',
    color: '#38bdf8',
  },
  {
    icon: '🧩',
    title: 'Plugin Store',
    desc: 'Community-built extensions to supercharge your workflow.',
    color: '#e879f9',
  },
]

const FACTS = [
  { emoji: '🧠', text: 'The human brain can store approximately 2.5 petabytes of information.' },
  { emoji: '⚡', text: 'Neural signals travel at up to 120 metres per second.' },
  { emoji: '🌌', text: 'There are more stars in the observable universe than grains of sand on Earth.' },
  { emoji: '🔬', text: 'A strand of DNA is about 2 nanometres wide — 50,000 times thinner than a hair.' },
  { emoji: '🌊', text: 'Over 80% of Earth\'s oceans remain unexplored by humans.' },
  { emoji: '⚛️', text: 'Quantum entanglement lets particles influence each other instantly across any distance.' },
  { emoji: '🦠', text: 'Your body contains roughly 38 trillion bacteria — more than human cells.' },
  { emoji: '🕰️', text: 'Time passes slightly faster at higher altitudes due to gravitational time dilation.' },
]

const TYPE_STYLES = {
  new:     { label: 'NEW',     color: '#5dcaa5' },
  fix:     { label: 'FIX',     color: '#f87171' },
  improve: { label: 'IMPROVE', color: '#ef9f27' },
}

const FEEDBACK_TYPES = ['Bug Report', 'Feature Request', 'General', 'Praise']

//  Component 

export default function Dashboard() {
  const { token, user } = useAuth()

  // tabs: 'features' | 'patches' | 'feed'
  const [tab, setTab] = useState('features')
  const [expandedPatch, setExpandedPatch] = useState(0)

  // feedback form
  const [fbType,    setFbType]    = useState('General')
  const [fbText,    setFbText]    = useState('')
  const [fbStatus,  setFbStatus]  = useState(null)   // null | 'sending' | 'sent' | 'error'

  async function submitFeedback() {
    if (!fbText.trim()) return
    setFbStatus('sending')
    try {
      const res = await fetch('http://127.0.0.1:8000/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ type: fbType, message: fbText.trim() }),
      })
      if (!res.ok) throw new Error()
      setFbStatus('sent')
      setFbText('')
      setTimeout(() => setFbStatus(null), 3000)
    } catch {
      setFbStatus('error')
      setTimeout(() => setFbStatus(null), 3000)
    }
  }

  return (
    <div className="dash">

      {/*  ambient glow  */}
      <div className="dash-ambient" />

      {/*  hero header  */}
      <header className="dash-hero">
        <div className="dash-hero-left">
          <p className="dash-eyebrow">AELITA DASHBOARD</p>
          <h1 className="dash-title">Your Scholar Hub</h1>
          <p className="dash-subtitle">
            Explore upcoming features, stay up to date, and shape Aelita's future.
          </p>
        </div>
        <div className="dash-hero-right">
          <div className="dash-version-pill">
            <span className="dash-version-dot" />
            v0.4.0 — Early Access
          </div>
        </div>
      </header>

      {/*  tab nav  */}
      <nav className="dash-tabs">
        {[
          { id: 'features', label: 'Coming Soon', icon: '🚀' },
          { id: 'patches',  label: 'Patch Notes', icon: '📋' },
          { id: 'feed',     label: 'Scholar Feed', icon: '⚡' },
        ].map(t => (
          <button
            key={t.id}
            className={`dash-tab ${tab === t.id ? 'active' : ''}`}
            onClick={() => setTab(t.id)}
          >
            <span>{t.icon}</span> {t.label}
          </button>
        ))}
      </nav>

      {/*  FEATURES TAB  */}
      {tab === 'features' && (
        <div className="dash-section">
          <div className="features-grid">
            {COMING_SOON.map((f, i) => (
              <div
                key={i}
                className="feature-card"
                style={{ '--fc': f.color, animationDelay: `${i * 0.06}s` }}
              >
                <div className="feature-icon">{f.icon}</div>
                <div className="feature-body">
                  <h3>{f.title}</h3>
                  <p>{f.desc}</p>
                </div>
                <div className="feature-badge">Soon</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/*  PATCH NOTES TAB  */}
      {tab === 'patches' && (
        <div className="dash-section patches-layout">

          {/* ── left: patch list ── */}
          <div className="patches-list">
            {PATCH_NOTES.map((patch, i) => (
              <div
                key={i}
                className={`patch-card ${expandedPatch === i ? 'open' : ''} ${patch.tag === 'upcoming' ? 'patch-card--upcoming' : ''}`}
                onClick={() => setExpandedPatch(expandedPatch === i ? -1 : i)}
              >
                <div className="patch-header">
                  <div className="patch-header-left">
                    <span className="patch-version">{patch.version}</span>
                    {patch.tag && (
                      <span
                        className="patch-tag"
                        style={{
                          color: patch.tagColor,
                          borderColor: patch.tagColor + '55',
                          background: patch.tagColor + '15',
                        }}
                      >
                        {patch.tag}
                      </span>
                    )}
                    {patch.date
                      ? <span className="patch-date">{patch.date}</span>
                      : <span className="patch-date patch-date--tba">TBA</span>
                    }
                  </div>
                  <svg
                    className="patch-chevron"
                    width="16" height="16" viewBox="0 0 24 24"
                    fill="none" stroke="currentColor" strokeWidth="2"
                  >
                    <polyline points="6 9 12 15 18 9"/>
                  </svg>
                </div>

                {expandedPatch === i && (
                  <ul className="patch-changes">
                    {patch.changes.map((c, j) => (
                      <li key={j} className="patch-change">
                        <span
                          className="change-type"
                          style={{
                            color: TYPE_STYLES[c.type].color,
                            borderColor: TYPE_STYLES[c.type].color + '44',
                            background: TYPE_STYLES[c.type].color + '12',
                          }}
                        >
                          {TYPE_STYLES[c.type].label}
                        </span>
                        <span className="change-text">{c.text}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>

          {/*  right: Zen Mode announcement  */}
          <div className="zen-announce">
            <div className="zen-announce-header">
              <div className="zen-announce-badge">
                <span className="zen-badge-dot" />
                In Development
              </div>
              <div className="zen-announce-icon">🧘</div>
              <h2 className="zen-announce-title">Zen Focus Mode</h2>
              <p className="zen-announce-sub">
                The next evolution in distraction-free studying. Coming in v0.5.0.
              </p>
            </div>

            <div className="zen-features-list">
              {ZEN_FEATURES.map((zf, i) => (
                <div key={i} className="zen-feature-item" style={{ animationDelay: `${i * 0.07}s` }}>
                  <span className="zen-feature-icon">{zf.icon}</span>
                  <div className="zen-feature-body">
                    <p className="zen-feature-title">{zf.title}</p>
                    <p className="zen-feature-desc">{zf.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="zen-announce-footer">
              <p className="zen-footer-text">
                Zen Mode is being built alongside Agent Select v1.5 and the Emotion Synthesiser Engine — all landing in the next major release.
              </p>
              <div className="zen-progress-bar">
                <div className="zen-progress-fill" style={{ width: '62%' }} />
              </div>
              <div className="zen-progress-labels">
                <span>Development</span>
                <span>62%</span>
              </div>
            </div>
          </div>

        </div>
      )}

      {/*  FEED TAB  */}
      {tab === 'feed' && (
        <div className="dash-section feed-layout">

          {/* facts column */}
          <div className="feed-col">
            <h2 className="feed-col-title">
              <span>⚡</span> Scholar Facts
            </h2>
            <div className="facts-list">
              {FACTS.map((f, i) => (
                <div key={i} className="fact-card" style={{ animationDelay: `${i * 0.05}s` }}>
                  <span className="fact-emoji">{f.emoji}</span>
                  <p className="fact-text">{f.text}</p>
                </div>
              ))}
            </div>
          </div>

          {/* feedback column */}
          <div className="feed-col">
            <h2 className="feed-col-title">
              <span>💬</span> Send Feedback
            </h2>
            <div className="feedback-card">
              <p className="feedback-intro">
                Found a bug? Want a feature? Just want to say hi? We read everything.
              </p>

              <div className="feedback-types">
                {FEEDBACK_TYPES.map(t => (
                  <button
                    key={t}
                    className={`fb-type-btn ${fbType === t ? 'active' : ''}`}
                    onClick={() => setFbType(t)}
                  >
                    {t}
                  </button>
                ))}
              </div>

              <textarea
                className="feedback-textarea"
                placeholder={`What's on your mind? (${fbType})`}
                value={fbText}
                onChange={e => setFbText(e.target.value)}
                rows={5}
              />

              <button
                className={`feedback-submit ${fbStatus || ''}`}
                onClick={submitFeedback}
                disabled={fbStatus === 'sending' || fbStatus === 'sent'}
              >
                {fbStatus === 'sending' && '⏳ Sending…'}
                {fbStatus === 'sent'    && '✅ Sent — thank you!'}
                {fbStatus === 'error'   && '❌ Failed, try again'}
                {!fbStatus             && 'Send Feedback →'}
              </button>
            </div>
          </div>

        </div>
      )}

    </div>
  )
}