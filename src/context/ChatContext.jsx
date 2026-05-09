import { createContext, useContext, useState, useRef } from 'react'

const ChatContext = createContext(null)

export function ChatProvider({ children }) {
  const [messages,      setMessages]      = useState([])
  const [sessionId,     setSessionId]     = useState(null)
  const [isStreaming,   setIsStreaming]   = useState(false)
  const [projectConfig, setProjectConfig] = useState(null)  // DeepStudy project
  const [studyMode,     setStudyMode]     = useState('quick') // 'quick' | 'deep'

  // Greeting is stable for the whole session
  const greetingRef = useRef(null)

  function resetChat() {
    setMessages([])
    setSessionId(null)
    setIsStreaming(false)
    setProjectConfig(null)
    setStudyMode('quick')
  }

  function startDeepProject(config) {
    // config = { name, personality, model, context, files[] }
    resetChat()
    setProjectConfig(config)
    setStudyMode('deep')
  }

  function startQuickStudy() {
    resetChat()
    setStudyMode('quick')
  }

  return (
    <ChatContext.Provider value={{
      messages,      setMessages,
      sessionId,     setSessionId,
      isStreaming,   setIsStreaming,
      projectConfig,
      studyMode,
      greetingRef,
      resetChat,
      startDeepProject,
      startQuickStudy,
    }}>
      {children}
    </ChatContext.Provider>
  )
}

export function useChat() {
  return useContext(ChatContext)
}