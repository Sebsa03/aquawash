import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const { login, loading, error } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    const ok = await login(email, password)
    if (ok) navigate('/app/dashboard')
  }

  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', padding:'1rem' }}>
      <div style={{ background:'var(--sur)', border:'1px solid var(--brd)', borderRadius:14, padding:'2rem 1.8rem', width:'100%', maxWidth:380 }}>
        <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:'2rem', letterSpacing:3, color:'var(--acc)', textAlign:'center', marginBottom:4 }}>
          AQUAWASH
        </div>
        <p style={{ textAlign:'center', fontSize:12, color:'var(--mut)', marginBottom:24 }}>
          Inicia sesion para continuar
        </p>
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
          {error && (
            <div style={{ background:'rgba(255,71,87,0.1)', border:'1px solid rgba(255,71,87,0.3)', borderRadius:6, padding:'8px 12px', fontSize:12, color:'var(--dan)', marginBottom:14 }}>
              {error}
            </div>
          )}
          <button className="btn-primary" type="submit" disabled={loading} style={{ width:'100%', padding:'0.75rem' }}>
            {loading ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>
        <div style={{ marginTop:16, textAlign:'center', fontSize:12, color:'var(--mut)' }}>
          No tienes cuenta? <Link to="/registro" style={{ color:'var(--acc)' }}>Registrate</Link>
        </div>
        <div style={{ marginTop:8, textAlign:'center' }}>
          <Link to="/demo" style={{ color:'var(--acc2)', fontSize:12 }}>Ver demo sin registro</Link>
        </div>
        <div style={{ marginTop:20, padding:'10px 12px', background:'var(--sur2)', borderRadius:8, fontSize:11, color:'var(--mut)', textAlign:'center' }}>
          <div style={{ color:'var(--acc)', fontWeight:600, marginBottom:4 }}>Demo rapido</div>
          <div>demo@aquawash.com</div>
          <div>demo1234</div>
        </div>
      </div>
    </div>
  )
}