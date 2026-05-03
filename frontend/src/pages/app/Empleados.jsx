import { useState, useEffect } from 'react'
import { getEmpleados, crearEmpleado, eliminarEmpleado, getRankingDetalle } from '../../services/api'
import { VEHICLE_ICONS } from '../../utils/constants'
import { useToast } from '../../components/Toast'

function fmt(n) { return Number(n || 0).toLocaleString('es-CO') }

export default function Empleados() {
  const toast = useToast()
  const [empleados, setEmpleados] = useState([])
  const [ranking, setRanking]     = useState([])
  const [expData, setExpData]     = useState([])
  const [periodoRank, setPeriodoRank] = useState('mes')
  const [periodoExp, setPeriodoExp]   = useState('mes')
  const [nuevo, setNuevo]         = useState('')
  const [loading, setLoading]     = useState(false)
  const [selectedEmp, setSelectedEmp] = useState(null)

  const ICONS = VEHICLE_ICONS

  useEffect(() => { cargarEmpleados() }, [])
  useEffect(() => { cargarRanking()   }, [periodoRank])
  useEffect(() => { cargarExpediente() }, [periodoExp])

  async function cargarEmpleados() {
    try {
      const data = await getEmpleados()
      setEmpleados(data)
    } catch (e) {
      toast?.('Error cargando empleados')
    }
  }

  async function cargarRanking() {
    try {
      const data = await getRankingDetalle(periodoRank)
      const emps = agruparDetalles(data)
      setRanking(Object.values(emps).sort((a,b) => b.total_lavados - a.total_lavados))
    } catch (e) {
      toast?.('Error cargando ranking')
    }
  }

  async function cargarExpediente() {
    try {
      const data = await getRankingDetalle(periodoExp)
      const emps = agruparDetalles(data)
      setExpData(Object.values(emps))
    } catch (e) {}
  }

  function agruparDetalles(data) {
    const emps = {}
    data.forEach(d => {
      if (!emps[d.empleado_id]) {
        emps[d.empleado_id] = {
          empleado_id: d.empleado_id,
          empleado_nombre: d.empleado_nombre,
          total_ingresos: 0,
          total_lavados: 0,
          minutos_totales: 0,
          max_lavados_vehiculo: d.total_lavados,
          vehiculo_favorito: d.tipo_vehiculo,
          detalles: []
        }
      } else {
        if (d.total_lavados > emps[d.empleado_id].max_lavados_vehiculo) {
          emps[d.empleado_id].vehiculo_favorito = d.tipo_vehiculo
          emps[d.empleado_id].max_lavados_vehiculo = d.total_lavados
        }
      }
      emps[d.empleado_id].total_ingresos += d.total_ingresos
      emps[d.empleado_id].total_lavados  += d.total_lavados
      emps[d.empleado_id].minutos_totales += (d.minutos_promedio * d.total_lavados)
      emps[d.empleado_id].detalles.push(d)
    })
    // Calcular promedios globales
    Object.values(emps).forEach(emp => {
      emp.promedio_global = emp.total_lavados > 0 ? (emp.minutos_totales / emp.total_lavados) : 0
    })
    return emps
  }

  async function handleAgregar() {
    if (!nuevo.trim()) return
    setLoading(true)
    try {
      await crearEmpleado(nuevo.trim())
      setNuevo('')
      await cargarEmpleados()
      toast?.(`✔ ${nuevo} agregado`)
    } catch (e) {
      toast?.(`Error: ${e.message}`)
    } finally {
      setLoading(false)
    }
  }

  async function handleEliminar(id, nombre) {
    if (!confirm(`¿Desactivar a ${nombre}?`)) return
    try {
      await eliminarEmpleado(id)
      await cargarEmpleados()
      await cargarRanking()
      toast?.(`${nombre} desactivado`)
    } catch (e) {
      toast?.('Error al eliminar')
    }
  }

  const medals = ['gold', 'silver', 'bronze']

  return (
    <div>
      <div style={{ marginBottom:'1.5rem' }}>
        <h1 style={{ fontFamily:"'Outfit',sans-serif", fontSize:'clamp(1.6rem, 5vw, 2.2rem)', letterSpacing:0.5, margin: 0, color: 'var(--acc)', textShadow: '0 0 15px rgba(0,212,255,0.3)' }}>
          Empleados
        </h1>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '1.2rem' }}>
        
        {/* COL IZQUIERDA: Gestionar y Expediente */}
        <div>
          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <div className="card-title" style={{ margin: 0, marginBottom: '0.5rem' }}>👷 Directorio de Empleados</div>
            <p style={{ fontSize:13, color:'var(--mut)', marginBottom: '1rem', fontFamily: "'Inter', sans-serif" }}>Haz clic en un empleado para ver su rendimiento abajo.</p>
            
            <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:'1rem' }}>
              <input className="input-base" style={{ flex:1, minWidth:180 }}
                placeholder="Nuevo empleado..."
                value={nuevo}
                onChange={e => setNuevo(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAgregar()}
              />
              <button className="btn-primary" onClick={handleAgregar} disabled={loading}>
                {loading ? '...' : '+ Agregar'}
              </button>
            </div>

            {empleados.length === 0 ? (
              <p style={{ fontSize:13, color:'var(--mut)' }}>Sin empleados registrados</p>
            ) : (
              <div style={{ display:'flex', flexWrap:'wrap', gap:'0.8rem' }}>
                {empleados.map(e => {
                  const isSelected = selectedEmp === e.id
                  return (
                    <div key={e.id} style={{
                      display:'flex', alignItems:'center', gap:10, cursor: 'pointer',
                      background: isSelected ? 'rgba(0, 212, 255, 0.15)' : 'rgba(255,255,255,0.05)', 
                      border: `1px solid ${isSelected ? 'var(--acc)' : 'rgba(255,255,255,0.1)'}`,
                      borderRadius:30, padding:'6px 14px 6px 18px',
                      transition: 'all 0.2s', backdropFilter: 'blur(4px)'
                    }}
                    onClick={() => setSelectedEmp(isSelected ? null : e.id)}
                    onMouseEnter={ev => { if (!isSelected) ev.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)' }}
                    onMouseLeave={ev => { if (!isSelected) ev.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)' }}
                    >
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: isSelected ? 'var(--acc)' : 'var(--acc3)', boxShadow: `0 0 8px ${isSelected ? 'var(--acc)' : 'var(--acc3)'}` }} />
                      <span style={{ fontSize:14, fontWeight: '600', color: isSelected ? 'var(--acc)' : 'var(--txt)' }}>{e.nombre}</span>
                      <button className="del-btn" style={{ padding:'2px 4px', color: 'rgba(255,255,255,0.3)' }}
                        onClick={(ev) => { ev.stopPropagation(); handleEliminar(e.id, e.nombre); }}>✕</button>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* EXPEDIENTE SELECCIONADO */}
          {selectedEmp && (
            <div className="glass-panel" style={{ marginTop: '1.5rem', padding: '1.5rem', border: '1px solid var(--acc)', boxShadow: '0 0 20px rgba(0,212,255,0.15)' }}>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <div className="card-title" style={{ color: 'var(--acc)', margin: 0 }}>Expediente</div>
                <div className="tabs" style={{ background: 'transparent' }}>
                  {[
                    { v:'hoy',    l:'Hoy' },
                    { v:'semana', l:'Semana' },
                    { v:'mes',    l:'Mes' }
                  ].map(t => (
                    <button key={t.v} className={`tab ${periodoExp === t.v ? 'active' : ''}`}
                      style={{ padding: '4px 10px', fontSize: 11 }}
                      onClick={() => setPeriodoExp(t.v)}>
                      {t.l}
                    </button>
                  ))}
                </div>
              </div>

              {(() => {
                const empData = expData.find(r => r.empleado_id === selectedEmp)
                const empName = empleados.find(e => e.id === selectedEmp)?.nombre
                
                if (!empData) return (
                  <div style={{ textAlign: 'center', padding: '1rem', color: 'var(--mut)' }}>
                    <div style={{ fontSize: '1.2rem', color: 'var(--txt)', fontWeight: 'bold', marginBottom: 4 }}>{empName}</div>
                    No registra lavados o ingresos en el período seleccionado.
                  </div>
                )

                return (
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: '1.5rem' }}>
                      <div style={{ fontSize: '2rem', fontWeight: '900', color: '#fff', letterSpacing: 0.5 }}>{empData.empleado_nombre}</div>
                      {empData.vehiculo_favorito && (
                        <span title={`Especialista en ${empData.vehiculo_favorito}`} style={{ fontSize: '1.4rem', background: 'rgba(255,255,255,0.1)', padding: '4px 8px', borderRadius: 8 }}>
                          {ICONS[empData.vehiculo_favorito]}
                        </span>
                      )}
                      <span style={{ fontSize: 13, color: 'var(--mut)', marginLeft: 'auto', background: 'rgba(0,0,0,0.2)', padding: '6px 12px', borderRadius: 20 }}>
                        ⏱️ {Math.round(empData.promedio_global)} mins prom.
                      </span>
                    </div>
                    
                    <div style={{ display: 'flex', gap: '2rem', marginBottom: '1.5rem', background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: 8 }}>
                      <div>
                        <div style={{ fontSize: 11, color: 'var(--mut)', textTransform: 'uppercase' }}>Dinero Generado</div>
                        <div style={{ fontSize: '1.4rem', color: 'var(--acc3)', fontWeight: 'bold' }}>${fmt(empData.total_ingresos)}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: 11, color: 'var(--mut)', textTransform: 'uppercase' }}>Total Lavados</div>
                        <div style={{ fontSize: '1.4rem', color: '#fff', fontWeight: 'bold' }}>{empData.total_lavados}</div>
                      </div>
                    </div>

                    <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
                       <thead style={{ background: 'transparent' }}>
                         <tr style={{ color: 'var(--mut)', textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                           <th style={{ padding: '8px 0', border: 'none' }}>Clase de Vehículo</th>
                           <th style={{ textAlign: 'center', border: 'none' }}>Cantidad</th>
                           <th style={{ textAlign: 'right', border: 'none' }}>⏱️ T. Promedio</th>
                         </tr>
                       </thead>
                       <tbody>
                         {empData.detalles.map(d => (
                           <tr key={d.tipo_vehiculo}>
                             <td style={{ padding: '10px 0', fontWeight: 'bold', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                               <span style={{ marginRight: 6 }}>{ICONS[d.tipo_vehiculo]}</span> 
                               <span style={{ textTransform: 'capitalize' }}>{d.tipo_vehiculo}</span>
                             </td>
                             <td style={{ textAlign: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                               <span style={{ background: 'rgba(255,255,255,0.1)', padding: '2px 8px', borderRadius: 12 }}>{d.total_lavados}</span>
                             </td>
                             <td style={{ textAlign: 'right', borderBottom: '1px solid rgba(255,255,255,0.05)', color: d.minutos_promedio > 50 ? 'var(--red)' : 'var(--mut)' }}>
                               {Math.round(d.minutos_promedio)} mins
                             </td>
                           </tr>
                         ))}
                       </tbody>
                    </table>
                  </div>
                )
              })()}
            </div>
          )}
        </div>

        {/* COL DERECHA: Ranking Limpio */}
        <div>
          <div className="glass-panel" style={{ height: '100%', padding: '1.5rem' }}>
            <div className="card-title" style={{ margin: 0, marginBottom: '1rem' }}>🏆 Ranking Global</div>
            <div className="tabs">
              {[
                { v:'hoy',    l:'Hoy' },
                { v:'semana', l:'Última Semana' },
                { v:'mes',    l:'Mes' },
                { v:'total',  l:'Total' },
              ].map(t => (
                <button key={t.v} className={`tab ${periodoRank === t.v ? 'active' : ''}`}
                  onClick={() => setPeriodoRank(t.v)}>
                  {t.l}
                </button>
              ))}
            </div>

            {ranking.length === 0 ? (
              <div className="empty-state" style={{ marginTop: '2rem' }}>Sin datos para este período</div>
            ) : (
              <div style={{ marginTop: '1rem' }}>
                {ranking.map((emp, i) => {
                  const maxL = ranking[0]?.total_lavados || 1
                  return (
                    <div key={emp.empleado_id} className="rank-item" style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 12, border: 'none', marginBottom: '0.8rem' }}>
                      <div className={`rank-num ${medals[i] || ''}`}>{i + 1}</div>
                      <div style={{ flex:1, display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ fontWeight:800, fontSize:19, color: '#fff', letterSpacing: 0.5 }}>{emp.empleado_nombre}</div>
                          {emp.vehiculo_favorito && (
                            <span title={`Especialista en ${emp.vehiculo_favorito}`} style={{ fontSize: '1rem', background: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: 6 }}>
                              {ICONS[emp.vehiculo_favorito]}
                            </span>
                          )}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <span style={{ fontSize:13, color:'var(--mut)' }}>💰 ${fmt(emp.total_ingresos)} generados</span>
                          <span style={{ fontSize:13, color:'var(--mut)' }}>⏱️ {Math.round(emp.promedio_global)} mins prom.</span>
                        </div>
                      </div>
                      <div className="rank-bar-bg" style={{ background: 'rgba(255,255,255,0.1)' }}>
                        <div className="rank-bar" style={{ width:`${(emp.total_lavados / maxL * 100).toFixed(0)}%`, background: 'linear-gradient(90deg, rgba(0,212,255,0.5) 0%, rgba(0,212,255,1) 100%)', boxShadow: '0 0 10px rgba(0,212,255,0.5)' }} />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 44 }}>
                        <div className="rank-count" style={{textShadow: '0 0 10px rgba(0,212,255,0.2)'}}>{emp.total_lavados}</div>
                        <div style={{ fontSize: 9, color: 'var(--mut)', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 2 }}>Lavados</div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

      </div>

      <style>{`
        @media (max-width: 900px) {
          div[style*="grid-template-columns"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  )
}