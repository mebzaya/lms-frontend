import { createContext, useContext, useState } from 'react'
import * as authApi from '../api/auth'
import { getToken, setToken, clearToken } from '../api/tokenStorage'
import { useEffectDeduped } from '../hooks/useEffectDeduped'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffectDeduped(() => {
    const token = getToken()
    if (!token) {
      setIsLoading(false)
      return
    }

    authApi
      .fetchCurrentUser()
      .then(setUser)
      .catch(() => clearToken())
      .finally(() => setIsLoading(false))
  }, [])

  async function login(email, password) {
    const data = await authApi.login(email, password)
    setToken(data.access_token)
    setUser(data.user)
    return data.user
  }

  async function logout() {
    try {
      await authApi.logout()
    } finally {
      clearToken()
      setUser(null)
    }
  }

  function updateUserName(name) {
    setUser((prev) => (prev ? { ...prev, name } : prev))
  }

  const value = {
    user,
    isAuthenticated: Boolean(user),
    isLoading,
    login,
    logout,
    updateUserName,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
