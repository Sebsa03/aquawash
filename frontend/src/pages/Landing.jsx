import { useNavigate } from 'react-router-dom'

const features = [
  { icon: '🚿', title: 'Registro rápido', desc: 'Registra un lavado en segundos. El precio se calcula solo.' },
  { icon: '📊', title: 'Estadísticas en tiempo real', desc: 'Ve cuánto llevas hoy, esta semana y este mes. Sin Excel.' },
  { icon: '👷', title: 'Ranking de empleados', desc: 'Sabe quién está lavando más y generando más ingresos.' },
  { icon: '🚗', title: 'Clientes frecuentes', desc: 'Identifica placas que regresan seguido automáticamente.' },
  { icon: '🔒', title: 'Acceso seguro', desc: 'Cada lavadero tiene sus propias credenciales.' },
  { icon: '📱', title: 'Cualquier dispositivo', desc: 'Celular, tablet o computador. Solo necesitas un navegador.' },
]

const steps = [
  { num: '01', icon: '📝', title: 'Crea tu cuenta', desc: 'Regístrate con tu correo. Listo en 2 minutos.' },
  { num: '02', icon: '⚙️', title: 'Configura tus precios', desc: 'Define cuánto cobras por tipo de vehículo.' },
  { num: '03', icon: '🚿', title: 'Empieza a registrar', desc: 'Agrega empleados y registra desde cualquier dispositivo.' },
]

export default function Landing() {
  const navigate = useNavigate()

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>

      {/* NAV */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: 'rgba(14,15,17,0.95)',
        borderBottom: '1px solid var(--brd)',
        padding: '0 5%', display: 'flex',
        alignItems: 'center', justifyContent: 'space-between', height: 60
      }}>
        <div style={{
          fontFamily: "'Bebas Neue', sans-serif",
          fontSize: '1.4rem', letterSpacing: 3, color: 'var(--acc)'
        }}>
          💧 <span style={{ color: 'var(--txt)' }}>AQUA</span>WASH
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn-secondary" onClick={() => navigate('/demo')}
            style={{ fontSize: 13, padding: '7px 16px', background: 'transparent', border: '1px solid var(--acc2)', color: 'var(--acc2)' }}>
            Ver Demo
          </button>
          <button className="btn-secondary" onClick={() => navigate('/login')}
            style={{ fontSize: 13, padding: '7px 16px' }}>
            Iniciar sesión
          </button>
          <button className="btn-primary" onClick={() => navigate('/registro')}
            style={{ fontSize: 13, padding: '7px 16px' }}>
            Crear nueva cuenta
          </button>
        </div>
      </nav>

      {/* HERO */}
      <section style={{ padding: '80px 5% 60px', textAlign: 'center' }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          background: 'rgba(0,212,255,0.1)', border: '1px solid rgba(0,212,255,0.25)',
          color: 'var(--acc)', borderRadius: 20, padding: '4px 14px',
          fontSize: 12, fontWeight: 600, fontFamily: "'DM Mono', monospace",
          marginBottom: 24, letterSpacing: 0.5
        }}>
          <span style={{
            width: 6, height: 6, borderRadius: '50%',
            background: 'var(--acc3)', display: 'inline-block'
          }} />
          NUEVO — Versión 1.0 disponible
        </div>

        <h1 style={{
          fontFamily: "'Bebas Neue', sans-serif",
          fontSize: 'clamp(2.8rem, 7vw, 5rem)',
          letterSpacing: 3, lineHeight: 1, marginBottom: 20
        }}>
          Gestiona tu lavadero<br />
          <span style={{ color: 'var(--acc)' }}>sin complicaciones</span>
        </h1>

        <p style={{ fontSize: '1.05rem', color: 'var(--mut)', maxWidth: 520, margin: '0 auto 32px', lineHeight: 1.7 }}>
          Registra lavados, controla ingresos, mide el rendimiento de tu equipo
          y conoce a tus clientes frecuentes desde cualquier dispositivo.
        </p>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button className="btn-primary"
            style={{ fontSize: 15, padding: '14px 28px', borderRadius: 8 }}
            onClick={() => navigate('/registro')}>
            Crear nueva cuenta — 7 días gratis
          </button>
          <button className="btn-secondary"
            style={{ fontSize: 15, padding: '14px 28px', borderRadius: 8, border: '1px solid var(--acc2)', color: 'var(--acc2)', background: 'transparent' }}
            onClick={() => navigate('/demo')}>
            Explorar Demo Interactivo
          </button>
        </div>

        {/* Stats */}
        <div style={{ display: 'flex', gap: 32, justifyContent: 'center', marginTop: 48, flexWrap: 'wrap' }}>
          {[
            { v: '$0', l: 'Para empezar' },
            { v: '7 días', l: 'Prueba gratis' },
            { v: '100%', l: 'Web — sin instalar' },
            { v: 'Multi', l: 'Dispositivos' },
          ].map(s => (
            <div key={s.l} style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '2rem', color: 'var(--acc)', letterSpacing: 1 }}>{s.v}</div>
              <div style={{ fontSize: 12, color: 'var(--mut)', textTransform: 'uppercase', letterSpacing: 1 }}>{s.l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section style={{
        padding: '60px 5%',
        background: 'var(--sur)',
        borderTop: '1px solid var(--brd)',
        borderBottom: '1px solid var(--brd)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '2.2rem', letterSpacing: 2, marginBottom: 8 }}>
            Todo lo que necesita tu lavadero
          </h2>
          <p style={{ color: 'var(--mut)', fontSize: '0.95rem' }}>Diseñado para operadores reales, no para contadores</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, maxWidth: 860, margin: '0 auto' }}>
          {features.map(f => (
            <div key={f.title} className="card" style={{ margin: 0 }}>
              <div style={{
                width: 40, height: 40, borderRadius: 10,
                background: 'rgba(0,212,255,0.1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 18, marginBottom: 14
              }}>{f.icon}</div>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: 6 }}>{f.title}</h3>
              <p style={{ fontSize: '0.82rem', color: 'var(--mut)', lineHeight: 1.6 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CÓMO FUNCIONA */}
      <section style={{ padding: '60px 5%', textAlign: 'center' }}>
        <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '2.2rem', letterSpacing: 2, marginBottom: 8 }}>
          Empieza en 3 pasos
        </h2>
        <p style={{ color: 'var(--mut)', marginBottom: 40 }}>Sin configuraciones complicadas</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20, maxWidth: 700, margin: '0 auto' }}>
          {steps.map(s => (
            <div key={s.num} style={{ textAlign: 'center', padding: '0 10px' }}>
              <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '2rem', color: 'rgba(0,212,255,0.2)', lineHeight: 1, marginBottom: 8 }}>{s.num}</div>
              <div style={{ fontSize: '1.8rem', marginBottom: 10 }}>{s.icon}</div>
              <h3 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: 6 }}>{s.title}</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--mut)' }}>{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* PLANES */}
      <section style={{ padding: '60px 5%', background: 'var(--sur)', borderTop: '1px solid var(--brd)', borderBottom: '1px solid var(--brd)' }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '2.2rem', letterSpacing: 2, marginBottom: 8 }}>
            Planes simples, sin letra pequeña
          </h2>
          <p style={{ color: 'var(--mut)' }}>7 días de prueba gratis en cualquier plan</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 20, maxWidth: 660, margin: '0 auto' }}>
          {/* Básico removido */}

          {/* Pro */}
          <div className="card" style={{ margin: 0, borderColor: 'var(--acc)', background: 'rgba(0,212,255,0.04)' }}>
            <div style={{
              display: 'inline-block', background: 'var(--acc)', color: '#000',
              fontSize: 11, fontWeight: 700, padding: '2px 12px',
              borderRadius: 20, marginBottom: 8, fontFamily: "'DM Mono', monospace"
            }}>⭐ MÁS POPULAR</div>
            <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '1.4rem', letterSpacing: 2, color: 'var(--acc)', marginBottom: 4 }}>Pro</div>
            <div style={{ fontSize: 12, color: 'var(--mut)', marginBottom: 10 }}>Para lavaderos que quieren crecer</div>
            <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '2.2rem', color: 'var(--acc)', marginBottom: 2 }}>Prueba</div>
            <div style={{ fontSize: 12, color: 'var(--mut)', marginBottom: 16 }}>COP / mes</div>
            {['Todo lo del plan Básico', 'Cierre de caja del día', 'Etiquetas de estado del vehículo', 'Exportación de datos (JSON)', 'Cliente frecuente ★', 'Soporte prioritario'].map(i => (
              <div key={i} style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <span style={{ color: 'var(--acc3)', fontWeight: 700 }}>✓</span>{i}
              </div>
            ))}
            <button className="btn-primary" style={{ width: '100%', marginTop: 16 }} onClick={() => navigate('/registro')}>
              Crear nueva cuenta
            </button>
            <div style={{ textAlign: 'center', fontSize: 11, color: 'var(--mut)', marginTop: 6 }}>7 días gratis — sin tarjeta</div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: '60px 5%', textAlign: 'center' }}>
        <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '2.4rem', letterSpacing: 2, marginBottom: 12 }}>
          ¿Listo para organizar tu lavadero?
        </h2>
        <p style={{ color: 'var(--mut)', marginBottom: 28 }}>Únete a los lavaderos que ya controlan sus ingresos con AquaWash</p>
        <button className="btn-primary" style={{ fontSize: 15, padding: '14px 28px', borderRadius: 8 }}
          onClick={() => navigate('/registro')}>
          Crear nueva cuenta
        </button>
      </section>

      {/* FOOTER */}
      <footer style={{
        background: 'var(--sur)', borderTop: '1px solid var(--brd)',
        padding: '20px 5%', display: 'flex',
        alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10
      }}>
        <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '1.1rem', letterSpacing: 2, color: 'var(--acc)' }}>
          💧 <span style={{ color: 'var(--txt)' }}>AQUA</span>WASH
        </div>
        <div style={{ fontSize: 12, color: 'var(--mut)' }}>© 2026 AquaWash. Todos los derechos reservados.</div>
        <div style={{ display: 'flex', gap: 16 }}>
          {['Términos', 'Privacidad', 'Soporte'].map(l => (
            <span key={l} style={{ fontSize: 12, color: 'var(--mut)', cursor: 'pointer' }}>{l}</span>
          ))}
        </div>
      </footer>

    </div>
  )
}