import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Toast from './Toast'
import PinLock from './PinLock'
import ErrorBoundary from './ErrorBoundary'
import { useState, useEffect } from 'react'
import { getConfig, getCierreCaja } from '../services/api'

export default function AppLayout() {
  const { logout, role, setRole } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [fecha, setFecha] = useState('')
  const [hora, setHora] = useState('')
  const [nombreLav, setNombreLav] = useState('AQUAWASH')
  const [showLogoutModal, setShowLogoutModal] = useState(false)
  const [isDemo, setIsDemo] = useState(false)

  useEffect(() => {
    try {
      const token = localStorage.getItem('aw_token')
      if (token) {
        const payload = JSON.parse(atob(token.split('.')[1]))
        if (payload.email === 'demo@aquawash.com') setIsDemo(true)
      }
    } catch(e) {}
  }, [])

  useEffect(() => {
    function tick() {
      const n = new Date()
      const dias = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
      const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
      setFecha(`${dias[n.getDay()]} ${n.getDate()} ${meses[n.getMonth()]}`)
      setHora(`${String(n.getHours()).padStart(2, '0')}:${String(n.getMinutes()).padStart(2, '0')}:${String(n.getSeconds()).padStart(2, '0')}`)
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    if (role) {
      getConfig().then(data => {
        if (data && data.nombre) setNombreLav(data.nombre)
      }).catch(() => {})
    }
  }, [role])

  // Restricciones Locales Fijas
  useEffect(() => {
    if (role === 'operario') {
      const restricted = ['/app/estadisticas', '/app/config']
      if (restricted.includes(location.pathname)) {
        navigate('/app/dashboard', { replace: true })
      }
    }
  }, [role, location.pathname, navigate])

  const [isCajaCerrada, setIsCajaCerrada] = useState(true)

  async function handleLogoutClick() {
    try {
      if (role === 'dueno') {
        const d = new Date()
        d.setMinutes(d.getMinutes() - d.getTimezoneOffset())
        const localDate = d.toISOString().slice(0,10)
        const res = await getCierreCaja(localDate)
        setIsCajaCerrada(res !== null)
      }
    } catch(e) {
      setIsCajaCerrada(true)
    }
    setShowLogoutModal(true)
  }

  function confirmLogout() {
    logout()
    navigate('/login')
  }

  let navItems = [
    { to: '/app/nuevo',        label: '+ Nuevo',      icon: '＋',  short: 'Nuevo'      },
    { to: '/app/historial',    label: '📋 Historial', icon: '📋', short: 'Historial'   },
    { to: '/app/estadisticas', label: '📊 Estadísticas', icon: '📊', short: 'Estadísticas' },
    { to: '/app/vehiculos',    label: '🚗 Vehículos', icon: '🚗', short: 'Vehículos'   },
    { to: '/app/empleados',    label: '👷 Empleados', icon: '👷', short: 'Empleados'   },
    { to: '/app/caja',         label: '💵 Caja',      icon: '💵', short: 'Caja'        },
    { to: '/app/inventario',   label: '📦 Inventario',icon: '📦', short: 'Inventario'  },
    { to: '/app/config',       label: '⚙️ Config',    icon: '⚙️', short: 'Config'      },
  ]
  // Menú exclusivo de DUEÑO
  if (role === 'dueno') {
    let allowed = ['/app/historial', '/app/estadisticas', '/app/vehiculos', '/app/empleados', '/app/caja', '/app/inventario', '/app/config']
    if (isDemo) {
      allowed = ['/app/historial', '/app/estadisticas', '/app/vehiculos', '/app/empleados', '/app/caja', '/app/inventario']
    }
    navItems = navItems.filter(i => allowed.includes(i.to))
  }

  // Menú exclusivo de OPERARIO
  if (role === 'operario') {
    navItems = navItems.filter(i => ['/app/nuevo', '/app/historial', '/app/vehiculos'].includes(i.to))
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>

      <PinLock />

      {/* HEADER */}
      <header className="app-main-header glass-panel" style={{
        padding: '0.8rem 1rem', display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', minHeight: 60, gap: '0.5rem',
        position: 'sticky', top: 0, zIndex: 101, flexWrap: 'nowrap', overflow: 'hidden',
        borderBottomLeftRadius: 0, borderBottomRightRadius: 0, borderTopLeftRadius: 0, borderTopRightRadius: 0, borderTop: 'none', borderLeft: 'none', borderRight: 'none'
      }}>
        <div className="app-header-left" style={{
          display: 'flex', alignItems: 'center', gap: '0.8rem', minWidth: 0
        }}>
          <div style={{
            fontFamily: "'Outfit', sans-serif", fontWeight: 800,
            fontSize: 'clamp(1.2rem, 4vw, 1.8rem)', letterSpacing: 0.5, color: 'var(--acc)',
            display: 'flex', alignItems: 'center', gap: 6,
            textShadow: '0 0 15px rgba(0,212,255,0.3)',
            textTransform: 'uppercase', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
          }}>
            💧 <span style={{ color: 'var(--txt)' }}>{nombreLav.split(' ')[0]}</span> {nombreLav.split(' ').slice(1).join(' ')}
          </div>
          {role && (
            <span style={{
              fontSize: '0.65rem', padding: '2px 6px', borderRadius: 4,
              background: role === 'dueno' ? 'rgba(0, 212, 255, 0.2)' : 'rgba(255, 255, 255, 0.1)',
              color: role === 'dueno' ? 'var(--acc)' : 'var(--mut)',
              textTransform: 'uppercase', fontWeight: 'bold', letterSpacing: 0.5, flexShrink: 0
            }}>
              {role === 'dueno' ? 'ADMIN' : 'OPERADOR'}
            </span>
          )}
        </div>

        <div className="app-header-right" style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexShrink: 0 }}>
          <div style={{
            fontFamily: "'JetBrains Mono', monospace", fontSize: '0.8rem',
            color: 'var(--mut)', textAlign: 'right', lineHeight: 1.3
          }}>
            <span className="header-date">{fecha}<br /></span>
            <span className="header-hora" style={{ color: 'var(--acc)' }}>{hora}</span>
          </div>
          <button
            onClick={handleLogoutClick}
            style={{
              width: 36, height: 36, borderRadius: '50%',
              background: 'rgba(0,212,255,0.1)', flexShrink: 0,
              border: '1px solid rgba(0,212,255,0.3)',
              color: 'var(--acc)', fontSize: 13, fontWeight: 700,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', fontFamily: "'Outfit', sans-serif", letterSpacing: 1,
              transition: 'all 0.2s ease', boxShadow: '0 0 10px rgba(0,212,255,0.1)'
            }}
            title="Cerrar sesión"
            onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
          >
            {nombreLav.substring(0, 2).toUpperCase()}
          </button>
        </div>
      </header>

      {isDemo && (
        <div style={{
          background: 'var(--acc2)', color: '#000', textAlign: 'center',
          padding: '8px 1rem', fontSize: '0.85rem', fontWeight: 600,
          letterSpacing: 1, textTransform: 'uppercase', fontFamily: "'DM Sans', sans-serif",
          display: 'flex', justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap', gap: '1rem'
        }}>
          <span>⚠️ MODO DE DEMOSTRACIÓN: ALGUNAS FUNCIONES ESTÁN DESHABILITADAS.</span>
          <button 
            onClick={() => {
              setRole(role === 'dueno' ? 'operario' : 'dueno')
              navigate('/app/dashboard')
            }}
            style={{
              padding: '6px 14px', fontSize: '12px', background: '#000', color: 'var(--acc2)',
              border: 'none', borderRadius: 20, cursor: 'pointer', fontWeight: 'bold', letterSpacing: 0.5,
              boxShadow: '0 2px 10px rgba(0,0,0,0.2)'
            }}>
            🔄 CAMBIAR A VISTA {role === 'dueno' ? 'OPERADOR' : 'ADMINISTRADOR'}
          </button>
        </div>
      )}

      {/* NAV */}
      <nav className="app-nav">
        {navItems.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => `app-nav-link ${isActive ? 'active' : ''}`}
          >
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-label">{item.short}</span>
          </NavLink>
        ))}
      </nav>

      {/* CONTENIDO */}
      <ErrorBoundary>
        <main style={{ flex: 1, padding: '1.2rem', maxWidth: '100%', margin: '0 auto', width: '100%', display: 'flex', flexDirection: 'column' }}>
          {role ? <Outlet /> : null /* Evitar renderizado de hijos cuando el PIN screen esta encima para mayor seguridad local */}
        </main>
      </ErrorBoundary>

      <Toast />

      {/* CUSTOM LOGOUT MODAL */}
      {showLogoutModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)',
          zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
        }}>
          <div style={{
            background: 'rgba(20, 22, 31, 0.85)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(0, 212, 255, 0.2)',
            boxShadow: '0 10px 40px rgba(0,0,0,0.5), 0 0 20px rgba(0, 212, 255, 0.1)',
            borderRadius: 16, maxWidth: 420, width: '100%', textAlign: 'center', padding: '2.5rem'
          }}>
            <div style={{ fontSize: '3.5rem', marginBottom: '0.5rem', textShadow: '0 0 20px rgba(0,212,255,0.4)' }}>🚪</div>
            <h2 style={{ fontFamily: "'Outfit',sans-serif", fontSize: '2rem', color: '#fff', margin: 0, letterSpacing: 0.5 }}>CERRAR SESIÓN</h2>
            <p style={{ color: 'var(--mut)', lineHeight: 1.6, margin: '1.5rem 0 2.5rem 0', fontSize: 15 }}>
              ¿Estás seguro de que deseas salir del panel? 
              <br/><br/>
              Requerirás el <strong style={{color:'var(--acc)'}}>PIN de Seguridad</strong> para volver a iniciar operaciones.
            </p>

            {!isCajaCerrada && (
              <div style={{ background: 'rgba(255,217,0,0.1)', border: '1px solid rgba(255,217,0,0.3)', padding: '1rem', borderRadius: 8, marginBottom: '2rem', animation: 'fadeIn 0.3s ease' }}>
                <div style={{ fontSize: '1.5rem', marginBottom: 4 }}>⚠️</div>
                <div style={{ color: '#ffd900', fontWeight: 'bold', marginBottom: 4, letterSpacing: 0.5 }}>CAJA SIN CERRAR</div>
                <div style={{ color: 'var(--txt)', fontSize: '0.85rem' }}>No has realizado el <strong>Cierre de Caja</strong> del día de hoy. ¿Deseas ir a cerrarla antes de salir?</div>
                <button 
                  onClick={() => { setShowLogoutModal(false); navigate('/app/caja'); }}
                  style={{ background: '#ffd900', color: '#000', border: 'none', padding: '0.5rem 1rem', borderRadius: 6, fontWeight: 'bold', marginTop: '0.8rem', cursor: 'pointer', fontSize: '0.85rem' }}
                >
                  Ir a Cerrar Caja
                </button>
              </div>
            )}

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button 
                onClick={() => setShowLogoutModal(false)} 
                style={{ 
                  flex: 1, padding: '0.8rem', borderRadius: 8, background: 'rgba(255,255,255,0.05)', 
                  color: 'var(--mut)', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', fontWeight: 'bold' 
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
              >
                Cancelar
              </button>
              <button 
                onClick={confirmLogout} 
                style={{ 
                  flex: 1, padding: '0.8rem', borderRadius: 8, background: 'var(--dan)', 
                  color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 'bold', boxShadow: '0 4px 15px rgba(255,71,87,0.3)'
                }}
                onMouseEnter={e => e.currentTarget.style.filter = 'brightness(1.2)'}
                onMouseLeave={e => e.currentTarget.style.filter = 'none'}
              >
                Sí, Salir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}