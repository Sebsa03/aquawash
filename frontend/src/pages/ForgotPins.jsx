import { useState } from 'react'
import { forgotPins } from '../services/api'
import AuthCard from '../components/AuthCard'
import Feedback from '../components/Feedback'

export default function ForgotPins() {
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
      await forgotPins(email)
      setMessage('Se envió el enlace para recuperar tus PINs. Revisa tu correo.')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthCard title="Recuperar PINs" description="Ingresa tu correo y te enviaremos el enlace para restablecer tus PINs.">
      <form onSubmit={handleSubmit}>
        <div className="form-group" style={{ marginBottom:18 }}>
          <label className="form-label">Correo electronico</label>
          <input className="input-base" type="email" placeholder="tu@correo.com" value={email} onChange={e => setEmail(e.target.value)} required />
        </div>

        <Feedback error={error} message={message} />

        <button className="btn-primary" type="submit" disabled={loading} style={{ width:'100%', padding:'0.9rem' }}>
          {loading ? 'Enviando...' : 'Enviar enlace'}
        </button>
      </form>
    </AuthCard>
  )
}
