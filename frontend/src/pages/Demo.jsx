import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Demo() {
  const { login, setRole } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    async function initDemo() {
      const ok = await login('demo@aquawash.com', 'demo1234')
      if (ok) {
        setRole('dueno')
        navigate('/app/dashboard', { replace: true })
      } else {
        alert('Error: La cuenta de demostración no está disponible en este momento.')
        navigate('/', { replace: true })
      }
    }
    initDemo()
  }, [login, navigate, setRole])

  return (
    <div style={{ height: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '2.5rem', color: 'var(--acc)', letterSpacing: 3, marginBottom: 20 }}>
        AQUAWASH
      </div>
      <div style={{ color: 'var(--mut)', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: 10 }}>
        <span className="loader" style={{ width: 16, height: 16, border: '2px solid var(--mut)', borderTopColor: 'transparent', borderRadius: '50%', display: 'inline-block', animation: 'spin 1s linear infinite' }}></span>
        Entrando al entorno de demostración interactiva...
      </div>
      <style>{`
        @keyframes spin { 100% { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}
