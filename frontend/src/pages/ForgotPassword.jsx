import { useState } from 'react'
import { Link } from 'react-router-dom'
import { forgotPassword } from '../services/api'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState(null)
  const [error, setError] = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setMessage(null)
    setLoading(true)
    try {
      await forgotPassword(email)
      setMessage('Se envió el enlace de recuperación. Revisa tu correo.')
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
          Recuperar contraseña
        </div>
        <p style={{ color:'var(--mut)', fontSize:13, marginBottom:18, textAlign:'center' }}>
          Ingresa tu correo y te enviaremos un enlace para restablecer tu contraseña.
        </p>
        <form onSubmit={handleSubmit}>
          <div className="form-group" style={{ marginBottom:18 }}>
            <label className="form-label">Correo electronico</label>
            <input className="input-base" type="email" placeholder="tu@correo.com" value={email} onChange={e => setEmail(e.target.value)} required />
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
            {loading ? 'Enviando...' : 'Enviar enlace'}
          </button>
        </form>
        <div style={{ marginTop:18, textAlign:'center', color:'var(--mut)', fontSize:13 }}>
          <Link to="/login" style={{ color:'var(--acc)' }}>Volver al inicio de sesión</Link>
        </div>
      </div>
    </div>
  )
}
