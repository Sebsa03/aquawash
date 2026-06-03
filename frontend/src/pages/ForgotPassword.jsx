import { useState } from 'react'
import { forgotPassword, verifyResetCode, resetPassword } from '../services/api'
import AuthCard from '../components/AuthCard'
import Feedback from '../components/Feedback'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [codigo, setCodigo] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
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
      await forgotPassword(email)
      setSent(true)
      setMessage('Se envió el código o enlace de recuperación. Revisa tu correo.')
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

    if (codigo.length === 0) {
      return setError('Ingresa el código de verificación que recibiste en el correo.')
    }

    setLoading(true)
    try {
      await verifyResetCode(codigo)
      setCodeConfirmed(true)
      setMessage('Código correcto. Ingresa tu nueva contraseña.')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleResetPassword(e) {
    e.preventDefault()
    setError(null)
    setMessage(null)

    if (!codeConfirmed) {
      return setError('Primero debes confirmar el código de verificación.')
    }
    if (password.length < 8) {
      return setError('La contraseña debe tener al menos 8 caracteres.')
    }
    if (password !== confirm) {
      return setError('Las contraseñas no coinciden.')
    }

    setLoading(true)
    try {
      await resetPassword({ token: codigo, new_password: password })
      setMessage('Contraseña actualizada correctamente. Ahora puedes iniciar sesión.')
      setEmail('')
      setCodigo('')
      setPassword('')
      setConfirm('')
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
      title="Recuperar contraseña"
      description={!sent
        ? 'Ingresa tu correo y te enviaremos el código o enlace para restablecer tu contraseña.'
        : !codeConfirmed
          ? 'Revisa tu correo, ingresa el código y luego define tu nueva contraseña.'
          : 'Ingresa tu nueva contraseña para completar el cambio.'}
    >
      <form onSubmit={sent ? (codeConfirmed ? handleResetPassword : handleConfirmCode) : handleSendEmail}>
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

        {sent && !codeConfirmed && (
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
          <>
            <div className="form-group" style={{ marginBottom:14 }}>
              <label className="form-label">Nueva contraseña</label>
              <input
                className="input-base"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
            </div>
            <div className="form-group" style={{ marginBottom:18 }}>
              <label className="form-label">Confirmar contraseña</label>
              <input
                className="input-base"
                type="password"
                placeholder="••••••••"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                required
              />
            </div>
          </>
        )}

        <Feedback error={error} message={message} />

        <button className="btn-primary" type="submit" disabled={loading} style={{ width:'100%', padding:'0.9rem' }}>
          {loading
            ? 'Procesando...'
            : !sent
              ? 'Enviar código'
              : !codeConfirmed
                ? 'Confirmar código'
                : 'Restablecer contraseña'}
        </button>
      </form>
    </AuthCard>
  )
}
