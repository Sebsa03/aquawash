import { useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { resetPassword } from '../services/api'

export default function ResetPassword() {
  const { token } = useParams()
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState(null)
  const [error, setError] = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setMessage(null)
    if (password.length < 8) return setError('La contraseña debe tener al menos 8 caracteres')
    if (password !== confirm) return setError('Las contraseñas no coinciden')

    setLoading(true)
    try {
      await resetPassword({ token, new_password: password })
      setMessage('Contraseña actualizada correctamente. Ahora puedes iniciar sesión.')
      setTimeout(() => navigate('/login'), 1600)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', padding:'1rem' }}>
      <div style={{ background:'var(--sur)', border:'1px solid var(--brd)', borderRadius:14, padding:'2rem 1.8rem', width:'100%', maxWidth:420 }}>
        <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:'1.75rem', letterSpacing:3, color:'var(--acc)', textAlign:'center', marginBottom:14 }}>
          Restablecer contraseña
        </div>
        <p style={{ color:'var(--mut)', fontSize:13, marginBottom:18, textAlign:'center' }}>
          Ingresa una nueva contraseña para tu cuenta.
        </p>
        <form onSubmit={handleSubmit}>
          <div className="form-group" style={{ marginBottom:14 }}>
            <label className="form-label">Nueva contraseña</label>
            <input className="input-base" type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required />
          </div>
          <div className="form-group" style={{ marginBottom:18 }}>
            <label className="form-label">Confirmar contraseña</label>
            <input className="input-base" type="password" placeholder="••••••••" value={confirm} onChange={e => setConfirm(e.target.value)} required />
          </div>
          {error && (
            <div style={{ background:'rgba(255,71,87,0.1)', border:'1px solid rgba(255,71,87,0.3)', borderRadius:6, padding:'10px 14px', fontSize:13, color:'var(--dan)', marginBottom:14, textAlign:'center' }}>
              {error}
            </div>
          )}
          {message && (
            <div style={{ background:'rgba(0,214,255,0.1)', border:'1px solid rgba(0,212,255,0.3)', borderRadius:6, padding:'10px 14px', fontSize:13, color:'var(--acc)', marginBottom:14, textAlign:'center' }}>
              {message}
            </div>
          )}
          <button className="btn-primary" type="submit" disabled={loading} style={{ width:'100%', padding:'0.9rem' }}>
            {loading ? 'Guardando...' : 'Restablecer contraseña'}
          </button>
        </form>
        <div style={{ marginTop:18, textAlign:'center', color:'var(--mut)', fontSize:13 }}>
          <Link to="/login" style={{ color:'var(--acc)' }}>Volver al inicio de sesión</Link>
        </div>
      </div>
    </div>
  )
}
