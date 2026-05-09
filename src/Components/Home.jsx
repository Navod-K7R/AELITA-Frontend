import { useRef, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism'
import '../CSS/Home.css'
import InputPanel from './InputPanel'
import { useAuth } from '../context/AuthContext'
import { useChat } from '../context/ChatContext'
import { streamChat, createSession, saveMessage, getSessionMessages } from '../api'

// Greeting logic 
const GREETINGS = {
  morning:   ["Good morning","Rise and shine","Morning","Wakey wakey","Top of the morning","Early bird","A fresh start"],
  afternoon: ["Good afternoon","Hey there","Hello","Welcome back","Good to see you","Hope your day's going well","Afternoon"],
  evening:   ["Good evening","Evening","Hey","Winding down","Hope it was a good day","Back at it","Evening, scholar"],
  night:     ["Burning the midnight oil","Late night session","Still up","The night owl returns","Another late one","Can't sleep either","Midnight grind"],
}

function getGreeting(username) {
  const hour = new Date().getHours()
  let pool
  if (hour >= 5 && hour < 12)       pool = GREETINGS.morning
  else if (hour >= 12 && hour < 17) pool = GREETINGS.afternoon
  else if (hour >= 17 && hour < 21) pool = GREETINGS.evening
  else                               pool = GREETINGS.night

  const phrase = pool[Math.floor(Math.random() * pool.length)]
  if (username) {
    const isNight = hour >= 21 || hour < 5
    return { main: phrase + ',', name: username + (isNight ? '?' : '') }
  }
  return { main: 'Hello,', name: 'Scholar.' }
}

const SUGGESTIONS = [
  { emoji: '⚛️', text: 'Explain quantum entanglement' },
  { emoji: '🧠', text: 'What is backpropagation?' },
  { emoji: '🏛️', text: 'Teach me about the Roman Empire' },
  { emoji: '🌌', text: 'How does a black hole form?' },
]

// Markdown components 
function buildMarkdownComponents() {
  return {
    code({ node, inline, className, children, ...props }) {
      const match = /language-(\w+)/.exec(className || '')
      const language = match ? match[1] : ''
      if (!inline && language) {
        return (
          <SyntaxHighlighter
            style={oneDark}
            language={language}
            PreTag="div"
            className="md-code-block"
            customStyle={{
              borderRadius: '10px',
              fontSize: '13px',
              margin: '12px 0',
              padding: '16px',
              background: 'rgba(0,0,0,0.35)',
              border: '1px solid rgba(255,255,255,0.08)',
            }}
            {...props}
          >
            {String(children).replace(/\n$/, '')}
          </SyntaxHighlighter>
        )
      }
      return <code className="md-inline-code" {...props}>{children}</code>
    },
    h1: ({ children }) => <h1 className="md-h1">{children}</h1>,
    h2: ({ children }) => <h2 className="md-h2">{children}</h2>,
    h3: ({ children }) => <h3 className="md-h3">{children}</h3>,
    h4: ({ children }) => <h4 className="md-h4">{children}</h4>,
    p:  ({ children }) => <p  className="md-p">{children}</p>,
    ul: ({ children }) => <ul className="md-ul">{children}</ul>,
    ol: ({ children }) => <ol className="md-ol">{children}</ol>,
    li: ({ children }) => <li className="md-li">{children}</li>,
    strong: ({ children }) => <strong className="md-strong">{children}</strong>,
    em:     ({ children }) => <em     className="md-em">{children}</em>,
    blockquote: ({ children }) => <blockquote className="md-blockquote">{children}</blockquote>,
    hr: () => <hr className="md-hr" />,
    table: ({ children }) => (
      <div className="md-table-wrap"><table className="md-table">{children}</table></div>
    ),
    thead: ({ children }) => <thead className="md-thead">{children}</thead>,
    tbody: ({ children }) => <tbody>{children}</tbody>,
    tr:    ({ children }) => <tr    className="md-tr">{children}</tr>,
    th:    ({ children }) => <th    className="md-th">{children}</th>,
    td:    ({ children }) => <td    className="md-td">{children}</td>,
    a: ({ href, children }) => (
      <a className="md-link" href={href} target="_blank" rel="noopener noreferrer">{children}</a>
    ),
  }
}

const MD_COMPONENTS = buildMarkdownComponents()

// Message bubble 
function MessageBubble({ msg, isStreaming, isLast }) {
  const isAelita = msg.sender === 'aelita'

  if (!isAelita) {
    return (
      <div className="msg-row msg-row--user">
        <div className="bubble bubble--user">
          <p className="bubble-user-text">{msg.text}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="msg-row msg-row--aelita">
      <div className="aelita-avatar">
        <div className="aelita-avatar-dot" />
      </div>
      <div className="bubble bubble--aelita">
        {msg.text ? (
          <ReactMarkdown remarkPlugins={[remarkGfm]} components={MD_COMPONENTS}>
            {msg.text}
          </ReactMarkdown>
        ) : (
          <span className="bubble-thinking">
            <span className="thinking-dot" />
            <span className="thinking-dot" />
            <span className="thinking-dot" />
          </span>
        )}
        {isStreaming && isLast && msg.text && <span className="cursor">▋</span>}
      </div>
    </div>
  )
}

// Deep Study project banner 
function DeepStudyBanner({ config }) {
  if (!config) return null
  return (
    <div className="deep-banner">
      <div className="deep-banner-left">
        <div className="deep-banner-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="13" height="13">
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
          </svg>
        </div>
        <div className="deep-banner-info">
          <span className="deep-banner-name">{config.name}</span>
          <span className="deep-banner-meta">
            {config.personality?.icon} {config.personality?.name}
            {config.files?.length > 0 && ` · ${config.files.length} file${config.files.length > 1 ? 's' : ''}`}
          </span>
        </div>
      </div>
      <span className="deep-banner-badge">DEEP STUDY</span>
    </div>
  )
}

// Home 
function Home() {
  const {
    messages,      setMessages,
    isStreaming,   setIsStreaming,
    sessionId,     setSessionId,
    projectConfig,
    studyMode,
    greetingRef,
    startQuickStudy,   // clears projectConfig + resets studyMode
  } = useChat()

  const messagesEndRef = useRef(null)
  const { token, user } = useAuth()
  const location = useLocation()

  // Stable greeting — computed once, stored in context ref
  if (!greetingRef.current) {
    greetingRef.current = getGreeting(user?.username || user?.name || null)
  }
  const greeting = greetingRef.current

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Resume session navigated from History page
  useEffect(() => {
    const resume = location.state?.resumeSession
    if (resume && token) {
      loadSession(resume)
      window.history.replaceState({}, document.title)
    }
  }, [location.state, token])

  async function loadSession(session) {
    try {
      const msgs = await getSessionMessages(session.id, token)
      const formatted = msgs.map(m => ({
        text: m.content,
        sender: m.role === 'user' ? 'user' : 'aelita'
      }))
      // ← KEY FIX: clear Deep Study project config before loading the old session
      startQuickStudy()
      setMessages(formatted)
      setSessionId(session.id)
    } catch (err) {
      console.error('Failed to load session', err)
    }
  }

  async function sendMessage(text, selectedMode = 'quick', attachedFile = null) {
    if (!text.trim() && !attachedFile) return
    if (isStreaming) return

    const displayText = attachedFile
      ? (text ? `📎 ${attachedFile.name}\n\n${text}` : `📎 ${attachedFile.name}`)
      : text

    const userMessage = { text: displayText, sender: 'user' }
    const updatedMessages = [...messages, userMessage]
    setMessages(updatedMessages)
    setIsStreaming(true)
    setMessages(prev => [...prev, { text: '', sender: 'aelita' }])

    try {
      let currentSessionId = sessionId
      if (!currentSessionId) {
        const sessionTitle = projectConfig?.name || text.slice(0, 50) || attachedFile?.name || 'File chat'
        const session = await createSession(sessionTitle, selectedMode, token)
        currentSessionId = session.id
        setSessionId(currentSessionId)
      }

      let messageContentForAI
      let messageContentToSave

      if (attachedFile?.isImage) {
        messageContentForAI = [
          { type: 'image_url', image_url: { url: attachedFile.content } },
          { type: 'text', text: text || 'Please describe and analyse this image.' }
        ]
        messageContentToSave = displayText
      } else if (attachedFile) {
        const header = `[Attached file: ${attachedFile.name}]\n\`\`\`\n${attachedFile.content}\n\`\`\``
        messageContentForAI  = text ? `${header}\n\nUser question: ${text}` : `${header}\n\nPlease analyse the content above.`
        messageContentToSave = messageContentForAI
      } else {
        messageContentForAI  = text
        messageContentToSave = text
      }

      await saveMessage(currentSessionId, 'user', messageContentToSave, token)

      // Build system context from Deep Study project config
      let systemContext = null
      if (projectConfig) {
        const parts = []
        if (projectConfig.personality) {
          const p = projectConfig.personality
          parts.push(`You are Aelita in "${p.name}" mode: ${p.desc}`)
        }
        if (projectConfig.name) {
          parts.push(`The study topic/project is: "${projectConfig.name}".`)
        }
        if (projectConfig.context) {
          parts.push(`Additional context from the user: ${projectConfig.context}`)
        }
        if (projectConfig.files?.length > 0) {
          const fileSummaries = projectConfig.files.map(f =>
            f.isImage ? `[Image: ${f.name}]` : `[File: ${f.name}]\n${f.content?.slice(0, 2000)}`
          ).join('\n\n')
          parts.push(`Reference files attached by the user:\n${fileSummaries}`)
        }
        systemContext = parts.join('\n\n')
      }

      const history = [
        ...(systemContext ? [{ role: 'system', content: systemContext }] : []),
        ...updatedMessages.slice(0, -1).map(m => ({
          role: m.sender === 'user' ? 'user' : 'assistant',
          content: m.text
        })),
        { role: 'user', content: messageContentForAI }
      ]

      let fullResponse = ''

      await streamChat(history, selectedMode, token, (chunk) => {
        fullResponse += chunk
        setMessages(prev => {
          const updated = [...prev]
          updated[updated.length - 1] = {
            ...updated[updated.length - 1],
            text: updated[updated.length - 1].text + chunk
          }
          return updated
        })
      })

      await saveMessage(currentSessionId, 'assistant', fullResponse, token)

    } catch (err) {
      setMessages(prev => {
        const updated = [...prev]
        updated[updated.length - 1] = {
          ...updated[updated.length - 1],
          text: 'Sorry, something went wrong. Please try again.'
        }
        return updated
      })
    } finally {
      setIsStreaming(false)
    }
  }

  const modeMap = {
    'Deep Study':  'deep',
    'Quick Study': 'quick',
    'Focus Mode':  'quick',
  }

  const defaultInputMode = projectConfig ? 'Deep Study' : 'Quick Study'

  return (
    <div className="home">
      {/* Deep Study project banner — only shows when a project is active */}
      {projectConfig && <DeepStudyBanner config={projectConfig} />}

      {messages.length === 0 ? (
        <div className="welcome">
          <div className="welcome-greeting">
            {projectConfig ? (
              <>
                <h1 className="welcome-title">
                  <span className="greeting-main">Ready to explore</span>
                  <span className="greeting-name">{projectConfig.name}.</span>
                </h1>
                <p className="welcome-sub">
                  {projectConfig.personality?.icon} {projectConfig.personality?.name} mode active —&nbsp;
                  {projectConfig.context
                    ? 'context loaded, ask anything.'
                    : 'ask your first question to begin.'}
                </p>
              </>
            ) : (
              <>
                <h1 className="welcome-title">
                  <span className="greeting-main">{greeting.main}</span>
                  <span className="greeting-name">{greeting.name}</span>
                </h1>
                <p className="welcome-sub">What shall we explore today?</p>
              </>
            )}
          </div>
          <div className="suggestion-cards">
            {SUGGESTIONS.map((s, i) => (
              <div
                key={i}
                className="card"
                style={{ animationDelay: `${0.05 + i * 0.07}s` }}
                onClick={() => sendMessage(s.text, modeMap[defaultInputMode])}
              >
                <span className="card-emoji">{s.emoji}</span>
                <span className="card-text">{s.text}</span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="chat-screen">
          <div className="messages">
            {messages.map((msg, index) => (
              <MessageBubble
                key={index}
                msg={msg}
                isStreaming={isStreaming}
                isLast={index === messages.length - 1}
              />
            ))}
            <div ref={messagesEndRef} />
          </div>
        </div>
      )}

      <InputPanel
        defaultMode={defaultInputMode}
        onSend={(text, selectedMode, attachedFile) => {
          sendMessage(text, modeMap[selectedMode] || 'quick', attachedFile)
        }}
      />
    </div>
  )
}

export default Home