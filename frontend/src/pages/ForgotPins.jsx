import { useState } from 'react'
import { forgotPins, resetPins, verifyResetCode } from '../services/api'
import AuthCard from '../components/AuthCard'
import Feedback from '../components/Feedback'

export default function ForgotPins() {
  const [email, setEmail] = useState('')
  const [codigo, setCodigo] = useState('')
  const [pinDueno, setPinDueno] = useState('')
  const [pinOperario, setPinOperario] = useState('')
  const [sent, setSent] = useState(false)
  const [codeConfirmed, setCodeConfirmed] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState(null)
  const [error, setError] = useState(null)

  async function handleSendEmail(e) {
    e.preventDefault()
    setError(null)
    setMessage(null)
    setLoading(true)
    try {
      await forgotPins(email)
      setSent(true)
      setMessage('Se envió el código de verificación a tu correo. Ingresa el código para continuar.')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleConfirmCode(e) {
    e.preventDefault()
    setError(null)
    setMessage(null)

    if (codigo.length !== 6) {
      return setError('Ingresa el código de verificación de 6 dígitos.')
    }

    setLoading(true)
    try {
      await verifyResetCode(codigo)
      setCodeConfirmed(true)
      setMessage('Código correcto. Ahora ingresa los nuevos PINs.')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleResetPins(e) {
    e.preventDefault()
    setError(null)
    setMessage(null)

    if (!codeConfirmed) {
      return setError('Primero debes confirmar el código de verificación.')
    }
    if (pinDueno.length !== 4 || pinOperario.length !== 4) {
      return setError('Los PINs deben ser de exactamente 4 dígitos.')
    }

    setLoading(true)
    try {
      await resetPins({ token: codigo, new_pin_dueno: pinDueno, new_pin_operario: pinOperario })
      setMessage('Tus PINs se actualizaron correctamente. Ahora puedes iniciar sesión con los nuevos códigos.')
      setError(null)
      setCodigo('')
      setPinDueno('')
      setPinOperario('')
      setSent(false)
      setCodeConfirmed(false)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthCard
      title="Recuperar PINs"
      description={!sent
        ? 'Ingresa tu correo y te enviaremos el código para restablecer tus PINs.'
        : !codeConfirmed
          ? 'Revisa tu correo, escribe el código y luego define tus nuevos PINs.'
          : 'Ingresa tus nuevos PINs para completar el cambio.'}
    >
      <form onSubmit={sent ? (codeConfirmed ? handleResetPins : handleConfirmCode) : handleSendEmail}>
        {!sent && (
          <div className="form-group" style={{ marginBottom:18 }}>
            <label className="form-label">Correo electronico</label>
            <input
              className="input-base"
              type="email"
              placeholder="tu@correo.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </div>
        )}

        {sent && (
          <div className="form-group" style={{ marginBottom:18 }}>
            <label className="form-label">Código de verificación</label>
            <input
              className="input-base"
              type="text"
              placeholder="123456"
              maxLength="6"
              value={codigo}
              onChange={e => setCodigo(e.target.value.replace(/[^0-9]/g, ''))}
              required
            />
          </div>
        )}

        {sent && codeConfirmed && (
          <div className="form-grid" style={{ marginBottom:18 }}>
            <div className="form-group">
              <label className="form-label">Nuevo PIN Dueño</label>
              <input
                className="input-base"
                type="text"
                placeholder="9999"
                maxLength="4"
                value={pinDueno}
                onChange={e => setPinDueno(e.target.value.replace(/[^0-9]/g, ''))}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Nuevo PIN Operario</label>
              <input
                className="input-base"
                type="text"
                placeholder="1111"
                maxLength="4"
                value={pinOperario}
                onChange={e => setPinOperario(e.target.value.replace(/[^0-9]/g, ''))}
                required
              />
            </div>
          </div>
        )}

        <Feedback error={error} message={message} />

        <button className="btn-primary" type="submit" disabled={loading} style={{ width:'100%', padding:'0.9rem' }}>
          {loading ? 'Procesando...' : !sent ? 'Enviar código' : !codeConfirmed ? 'Confirmar código' : 'Restablecer PINs'}
        </button>
      </form>
    </AuthCard>
  )
}
