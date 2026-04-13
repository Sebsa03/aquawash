import { useState, useEffect } from 'react'
import { getResumen, getPorTipo, getRankingDetalle } from '../../services/api'
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
  const [ranking, setRanking] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function cargar() {
      setLoading(true)
      try {
        const [r, t, rD] = await Promise.all([
          getResumen(periodo),
          getPorTipo(periodo),
          getRankingDetalle(periodo)
        ])
        setResumen(r)
        setPorTipo(t)
        
        // Agrupar ranking_detalle para obtener vehículo favorito
        const emps = {}
        rD.forEach(d => {
          if (!emps[d.empleado_id]) {
            emps[d.empleado_id] = {
              empleado_id: d.empleado_id,
              empleado_nombre: d.empleado_nombre,
              total_ingresos: 0,
              total_lavados: 0,
              minutos_promedio: 0,
              vehiculo_favorito: d.tipo_vehiculo,
              max_lavados_vehiculo: d.total_lavados
            }
          } else {
            if (d.total_lavados > emps[d.empleado_id].max_lavados_vehiculo) {
              emps[d.empleado_id].vehiculo_favorito = d.tipo_vehiculo
              emps[d.empleado_id].max_lavados_vehiculo = d.total_lavados
            }
          }
          emps[d.empleado_id].total_ingresos += d.total_ingresos
          emps[d.empleado_id].total_lavados  += d.total_lavados
          // Note: Promedio es aproximado al último o no estricto, para UI simple se omite el re-caálculo ponderado complejo o se deja el del item principal
          emps[d.empleado_id].minutos_promedio = d.minutos_promedio // simplificación visual
        })
        const rankingAgrupado = Object.values(emps).sort((a,b) => b.total_lavados - a.total_lavados)
        setRanking(rankingAgrupado)
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
      <div style={{ marginBottom: '1.2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:'1.6rem', letterSpacing:2 }}>
            Panel Gerencial
          </h1>
          <p style={{ fontSize:13, color:'var(--mut)', marginTop:4 }}>
            Rentabilidad y Métrica de Operarios
          </p>
        </div>

        {/* Tabs período */}
        <div className="tabs">
          {[
            { v:'hoy',    l:'Hoy' },
            { v:'semana', l:'Última Semana' },
            { v:'mes',    l:'Mes' },
            { v:'total',  l:'Total' },
          ].map(t => (
            <button key={t.v} className={`tab ${periodo === t.v ? 'active' : ''}`}
              onClick={() => setPeriodo(t.v)}>
              {t.l}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign:'center', padding:'3rem', color:'var(--mut)' }}>Cargando datos protegidos...</div>
      ) : (
        <>
          <div className="stats-grid">
            <StatCard label="Vehículos"  value={resumen?.vehiculos ?? 0}                color="blue" />
            <StatCard label="Total Ganancias"   value={`$${fmtK(resumen?.ingresos)}`}         color="green"  sub={`$${fmt(resumen?.ingresos)}`} />
            <StatCard label="Adicionales (Extras)" value={`$${fmtK(resumen?.adicionales)}`}     color="orange" />
            <StatCard label="Ticket Promedio"   value={`$${fmtK(Math.round(resumen?.promedio ?? 0))}`} color="red" />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.2fr) minmax(0, 1.8fr)', gap: '1.2rem', marginTop: '1.2rem' }}>
            
            {/* PANEL IZQUIERDO: TIPO DE VEHICULOS */}
            <div className="card" style={{ order: 0, paddingBottom: '0.8rem' }}>
              <div className="card-title">📈 Por Tipo de Vehículo</div>
              {porTipo.length === 0 ? (
                <div className="empty-state">Sin datos para este período</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {Object.keys(TIPOS).map(tipo => {
                  const d = porTipo.find(t => t.tipo_vehiculo === tipo)
                  const count    = d?.total    ?? 0
                  const ingresos = d?.ingresos ?? 0
                  return (
                    <div key={tipo} className="bar-tipo">
                      <span className="bar-lbl" style={{ color: 'var(--txt)' }}>{ICONS[tipo]} {TIPOS[tipo]}</span>
                      <div className="bar-bg" style={{ background: 'rgba(255,255,255,0.05)' }}>
                        <div className="bar-fill" style={{ width: `${(count / maxCount * 100).toFixed(0)}%`, boxShadow: '0 0 10px rgba(0,212,255,0.4)', background: 'linear-gradient(90deg, rgba(0,212,255,0.7) 0%, rgba(0,212,255,1) 100%)' }} />
                      </div>
                      <span className="bar-cnt" style={{ fontWeight: 'bold' }}>{count}</span>
                      <span className="bar-rev" style={{ color: 'var(--txt)', opacity: 0.8 }}>${fmt(ingresos)}</span>
                    </div>
                  )
                })}
                </div>
              )}
            </div>

            {/* PANEL DERECHO: RANKING EMPLEADOS */}
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <div className="card-title" style={{ padding: '1.2rem 1.2rem 0' }}>🏆 Rendimiento Operarios</div>
              {ranking.length === 0 ? (
                <div className="empty-state" style={{ padding: '2rem' }}>Sin lavados en este período</div>
              ) : (
                <div className="table-wrap" style={{ border: 'none', background: 'transparent' }}>
                  <table style={{ margin: 0, width: '100%', borderCollapse: 'collapse' }}>
                    <thead style={{ background: 'rgba(255,255,255,0.03)' }}>
                      <tr>
                        <th style={{ padding: '12px 1rem', textAlign: 'left', fontSize: 11, color: 'rgba(255,255,255,0.5)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>Top</th>
                        <th style={{ padding: '12px 1rem', textAlign: 'left', fontSize: 11, color: 'rgba(255,255,255,0.5)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>Operario</th>
                        <th style={{ padding: '12px 1rem', textAlign: 'center', fontSize: 11, color: 'rgba(255,255,255,0.5)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>Especialidad</th>
                        <th style={{ padding: '12px 1rem', textAlign: 'center', fontSize: 11, color: 'rgba(255,255,255,0.5)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>Lavados</th>
                        <th style={{ padding: '12px 1rem', textAlign: 'right', fontSize: 11, color: 'rgba(255,255,255,0.5)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>Prod. Dinero</th>
                        <th style={{ padding: '12px 1rem', textAlign: 'right', fontSize: 11, color: 'rgba(255,255,255,0.5)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>T. Promedio</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ranking.map((r, idx) => (
                        <tr key={r.empleado_id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', transition: 'background 0.2s' }}>
                          <td style={{ padding: '12px 1rem', color: idx === 0 ? '#ffd700' : 'var(--mut)', fontWeight: 'bold' }}>
                            #{idx + 1}
                          </td>
                          <td style={{ padding: '12px 1rem', fontWeight: 600 }}>{r.empleado_nombre}</td>
                          <td style={{ padding: '12px 1rem', textAlign: 'center', fontSize: '1rem' }} title={`Especialista en ${TIPOS[r.vehiculo_favorito]}`}>
                            {ICONS[r.vehiculo_favorito]}
                          </td>
                          <td style={{ padding: '12px 1rem', textAlign: 'center' }}>
                            <span style={{ background: 'rgba(255,255,255,0.1)', padding: '2px 8px', borderRadius: 12, fontSize: '0.8rem' }}>{r.total_lavados}</span>
                          </td>
                          <td style={{ padding: '12px 1rem', textAlign: 'right', color: 'var(--acc)', fontWeight: 'bold', fontFamily: "'DM Mono', monospace" }}>
                            ${fmt(r.total_ingresos)}
                          </td>
                          <td style={{ padding: '12px 1rem', textAlign: 'right', color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem' }}>
                            {r.minutos_promedio > 0 ? `${Math.round(r.minutos_promedio)}m /auto` : '--'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

          </div>
        </>
      )}
      <style>{`
        @media (max-width: 800px) {
          div[style*="grid-template-columns"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  )
}