export default function UpgradeModal({ open, mensaje, onClose }) {
  if (!open) return null

  return (
    <div
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.8)',
        zIndex: 500, display: 'flex',
        alignItems: 'center', justifyContent: 'center',
        padding: '1rem'
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div style={{
        background: 'var(--sur)', border: '1px solid var(--brd)',
        borderRadius: 14, padding: '1.5rem',
        width: '100%', maxWidth: 420
      }}>
        <div style={{ textAlign: 'center', fontSize: '2rem', marginBottom: 12 }}>🚀</div>
        <div style={{
          fontFamily: "'Bebas Neue', sans-serif", fontSize: '1.4rem',
          letterSpacing: 2, color: 'var(--acc2)', textAlign: 'center', marginBottom: 8
        }}>
          Pásate al plan completo
        </div>
        <p style={{
          fontSize: 13, color: 'var(--mut)', textAlign: 'center',
          lineHeight: 1.6, marginBottom: 20
        }}>
          {mensaje || 'Desbloquea todas las funciones sin límites. 7 días gratis, sin tarjeta.'}
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
          {/* Plan Básico */}
          <div style={{
            background: 'var(--sur2)', border: '1px solid var(--brd)',
            borderRadius: 10, padding: 14, textAlign: 'center'
          }}>
            <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '1rem', letterSpacing: 1, marginBottom: 4 }}>
              Básico
            </div>
            <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '1.4rem' }}>$35k</div>
            <div style={{ fontSize: 10, color: 'var(--mut)', marginBottom: 10 }}>COP / mes</div>
            <button className="btn-secondary" style={{ width: '100%', fontSize: 12, padding: '7px 0' }}
              onClick={onClose}>
              Empezar gratis
            </button>
          </div>

          {/* Plan Pro */}
          <div style={{
            background: 'rgba(0,212,255,0.05)',
            border: '1px solid var(--acc)',
            borderRadius: 10, padding: 14, textAlign: 'center'
          }}>
            <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '1rem', letterSpacing: 1, color: 'var(--acc)', marginBottom: 4 }}>
              Pro
            </div>
            <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '1.4rem', color: 'var(--acc)' }}>$75k</div>
            <div style={{ fontSize: 10, color: 'var(--mut)', marginBottom: 10 }}>COP / mes</div>
            <button className="btn-primary" style={{ width: '100%', fontSize: 12, padding: '7px 0' }}
              onClick={onClose}>
              Empezar gratis
            </button>
          </div>
        </div>

        <div style={{ textAlign: 'center', fontSize: 12, color: 'var(--mut)', cursor: 'pointer' }}
          onClick={onClose}>
          Seguir en modo demo <span style={{ color: 'var(--acc)', textDecoration: 'underline' }}>→</span>
        </div>
      </div>
    </div>
  )
}