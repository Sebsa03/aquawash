import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import { verifyPinReq } from '../services/api'
import { useToast } from './Toast'

export default function PinLock() {
  const { role, setRole } = useAuth()
  const [pin, setPin] = useState('')
  const [error, setError] = useState(false)
  const toast = useToast()
  const inputRef = useRef(null)

  // Auto-focus cuando aparece la pantalla
  useEffect(() => {
    if (!role) setTimeout(() => inputRef.current?.focus(), 100)
  }, [role])

  // Auto-submit al llegar a 4 dígitos
  useEffect(() => {
    if (pin.length === 4) verify()
  }, [pin])

  const verify = async () => {
    if (pin.length === 0) return
    try {
      const res = await verifyPinReq(pin)
      setRole(res.rol)
      const rolLabel = res.rol === 'dueno' ? 'DUEÑO' : 'OPERADOR'
      toast?.(`Sesión Iniciada: ${rolLabel}`)
    } catch (e) {
      setError(true)
      toast?.('PIN Incorrecto')
      setTimeout(() => { setPin(''); setError(false) }, 500)
    }
  }

  const handleChange = (e) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 4)
    setPin(val)
    setError(false)
  }

  if (role) return null

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'var(--sur)', zIndex: 9999, display: 'flex',
      flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '2rem'
    }}>
      <div style={{ width: '100%', maxWidth: '320px', textAlign: 'center' }}>
        <h1 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '3rem', letterSpacing: 2, color: 'var(--acc)', margin: '0 0 0.5rem 0' }}>
          BLOQUEO DE SISTEMA
        </h1>
        <p style={{ color: 'var(--mut)', marginBottom: '2rem' }}>
          Ingrese PIN para Operar o Administrar.
        </p>

        {/* Campo de texto PIN */}
        <div style={{ animation: error ? 'shake 0.4s' : 'none' }}>
          <input
            ref={inputRef}
            type="password"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={4}
            value={pin}
            onChange={handleChange}
            onKeyDown={e => e.key === 'Enter' && verify()}
            placeholder="• • • •"
            autoComplete="one-time-code"
            style={{
              width: '100%', padding: '1rem', textAlign: 'center',
              fontSize: '2rem', letterSpacing: '1rem',
              background: 'var(--sur2)',
              border: `2px solid ${error ? 'var(--dan)' : 'var(--brd)'}`,
              borderRadius: 12, color: 'var(--txt)', outline: 'none',
              transition: 'border-color 0.2s',
              fontFamily: "'DM Mono', monospace",
              caretColor: 'var(--acc)'
            }}
            onFocus={e => { if (!error) e.target.style.borderColor = 'var(--acc)' }}
            onBlur={e => { if (!error) e.target.style.borderColor = 'var(--brd)' }}
          />
        </div>

        <button
          onClick={verify}
          className="btn-primary"
          style={{ width: '100%', marginTop: '1rem', padding: '0.9rem', fontSize: '1rem', borderRadius: 10, letterSpacing: 1 }}
        >
          ENTRAR
        </button>
      </div>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20%       { transform: translateX(-10px); }
          40%       { transform: translateX(10px); }
          60%       { transform: translateX(-5px); }
          80%       { transform: translateX(5px); }
        }
      `}</style>
    </div>
  )
}
