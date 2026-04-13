import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Toast from './Toast'
import PinLock from './PinLock'
import ErrorBoundary from './ErrorBoundary'
import { useState, useEffect } from 'react'
import { getConfig } from '../services/api'

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
      const restricted = ['/app/estadisticas', '/app/config', '/app/auditoria']
      if (restricted.includes(location.pathname)) {
        navigate('/app/dashboard', { replace: true })
      }
    }
  }, [role, location.pathname, navigate])

  function handleLogoutClick() {
    setShowLogoutModal(true)
  }

  function confirmLogout() {
    logout()
    navigate('/login')
  }

  let navItems = [
    { to: '/app/nuevo', label: '＋ Nuevo' },
    { to: '/app/historial', label: '📋 Historial' },
    { to: '/app/estadisticas', label: '📊 Estadísticas' },
    { to: '/app/auditoria', label: '💼 Reportes' },
    { to: '/app/vehiculos', label: '🚗 Vehículos' },
    { to: '/app/empleados', label: '👷 Empleados' },
    { to: '/app/config', label: '⚙️ Config' },
  ]
  // Menú exclusivo de DUEÑO
  if (role === 'dueno') {
    let allowed = ['/app/historial', '/app/estadisticas', '/app/auditoria', '/app/vehiculos', '/app/empleados', '/app/config']
    if (isDemo) {
      // Limitar Demo: no permitir Configuración ni Auditoría real
      allowed = ['/app/historial', '/app/estadisticas', '/app/vehiculos', '/app/empleados']
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
      <header style={{
        background: 'var(--sur)', borderBottom: '1px solid var(--brd)',
        padding: '0 1.2rem', display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', height: 54,
        position: 'sticky', top: 0, zIndex: 100
      }}>
        <div style={{
          fontFamily: "'Bebas Neue', sans-serif",
          fontSize: '1.8rem', letterSpacing: 2, color: 'var(--acc)',
          display: 'flex', alignItems: 'center', gap: 6,
          textShadow: '0 0 15px rgba(0,212,255,0.3)',
          textTransform: 'uppercase'
        }}>
          💧 <span style={{ color: 'var(--txt)' }}>{nombreLav.split(' ')[0]}</span>{nombreLav.split(' ').slice(1).join(' ')}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {role && (
            <span style={{
              fontSize: '0.8rem', padding: '4px 8px', borderRadius: 6,
              background: role === 'dueno' ? 'rgba(0, 212, 255, 0.2)' : 'rgba(255, 255, 255, 0.1)',
              color: role === 'dueno' ? 'var(--acc)' : 'var(--mut)',
              textTransform: 'uppercase', fontWeight: 'bold', letterSpacing: 1
            }}>
              {role === 'dueno' ? 'ADMIN' : 'OPERADOR'}
            </span>
          )}

          <div style={{
            fontFamily: "'DM Mono', monospace", fontSize: 13,
            color: 'var(--mut)', textAlign: 'right', lineHeight: 1.4
          }}>
            {fecha}<br />{hora}
          </div>
          <button
            onClick={handleLogoutClick}
            style={{
              width: 32, height: 32, borderRadius: '50%',
              background: 'rgba(0,212,255,0.1)',
              border: '1px solid rgba(0,212,255,0.25)',
              color: 'var(--acc)', fontSize: 13, fontWeight: 700,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', fontFamily: "'Bebas Neue', sans-serif", letterSpacing: 1
            }}
            title="Cerrar sesión"
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
      <nav style={{
        background: 'linear-gradient(90deg, var(--sur) 0%, var(--sur2) 50%, var(--sur) 100%)', 
        borderBottom: '1px solid rgba(0, 212, 255, 0.15)',
        boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
        display: 'flex', overflowX: 'auto', scrollbarWidth: 'none',
        padding: '0 0.5rem'
      }}>
        {navItems.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            style={({ isActive }) => ({
              background: isActive ? 'linear-gradient(0deg, rgba(0,212,255,0.1) 0%, transparent 100%)' : 'none',
              borderBottom: isActive ? '3px solid var(--acc)' : '3px solid transparent',
              color: isActive ? '#fff' : 'var(--mut)',
              textShadow: isActive ? '0 0 10px rgba(0,212,255,0.4)' : 'none',
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 14, fontWeight: isActive ? 700 : 600,
              padding: '16px 18px', cursor: 'pointer',
              whiteSpace: 'nowrap', textTransform: 'uppercase',
              letterSpacing: 0.8, textDecoration: 'none',
              display: 'block', transition: 'all 0.3s ease'
            })}
          >
            {item.label}
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
            background: 'linear-gradient(145deg, rgba(20,28,40,0.9), rgba(16,21,29,0.95))',
            border: '1px solid rgba(0, 212, 255, 0.2)',
            boxShadow: '0 10px 40px rgba(0,0,0,0.5), 0 0 20px rgba(0, 212, 255, 0.1)',
            borderRadius: 16, maxWidth: 420, width: '100%', textAlign: 'center', padding: '2.5rem'
          }}>
            <div style={{ fontSize: '3.5rem', marginBottom: '0.5rem', textShadow: '0 0 20px rgba(0,212,255,0.4)' }}>🚪</div>
            <h2 style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: '2.5rem', color: '#fff', margin: 0, letterSpacing: 1 }}>CERRAR SESIÓN</h2>
            <p style={{ color: 'var(--mut)', lineHeight: 1.6, margin: '1.5rem 0 2.5rem 0', fontSize: 15 }}>
              ¿Estás seguro de que deseas salir del panel? 
              <br/><br/>
              Requerirás el <strong style={{color:'var(--acc)'}}>PIN de Seguridad</strong> para volver a iniciar operaciones.
            </p>
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