import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { verifyPinReq } from '../services/api'
import { useToast } from './Toast'

export default function PinLock() {
  const { role, setRole } = useAuth()
  const [pin, setPin] = useState('')
  const [error, setError] = useState(false)
  const toast = useToast()

  const handleInput = (digit) => {
    if (pin.length < 4) {
      setPin(p => p + digit)
      setError(false)
    }
  }

  const handleDelete = () => {
    setPin(p => p.slice(0, -1))
    setError(false)
  }

  // Auto submit when 4 digits are entered
  useEffect(() => {
    if (pin.length === 4) {
      verify()
    }
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
      setTimeout(() => setPin(''), 500) // Clear pin after half a second
    }
  }

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (role) return
      if (e.key >= '0' && e.key <= '9') {
        handleInput(e.key)
      } else if (e.key === 'Backspace') {
        handleDelete()
      } else if (e.key === 'Enter') {
        verify()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [pin, role])

  const nums = [1, 2, 3, 4, 5, 6, 7, 8, 9, 'Borrar', 0, 'Entrar']

  if (role) return null // Return empty if role is verified

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'var(--sur)', zIndex: 9999, display: 'flex',
      flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '2rem'
    }}>
      <div style={{ width: '100%', maxWidth: '320px', textAlign: 'center' }}>
        <h1 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '3rem', letterSpacing: 2, color: 'var(--acc)', margin: '0 0 1rem 0' }}>
          BLOQUEO DE SISTEMA
        </h1>
        <p style={{ color: 'var(--mut)', marginBottom: '2rem' }}>Ingrese PIN para Operar o Administrar.</p>
        
        {/* Input Dots */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginBottom: '3rem', animation: error ? 'shake 0.4s' : 'none' }}>
          {[0, 1, 2, 3].map(i => (
            <div key={i} style={{
              width: 20, height: 20, borderRadius: '50%',
              background: i < pin.length ? 'var(--acc)' : 'transparent',
              border: `2px solid ${i < pin.length ? 'var(--acc)' : 'var(--mut)'}`,
              transition: 'all 0.2s',
              boxShadow: i < pin.length ? '0 0 10px var(--acc)' : 'none'
            }} />
          ))}
        </div>

        {/* Numpad */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
          {nums.map((n, i) => {
            if (n === 'Borrar') return (
              <button key={i} onClick={handleDelete} style={{
                background: 'transparent', border: 'none', color: 'var(--mut)',
                fontSize: '1rem', fontWeight: 'bold', cursor: 'pointer'
              }}>BORRAR</button>
            )
            if (n === 'Entrar') return (
              <button key={i} onClick={verify} style={{
                background: 'transparent', border: 'none', color: 'var(--acc)',
                fontSize: '1rem', fontWeight: 'bold', cursor: 'pointer'
              }}>ENTRAR</button>
            )
            return (
              <button key={i} onClick={() => handleInput(n)} style={{
                background: 'var(--sur2)', border: '1px solid var(--brd)',
                borderRadius: '50%', width: 70, height: 70, justifySelf: 'center',
                color: 'var(--txt)', fontSize: '1.5rem', fontWeight: 600,
                cursor: 'pointer', outline: 'none', transition: 'all 0.1s'
              }}
              onMouseDown={e => e.currentTarget.style.background = 'var(--acc)'}
              onMouseUp={e => e.currentTarget.style.background = 'var(--sur2)'}
              >
                {n}
              </button>
            )
          })}
        </div>
      </div>
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-10px); }
          40% { transform: translateX(10px); }
          60% { transform: translateX(-5px); }
          80% { transform: translateX(5px); }
        }
      `}</style>
    </div>
  )
}
