// src/Components/History.jsx

import { useState, useEffect, useRef } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import { getSessions, getSessionMessages } from "../api"
import "../CSS/History.css"

const STUDY_QUOTES = [
    { text: "The more that you read, the more things you will know.", author: "Dr. Seuss" },
    { text: "Education is not the filling of a pail, but the lighting of a fire.", author: "W.B. Yeats" },
    { text: "Live as if you were to die tomorrow. Learn as if you were to live forever.", author: "Mahatma Gandhi" },
    { text: "The beautiful thing about learning is that nobody can take it from you.", author: "B.B. King" },
    { text: "An investment in knowledge pays the best interest.", author: "Benjamin Franklin" },
    { text: "The mind is not a vessel to be filled, but a fire to be kindled.", author: "Plutarch" },
    { text: "Curiosity is the wick in the candle of learning.", author: "William Arthur Ward" },
]

function ConfirmModal({ title, message, onConfirm, onCancel }) {
    return (
        <div className="modal-overlay" onClick={onCancel}>
            <div className="modal-box" onClick={e => e.stopPropagation()}>
                <div className="modal-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                    </svg>
                </div>
                <h3 className="modal-title">{title}</h3>
                <p className="modal-message">{message}</p>
                <div className="modal-actions">
                    <button className="hbtn hbtn-cancel" onClick={onCancel}>Cancel</button>
                    <button className="hbtn hbtn-confirm" onClick={onConfirm}>Yes, delete</button>
                </div>
            </div>
        </div>
    )
}

function ActivityHeatmap({ sessions }) {
    const days = 28
    const today = new Date()
    const cells = []

    for (let i = days - 1; i >= 0; i--) {
        const d = new Date(today)
        d.setDate(today.getDate() - i)
        const dateStr = d.toISOString().slice(0, 10)
        const count = sessions.filter(s => s.created_at?.slice(0, 10) === dateStr).length
        cells.push({ date: dateStr, count })
    }

    const getIntensity = (count) => {
        if (count === 0) return "hm-0"
        if (count === 1) return "hm-1"
        if (count === 2) return "hm-2"
        return "hm-3"
    }

    return (
        <div className="heatmap-wrap">
            <div className="heatmap-label">Activity — last 28 days</div>
            <div className="heatmap-grid">
                {cells.map((c, i) => (
                    <div
                        key={i}
                        className={`hm-cell ${getIntensity(c.count)}`}
                        title={`${c.date}: ${c.count} session${c.count !== 1 ? "s" : ""}`}
                    />
                ))}
            </div>
            <div className="heatmap-legend">
                <span>Less</span>
                <div className="hm-cell hm-0" />
                <div className="hm-cell hm-1" />
                <div className="hm-cell hm-2" />
                <div className="hm-cell hm-3" />
                <span>More</span>
            </div>
        </div>
    )
}

function EmptyPanel({ sessions }) {
    const [quote] = useState(() => STUDY_QUOTES[Math.floor(Math.random() * STUDY_QUOTES.length)])
    const deepCount = sessions.filter(s => s.mode === "deep").length
    const quickCount = sessions.filter(s => s.mode === "quick").length

    if (sessions.length === 0) {
        return (
            <div className="empty-panel">
                <div className="ep-empty">
                    <div className="ep-empty-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                    </div>
                    <p className="ep-empty-title">No study sessions yet</p>
                    <p className="ep-empty-sub">Start a conversation with Aelita to begin your learning journey.</p>
                </div>
            </div>
        )
    }

    return (
        <div className="empty-panel">
            <div className="ep-stats">
                <div className="ep-stat">
                    <span className="ep-stat-num">{sessions.length}</span>
                    <span className="ep-stat-label">Total</span>
                </div>
                <div className="ep-stat-divider" />
                <div className="ep-stat">
                    <span className="ep-stat-num deep">{deepCount}</span>
                    <span className="ep-stat-label">Deep</span>
                </div>
                <div className="ep-stat-divider" />
                <div className="ep-stat">
                    <span className="ep-stat-num quick">{quickCount}</span>
                    <span className="ep-stat-label">Quick</span>
                </div>
            </div>

            <ActivityHeatmap sessions={sessions} />

            <div className="ep-quote">
                <div className="ep-quote-mark">"</div>
                <div className="ep-quote-text">{quote.text}</div>
                <div className="ep-quote-author">— {quote.author}</div>
            </div>

            <div className="ep-hint">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="13" height="13">
                    <path d="M19 9l-7 7-7-7" />
                </svg>
                Select a session below to preview
            </div>
        </div>
    )
}

function SessionPanel({ session, messages, loading, onDelete, onResume }) {
    const [copied, setCopied] = useState(false)
    const [copiedLast, setCopiedLast] = useState(false)

    function formatDate(iso) {
        return new Date(iso).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
    }

    function wordCount(msgs) {
        return msgs.reduce((acc, m) => acc + m.content.split(/\s+/).length, 0)
    }

    function estimateReadTime(wc) {
        return `${Math.max(1, Math.round(wc / 200))} min read`
    }

    function copyTranscript() {
        const text = messages
            .map(m => `[${m.role === "user" ? "YOU" : "AELITA"}]\n${m.content}`)
            .join("\n\n---\n\n")
        navigator.clipboard.writeText(text)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    function copyLastAnswer() {
        const last = [...messages].reverse().find(m => m.role === "assistant")
        if (!last) return
        navigator.clipboard.writeText(last.content)
        setCopiedLast(true)
        setTimeout(() => setCopiedLast(false), 2000)
    }

    const wc = wordCount(messages)
    const userMsgs = messages.filter(m => m.role === "user").length
    const aelitaMsgs = messages.filter(m => m.role === "assistant").length
    const firstUserMsg = messages.find(m => m.role === "user")

    return (
        <div className="session-panel">
            {/* Header */}
            <div className="sp-header">
                <div className="sp-header-left">
                    <div className="sp-title">{session.title}</div>
                    <div className="sp-meta">
                        <span className={`sp-badge ${session.mode}`}>
                            {session.mode === "deep" ? "Deep Study" : "Quick Study"}
                        </span>
                        <span className="sp-date">{formatDate(session.created_at)}</span>
                        {!loading && messages.length > 0 && (
                            <>
                                <span className="sp-dot" />
                                <span className="sp-meta-item">{messages.length} messages</span>
                                <span className="sp-dot" />
                                <span className="sp-meta-item">{wc.toLocaleString()} words</span>
                                <span className="sp-dot" />
                                <span className="sp-meta-item">{estimateReadTime(wc)}</span>
                            </>
                        )}
                    </div>
                </div>
                <div className="sp-actions">
                    <button className="sp-btn sp-btn-ghost" onClick={copyTranscript}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="13" height="13">
                            {copied
                                ? <polyline points="20 6 9 17 4 12" />
                                : <><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></>
                            }
                        </svg>
                        {copied ? "Copied!" : "Copy transcript"}
                    </button>
                    <button className="sp-btn sp-btn-ghost" onClick={copyLastAnswer}>
                        {copiedLast ? "Copied!" : "Copy last answer"}
                    </button>
                    <button className="sp-btn sp-btn-delete" onClick={onDelete}>Delete</button>
                    <button className="sp-btn sp-btn-resume" onClick={onResume}>
                        Resume
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="12" height="12">
                            <path d="M5 12h14M12 5l7 7-7 7"/>
                        </svg>
                    </button>
                </div>
            </div>

            {/* Stats row */}
            {!loading && messages.length > 0 && (
                <div className="sp-stats-row">
                    <div className="sp-stat-pill">
                        <span className="sp-stat-pill-n">{userMsgs}</span>
                        <span className="sp-stat-pill-l">your questions</span>
                    </div>
                    <div className="sp-stat-pill">
                        <span className="sp-stat-pill-n">{aelitaMsgs}</span>
                        <span className="sp-stat-pill-l">aelita responses</span>
                    </div>
                    {firstUserMsg && (
                        <div className="sp-topic-pill">
                            <span className="sp-topic-icon">⚡</span>
                            <span className="sp-topic-text">
                                "{firstUserMsg.content.slice(0, 70)}{firstUserMsg.content.length > 70 ? "…" : ""}"
                            </span>
                        </div>
                    )}
                </div>
            )}

            {/* Messages */}
            <div className="sp-messages">
                {loading ? (
                    <div className="sp-loading">
                        <div className="sp-loading-dots"><span /><span /><span /></div>
                        <p>Loading conversation…</p>
                    </div>
                ) : messages.length === 0 ? (
                    <p className="sp-no-msgs">No messages in this session.</p>
                ) : (
                    messages.map((m, i) => (
                        <div key={i} className={`sp-msg ${m.role}`}>
                            <span className={`sp-msg-role ${m.role}`}>
                                {m.role === "user" ? "YOU" : "AELITA"}
                            </span>
                            <span className="sp-msg-text">{m.content}</span>
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}

function History() {
    const { token } = useAuth()
    const navigate = useNavigate()
    const cardsRef = useRef(null)

    const [sessions, setSessions] = useState([])
    const [activeSession, setActiveSession] = useState(null)
    const [activeMessages, setActiveMessages] = useState([])
    const [loading, setLoading] = useState(true)
    const [messagesLoading, setMessagesLoading] = useState(false)
    const [search, setSearch] = useState("")
    const [filter, setFilter] = useState("all")
    const [sortBy, setSortBy] = useState("newest")
    const [toast, setToast] = useState(null)
    const [modal, setModal] = useState(null)
    const [canScrollLeft, setCanScrollLeft] = useState(false)
    const [canScrollRight, setCanScrollRight] = useState(false)
    const [error, setError] = useState(null)

    useEffect(() => { fetchSessions() }, [])
    useEffect(() => { setTimeout(() => checkScroll(), 50) }, [sessions, filter, search, sortBy])

    function checkScroll() {
        const el = cardsRef.current
        if (!el) return
        setCanScrollLeft(el.scrollLeft > 0)
        setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4)
    }

    function scrollCards(dir) {
        const el = cardsRef.current
        if (!el) return
        el.scrollBy({ left: dir * 340, behavior: "smooth" })
        setTimeout(checkScroll, 350)
    }

    function handleWheel(e) {
        const el = cardsRef.current
        if (!el) return
        e.preventDefault()
        el.scrollBy({ left: e.deltaY * 1.5, behavior: "smooth" })
        setTimeout(checkScroll, 350)
    }

    function showToast(msg, type = "success") {
        setToast({ msg, type })
        setTimeout(() => setToast(null), 2500)
    }

    async function fetchSessions() {
        try {
            setLoading(true)
            const data = await getSessions(token)
            setSessions(data)
        } catch {
            setError("Failed to load sessions")
        } finally {
            setLoading(false)
        }
    }

    async function selectSession(session) {
        setActiveSession(session)
        setMessagesLoading(true)
        try {
            const msgs = await getSessionMessages(session.id, token)
            setActiveMessages(msgs)
        } catch {
            setActiveMessages([])
        } finally {
            setMessagesLoading(false)
        }
    }

    async function deleteSession(id) {
        try {
            const res = await fetch(`http://127.0.0.1:8000/chat/sessions/${id}`, {
                method: "DELETE",
                headers: { "Authorization": `Bearer ${token}` }
            })
            if (!res.ok) throw new Error()
            setSessions(prev => prev.filter(s => s.id !== id))
            if (activeSession?.id === id) { setActiveSession(null); setActiveMessages([]) }
            setModal(null)
            showToast("Session deleted")
        } catch {
            setModal(null)
            showToast("Failed to delete session", "error")
        }
    }

    async function deleteAllSessions() {
        try {
            await Promise.all(sessions.map(s =>
                fetch(`http://127.0.0.1:8000/chat/sessions/${s.id}`, {
                    method: "DELETE",
                    headers: { "Authorization": `Bearer ${token}` }
                })
            ))
            setSessions([])
            setActiveSession(null)
            setActiveMessages([])
            setModal(null)
            showToast("All sessions deleted")
        } catch {
            setModal(null)
            showToast("Failed to delete all", "error")
        }
    }

    function formatDate(iso) {
        const d = new Date(iso)
        const now = new Date()
        const diff = Math.floor((now - d) / 86400000)
        if (diff === 0) return "Today"
        if (diff === 1) return "Yesterday"
        if (diff < 7) return `${diff}d ago`
        return d.toLocaleDateString("en-US", { month: "short", day: "numeric" })
    }

    const filtered = sessions
        .filter(s => {
            const matchSearch = s.title.toLowerCase().includes(search.toLowerCase())
            const matchFilter = filter === "all" || s.mode === filter
            return matchSearch && matchFilter
        })
        .sort((a, b) => {
            if (sortBy === "newest") return new Date(b.created_at) - new Date(a.created_at)
            if (sortBy === "oldest") return new Date(a.created_at) - new Date(b.created_at)
            if (sortBy === "az") return a.title.localeCompare(b.title)
            return 0
        })

    return (
        <div className="history-root">
            <div className="history-ambient" />

            {modal?.type === "single" && (
                <ConfirmModal
                    title="Delete session?"
                    message={`"${modal.session.title}" will be permanently removed.`}
                    onConfirm={() => deleteSession(modal.session.id)}
                    onCancel={() => setModal(null)}
                />
            )}
            {modal?.type === "all" && (
                <ConfirmModal
                    title="Clear all sessions?"
                    message={`All ${sessions.length} study sessions will be permanently deleted.`}
                    onConfirm={deleteAllSessions}
                    onCancel={() => setModal(null)}
                />
            )}

            {toast && <div className={`history-toast ${toast.type}`}>{toast.msg}</div>}

            {/* TOP PANEL */}
            <div className="history-top">
                {!activeSession
                    ? <EmptyPanel sessions={sessions} />
                    : <SessionPanel
                        session={activeSession}
                        messages={activeMessages}
                        loading={messagesLoading}
                        onDelete={() => setModal({ type: "single", session: activeSession })}
                        onResume={() => navigate("/", { state: { resumeSession: activeSession } })}
                    />
                }
            </div>

            <div className="history-divider" />

            {/* SHELF */}
            <div className="history-shelf">
                <div className="history-shelf-top">
                    <div className="history-shelf-left">
                        <span className="history-shelf-label">Study Sessions</span>
                        <div className="history-filter-tabs">
                            {["all", "deep", "quick"].map(f => (
                                <button
                                    key={f}
                                    className={`history-filter-tab ${filter === f ? "active" : ""} ${f}`}
                                    onClick={() => setFilter(f)}
                                >
                                    {f === "all" ? "All" : f === "deep" ? "Deep" : "Quick"}
                                </button>
                            ))}
                        </div>
                        <select className="history-sort" value={sortBy} onChange={e => setSortBy(e.target.value)}>
                            <option value="newest">Newest</option>
                            <option value="oldest">Oldest</option>
                            <option value="az">A → Z</option>
                        </select>
                    </div>
                    <div className="history-shelf-right">
                        {sessions.length > 0 && (
                            <button className="hbtn hbtn-delete-all" onClick={() => setModal({ type: "all" })}>
                                Clear all
                            </button>
                        )}
                        <div className="history-search-wrap">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="history-search-icon">
                                <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
                            </svg>
                            <input
                                className="history-search"
                                type="text"
                                placeholder="Search sessions…"
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                            />
                            {search && (
                                <button className="history-search-clear" onClick={() => setSearch("")}>×</button>
                            )}
                        </div>
                    </div>
                </div>

                {loading ? (
                    <p className="history-shelf-status">Loading your sessions…</p>
                ) : error ? (
                    <p className="history-shelf-status">{error}</p>
                ) : filtered.length === 0 ? (
                    <p className="history-shelf-status">
                        {search || filter !== "all" ? "No sessions match." : "No study sessions yet. Start a chat!"}
                    </p>
                ) : (
                    <div className="history-scroll-area">
                        {canScrollLeft && (
                            <button className="scroll-arrow scroll-arrow-left" onClick={() => scrollCards(-1)}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <polyline points="15 18 9 12 15 6" />
                                </svg>
                            </button>
                        )}
                        <div className="history-cards-wrapper" ref={cardsRef} onWheel={handleWheel} onScroll={checkScroll}>
                            <div className="history-cards">
                                {filtered.map(s => (
                                    <div
                                        key={s.id}
                                        className={`history-card ${activeSession?.id === s.id ? "active" : ""}`}
                                        onClick={() => selectSession(s)}
                                    >
                                        <div className={`history-card-mode ${s.mode}`}>
                                            {s.mode === "deep" ? "Deep Study" : "Quick Study"}
                                        </div>
                                        <div className="history-card-title">{s.title}</div>
                                        <div className="history-card-date">{formatDate(s.created_at)}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        {canScrollRight && (
                            <button className="scroll-arrow scroll-arrow-right" onClick={() => scrollCards(1)}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <polyline points="9 18 15 12 9 6" />
                                </svg>
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}

export default History