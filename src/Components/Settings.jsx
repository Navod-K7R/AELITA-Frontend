import { useState, useEffect, useCallback } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import '../CSS/Settings.css'

const BASE_URL = 'http://127.0.0.1:8000'

// Constants 

const MODELS = [
    {
        id: 'z-ai/glm-4.5-air:free',
        name: 'GLM 4.5 Air',
        desc: 'Fast, capable — default Aelita model',
        badge: 'Default',
    },
    {
        id: 'qwen/qwen3-14b:free',
        name: 'Qwen 3 14B',
        desc: 'Strong reasoning, great for deep study',
        badge: 'Powerful',
    },
    {
        id: 'meta-llama/llama-3.1-8b-instruct:free',
        name: 'Llama 3.1 8B',
        desc: 'Lightweight and snappy for quick answers',
        badge: 'Fast',
    },
]

const PERSONALITIES = [
    {
        id: 'apollo',
        name: 'Apollo',
        tagline: 'The Confident Scholar',
        desc: 'Direct, assertive, and precise. Apollo delivers knowledge with authority and minimal fluff.',
        color: '#f5a623',
        icon: '☀️',
    },
    {
        id: 'lyra',
        name: 'Lyra',
        tagline: 'The Warm Mentor',
        desc: 'Nurturing, patient, and encouraging. Lyra guides you gently through complex ideas.',
        color: '#a98dff',
        icon: '🎵',
    },
    {
        id: 'cipher',
        name: 'Cipher',
        tagline: 'The Analytical Mind',
        desc: 'Methodical, structured, and data-driven. Cipher breaks problems into clear logical steps.',
        color: '#00e5cc',
        icon: '⬡',
    },
]

const TABS = [
    {
        id: 'aelita',
        label: 'Aelita',
        icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                <circle cx="12" cy="12" r="3"/>
                <path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/>
            </svg>
        ),
    },
    {
        id: 'account',
        label: 'Account',
        icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
            </svg>
        ),
    },
    {
        id: 'general',
        label: 'General',
        icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                <circle cx="12" cy="12" r="3"/>
                <path d="M19.07 4.93a10 10 0 010 14.14M4.93 4.93a10 10 0 000 14.14M12 2v2M12 20v2M2 12h2M20 12h2"/>
            </svg>
        ),
    },
]

const DEFAULT_SETTINGS = {
    model: 'z-ai/glm-4.5-air:free',
    personality: 'apollo',
    confidence: 72,
    responseLength: 1,
    contextWindow: 16,
    temperature: 50,
    showCitations: true,
    proactiveSuggestions: true,
    autoDetectMode: false,
    markdownRendering: true,
    displayName: '',
    email: '',
    saveHistory: true,
    analytics: false,
    theme: 'Dark',
    compactMode: false,
    reducedMotion: false,
    showWordCount: false,
    language: 'en',
    timeFormat: '12h',
    studyReminders: false,
    sessionSummaries: true,
}

// API helpers 

async function apiFetch(path, token, options = {}) {
    const res = await fetch(`${BASE_URL}${path}`, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            ...(options.headers || {}),
        },
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.detail || 'Request failed')
    return data
}

// Small reusable components 

function Section({ title, desc, children }) {
    return (
        <div className="s-section">
            <div className="s-section-header">
                <h3 className="s-section-title">{title}</h3>
                {desc && <p className="s-section-desc">{desc}</p>}
            </div>
            <div className="s-section-body">{children}</div>
        </div>
    )
}

function Toggle({ checked, onChange, label, desc }) {
    return (
        <div className="s-toggle-row">
            <div className="s-toggle-text">
                <span className="s-toggle-label">{label}</span>
                {desc && <span className="s-toggle-desc">{desc}</span>}
            </div>
            <button
                className={`s-toggle ${checked ? 'on' : ''}`}
                onClick={() => onChange(!checked)}
                role="switch"
                aria-checked={checked}
            >
                <span className="s-toggle-thumb" />
            </button>
        </div>
    )
}

function Slider({ label, desc, value, min, max, step = 1, format, onChange }) {
    const pct = ((value - min) / (max - min)) * 100
    return (
        <div className="s-slider-row">
            <div className="s-slider-top">
                <span className="s-slider-label">{label}</span>
                <span className="s-slider-val">{format ? format(value) : value}</span>
            </div>
            {desc && <span className="s-slider-desc">{desc}</span>}
            <div className="s-slider-track">
                <div className="s-slider-fill" style={{ width: `${pct}%` }} />
                <input
                    type="range"
                    min={min} max={max} step={step}
                    value={value}
                    onChange={e => onChange(Number(e.target.value))}
                />
            </div>
        </div>
    )
}

function SaveBar({ dirty, onSave, onDiscard, saving }) {
    if (!dirty) return null
    return (
        <div className="s-save-bar">
            <span className="s-save-bar-text">You have unsaved changes</span>
            <div className="s-save-bar-actions">
                <button className="s-btn s-btn-ghost" onClick={onDiscard}>Discard</button>
                <button className="s-btn s-btn-primary" onClick={onSave} disabled={saving}>
                    {saving ? 'Saving…' : 'Save changes'}
                </button>
            </div>
        </div>
    )
}

// Tab: Aelita 

function AelitaTab({ settings, onChange }) {
    return (
        <div className="s-tab-content">
            <Section title="AI Model" desc="Choose the underlying model powering Aelita.">
                <div className="s-model-grid">
                    {MODELS.map(m => (
                        <button
                            key={m.id}
                            className={`s-model-card ${settings.model === m.id ? 'active' : ''}`}
                            onClick={() => onChange('model', m.id)}
                        >
                            <div className="s-model-top">
                                <span className="s-model-name">{m.name}</span>
                                <span className="s-model-badge">{m.badge}</span>
                            </div>
                            <span className="s-model-desc">{m.desc}</span>
                            {settings.model === m.id && (
                                <div className="s-model-check">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                        <polyline points="20 6 9 17 4 12"/>
                                    </svg>
                                </div>
                            )}
                        </button>
                    ))}
                </div>
            </Section>

            <Section title="Personality" desc="Select Aelita's communication style and character.">
                <div className="s-personality-grid">
                    {PERSONALITIES.map(p => (
                        <button
                            key={p.id}
                            className={`s-personality-card ${settings.personality === p.id ? 'active' : ''}`}
                            style={{ '--p-color': p.color }}
                            onClick={() => onChange('personality', p.id)}
                        >
                            <div className="s-personality-icon">{p.icon}</div>
                            <div className="s-personality-info">
                                <span className="s-personality-name">{p.name}</span>
                                <span className="s-personality-tagline">{p.tagline}</span>
                                <span className="s-personality-desc">{p.desc}</span>
                            </div>
                            {settings.personality === p.id && (
                                <div className="s-personality-check">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                        <polyline points="20 6 9 17 4 12"/>
                                    </svg>
                                </div>
                            )}
                        </button>
                    ))}
                </div>
            </Section>

            <Section title="Response Tuning" desc="Fine-tune how Aelita generates responses.">
                <div className="s-sliders">
                    <Slider
                        label="Confidence Level"
                        desc="Higher values make Aelita more assertive. Lower values introduce more nuance and hedging."
                        value={settings.confidence}
                        min={0} max={100}
                        format={v => `${v}%`}
                        onChange={v => onChange('confidence', v)}
                    />
                    <Slider
                        label="Response Length"
                        desc="Controls how detailed Aelita's answers are by default."
                        value={settings.responseLength}
                        min={0} max={2} step={1}
                        format={v => ['Concise', 'Balanced', 'Detailed'][v]}
                        onChange={v => onChange('responseLength', v)}
                    />
                    <Slider
                        label="Context Memory"
                        desc="How many previous messages Aelita considers when responding."
                        value={settings.contextWindow}
                        min={4} max={32} step={4}
                        format={v => `${v} messages`}
                        onChange={v => onChange('contextWindow', v)}
                    />
                    <Slider
                        label="Creativity"
                        desc="Temperature setting — higher values produce more varied, creative responses."
                        value={settings.temperature}
                        min={0} max={100}
                        format={v => v < 34 ? 'Precise' : v < 67 ? 'Balanced' : 'Creative'}
                        onChange={v => onChange('temperature', v)}
                    />
                </div>
            </Section>

            <Section title="Behaviour">
                <div className="s-toggles">
                    <Toggle
                        label="Show citations"
                        desc="Aelita will reference sources when explaining factual topics."
                        checked={settings.showCitations}
                        onChange={v => onChange('showCitations', v)}
                    />
                    <Toggle
                        label="Proactive suggestions"
                        desc="Aelita will suggest related topics and follow-up questions."
                        checked={settings.proactiveSuggestions}
                        onChange={v => onChange('proactiveSuggestions', v)}
                    />
                    <Toggle
                        label="Study mode auto-detect"
                        desc="Automatically switch between Deep and Quick Study based on your question."
                        checked={settings.autoDetectMode}
                        onChange={v => onChange('autoDetectMode', v)}
                    />
                    <Toggle
                        label="Markdown rendering"
                        desc="Render formatted text, code blocks and lists in responses."
                        checked={settings.markdownRendering}
                        onChange={v => onChange('markdownRendering', v)}
                    />
                </div>
            </Section>
        </div>
    )
}

// Tab: Account 

function AccountTab({ settings, onChange, token, showToast }) {
    const { logout } = useAuth()
    const navigate = useNavigate()

    const [pwForm, setPwForm] = useState({ current: '', next: '', confirm: '' })
    const [pwError, setPwError] = useState(null)
    const [pwSaving, setPwSaving] = useState(false)

    const [deleteConfirm, setDeleteConfirm] = useState(null) // null | 'sessions' | 'account'

    function handleLogout() {
        logout()
        navigate('/auth')
    }

    async function handlePasswordChange() {
        setPwError(null)
        if (pwForm.next !== pwForm.confirm) {
            setPwError('New passwords do not match')
            return
        }
        if (pwForm.next.length < 8) {
            setPwError('Password must be at least 8 characters')
            return
        }
        setPwSaving(true)
        try {
            await apiFetch('/settings/password', token, {
                method: 'POST',
                body: JSON.stringify({
                    current_password: pwForm.current,
                    new_password: pwForm.next,
                }),
            })
            setPwForm({ current: '', next: '', confirm: '' })
            showToast('Password updated')
        } catch (err) {
            setPwError(err.message)
        } finally {
            setPwSaving(false)
        }
    }

    async function handleDeleteSessions() {
        try {
            await apiFetch('/settings/sessions', token, { method: 'DELETE' })
            setDeleteConfirm(null)
            showToast('All sessions deleted')
        } catch {
            showToast('Failed to delete sessions')
        }
    }

    async function handleDeleteAccount() {
        try {
            await apiFetch('/settings/account', token, { method: 'DELETE' })
            logout()
            navigate('/auth')
        } catch {
            showToast('Failed to delete account')
        }
    }

    return (
        <div className="s-tab-content">
            <Section title="Profile" desc="Manage your account information.">
                <div className="s-profile-block">
                    <div className="s-avatar-wrap">
                        <div className="s-avatar">
                            {(settings.displayName || '?').slice(0, 2).toUpperCase()}
                        </div>
                    </div>
                    <div className="s-profile-fields">
                        <div className="s-field-group">
                            <label className="s-label">Display name</label>
                            <input
                                className="s-input"
                                value={settings.displayName}
                                onChange={e => onChange('displayName', e.target.value)}
                                placeholder="Your name"
                            />
                        </div>
                        <div className="s-field-group">
                            <label className="s-label">Email</label>
                            <input
                                className="s-input"
                                value={settings.email}
                                onChange={e => onChange('email', e.target.value)}
                                placeholder="your@email.com"
                                type="email"
                            />
                        </div>
                    </div>
                </div>
            </Section>

            <Section title="Security" desc="Update your password.">
                <div className="s-fields-col">
                    <div className="s-field-group">
                        <label className="s-label">Current password</label>
                        <input
                            className="s-input"
                            type="password"
                            placeholder="••••••••"
                            value={pwForm.current}
                            onChange={e => setPwForm(p => ({ ...p, current: e.target.value }))}
                        />
                    </div>
                    <div className="s-field-group">
                        <label className="s-label">New password</label>
                        <input
                            className="s-input"
                            type="password"
                            placeholder="••••••••"
                            value={pwForm.next}
                            onChange={e => setPwForm(p => ({ ...p, next: e.target.value }))}
                        />
                    </div>
                    <div className="s-field-group">
                        <label className="s-label">Confirm new password</label>
                        <input
                            className="s-input"
                            type="password"
                            placeholder="••••••••"
                            value={pwForm.confirm}
                            onChange={e => setPwForm(p => ({ ...p, confirm: e.target.value }))}
                        />
                    </div>
                    {pwError && <p className="s-field-error">{pwError}</p>}
                    <button
                        className="s-btn s-btn-ghost"
                        style={{ alignSelf: 'flex-start' }}
                        onClick={handlePasswordChange}
                        disabled={pwSaving || !pwForm.current || !pwForm.next || !pwForm.confirm}
                    >
                        {pwSaving ? 'Updating…' : 'Update password'}
                    </button>
                </div>
            </Section>

            <Section title="Data & Privacy">
                <div className="s-toggles">
                    <Toggle
                        label="Save conversation history"
                        desc="Store your study sessions for later review."
                        checked={settings.saveHistory}
                        onChange={v => onChange('saveHistory', v)}
                    />
                    <Toggle
                        label="Analytics"
                        desc="Help improve Aelita by sharing anonymous usage data."
                        checked={settings.analytics}
                        onChange={v => onChange('analytics', v)}
                    />
                </div>
            </Section>

            <Section title="Danger Zone">
                <div className="s-danger-block">
                    <div className="s-danger-row">
                        <div>
                            <p className="s-danger-label">Sign out</p>
                            <p className="s-danger-desc">Sign out of your account on this device.</p>
                        </div>
                        <button className="s-btn s-btn-ghost" onClick={handleLogout}>Sign out</button>
                    </div>

                    <div className="s-danger-row">
                        <div>
                            <p className="s-danger-label">Delete all sessions</p>
                            <p className="s-danger-desc">Permanently delete all your study history.</p>
                        </div>
                        {deleteConfirm === 'sessions' ? (
                            <div className="s-confirm-row">
                                <span className="s-confirm-text">Sure?</span>
                                <button className="s-btn s-btn-danger" onClick={handleDeleteSessions}>Yes, delete</button>
                                <button className="s-btn s-btn-ghost" onClick={() => setDeleteConfirm(null)}>Cancel</button>
                            </div>
                        ) : (
                            <button className="s-btn s-btn-danger" onClick={() => setDeleteConfirm('sessions')}>Delete history</button>
                        )}
                    </div>

                    <div className="s-danger-row">
                        <div>
                            <p className="s-danger-label s-danger-label-red">Delete account</p>
                            <p className="s-danger-desc">Permanently delete your account and all data. This cannot be undone.</p>
                        </div>
                        {deleteConfirm === 'account' ? (
                            <div className="s-confirm-row">
                                <span className="s-confirm-text">Sure?</span>
                                <button className="s-btn s-btn-danger" onClick={handleDeleteAccount}>Yes, delete</button>
                                <button className="s-btn s-btn-ghost" onClick={() => setDeleteConfirm(null)}>Cancel</button>
                            </div>
                        ) : (
                            <button className="s-btn s-btn-danger" onClick={() => setDeleteConfirm('account')}>Delete account</button>
                        )}
                    </div>
                </div>
            </Section>
        </div>
    )
}

// Tab: General 

function GeneralTab({ settings, onChange }) {
    return (
        <div className="s-tab-content">
            <Section title="Appearance" desc="Customize the look and feel of Aelita.">
                <div className="s-theme-grid">
                    {['Dark', 'Darker', 'Midnight'].map(t => (
                        <button
                            key={t}
                            className={`s-theme-card ${settings.theme === t ? 'active' : ''}`}
                            onClick={() => onChange('theme', t)}
                        >
                            <div className={`s-theme-preview s-theme-${t.toLowerCase()}`} />
                            <span>{t}</span>
                        </button>
                    ))}
                </div>
            </Section>

            <Section title="Interface">
                <div className="s-toggles">
                    <Toggle
                        label="Compact mode"
                        desc="Reduce spacing and padding throughout the interface."
                        checked={settings.compactMode}
                        onChange={v => onChange('compactMode', v)}
                    />
                    <Toggle
                        label="Reduced motion"
                        desc="Minimize animations and transitions."
                        checked={settings.reducedMotion}
                        onChange={v => onChange('reducedMotion', v)}
                    />
                    <Toggle
                        label="Show word count"
                        desc="Display word and character count while typing."
                        checked={settings.showWordCount}
                        onChange={v => onChange('showWordCount', v)}
                    />
                </div>
            </Section>

            <Section title="Language & Region">
                <div className="s-fields-col">
                    <div className="s-field-group">
                        <label className="s-label">Interface language</label>
                        <select
                            className="s-select"
                            value={settings.language}
                            onChange={e => onChange('language', e.target.value)}
                        >
                            <option value="en">English</option>
                            <option value="es">Español</option>
                            <option value="fr">Français</option>
                            <option value="de">Deutsch</option>
                            <option value="ja">日本語</option>
                            <option value="zh">中文</option>
                        </select>
                    </div>
                    <div className="s-field-group">
                        <label className="s-label">Time format</label>
                        <select
                            className="s-select"
                            value={settings.timeFormat}
                            onChange={e => onChange('timeFormat', e.target.value)}
                        >
                            <option value="12h">12-hour (AM/PM)</option>
                            <option value="24h">24-hour</option>
                        </select>
                    </div>
                </div>
            </Section>

            <Section title="Notifications">
                <div className="s-toggles">
                    <Toggle
                        label="Study reminders"
                        desc="Receive reminders to maintain your study streak."
                        checked={settings.studyReminders}
                        onChange={v => onChange('studyReminders', v)}
                    />
                    <Toggle
                        label="Session summaries"
                        desc="Get a summary notification after each study session ends."
                        checked={settings.sessionSummaries}
                        onChange={v => onChange('sessionSummaries', v)}
                    />
                </div>
            </Section>

            <Section title="Keyboard Shortcuts">
                <div className="s-shortcuts">
                    {[
                        { keys: ['Ctrl', 'Enter'], action: 'Send message' },
                        { keys: ['Ctrl', 'K'],     action: 'New session' },
                        { keys: ['Ctrl', '/'],     action: 'Toggle mode' },
                        { keys: ['Esc'],            action: 'Clear input' },
                    ].map((s, i) => (
                        <div key={i} className="s-shortcut-row">
                            <span className="s-shortcut-action">{s.action}</span>
                            <div className="s-shortcut-keys">
                                {s.keys.map((k, j) => <kbd key={j}>{k}</kbd>)}
                            </div>
                        </div>
                    ))}
                </div>
            </Section>
        </div>
    )
}

// Main Settings 

function Settings() {
    const { user, token } = useAuth()
    const [searchParams] = useSearchParams()
    const tabParam = searchParams.get('tab')

    const [activeTab, setActiveTab] = useState(
        TABS.find(t => t.id === tabParam) ? tabParam : 'aelita'
    )
    const [settings, setSettings] = useState(() => ({
        ...DEFAULT_SETTINGS,
        displayName: user?.username || user?.name || '',
        email: user?.email || '',
    }))
    const [saved, setSaved] = useState(null)  // null = not loaded yet
    const [saving, setSaving] = useState(false)
    const [loading, setLoading] = useState(true)
    const [toast, setToast] = useState(null)

    // Load settings from backend on mount 
    useEffect(() => {
        if (!token) return
        apiFetch('/settings', token)
            .then(data => {
                // Map snake_case DB cols → camelCase UI keys
                const loaded = {
                    model:                data.model                ?? DEFAULT_SETTINGS.model,
                    personality:          data.personality          ?? DEFAULT_SETTINGS.personality,
                    confidence:           data.confidence           ?? DEFAULT_SETTINGS.confidence,
                    responseLength:       data.response_length      ?? DEFAULT_SETTINGS.responseLength,
                    contextWindow:        data.context_window       ?? DEFAULT_SETTINGS.contextWindow,
                    temperature:          data.temperature          ?? DEFAULT_SETTINGS.temperature,
                    showCitations:        data.show_citations       ?? DEFAULT_SETTINGS.showCitations,
                    proactiveSuggestions: data.proactive_suggestions ?? DEFAULT_SETTINGS.proactiveSuggestions,
                    autoDetectMode:       data.auto_detect_mode     ?? DEFAULT_SETTINGS.autoDetectMode,
                    markdownRendering:    data.markdown_rendering   ?? DEFAULT_SETTINGS.markdownRendering,
                    theme:                data.theme                ?? DEFAULT_SETTINGS.theme,
                    compactMode:          data.compact_mode         ?? DEFAULT_SETTINGS.compactMode,
                    reducedMotion:        data.reduced_motion       ?? DEFAULT_SETTINGS.reducedMotion,
                    showWordCount:        data.show_word_count      ?? DEFAULT_SETTINGS.showWordCount,
                    language:             data.language             ?? DEFAULT_SETTINGS.language,
                    timeFormat:           data.time_format          ?? DEFAULT_SETTINGS.timeFormat,
                    studyReminders:       data.study_reminders      ?? DEFAULT_SETTINGS.studyReminders,
                    sessionSummaries:     data.session_summaries    ?? DEFAULT_SETTINGS.sessionSummaries,
                    saveHistory:          data.save_history         ?? DEFAULT_SETTINGS.saveHistory,
                    analytics:            data.analytics            ?? DEFAULT_SETTINGS.analytics,
                    displayName:          user?.username || user?.name || '',
                    email:                user?.email || '',
                }
                setSettings(loaded)
                setSaved(loaded)
            })
            .catch(() => {
                // Backend has no row yet — use defaults
                const defaults = {
                    ...DEFAULT_SETTINGS,
                    displayName: user?.username || user?.name || '',
                    email: user?.email || '',
                }
                setSettings(defaults)
                setSaved(defaults)
            })
            .finally(() => setLoading(false))
    }, [token])

    const dirty = saved !== null && JSON.stringify(settings) !== JSON.stringify(saved)

    function onChange(key, value) {
        setSettings(prev => ({ ...prev, [key]: value }))
    }

    function discard() {
        if (saved) setSettings({ ...saved })
    }

    function showToast(msg) {
        setToast(msg)
        setTimeout(() => setToast(null), 2500)
    }

    // Save — dispatches to the right endpoint per tab 
    async function save() {
        setSaving(true)
        try {
            const promises = []

            if (activeTab === 'aelita' || dirty) {
                promises.push(
                    apiFetch('/settings/aelita', token, {
                        method: 'POST',
                        body: JSON.stringify({
                            model:                 settings.model,
                            personality:           settings.personality,
                            confidence:            settings.confidence,
                            response_length:       settings.responseLength,
                            context_window:        settings.contextWindow,
                            temperature:           settings.temperature,
                            show_citations:        settings.showCitations,
                            proactive_suggestions: settings.proactiveSuggestions,
                            auto_detect_mode:      settings.autoDetectMode,
                            markdown_rendering:    settings.markdownRendering,
                        }),
                    })
                )
            }

            if (activeTab === 'general' || dirty) {
                promises.push(
                    apiFetch('/settings/general', token, {
                        method: 'POST',
                        body: JSON.stringify({
                            theme:             settings.theme,
                            compact_mode:      settings.compactMode,
                            reduced_motion:    settings.reducedMotion,
                            show_word_count:   settings.showWordCount,
                            language:          settings.language,
                            time_format:       settings.timeFormat,
                            study_reminders:   settings.studyReminders,
                            session_summaries: settings.sessionSummaries,
                        }),
                    })
                )
            }

            if (activeTab === 'account' || dirty) {
                promises.push(
                    apiFetch('/settings/account', token, {
                        method: 'POST',
                        body: JSON.stringify({
                            display_name: settings.displayName,
                            email:        settings.email,
                            save_history: settings.saveHistory,
                            analytics:    settings.analytics,
                        }),
                    })
                )
            }

            await Promise.all(promises)
            setSaved({ ...settings })
            showToast('Settings saved')
        } catch (err) {
            showToast(`Error: ${err.message}`)
        } finally {
            setSaving(false)
        }
    }

    if (loading) {
        return (
            <div className="settings-root">
                <div className="settings-loading">Loading settings…</div>
            </div>
        )
    }

    return (
        <div className="settings-root">
            <div className="settings-ambient" />
            {toast && <div className="s-toast">{toast}</div>}

            <div className="settings-inner">
                <div className="s-header">
                    <h1 className="s-header-title">Settings</h1>
                    <p className="s-header-sub">Manage your account, Aelita behaviour, and preferences.</p>
                </div>

                <div className="s-tabs">
                    {TABS.map(tab => (
                        <button
                            key={tab.id}
                            className={`s-tab ${activeTab === tab.id ? 'active' : ''}`}
                            onClick={() => setActiveTab(tab.id)}
                        >
                            <span className="s-tab-icon">{tab.icon}</span>
                            {tab.label}
                        </button>
                    ))}
                </div>

                <div className="s-content">
                    {activeTab === 'aelita'  && <AelitaTab  settings={settings} onChange={onChange} />}
                    {activeTab === 'account' && <AccountTab settings={settings} onChange={onChange} token={token} showToast={showToast} />}
                    {activeTab === 'general' && <GeneralTab settings={settings} onChange={onChange} />}
                </div>
            </div>

            <SaveBar dirty={dirty} onSave={save} onDiscard={discard} saving={saving} />
        </div>
    )
}

export default Settings