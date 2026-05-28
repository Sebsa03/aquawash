import { createContext, useContext, useState } from 'react'
import { login as apiLogin } from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [token, setToken]     = useState(localStorage.getItem('aw_token'))
  const [role, setRole]       = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState(null)

  const isAuthenticated = !!token

  async function login(email, password) {
    setLoading(true)
    setError(null)
    try {
      const data = await apiLogin(email, password)
      localStorage.setItem('aw_token', data.access_token)
      setToken(data.access_token)
      return true
    } catch (err) {
      setError(err.message)
      return false
    } finally {
      setLoading(false)
    }
  }

  function setAuthToken(tokenValue) {
    localStorage.setItem('aw_token', tokenValue)
    setToken(tokenValue)
  }

  function logout() {
    localStorage.removeItem('aw_token')
    setToken(null)
    setRole(null)
  }

  return (
    <AuthContext.Provider value={{ token, isAuthenticated, role, setRole, login, setAuthToken, logout, loading, error }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)