import { useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { resetPins } from '../services/api'

export default function ResetPins() {
  const { token } = useParams()
  const navigate = useNavigate()
  const [pinDueno, setPinDueno] = useState('')
  const [pinOperario, setPinOperario] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState(null)
  const [error, setError] = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setMessage(null)
    if (pinDueno.length !== 4 || pinOperario.length !== 4) return setError('Los PINs deben ser de exactamente 4 dígitos')

    setLoading(true)
    try {
      await resetPins({ token, new_pin_dueno: pinDueno, new_pin_operario: pinOperario })
      setMessage('PINs actualizados correctamente. Ahora puedes ingresar con los nuevos códigos.')
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
          Restablecer PINs
        </div>
        <p style={{ color:'var(--mut)', fontSize:13, marginBottom:18, textAlign:'center' }}>
          Ingresa nuevos PINs para el dueño y el operario.
        </p>
        <form onSubmit={handleSubmit}>
          <div className="form-grid" style={{ marginBottom:18 }}>
            <div className="form-group">
              <label className="form-label">Nuevo PIN Dueño</label>
              <input className="input-base" type="text" placeholder="9999" maxLength="4" value={pinDueno} onChange={e => setPinDueno(e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="form-label">Nuevo PIN Operario</label>
              <input className="input-base" type="text" placeholder="1111" maxLength="4" value={pinOperario} onChange={e => setPinOperario(e.target.value)} required />
            </div>
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
            {loading ? 'Guardando...' : 'Restablecer PINs'}
          </button>
        </form>
        <div style={{ marginTop:18, textAlign:'center', color:'var(--mut)', fontSize:13 }}>
          <Link to="/login" style={{ color:'var(--acc)' }}>Volver al inicio de sesión</Link>
        </div>
      </div>
    </div>
  )
}
