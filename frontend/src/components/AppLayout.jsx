import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Toast from './Toast'
import { useState, useEffect } from 'react'

export default function AppLayout() {
  const { logout } = useAuth()
  const navigate = useNavigate()
  const [fecha, setFecha] = useState('')
  const [hora, setHora] = useState('')

  useEffect(() => {
    function tick() {
      const n = new Date()
      const dias = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb']
      const meses = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']
      setFecha(`${dias[n.getDay()]} ${n.getDate()} ${meses[n.getMonth()]}`)
      setHora(`${String(n.getHours()).padStart(2,'0')}:${String(n.getMinutes()).padStart(2,'0')}`)
    }
    tick()
    const id = setInterval(tick, 30000)
    return () => clearInterval(id)
  }, [])

  function handleLogout() {
    logout()
    navigate('/login')
  }

  const navItems = [
    { to: '/app/nuevo',         label: '＋ Nuevo' },
    { to: '/app/historial',     label: '📋 Historial' },
    { to: '/app/estadisticas',  label: '📊 Stats' },
    { to: '/app/vehiculos',     label: '🚗 Vehículos' },
    { to: '/app/empleados',     label: '👷 Empleados' },
    { to: '/app/config',        label: '⚙️ Config' },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>

      {/* HEADER */}
      <header style={{
        background: 'var(--sur)', borderBottom: '1px solid var(--brd)',
        padding: '0 1.2rem', display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', height: 54,
        position: 'sticky', top: 0, zIndex: 100
      }}>
        <div style={{
          fontFamily: "'Bebas Neue', sans-serif",
          fontSize: '1.4rem', letterSpacing: 2, color: 'var(--acc)',
          display: 'flex', alignItems: 'center', gap: 6
        }}>
          💧 <span style={{ color: 'var(--txt)' }}>AQUA</span>WASH
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            fontFamily: "'DM Mono', monospace", fontSize: 11,
            color: 'var(--mut)', textAlign: 'right', lineHeight: 1.5
          }}>
            {fecha}<br />{hora}
          </div>
          <button
            onClick={handleLogout}
            style={{
              width: 32, height: 32, borderRadius: '50%',
              background: 'rgba(0,212,255,0.1)',
              border: '1px solid rgba(0,212,255,0.25)',
              color: 'var(--acc)', fontSize: 11, fontWeight: 700,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', title: 'Cerrar sesión'
            }}
            title="Cerrar sesión"
          >
            LD
          </button>
        </div>
      </header>

      {/* NAV */}
      <nav style={{
        background: 'var(--sur)', borderBottom: '1px solid var(--brd)',
        display: 'flex', overflowX: 'auto', scrollbarWidth: 'none'
      }}>
        {navItems.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            style={({ isActive }) => ({
              background: 'none',
              border: 'none',
              borderBottom: isActive ? '2px solid var(--acc)' : '2px solid transparent',
              color: isActive ? 'var(--acc)' : 'var(--mut)',
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 11, fontWeight: 500,
              padding: '10px 13px', cursor: 'pointer',
              whiteSpace: 'nowrap', textTransform: 'uppercase',
              letterSpacing: 0.5, textDecoration: 'none',
              display: 'block', transition: 'all 0.2s'
            })}
          >
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* CONTENIDO */}
      <main style={{ flex: 1, padding: '1.2rem', maxWidth: 900, margin: '0 auto', width: '100%' }}>
        <Outlet />
      </main>

      <Toast />
    </div>
  )
}