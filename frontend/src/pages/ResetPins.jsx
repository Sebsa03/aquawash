import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { resetPins } from '../services/api'
import AuthCard from '../components/AuthCard'
import Feedback from '../components/Feedback'

export default function ResetPins() {
  const { token: tokenFromUrl } = useParams()
  const navigate = useNavigate()
  const [token, setToken] = useState(tokenFromUrl || '')
  const [pinDueno, setPinDueno] = useState('')
  const [pinOperario, setPinOperario] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState(null)
  const [error, setError] = useState(null)

  const isManualCode = !tokenFromUrl

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setMessage(null)

    if (isManualCode && token.length !== 6) {
      return setError('Ingresa el código de verificación de 6 dígitos enviado por correo.')
    }
    if (!isManualCode && !token) {
      return setError('Token inválido. Usa el enlace que recibiste por correo o ingresa el código manualmente.')
    }
    if (pinDueno.length !== 4 || pinOperario.length !== 4) {
      return setError('Los PINs deben ser de exactamente 4 dígitos')
    }

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
    <AuthCard
      title="Restablecer PINs"
      description={isManualCode
        ? "Ingresa el código de verificación enviado por correo y define nuevos PINs."
        : "Usa el enlace recibido por correo para restablecer tus PINs."}
    >
      <form onSubmit={handleSubmit}>
        {isManualCode && (
          <div className="form-group" style={{ marginBottom:18 }}>
            <label className="form-label">Código de verificación</label>
            <input
              className="input-base"
              type="text"
              placeholder="123456"
              maxLength="6"
              value={token}
              onChange={e => setToken(e.target.value.replace(/[^0-9]/g, ''))}
              required
            />
          </div>
        )}

        <div className="form-grid" style={{ marginBottom:18 }}>
          <div className="form-group">
            <label className="form-label">Nuevo PIN Dueño</label>
            <input className="input-base" type="text" placeholder="9999" maxLength="4" value={pinDueno} onChange={e => setPinDueno(e.target.value.replace(/[^0-9]/g, ''))} required />
          </div>
          <div className="form-group">
            <label className="form-label">Nuevo PIN Operario</label>
            <input className="input-base" type="text" placeholder="1111" maxLength="4" value={pinOperario} onChange={e => setPinOperario(e.target.value.replace(/[^0-9]/g, ''))} required />
          </div>
        </div>

        <Feedback error={error} message={message} />

        <button className="btn-primary" type="submit" disabled={loading} style={{ width:'100%', padding:'0.9rem' }}>
          {loading ? 'Guardando...' : 'Restablecer PINs'}
        </button>
      </form>
    </AuthCard>
  )
}
