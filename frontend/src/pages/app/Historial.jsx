import { useState, useEffect, useCallback } from 'react'
import { getLavados, eliminarLavado } from '../../services/api'
import { useToast } from '../../components/Toast'
import Badge from '../../components/Badge'

function fmt(n) { return Number(n || 0).toLocaleString('es-CO') }

export default function Historial() {
  const toast = useToast()
  const [lavados, setLavados] = useState([])
  const [loading, setLoading] = useState(true)
  const [buscar, setBuscar]   = useState('')
  const [tipo, setTipo]       = useState('')
  const [periodo, setPeriodo] = useState('hoy')

  const cargar = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getLavados({ periodo, ...(tipo && { tipo }) })
      setLavados(data)
    } catch (e) {
      toast?.('Error cargando historial')
    } finally {
      setLoading(false)
    }
  }, [periodo, tipo])

  useEffect(() => { cargar() }, [cargar])

  async function handleEliminar(id) {
    if (!confirm('¿Eliminar este registro?')) return
    try {
      await eliminarLavado(id)
      setLavados(l => l.filter(x => x.id !== id))
      toast?.('Registro eliminado')
    } catch (e) {
      toast?.('Error al eliminar')
    }
  }

  const filtrados = lavados.filter(l => {
    if (!buscar) return true
    const q = buscar.toLowerCase()
    return l.placa.toLowerCase().includes(q) ||
           (l.empleado_id && String(l.empleado_id).includes(q))
  })

  return (
    <div>
      <div style={{ marginBottom: '1.2rem' }}>
        <h1 style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: '1.6rem', letterSpacing: 2 }}>
          Historial de Lavados
        </h1>
      </div>

      {/* Filtros */}
      <div className="search-bar">
        <input
          placeholder="Buscar por placa..."
          value={buscar}
          onChange={e => setBuscar(e.target.value)}
        />
        <select value={tipo} onChange={e => setTipo(e.target.value)}>
          <option value="">Todos los tipos</option>
          <option value="moto">Moto</option>
          <option value="carro">Carro</option>
          <option value="furgon">Furgón</option>
          <option value="camion">Camión</option>
          <option value="bus">Bus</option>
        </select>
      </div>

      {/* Tabs período */}
      <div className="tabs" style={{ marginBottom: '1rem' }}>
        {[
          { v: 'hoy',    l: 'Hoy' },
          { v: 'semana', l: 'Semana' },
          { v: 'mes',    l: 'Mes' },
          { v: 'todo',   l: 'Todo' },
        ].map(t => (
          <button key={t.v} className={`tab ${periodo === t.v ? 'active' : ''}`}
            onClick={() => setPeriodo(t.v)}>
            {t.l}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--mut)' }}>Cargando...</div>
      ) : filtrados.length === 0 ? (
        <div className="empty-state">🔍 Sin registros para mostrar</div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Hora</th>
                <th>Tipo</th>
                <th>Placa</th>
                <th>Adicionales</th>
                <th>Total</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtrados.map((l, i) => (
                <tr key={l.id}>
                  <td className="mono text-muted">{filtrados.length - i}</td>
                  <td className="mono">{String(l.hora_ingreso).slice(0, 5)}</td>
                  <td><Badge tipo={l.tipo_vehiculo} /></td>
                  <td className="mono" style={{ fontWeight: 700 }}>{l.placa}</td>
                  <td style={{ fontSize: 11, color: 'var(--mut)', maxWidth: 140 }}>
                    {Array.isArray(l.adicionales_aplicados) && l.adicionales_aplicados.length > 0
                      ? l.adicionales_aplicados.map(a => a.nombre).join(', ')
                      : '—'}
                  </td>
                  <td className="mono text-green" style={{ fontWeight: 700 }}>
                    ${fmt(l.precio_total)}
                  </td>
                  <td>
                    <button className="del-btn" onClick={() => handleEliminar(l.id)}>✕</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Resumen pie de tabla */}
      {filtrados.length > 0 && (
        <div style={{ marginTop: 10, display: 'flex', gap: 20, fontSize: 12, color: 'var(--mut)', flexWrap: 'wrap' }}>
          <span>{filtrados.length} registros</span>
          <span style={{ color: 'var(--acc3)', fontWeight: 600 }}>
            Total: ${fmt(filtrados.reduce((s, l) => s + l.precio_total, 0))}
          </span>
        </div>
      )}
    </div>
  )
}