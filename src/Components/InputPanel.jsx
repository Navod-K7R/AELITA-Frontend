import { useRef, useState, useEffect } from 'react'
import '../CSS/InputPanel.css'

const MODELS = [
  { label: 'Deep Study',  color: '#5dcaa5', desc: 'Thorough explanations' },
  { label: 'Quick Study', color: '#7c6fcd', desc: 'Fast answers'          },
  { label: 'Focus Mode',  color: '#ef9f27', desc: 'No distractions'       },
]

const ACCEPTED_TYPES = [
  'text/plain', 'text/markdown', 'text/csv',
  'application/json', 'application/pdf',
  'image/png', 'image/jpeg', 'image/webp', 'image/gif',
].join(',')

// Rotating placeholders 
const PLACEHOLDERS = [
  "Ask Aelita anything...",
  "What's puzzling you today?",
  "Curious about something?",
  "Drop a topic, let's dive in...",
  "What shall we unravel today?",
  "A question is the start of everything...",
  "What do you want to understand?",
  "Let's explore something together...",
  "What's on your mind?",
  "Knowledge starts with a question...",
]

function usePlaceholder() {
  const [index, setIndex]     = useState(0)
  const [opacity, setOpacity] = useState(1)

  useEffect(() => {
    const interval = setInterval(() => {
      setOpacity(0)
      setTimeout(() => {
        setIndex(prev => (prev + 1) % PLACEHOLDERS.length)
        setOpacity(1)
      }, 400) // fade out duration
    }, 3500) // how long each phrase shows

    return () => clearInterval(interval)
  }, [])

  return { text: PLACEHOLDERS[index], opacity }
}

function InputPanel({ onSend, defaultMode = 'Quick Study' }) {
  const defaultIdx = MODELS.findIndex(m => m.label === defaultMode)

  const [input,        setInput]        = useState('')
  const [focused,      setFocused]      = useState(false)
  const [modelIdx,     setModelIdx]     = useState(defaultIdx >= 0 ? defaultIdx : 1)
  const [dropOpen,     setDropOpen]     = useState(false)
  const [sending,      setSending]      = useState(false)
  const [attachedFile, setAttachedFile] = useState(null)
  const [fileError,    setFileError]    = useState(null)

  const textareaRef = useRef(null)
  const fileRef     = useRef(null)
  const dropdownRef = useRef(null)

  const placeholder = usePlaceholder()

  // Sync model index when defaultMode prop changes
  useEffect(() => {
    const idx = MODELS.findIndex(m => m.label === defaultMode)
    if (idx >= 0) setModelIdx(idx)
  }, [defaultMode])

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setDropOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function handleInput(e) {
    setInput(e.target.value)
    const ta = textareaRef.current
    ta.style.height = 'auto'
    ta.style.height = ta.scrollHeight + 'px'
  }

  function handleFileChange(e) {
    const file = e.target.files[0]
    if (!file) return
    setFileError(null)

    if (file.size > 10 * 1024 * 1024) {
      setFileError('File too large (max 10 MB)')
      fileRef.current.value = ''
      return
    }

    const isImage = file.type.startsWith('image/')
    const reader  = new FileReader()

    reader.onload = (ev) => {
      setAttachedFile({
        name: file.name,
        type: file.type,
        content: ev.target.result,
        isImage,
      })
    }
    reader.onerror = () => setFileError('Failed to read file')

    if (isImage) reader.readAsDataURL(file)
    else         reader.readAsText(file)

    fileRef.current.value = ''
  }

  function removeAttachment() {
    setAttachedFile(null)
    setFileError(null)
  }

  function handleSend() {
    if (!input.trim() && !attachedFile) return
    setSending(true)
    onSend(input.trim(), MODELS[modelIdx].label, attachedFile || null)
    setInput('')
    setAttachedFile(null)
    setFileError(null)
    textareaRef.current.style.height = 'auto'
    setTimeout(() => setSending(false), 400)
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const activeModel = MODELS[modelIdx]

  return (
    <div className="input-wrap">
      <div className={`input-border ${focused || attachedFile ? 'active' : ''}`}>
        <div className="input-panel">

          {attachedFile && (
            <div className="attachment-preview">
              {attachedFile.isImage ? (
                <img src={attachedFile.content} alt={attachedFile.name} className="attachment-thumb" />
              ) : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                </svg>
              )}
              <span className="attachment-name">{attachedFile.name}</span>
              <button className="attachment-remove" onClick={removeAttachment} title="Remove">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
          )}

          {fileError && <div className="attachment-error">{fileError}</div>}

          {/* Textarea with animated placeholder */}
          <div className="textarea-wrap">
            <textarea
              ref={textareaRef}
              value={input}
              placeholder=""
              rows={2}
              onChange={handleInput}
              onKeyDown={handleKeyDown}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
            />
            {/* Only show custom placeholder when empty and not focused */}
            {!input && !focused && (
              <span
                className="textarea-placeholder"
                style={{ opacity: placeholder.opacity, transition: 'opacity 0.4s ease' }}
              >
                {placeholder.text}
              </span>
            )}
          </div>

          <div className="panel-toolbar">
            <div className="panel-left">
              <input
                type="file"
                ref={fileRef}
                style={{ display: 'none' }}
                accept={ACCEPTED_TYPES}
                onChange={handleFileChange}
              />
              <button
                className={`tool-btn ${attachedFile ? 'attached' : ''}`}
                onClick={() => fileRef.current.click()}
                title="Attach a file"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66L9.41 17.41a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
                </svg>
                Attach
              </button>

              <div className="model-select" ref={dropdownRef}>
                <button className="model-trigger" onClick={() => setDropOpen(prev => !prev)}>
                  <span className="model-dot" style={{ background: activeModel.color }}/>
                  {activeModel.label}
                  <svg className={`chevron ${dropOpen ? 'open' : ''}`}
                    width="10" height="10" viewBox="0 0 24 24"
                    fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="6 9 12 15 18 9"/>
                  </svg>
                </button>

                {dropOpen && (
                  <div className="model-dropdown">
                    {MODELS.map((model, i) => (
                      <div
                        key={i}
                        className={`model-option ${i === modelIdx ? 'selected' : ''}`}
                        onClick={() => { setModelIdx(i); setDropOpen(false) }}
                      >
                        <span className="model-dot" style={{ background: model.color }}/>
                        <div className="model-info">
                          <span className="model-name">{model.label}</span>
                          <span className="model-desc">{model.desc}</span>
                        </div>
                        {i === modelIdx && (
                          <svg width="12" height="12" viewBox="0 0 24 24"
                            fill="none" stroke={model.color} strokeWidth="2.5">
                            <polyline points="20 6 9 17 4 12"/>
                          </svg>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <button className={`send-btn ${sending ? 'sending' : ''}`} onClick={handleSend}>
              <svg viewBox="0 0 24 24"><path d="M2 21L23 12 2 3v7l15 2-15 2z"/></svg>
            </button>
          </div>

        </div>
      </div>
    </div>
  )
}

export default InputPanel