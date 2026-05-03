import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getEstadisticasHoy, getRanking } from '../../services/api'
import StatCard from '../../components/StatCard'
import { useToast } from '../../components/Toast'
import { VEHICLE_TYPES as TIPOS, VEHICLE_ICONS as ICONS } from '../../utils/constants'

function fmt(n) { return Number(n || 0).toLocaleString('es-CO') }
function fmtK(n) {
  n = Number(n || 0)
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M'
  if (n >= 1000) return (n / 1000).toFixed(0) + 'k'
  return String(n)
}

export default function Dashboard() {
  const navigate = useNavigate()
  const toast = useToast()
  const [stats, setStats] = useState(null)
  const [ranking, setRanking] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function cargar() {
      try {
        const [s, r] = await Promise.all([
          getEstadisticasHoy(),
          getRanking('hoy')
        ])
        setStats(s)
        setRanking(r)
      } catch (e) {
        toast?.('Error cargando datos')
      } finally {
        setLoading(false)
      }
    }
    cargar()
  }, [])

  if (loading) return (
    <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--mut)' }}>
      Cargando...
    </div>
  )

  const medals = ['gold', 'silver', 'bronze']

  return (
    <div>
      {/* Bienvenida */}
      <div style={{ marginBottom: '1.2rem' }}>
        <h1 style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: '1.6rem', letterSpacing: 2, marginBottom: 4 }}>
          Resumen del día
        </h1>
        <p style={{ fontSize: 13, color: 'var(--mut)' }}>
          {new Date().toLocaleDateString('es-CO', { weekday:'long', year:'numeric', month:'long', day:'numeric' })}
        </p>
      </div>

      {/* Stats del día */}
      <div className="stats-grid">
        <StatCard label="Vehículos hoy"  value={stats?.vehiculos_hoy  ?? 0}          color="blue" />
        <StatCard label="Ingresos hoy"   value={`$${fmtK(stats?.ingresos_hoy)}`}    color="green" sub={`$${fmt(stats?.ingresos_hoy)}`} />
        <StatCard label="Adicionales"    value={`$${fmtK(stats?.adicionales_hoy)}`} color="orange" />
        <StatCard label="Promedio"       value={`$${fmtK(Math.round(stats?.promedio_hoy ?? 0))}`} color="red" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>

        {/* Accesos rápidos */}
        <div className="card">
          <div className="card-title">⚡ Acceso Rápido</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              { icon:'🚿', label:'Registrar nuevo lavado', path:'/app/nuevo', color:'var(--acc)' },
              { icon:'📋', label:'Ver historial de hoy',   path:'/app/historial', color:'var(--acc2)' },
              { icon:'📊', label:'Ver estadísticas',       path:'/app/estadisticas', color:'var(--acc3)' },
              { icon:'👷', label:'Gestionar empleados',    path:'/app/empleados', color:'#c864ff' },
            ].map(item => (
              <button key={item.path}
                onClick={() => navigate(item.path)}
                style={{
                  background: 'var(--sur2)', border: '1px solid var(--brd)',
                  borderRadius: 8, padding: '10px 14px',
                  display: 'flex', alignItems: 'center', gap: 10,
                  cursor: 'pointer', transition: 'all 0.15s',
                  textAlign: 'left', color: 'var(--txt)'
                }}
                onMouseEnter={e => e.currentTarget.style.borderColor = item.color}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--brd)'}
              >
                <span style={{ fontSize: 16 }}>{item.icon}</span>
                <span style={{ fontSize: 13 }}>{item.label}</span>
                <span style={{ marginLeft: 'auto', color: 'var(--mut)', fontSize: 12 }}>→</span>
              </button>
            ))}
          </div>
        </div>

        {/* Ranking del día */}
        <div className="card">
          <div className="card-title">🏆 Ranking Hoy</div>
          {ranking.length === 0 ? (
            <div className="empty-state">Sin lavados registrados hoy</div>
          ) : (
            <div>
              {ranking.map((emp, i) => (
                <div key={emp.empleado_id} className="rank-item">
                  <div className={`rank-num ${medals[i] || ''}`}>{i + 1}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{emp.empleado_nombre}</div>
                    <div style={{ fontSize: 11, color: 'var(--mut)' }}>${fmt(emp.total_ingresos)}</div>
                  </div>
                  <div className="rank-bar-bg">
                    <div className="rank-bar" style={{ width: `${ranking[0]?.total_lavados ? (emp.total_lavados / ranking[0].total_lavados * 100).toFixed(0) : 0}%` }} />
                  </div>
                  <div className="rank-count">{emp.total_lavados}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}