// src/api.js — all backend calls in one place

const BASE_URL = "http://127.0.0.1:8000"

// --- Auth ---
export async function registerUser(email, username, password) {
    const res = await fetch(`${BASE_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, username, password })
    })
    if (!res.ok) {
        const err = await res.json()
        throw new Error(err.detail)
    }
    return res.json()
}

export async function loginUser(email, password) {
    const res = await fetch(`${BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
    })
    if (!res.ok) {
        const err = await res.json()
        throw new Error(err.detail)
    }
    return res.json()
}

// --- Chat streaming ---
export async function streamChat(messages, mode, token, onChunk) {
    const res = await fetch(`${BASE_URL}/chat/stream`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ messages, mode })
    })

    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`)

    const reader = res.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ""

    while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split("\n")
        buffer = lines.pop()

        for (const line of lines) {
            const trimmed = line.trim()
            if (trimmed.startsWith("data: ")) {
                const data = trimmed.slice(6)
                if (data === "[DONE]") return
                try {
                    const parsed = JSON.parse(data)
                    if (parsed.content) onChunk(parsed.content)
                } catch {}
            }
        }
    }
}



// --- Create new chat session ---
export async function createSession(title, mode, token) {
    const res = await fetch(`${BASE_URL}/chat/session`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ title, mode })
    })
    if (!res.ok) throw new Error("Failed to create session")
    return res.json()
}

// --- Save a message ---
export async function saveMessage(sessionId, role, content, token) {
    const res = await fetch(`${BASE_URL}/chat/message`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ session_id: sessionId, role, content })
    })
    if (!res.ok) throw new Error("Failed to save message")
    return res.json()
}

// --- Get all sessions ---
export async function getSessions(token) {
    const res = await fetch(`${BASE_URL}/chat/sessions`, {
        headers: { "Authorization": `Bearer ${token}` }
    })
    if (!res.ok) throw new Error("Failed to get sessions")
    return res.json()
}



export async function getSessionMessages(sessionId, token) {
    const res = await fetch(`${BASE_URL}/chat/sessions/${sessionId}/messages`, {
        headers: { "Authorization": `Bearer ${token}` }
    })
    if (!res.ok) throw new Error("Failed to get messages")
    return res.json()
}