import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Demo() {
  const { login, setRole } = useAuth()
  const navigate = useNavigate()
  const [error, setError] = useState(null)

  useEffect(() => {
    async function initDemo() {
      const ok = await login('demo@aquawash.com', 'demo1234')
      if (ok) {
        setRole('dueno')
        navigate('/app/dashboard', { replace: true })
        return
      }

      setError('No se pudo conectar con el backend de demostración. Asegúrate de que el servidor esté activo y que VITE_API_URL apunte correctamente.')
    }
    initDemo()
  }, [login, navigate, setRole])

  return (
    <div style={{ height: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '2.5rem', color: 'var(--acc)', letterSpacing: 3, marginBottom: 20 }}>
        AQUAWASH
      </div>
      {error ? (
        <div style={{ maxWidth: 420, textAlign: 'center', color: 'var(--dan)', background: 'rgba(255,71,87,0.08)', border: '1px solid rgba(255,71,87,0.18)', borderRadius: 14, padding: 24 }}>
          <p style={{ marginBottom: 16 }}>{error}</p>
          <button className="btn-primary" type="button" onClick={() => navigate('/', { replace: true })} style={{ width: '100%', padding: '0.8rem' }}>
            Volver al inicio
          </button>
        </div>
      ) : (
        <>
          <div style={{ color: 'var(--mut)', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: 10 }}>
            <span className="loader" style={{ width: 16, height: 16, border: '2px solid var(--mut)', borderTopColor: 'transparent', borderRadius: '50%', display: 'inline-block', animation: 'spin 1s linear infinite' }}></span>
            Entrando al entorno de demostración interactiva...
          </div>
          <style>{`
            @keyframes spin { 100% { transform: rotate(360deg); } }
          `}</style>
        </>
      )}
    </div>
  )
}
