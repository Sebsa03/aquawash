import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { registro as apiRegistro } from '../services/api'
import { useAuth } from '../context/AuthContext'

export default function Register() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState(null)
  const [form, setForm]       = useState({
    nombre_lavadero: '', ciudad: '', telefono: '',
    email: '', password: '', confirmar: ''
  })

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    if (form.password !== form.confirmar) return setError('Las contrasenas no coinciden')
    if (form.password.length < 8) return setError('La contrasena debe tener al menos 8 caracteres')
    if (!form.nombre_lavadero.trim()) return setError('El nombre del lavadero es obligatorio')

    setLoading(true)
    try {
      const data = await apiRegistro({
        nombre:   form.nombre_lavadero.trim(),
        ciudad:   form.ciudad,
        telefono: form.telefono,
        email:    form.email,
        password: form.password,
        plan:     'pro' // Siempre asignado al plan Pro
      })
      localStorage.setItem('aw_token', data.access_token)
      navigate('/app/dashboard')
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

      <div style={{ maxWidth:460, margin:'0 auto' }}>
        <div style={{ background:'var(--sur)', border:'1px solid var(--brd)', borderRadius:14, padding:'2rem 1.8rem' }}>
          <h2 style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:'1.5rem', letterSpacing:2, marginBottom:22, textAlign: 'center' }}>
            Crea tu cuenta
          </h2>
          <form onSubmit={handleSubmit}>
            <div className="form-grid" style={{ marginBottom:14 }}>
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
            <div className="form-group" style={{ marginBottom:14 }}>
              <label className="form-label">Correo electronico</label>
              <input className="input-base" type="email" name="email"
                placeholder="tu@correo.com"
                value={form.email} onChange={handleChange} required />
            </div>
            <div className="form-grid" style={{ marginBottom:14 }}>
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

            <div style={{ marginBottom:18 }}>
              {[
                { ok: form.password.length >= 8, txt:'Mínimo 8 caracteres' },
                { ok: form.password === form.confirmar && form.confirmar.length > 0, txt:'Las contraseñas coinciden' }
              ].map(r => (
                <div key={r.txt} style={{ display:'flex', alignItems:'center', gap:6, fontSize:12, color: r.ok ? 'var(--acc3)' : 'var(--mut)', marginBottom:4 }}>
                  <span>{r.ok ? '✓' : '○'}</span>{r.txt}
                </div>
              ))}
            </div>

            {error && (
              <div style={{ background:'rgba(255,71,87,0.1)', border:'1px solid rgba(255,71,87,0.3)', borderRadius:6, padding:'10px 14px', fontSize:13, color:'var(--dan)', marginBottom:14, textAlign: 'center' }}>
                {error}
              </div>
            )}

            <button className="btn-primary" type="submit" disabled={loading}
              style={{ width:'100%', padding:'0.9rem', fontSize:15, letterSpacing: 0.5 }}>
              {loading ? 'Creando cuenta...' : 'Crear cuenta gratis'}
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