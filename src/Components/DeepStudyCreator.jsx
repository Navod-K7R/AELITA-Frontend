import { useState, useRef, useEffect } from 'react'
import '../CSS/DeepStudyCreator.css'

// Available personalities 
const PERSONALITIES = [
  {
    id: 'scholar',
    name: 'The Scholar',
    desc: 'Deep, academic, thorough. Cites reasoning at every step.',
    icon: '🎓',
  },
  {
    id: 'mentor',
    name: 'The Mentor',
    desc: 'Warm, Socratic. Asks questions to guide you to the answer.',
    icon: '🧭',
  },
  {
    id: 'analyst',
    name: 'The Analyst',
    desc: 'Precise, structured, data-driven. Breaks everything into frameworks.',
    icon: '📊',
  },
  {
    id: 'creative',
    name: 'The Synthesiser',
    desc: 'Connects dots across disciplines. Thinks in metaphors and patterns.',
    icon: '🔮',
  },
]

// Available models 
const MODELS = [
  { id: 'deep',   label: 'Deep Study',  desc: 'Thorough, long-form responses',  color: '#7c5cfc' },
  { id: 'quick',  label: 'Quick Study', desc: 'Faster, concise answers',         color: '#5dcaa5' },
]

const ACCEPTED_TYPES = [
  'text/plain', 'text/markdown', 'text/csv',
  'application/json', 'application/pdf',
  'image/png', 'image/jpeg', 'image/webp',
].join(',')

// DeepStudyCreator 
function DeepStudyCreator({ onClose, onLaunch }) {
  const [step,        setStep]        = useState(0)   // 0 = name, 1 = personality, 2 = model, 3 = context
  const [projectName, setProjectName] = useState('')
  const [personality, setPersonality] = useState('scholar')
  const [model,       setModel]       = useState('deep')
  const [context,     setContext]     = useState('')
  const [files,       setFiles]       = useState([])  // [{ name, content, type, isImage }]
  const [fileError,   setFileError]   = useState(null)
  const [launching,   setLaunching]   = useState(false)

  const fileRef      = useRef(null)
  const nameInputRef = useRef(null)

  // Auto-focus project name on open
  useEffect(() => {
    if (step === 0) setTimeout(() => nameInputRef.current?.focus(), 80)
  }, [step])

  // Close on Escape
  useEffect(() => {
    function handler(e) { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  //  File handling 
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
      setFiles(prev => [...prev, {
        name: file.name,
        type: file.type,
        content: ev.target.result,
        isImage,
      }])
    }
    reader.onerror = () => setFileError('Failed to read file')

    if (isImage) reader.readAsDataURL(file)
    else         reader.readAsText(file)

    fileRef.current.value = ''
  }

  function removeFile(index) {
    setFiles(prev => prev.filter((_, i) => i !== index))
  }

  //  Steps validation 
  const canProceed = () => {
    if (step === 0) return projectName.trim().length >= 1
    return true
  }

  function handleNext() {
    if (!canProceed()) return
    if (step < 3) setStep(s => s + 1)
    else          handleLaunch()
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey && step === 0) {
      e.preventDefault()
      handleNext()
    }
  }

  //  Launch 
  async function handleLaunch() {
    setLaunching(true)
    // Brief dramatic pause for the animation
    await new Promise(r => setTimeout(r, 600))
    onLaunch({
      name:        projectName.trim(),
      personality: PERSONALITIES.find(p => p.id === personality),
      model,
      context:     context.trim(),
      files,
    })
  }

  const STEPS = ['Name', 'Style', 'Model', 'Context']

  return (
    <div className="dsc-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`dsc-panel ${launching ? 'launching' : ''}`}>

        {/*  Header  */}
        <div className="dsc-header">
          <div className="dsc-header-left">
            <div className="dsc-header-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" width="18" height="18">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
              </svg>
            </div>
            <div>
              <h2 className="dsc-title">Deep Study Session</h2>
              <p className="dsc-subtitle">Configure your focused learning environment</p>
            </div>
          </div>
          <button className="dsc-close" onClick={onClose}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/*  Step indicators  */}
        <div className="dsc-steps">
          {STEPS.map((label, i) => (
            <div
              key={i}
              className={`dsc-step ${i === step ? 'active' : ''} ${i < step ? 'done' : ''}`}
              onClick={() => i < step && setStep(i)}
            >
              <div className="dsc-step-dot">
                {i < step
                  ? <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="10" height="10"><polyline points="20 6 9 17 4 12"/></svg>
                  : <span>{i + 1}</span>
                }
              </div>
              <span className="dsc-step-label">{label}</span>
            </div>
          ))}
          <div className="dsc-step-bar">
            <div className="dsc-step-fill" style={{ width: `${(step / (STEPS.length - 1)) * 100}%` }} />
          </div>
        </div>

        {/*  Step content  */}
        <div className="dsc-body">

          {/* Step 0: Project name */}
          {step === 0 && (
            <div className="dsc-step-content" key="step-0">
              <h3 className="dsc-step-heading">What are you studying?</h3>
              <p className="dsc-step-desc">Give your session a name. This becomes the context anchor for the whole conversation.</p>
              <div className="dsc-name-wrap">
                <input
                  ref={nameInputRef}
                  className="dsc-name-input"
                  type="text"
                  placeholder="e.g. Quantum Mechanics, WWII History, React Internals…"
                  value={projectName}
                  onChange={e => setProjectName(e.target.value)}
                  onKeyDown={handleKeyDown}
                  maxLength={80}
                />
                <span className="dsc-char-count">{projectName.length}/80</span>
              </div>
            </div>
          )}

          {/* Step 1: Personality */}
          {step === 1 && (
            <div className="dsc-step-content" key="step-1">
              <h3 className="dsc-step-heading">Choose Aelita's teaching style</h3>
              <p className="dsc-step-desc">Different personalities unlock different modes of learning. Pick what fits your goal.</p>
              <div className="dsc-personality-grid">
                {PERSONALITIES.map(p => (
                  <button
                    key={p.id}
                    className={`dsc-personality-card ${personality === p.id ? 'selected' : ''}`}
                    onClick={() => setPersonality(p.id)}
                  >
                    <span className="dsc-p-icon">{p.icon}</span>
                    <span className="dsc-p-name">{p.name}</span>
                    <span className="dsc-p-desc">{p.desc}</span>
                    {personality === p.id && (
                      <div className="dsc-p-check">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="10" height="10">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Model */}
          {step === 2 && (
            <div className="dsc-step-content" key="step-2">
              <h3 className="dsc-step-heading">Response depth</h3>
              <p className="dsc-step-desc">Choose how Aelita responds — detailed and thorough, or fast and focused.</p>
              <div className="dsc-model-list">
                {MODELS.map(m => (
                  <button
                    key={m.id}
                    className={`dsc-model-card ${model === m.id ? 'selected' : ''}`}
                    onClick={() => setModel(m.id)}
                    style={{ '--model-color': m.color }}
                  >
                    <div className="dsc-model-dot" style={{ background: m.color }} />
                    <div className="dsc-model-info">
                      <span className="dsc-model-name">{m.label}</span>
                      <span className="dsc-model-desc">{m.desc}</span>
                    </div>
                    {model === m.id && (
                      <div className="dsc-m-check">
                        <svg viewBox="0 0 24 24" fill="none" stroke={m.color} strokeWidth="2.5" width="12" height="12">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Context + files */}
          {step === 3 && (
            <div className="dsc-step-content" key="step-3">
              <h3 className="dsc-step-heading">Set the context <span className="dsc-optional">optional</span></h3>
              <p className="dsc-step-desc">Give Aelita background knowledge, goals, or constraints for this session.</p>

              <textarea
                className="dsc-context-input"
                placeholder={`e.g. I'm preparing for an exam on ${projectName || 'this topic'}. Focus on key concepts and avoid going too deep into maths…`}
                value={context}
                onChange={e => setContext(e.target.value)}
                rows={4}
              />

              {/* File attachments */}
              <div className="dsc-files-section">
                <div className="dsc-files-header">
                  <span className="dsc-files-label">Reference files</span>
                  <button
                    className="dsc-attach-btn"
                    onClick={() => fileRef.current?.click()}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="12" height="12"
                      strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66L9.41 17.41a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
                    </svg>
                    Attach file
                  </button>
                  <input
                    ref={fileRef}
                    type="file"
                    style={{ display: 'none' }}
                    accept={ACCEPTED_TYPES}
                    onChange={handleFileChange}
                  />
                </div>

                {fileError && <p className="dsc-file-error">{fileError}</p>}

                {files.length > 0 && (
                  <div className="dsc-file-list">
                    {files.map((f, i) => (
                      <div key={i} className="dsc-file-chip">
                        {f.isImage
                          ? <img src={f.content} alt={f.name} className="dsc-file-thumb" />
                          : <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="12" height="12">
                              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                              <polyline points="14 2 14 8 20 8"/>
                            </svg>
                        }
                        <span className="dsc-file-name">{f.name}</span>
                        <button className="dsc-file-remove" onClick={() => removeFile(i)}>
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="10" height="10">
                            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/*  Footer  */}
        <div className="dsc-footer">
          {step > 0 && (
            <button className="dsc-btn-back" onClick={() => setStep(s => s - 1)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                <polyline points="15 18 9 12 15 6"/>
              </svg>
              Back
            </button>
          )}

          <div className="dsc-footer-right">
            {step === 3 && (
              <span className="dsc-skip-hint">Context is optional — you can start now</span>
            )}
            <button
              className={`dsc-btn-next ${!canProceed() ? 'disabled' : ''} ${launching ? 'launching' : ''}`}
              onClick={handleNext}
              disabled={!canProceed() || launching}
            >
              {launching ? (
                <>
                  <span className="dsc-launch-dot" />
                  <span className="dsc-launch-dot" />
                  <span className="dsc-launch-dot" />
                </>
              ) : step < 3 ? (
                <>
                  Continue
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                    <polyline points="9 18 15 12 9 6"/>
                  </svg>
                </>
              ) : (
                <>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="14" height="14">
                    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
                  </svg>
                  Launch Session
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}

export default DeepStudyCreator