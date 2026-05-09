// src/context/AuthContext.jsx — global auth state

import { createContext, useContext, useState, useEffect } from "react"

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null)
    const [token, setToken] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        // Load from localStorage on startup
        const savedToken = localStorage.getItem("aelita_token")
        const savedUser = localStorage.getItem("aelita_user")
        if (savedToken && savedUser) {
            setToken(savedToken)
            setUser(JSON.parse(savedUser))
        }
        setLoading(false)
    }, [])

    const login = (userData, userToken) => {
        setUser(userData)
        setToken(userToken)
        localStorage.setItem("aelita_token", userToken)
        localStorage.setItem("aelita_user", JSON.stringify(userData))
    }

    const logout = () => {
        setUser(null)
        setToken(null)
        localStorage.removeItem("aelita_token")
        localStorage.removeItem("aelita_user")
    }

    return (
        <AuthContext.Provider value={{ user, token, login, logout, loading }}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    return useContext(AuthContext)
}