import { useState, useEffect } from 'react'
import { useNavigate, Link, useLocation } from 'react-router-dom'
import { GoogleLogin } from '@react-oauth/google'
import { registro, googleLogin } from '../services/api'
import { useAuth } from '../context/AuthContext'

const GOOGLE_ENABLED = Boolean(import.meta.env.VITE_GOOGLE_CLIENT_ID)

export default function Register() {
  const navigate = useNavigate()
  const location = useLocation()
  const { setAuthToken } = useAuth()
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError]     = useState(null)
  const [success, setSuccess] = useState(null)
  const [needsGoogleComplete, setNeedsGoogleComplete] = useState(false)
  const [googleCredential, setGoogleCredential] = useState('')
  const [form, setForm]       = useState({
    nombre_lavadero: '', ciudad: '', telefono: '',
    email: '', password: '', confirmar: '',
    pin_dueno: '', pin_operario: '',
    pais: 'CO', moneda: 'COP'
  })

  useEffect(() => {
    if (location.state?.google) {
      const googleState = location.state.google
      setNeedsGoogleComplete(true)
      setGoogleCredential(googleState.credential || '')
      setForm(prev => ({
        ...prev,
        email: googleState.email || prev.email,
        nombre_lavadero: googleState.name || prev.nombre_lavadero
      }))
      setSuccess('Completa los datos faltantes para terminar el registro con Google.')
    }
  }, [location.state])

  const COUNTRY_OPTIONS = [
    { code: 'CO', label: 'Colombia', currency: 'COP', decimals: 0, example: '1.000' },
    { code: 'CL', label: 'Chile', currency: 'CLP', decimals: 0, example: '1.000' },
    { code: 'MX', label: 'México', currency: 'MXN', decimals: 2, example: '1.000,00' },
    { code: 'PE', label: 'Perú', currency: 'PEN', decimals: 2, example: '1.000,00' },
    { code: 'AR', label: 'Argentina', currency: 'ARS', decimals: 2, example: '1.000,00' },
    { code: 'US', label: 'Estados Unidos', currency: 'USD', decimals: 2, example: '1,000.00' },
    { code: 'ES', label: 'España', currency: 'EUR', decimals: 2, example: '1.000,00' }
  ]

  const selectedCountry = COUNTRY_OPTIONS.find(item => item.code === form.pais) ?? COUNTRY_OPTIONS[0]

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  function handleCountryChange(e) {
    const selected = COUNTRY_OPTIONS.find(item => item.code === e.target.value) ?? COUNTRY_OPTIONS[0]
    setForm({ ...form, pais: selected.code, moneda: selected.currency })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    if (!form.nombre_lavadero.trim()) return setError('El nombre del lavadero es obligatorio')
    if (!form.email.trim()) return setError('El correo electrónico es obligatorio')
    if (form.password !== form.confirmar) return setError('Las contraseñas no coinciden')
    if (form.password.length < 8) return setError('La contraseña debe tener al menos 8 caracteres')
    if (form.pin_dueno.length !== 4 || form.pin_operario.length !== 4) return setError('Los PINs deben ser de exactamente 4 dígitos')

    setLoading(true)
    try {
      const data = await registro({
        nombre: form.nombre_lavadero.trim(),
        ciudad: form.ciudad,
        telefono: form.telefono,
        email: form.email,
        password: form.password,
        pin_dueno: form.pin_dueno,
        pin_operario: form.pin_operario,
        pais: form.pais,
        moneda: form.moneda,
        plan: 'pro'
      })
      setAuthToken(data.access_token)
      navigate('/app/dashboard')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function onGoogleSuccess(response) {
    setError(null)
    setSuccess(null)
    setGoogleLoading(true)

    try {
      const data = await googleLogin(response.credential)
      if (data?.access_token) {
        setAuthToken(data.access_token)
        navigate('/app/dashboard')
        return
      }

      if (data?.needs_more_data) {
        setNeedsGoogleComplete(true)
        setGoogleCredential(response.credential)
        setForm(prev => ({
          ...prev,
          email: data.email || prev.email,
          nombre_lavadero: data.name || prev.nombre_lavadero
        }))
        setSuccess('Completa los datos faltantes para terminar el registro con Google.')
        return
      }

      setError('No se pudo autenticar con Google. Intenta nuevamente.')
    } catch (err) {
      setError(err.message)
    } finally {
      setGoogleLoading(false)
    }
  }

  async function handleGoogleComplete(e) {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    if (!googleCredential) return setError('No se encontró la sesión de Google. Intenta de nuevo.')
    if (!form.nombre_lavadero.trim()) return setError('El nombre del lavadero es obligatorio')
    if (form.pin_dueno.length !== 4 || form.pin_operario.length !== 4) return setError('Los PINs deben ser de exactamente 4 dígitos')

    setLoading(true)
    try {
      const data = await googleLogin(googleCredential, {
        nombre_lavadero: form.nombre_lavadero.trim(),
        pin_dueno: form.pin_dueno,
        pin_operario: form.pin_operario,
        pais: form.pais,
        moneda: form.moneda
      })
      if (data?.access_token) {
        setAuthToken(data.access_token)
        navigate('/app/dashboard')
        return
      }
      setError('No se pudo completar el registro de Google. Intenta nuevamente.')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight:'100vh', background:'var(--bg)', padding:'1.5rem 1rem' }}>

      <div style={{ textAlign:'center', marginBottom:30 }}>
        <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:'1.8rem', letterSpacing:3, color:'var(--acc)', cursor:'pointer' }}
          onClick={() => navigate('/')}>
          💧 AQUAWASH
        </div>
        <p style={{ fontSize:14, color:'var(--mut)', marginTop:6 }}>Versión Pro — 7 días gratis sin tarjeta</p>
      </div>

      <div style={{ maxWidth:720, margin:'0 auto' }}>
        <div style={{ background:'var(--sur)', border:'1px solid var(--brd)', borderRadius:14, padding:'2rem 2rem' }}>
          <h2 style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:'1.5rem', letterSpacing:2, marginBottom:22, textAlign: 'center' }}>
            Crea tu cuenta
          </h2>

          {!needsGoogleComplete && (
            GOOGLE_ENABLED ? (
              <div style={{ display:'flex', flexDirection:'column', gap:12, marginBottom:20 }}>
                <GoogleLogin
                  onSuccess={onGoogleSuccess}
                  onError={() => setError('Error en el inicio con Google. Intenta otra vez.')}
                />
                <div style={{ textAlign:'center', color:'var(--mut)', fontSize:13 }}>
                  O regístrate con tu correo y contraseña
                </div>
              </div>
            ) : (
              <div style={{ marginBottom:20, textAlign:'center', color:'var(--mut)', fontSize:13 }}>
                Registro con Google no está disponible.
              </div>
            )
          )}

          <form onSubmit={needsGoogleComplete ? handleGoogleComplete : handleSubmit}>
            <div style={{ display:'grid', gap:14, marginBottom:14 }}>
              <div className="form-group">
                <label className="form-label">Nombre del lavadero</label>
                <input className="input-base" name="nombre_lavadero"
                  placeholder="Ej: Lavadero El Diamante"
                  value={form.nombre_lavadero} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label className="form-label">Ciudad</label>
                <input className="input-base" name="ciudad"
                  placeholder="Ej: Valledupar"
                  value={form.ciudad} onChange={handleChange} />
              </div>
            </div>
            <div className="form-group" style={{ marginBottom:14 }}>
              <label className="form-label">Telefono (opcional)</label>
              <input className="input-base" name="telefono"
                placeholder="3001234567"
                value={form.telefono} onChange={handleChange} />
            </div>
            <div style={{ display:'grid', gap:14, marginBottom:14 }}>
              <div className="form-group">
                <label className="form-label">Pais</label>
                <select className="input-base" name="pais" value={form.pais} onChange={handleCountryChange}>
                  {COUNTRY_OPTIONS.map((item) => (
                    <option key={item.code} value={item.code}>{item.label}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Moneda</label>
                <input className="input-base" type="text" name="moneda" value={form.moneda} readOnly />
              </div>
            </div>
            <div style={{ marginBottom:16, fontSize:13, color:'var(--mut)' }}>
              Formato de moneda: {selectedCountry.decimals === 0 ? 'sin decimales' : '2 decimales'} ({selectedCountry.example})
            </div>
            <div className="form-group" style={{ marginBottom:14 }}>
              <label className="form-label">Correo electronico</label>
              <input className="input-base" type="email" name="email"
                placeholder="tu@correo.com"
                value={form.email} onChange={handleChange} required readOnly={needsGoogleComplete} />
            </div>
            {!needsGoogleComplete && (
              <div style={{ display:'grid', gap:14, marginBottom:14 }}>
                <div className="form-group">
                  <label className="form-label">Contraseña</label>
                  <input className="input-base" type="password" name="password"
                    placeholder="Min. 8 caracteres"
                    value={form.password} onChange={handleChange} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Confirmar</label>
                  <input className="input-base" type="password" name="confirmar"
                    placeholder="Repite la contraseña"
                    value={form.confirmar} onChange={handleChange} required />
                </div>
              </div>
            )}
            <div style={{ display:'grid', gap:14, marginBottom:14 }}>
              <div className="form-group">
                <label className="form-label">PIN Dueño (Administrador)</label>
                <input className="input-base" type="text" name="pin_dueno"
                  placeholder="Ej: 9999" maxLength="4" pattern="\d{4}"
                  value={form.pin_dueno} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label className="form-label">PIN Operario (Cajero)</label>
                <input className="input-base" type="text" name="pin_operario"
                  placeholder="Ej: 1111" maxLength="4" pattern="\d{4}"
                  value={form.pin_operario} onChange={handleChange} required />
              </div>
            </div>
            {needsGoogleComplete && (
              <div style={{ marginBottom:18, fontSize:13, color:'var(--acc)' }}>
                Completa los datos faltantes para finalizar tu registro con Google.
              </div>
            )}
            {error && (
              <div style={{ background:'rgba(255,71,87,0.1)', border:'1px solid rgba(255,71,87,0.3)', borderRadius:6, padding:'10px 14px', fontSize:13, color:'var(--dan)', marginBottom:14, textAlign: 'center' }}>
                {error}
              </div>
            )}
            {success && (
              <div style={{ background:'rgba(0,214,255,0.1)', border:'1px solid rgba(0,212,255,0.3)', borderRadius:6, padding:'10px 14px', fontSize:13, color:'var(--acc)', marginBottom:14, textAlign: 'center' }}>
                {success}
              </div>
            )}
            <button className="btn-primary" type="submit" disabled={loading || googleLoading}
              style={{ width:'100%', padding:'0.9rem', fontSize:15, letterSpacing: 0.5 }}>
              {needsGoogleComplete ? (loading ? 'Guardando datos...' : 'Completar registro con Google') : (loading ? 'Creando cuenta...' : 'Crear cuenta gratis')}
            </button>
          </form>
        </div>

        <div style={{ textAlign:'center', marginTop:16, fontSize:13, color:'var(--mut)' }}>
          ¿Ya tienes cuenta?{' '}
          <Link to="/login" style={{ color:'var(--acc)', fontWeight: 'bold' }}>Inicia sesión</Link>
        </div>
      </div>
    </div>
  )
}