import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { api } from './api.js'

const AuthContext = createContext(null)
const STORAGE_KEY = 'femtolens_session'

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(STORAGE_KEY) || null)
  const [user, setUser] = useState(null)
  const [subscription, setSubscription] = useState(null)
  const [loading, setLoading] = useState(!!token)

  const refresh = useCallback(async (t) => {
    const activeToken = t || token
    if (!activeToken) return
    setLoading(true)
    try {
      const me = await api.me(activeToken)
      setUser(me.user)
      setSubscription(me.subscription)
    } catch {
      // session invalid/expired
      setToken(null)
      setUser(null)
      setSubscription(null)
      localStorage.removeItem(STORAGE_KEY)
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    if (token) refresh(token)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const signInWithGoogleCredential = useCallback(async (idToken) => {
    const res = await api.authGoogle(idToken)
    setToken(res.token)
    setUser(res.user)
    setSubscription(res.subscription)
    localStorage.setItem(STORAGE_KEY, res.token)
    return res
  }, [])

  const signOut = useCallback(() => {
    setToken(null)
    setUser(null)
    setSubscription(null)
    localStorage.removeItem(STORAGE_KEY)
  }, [])

  return (
    <AuthContext.Provider value={{ token, user, subscription, loading, signInWithGoogleCredential, signOut, refresh }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
