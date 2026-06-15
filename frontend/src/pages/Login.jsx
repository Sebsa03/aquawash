import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import GoogleAuth from '../components/GoogleAuth'
import { useAuth } from '../context/AuthContext'
import { googleLogin } from '../services/api'

const GOOGLE_ENABLED = Boolean(import.meta.env.VITE_GOOGLE_CLIENT_ID)

export default function Login() {
  const { login, setAuthToken, loading, error } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [googleLoading, setGoogleLoading] = useState(false)
  const [googleError, setGoogleError] = useState(null)
  const [localError, setLocalError] = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    setLocalError(null)
    const ok = await login(email, password)
    if (ok) {
      if (email.toLowerCase().trim() === 'admin@aquawash.com') {
        navigate('/superadmin')
      } else {
        navigate('/app/dashboard')
      }
    }
  }

  async function handleGoogleSuccess(response) {
    setGoogleError(null)
    setGoogleLoading(true)
    // useGoogleLogin (auth-code flow) entrega { code }, no { credential }
    const credential = response.credential ?? response.code ?? null
    try {
      const data = await googleLogin(credential)
      if (data?.access_token) {
        setAuthToken(data.access_token)
        if (data.email?.toLowerCase() === 'admin@aquawash.com') {
          navigate('/superadmin')
        } else {
          navigate('/app/dashboard')
        }
        return
      }
      if (data?.needs_more_data) {
        navigate('/registro', { state: { google: { credential, email: data.email, name: data.name } } })
        return
      }
      setGoogleError('No se pudo iniciar sesión con Google. Intenta nuevamente.')
    } catch (err) {
      setGoogleError(err.message)
    } finally {
      setGoogleLoading(false)
    }
  }

  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', padding:'1rem' }}>
      <div style={{ background:'var(--sur)', border:'1px solid var(--brd)', borderRadius:14, padding:'2rem 1.8rem', width:'100%', maxWidth:420 }}>
        <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:'2rem', letterSpacing:3, color:'var(--acc)', textAlign:'center', marginBottom:4 }}>
          AQUAWASH
        </div>
        <p style={{ textAlign:'center', fontSize:12, color:'var(--mut)', marginBottom:24 }}>
          Inicia sesión para continuar
        </p>

        <div style={{ display:'flex', flexDirection:'column', gap:12, marginBottom:20 }}>
          <GoogleAuth
            onSuccess={handleGoogleSuccess}
            onError={() => setGoogleError('Error en el inicio con Google. Intenta otra vez.')}
            helperText={'O ingresa con correo y contraseña'}
          />
          {(googleError || !GOOGLE_ENABLED) && (
            <div style={{ background:'rgba(255,71,87,0.08)', border:'1px solid rgba(255,71,87,0.18)', borderRadius:6, padding:'10px 14px', fontSize:12, color:'var(--dan)' }}>
              {googleError || 'Para activar Google, define VITE_GOOGLE_CLIENT_ID en frontend/.env'}
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group" style={{ marginBottom:14 }}>
            <label className="form-label">Correo electronico</label>
            <input className="input-base" type="email" placeholder="tu@correo.com"
              value={email} onChange={e => setEmail(e.target.value)} required autoFocus />
          </div>
          <div className="form-group" style={{ marginBottom:20 }}>
            <label className="form-label">Contrasena</label>
            <input className="input-base" type="password" placeholder="••••••••"
              value={password} onChange={e => setPassword(e.target.value)} required />
          </div>
          {(error || localError) && (
            <div style={{ background:'rgba(255,71,87,0.1)', border:'1px solid rgba(255,71,87,0.3)', borderRadius:6, padding:'8px 12px', fontSize:12, color:'var(--dan)', marginBottom:14 }}>
              {localError || error}
            </div>
          )}
          <button className="btn-primary" type="submit" disabled={loading} style={{ width:'100%', padding:'0.75rem' }}>
            {loading ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>

        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:16, gap:10, flexWrap:'wrap' }}>
          <Link to="/forgot-password" style={{ color:'var(--acc)', fontSize:13 }}>¿Olvidaste tu contraseña?</Link>
          <Link to="/forgot-pins" style={{ color:'var(--acc)', fontSize:13 }}>¿Olvidaste tus PINs?</Link>
        </div>

        <div style={{ marginTop:18 }}>
          <button className="btn-secondary" type="button" onClick={() => navigate('/registro')} style={{ width:'100%', padding:'0.75rem', border: '1px solid var(--acc2)', color: 'var(--acc2)', background: 'transparent' }}>
            Crear nueva cuenta
          </button>
        </div>
      </div>
    </div>
  )
}