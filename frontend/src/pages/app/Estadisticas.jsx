import { useState, useEffect } from 'react'
import { getResumen, getPorTipo } from '../../services/api'
import StatCard from '../../components/StatCard'
import { useToast } from '../../components/Toast'

const TIPOS  = { moto:'Moto', carro:'Carro', furgon:'Furgón', camion:'Camión', bus:'Bus' }
const ICONS  = { moto:'🏍',  carro:'🚗',   furgon:'🚐',    camion:'🚚',    bus:'🚌'  }

function fmt(n)  { return Number(n || 0).toLocaleString('es-CO') }
function fmtK(n) {
  n = Number(n || 0)
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M'
  if (n >= 1000)    return (n / 1000).toFixed(0) + 'k'
  return String(n)
}

export default function Estadisticas() {
  const toast = useToast()
  const [periodo, setPeriodo] = useState('hoy')
  const [resumen, setResumen] = useState(null)
  const [porTipo, setPorTipo] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function cargar() {
      setLoading(true)
      try {
        const [r, t] = await Promise.all([
          getResumen(periodo),
          getPorTipo(periodo)
        ])
        setResumen(r)
        setPorTipo(t)
      } catch (e) {
        toast?.('Error cargando estadísticas')
      } finally {
        setLoading(false)
      }
    }
    cargar()
  }, [periodo])

  const maxCount = Math.max(...porTipo.map(t => t.total), 1)

  return (
    <div>
      <div style={{ marginBottom: '1.2rem' }}>
        <h1 style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:'1.6rem', letterSpacing:2 }}>
          Estadísticas
        </h1>
      </div>

      {/* Tabs período */}
      <div className="tabs">
        {[
          { v:'hoy',    l:'Hoy' },
          { v:'semana', l:'Semana' },
          { v:'mes',    l:'Mes' },
          { v:'total',  l:'Total' },
        ].map(t => (
          <button key={t.v} className={`tab ${periodo === t.v ? 'active' : ''}`}
            onClick={() => setPeriodo(t.v)}>
            {t.l}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign:'center', padding:'3rem', color:'var(--mut)' }}>Cargando...</div>
      ) : (
        <>
          <div className="stats-grid">
            <StatCard label="Vehículos"  value={resumen?.vehiculos ?? 0}                color="blue" />
            <StatCard label="Ingresos"   value={`$${fmtK(resumen?.ingresos)}`}         color="green"  sub={`$${fmt(resumen?.ingresos)}`} />
            <StatCard label="Adicionales" value={`$${fmtK(resumen?.adicionales)}`}     color="orange" />
            <StatCard label="Promedio"   value={`$${fmtK(Math.round(resumen?.promedio ?? 0))}`} color="red" />
          </div>

          <div className="card">
            <div className="card-title">📈 Por Tipo de Vehículo</div>
            {porTipo.length === 0 ? (
              <div className="empty-state">Sin datos para este período</div>
            ) : (
              Object.keys(TIPOS).map(tipo => {
                const d = porTipo.find(t => t.tipo_vehiculo === tipo)
                const count   = d?.total    ?? 0
                const ingresos = d?.ingresos ?? 0
                return (
                  <div key={tipo} className="bar-tipo">
                    <span className="bar-lbl">{ICONS[tipo]} {TIPOS[tipo]}</span>
                    <div className="bar-bg">
                      <div className="bar-fill" style={{ width: `${(count / maxCount * 100).toFixed(0)}%` }} />
                    </div>
                    <span className="bar-cnt">{count}</span>
                    <span className="bar-rev">${fmt(ingresos)}</span>
                  </div>
                )
              })
            )}
          </div>
        </>
      )}
    </div>
  )
}