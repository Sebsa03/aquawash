import { createContext, useContext, useState } from 'react'
import { login as apiLogin } from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [token, setToken]     = useState(localStorage.getItem('aw_token'))
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

  function logout() {
    localStorage.removeItem('aw_token')
    setToken(null)
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout, loading, error }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)