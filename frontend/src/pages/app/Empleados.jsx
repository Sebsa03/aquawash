import { useState, useEffect } from 'react'
import { getEmpleados, crearEmpleado, eliminarEmpleado, getRanking } from '../../services/api'
import { useToast } from '../../components/Toast'

function fmt(n) { return Number(n || 0).toLocaleString('es-CO') }

export default function Empleados() {
  const toast = useToast()
  const [empleados, setEmpleados] = useState([])
  const [ranking, setRanking]     = useState([])
  const [periodo, setPeriodo]     = useState('hoy')
  const [nuevo, setNuevo]         = useState('')
  const [loading, setLoading]     = useState(false)

  useEffect(() => { cargarEmpleados() }, [])
  useEffect(() => { cargarRanking()   }, [periodo])

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
      const data = await getRanking(periodo)
      setRanking(data)
    } catch (e) {
      toast?.('Error cargando ranking')
    }
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
      <div style={{ marginBottom:'1.2rem' }}>
        <h1 style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:'1.6rem', letterSpacing:2 }}>
          Empleados
        </h1>
      </div>

      {/* Gestionar */}
      <div className="card">
        <div className="card-title">👷 Gestionar Empleados</div>
        <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:'1rem' }}>
          <input className="input-base" style={{ flex:1, minWidth:180 }}
            placeholder="Nombre del empleado"
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
          <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
            {empleados.map(e => (
              <div key={e.id} style={{
                display:'flex', alignItems:'center', gap:6,
                background:'var(--sur2)', border:'1px solid var(--brd)',
                borderRadius:20, padding:'4px 12px 4px 14px'
              }}>
                <span style={{ fontSize:13 }}>{e.nombre}</span>
                <button className="del-btn" style={{ padding:'2px 4px' }}
                  onClick={() => handleEliminar(e.id, e.nombre)}>✕</button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Ranking */}
      <div className="card">
        <div className="card-title">🏆 Ranking de Empleados</div>
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

        {ranking.length === 0 ? (
          <div className="empty-state">Sin datos para este período</div>
        ) : (
          ranking.map((emp, i) => {
            const maxL = ranking[0]?.total_lavados || 1
            return (
              <div key={emp.empleado_id} className="rank-item">
                <div className={`rank-num ${medals[i] || ''}`}>{i + 1}</div>
                <div style={{ flex:1 }}>
                  <div style={{ fontWeight:600, fontSize:13 }}>{emp.empleado_nombre}</div>
                  <div style={{ fontSize:11, color:'var(--mut)' }}>${fmt(emp.total_ingresos)} generados</div>
                </div>
                <div className="rank-bar-bg">
                  <div className="rank-bar" style={{ width:`${(emp.total_lavados / maxL * 100).toFixed(0)}%` }} />
                </div>
                <div className="rank-count">{emp.total_lavados}</div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}