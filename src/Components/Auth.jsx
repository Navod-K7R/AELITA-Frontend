import { useState, useEffect, useRef } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import { loginUser, registerUser } from "../api"
import "../CSS/Auth.css"

function AuthOrb() {
    return (
        <div className="auth-orb-wrap">
            <div className="auth-orb-core" />
            <div className="auth-orb-ring auth-ring-1" />
            <div className="auth-orb-ring auth-ring-2" />
            <div className="auth-orb-ring auth-ring-3" />
            <div className="auth-orb-particle auth-p1" />
            <div className="auth-orb-particle auth-p2" />
            <div className="auth-orb-scanline" />
        </div>
    )
}

export default function Auth() {
    const [isLogin, setIsLogin]           = useState(true)
    const [email, setEmail]               = useState("")
    const [username, setUsername]         = useState("")
    const [password, setPassword]         = useState("")
    const [showPassword, setShowPassword] = useState(false)
    const [error, setError]               = useState("")
    const [loading, setLoading]           = useState(false)

    const { login } = useAuth()
    const navigate  = useNavigate()

    // Mouse parallax 
    const mousePos  = useRef({ x: 0.5, y: 0.5 })  // raw, normalised 0–1
    const smoothPos = useRef({ x: 0.5, y: 0.5 })  // lerped
    const rafId     = useRef(null)
    const amb1Ref   = useRef(null)
    const amb2Ref   = useRef(null)
    const gridRef   = useRef(null)
    const spotRef   = useRef(null)

    useEffect(() => {
        const onMove = (e) => {
            mousePos.current = {
                x: e.clientX / window.innerWidth,
                y: e.clientY / window.innerHeight,
            }
        }
        window.addEventListener("mousemove", onMove)

        const tick = () => {
            // Smooth follow — 0.04 = slow/lazy, raise for snappier
            const lf = 0.04
            smoothPos.current.x += (mousePos.current.x - smoothPos.current.x) * lf
            smoothPos.current.y += (mousePos.current.y - smoothPos.current.y) * lf

            const { x, y } = smoothPos.current

            // Nebula layer 1 — drifts WITH cursor, biggest range
            if (amb1Ref.current)
                amb1Ref.current.style.transform =
                    `translate(${(x - 0.5) * 60}px, ${(y - 0.5) * 60}px)`

            // Nebula layer 2 — drifts AGAINST cursor, slower (parallax depth)
            if (amb2Ref.current)
                amb2Ref.current.style.transform =
                    `translate(${(x - 0.5) * -35}px, ${(y - 0.5) * -35}px)`

            // Star grid — subtle drift with cursor
            if (gridRef.current)
                gridRef.current.style.transform =
                    `translate(${(x - 0.5) * 18}px, ${(y - 0.5) * 18}px)`

            // Spotlight — soft glow that follows cursor position
            if (spotRef.current)
                spotRef.current.style.background = `radial-gradient(
                    circle 320px at ${x * 100}% ${y * 100}%,
                    rgba(124,92,252,0.11) 0%,
                    rgba(0,229,204,0.05)  45%,
                    transparent          70%
                )`

            rafId.current = requestAnimationFrame(tick)
        }

        rafId.current = requestAnimationFrame(tick)

        return () => {
            window.removeEventListener("mousemove", onMove)
            cancelAnimationFrame(rafId.current)
        }
    }, [])

    //  Auth logic (unchanged) 
    const handleSubmit = async () => {
        setError("")
        setLoading(true)
        try {
            let data
            if (isLogin) {
                data = await loginUser(email, password)
            } else {
                data = await registerUser(email, username, password)
            }
            login(data.user, data.token)
            navigate("/")
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    function handleKeyDown(e) {
        if (e.key === "Enter") handleSubmit()
    }

    return (
        <div className="auth-container">

            {/*  Background layers  */}
            <div className="auth-ambient"   ref={amb1Ref} />
            <div className="auth-ambient-2" ref={amb2Ref} />
            <div className="auth-grid"      ref={gridRef} />

            {/* Cursor spotlight — soft glow that tracks mouse */}
            <div className="auth-spotlight" ref={spotRef} />

            {/* Floating particles */}
            <div className="auth-particles">
                {Array.from({ length: 15 }).map((_, i) => (
                    <div key={i} className="auth-particle" />
                ))}
            </div>

            {/* Sweeping energy lines */}
            <div className="auth-lines" />
            <div className="auth-line-extra" />

            {/* Vignette */}
            <div className="auth-vignette" />

            {/*  Card  */}
            <div className="auth-box" onKeyDown={handleKeyDown}>

                <div className="auth-logo">
                    <AuthOrb />
                    <div className="auth-logo-text">
                        <h1 className="auth-logo-name">AELITA</h1>
                        <p className="auth-logo-sub">THE ETHEREAL SCHOLAR</p>
                    </div>
                </div>

                <div className="auth-tabs">
                    <button
                        className={`auth-tab ${isLogin ? "active" : ""}`}
                        onClick={() => { setIsLogin(true); setError("") }}
                    >
                        Login
                    </button>
                    <button
                        className={`auth-tab ${!isLogin ? "active" : ""}`}
                        onClick={() => { setIsLogin(false); setError("") }}
                    >
                        Register
                    </button>
                    <div className={`auth-tab-slider ${isLogin ? "left" : "right"}`} />
                </div>

                <div className="auth-fields">
                    <div className="auth-field">
                        <svg className="auth-field-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                            <polyline points="22,6 12,13 2,6"/>
                        </svg>
                        <input
                            type="email"
                            placeholder="Email address"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            autoComplete="email"
                        />
                    </div>

                    {!isLogin && (
                        <div className="auth-field auth-field-enter">
                            <svg className="auth-field-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                                <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
                                <circle cx="12" cy="7" r="4"/>
                            </svg>
                            <input
                                type="text"
                                placeholder="Username"
                                value={username}
                                onChange={e => setUsername(e.target.value)}
                                autoComplete="username"
                            />
                        </div>
                    )}

                    <div className="auth-field">
                        <svg className="auth-field-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                            <path d="M7 11V7a5 5 0 0110 0v4"/>
                        </svg>
                        <input
                            type={showPassword ? "text" : "password"}
                            placeholder="Password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            autoComplete={isLogin ? "current-password" : "new-password"}
                        />
                        <button
                            className="auth-field-toggle"
                            onClick={() => setShowPassword(v => !v)}
                            tabIndex={-1}
                            type="button"
                        >
                            {showPassword ? (
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                                    <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/>
                                    <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/>
                                    <line x1="1" y1="1" x2="23" y2="23"/>
                                </svg>
                            ) : (
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                                    <circle cx="12" cy="12" r="3"/>
                                </svg>
                            )}
                        </button>
                    </div>
                </div>

                {error && (
                    <div className="auth-error">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" width="14" height="14">
                            <circle cx="12" cy="12" r="10"/>
                            <line x1="12" y1="8" x2="12" y2="12"/>
                            <line x1="12" y1="16" x2="12.01" y2="16"/>
                        </svg>
                        {error}
                    </div>
                )}

                <button
                    className="auth-submit"
                    onClick={handleSubmit}
                    disabled={loading}
                >
                    {loading ? (
                        <span className="auth-submit-loading">
                            <span /><span /><span />
                        </span>
                    ) : (
                        <>
                            {isLogin ? "Sign in" : "Create account"}
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="15" height="15">
                                <path d="M5 12h14M12 5l7 7-7 7"/>
                            </svg>
                        </>
                    )}
                </button>

                <p className="auth-footer">
                    {isLogin ? "Don't have an account? " : "Already have an account? "}
                    <button
                        className="auth-footer-link"
                        onClick={() => { setIsLogin(v => !v); setError("") }}
                    >
                        {isLogin ? "Register" : "Sign in"}
                    </button>
                </p>

            </div>
        </div>
    )
}