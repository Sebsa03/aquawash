import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { resetPassword } from '../services/api'
import AuthCard from '../components/AuthCard'
import Feedback from '../components/Feedback'

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
    <AuthCard title="Restablecer contraseña" description="Ingresa una nueva contraseña para tu cuenta.">
      <form onSubmit={handleSubmit}>
        <div className="form-group" style={{ marginBottom:14 }}>
          <label className="form-label">Nueva contraseña</label>
          <input className="input-base" type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required />
        </div>
        <div className="form-group" style={{ marginBottom:18 }}>
          <label className="form-label">Confirmar contraseña</label>
          <input className="input-base" type="password" placeholder="••••••••" value={confirm} onChange={e => setConfirm(e.target.value)} required />
        </div>

        <Feedback error={error} message={message} />

        <button className="btn-primary" type="submit" disabled={loading} style={{ width:'100%', padding:'0.9rem' }}>
          {loading ? 'Guardando...' : 'Restablecer contraseña'}
        </button>
      </form>
    </AuthCard>
  )
}
