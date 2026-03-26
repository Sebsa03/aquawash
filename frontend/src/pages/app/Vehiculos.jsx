import { useState, useEffect } from 'react'
import { getPlacas } from '../../services/api'
import { useToast } from '../../components/Toast'
import Badge from '../../components/Badge'

function fmt(n) { return Number(n || 0).toLocaleString('es-CO') }

export default function Vehiculos() {
  const toast = useToast()
  const [vehiculos, setVehiculos] = useState([])
  const [buscar, setBuscar]       = useState('')
  const [loading, setLoading]     = useState(true)

  useEffect(() => {
    async function cargar() {
      setLoading(true)
      try {
        const data = await getPlacas()
        setVehiculos(data)
      } catch (e) {
        toast?.('Error cargando vehículos')
      } finally {
        setLoading(false)
      }
    }
    cargar()
  }, [])

  const filtrados = vehiculos.filter(v =>
    v.placa.toLowerCase().includes(buscar.toLowerCase())
  )

  return (
    <div>
      <div style={{ marginBottom:'1.2rem' }}>
        <h1 style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:'1.6rem', letterSpacing:2 }}>
          Vehículos
        </h1>
        <p style={{ fontSize:13, color:'var(--mut)', marginTop:4 }}>
          Historial acumulado por placa — sin datos personales del propietario
        </p>
      </div>

      <div className="search-bar">
        <input placeholder="Buscar placa..." value={buscar}
          onChange={e => setBuscar(e.target.value)} />
      </div>

      {loading ? (
        <div style={{ textAlign:'center', padding:'3rem', color:'var(--mut)' }}>Cargando...</div>
      ) : filtrados.length === 0 ? (
        <div className="empty-state">🚗 Sin vehículos registrados</div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Placa</th>
                <th>Tipo</th>
                <th>Lavados</th>
                <th>Primer visita</th>
                <th>Último lavado</th>
                <th>Total gastado</th>
              </tr>
            </thead>
            <tbody>
              {filtrados.map(v => (
                <tr key={v.placa}>
                  <td>
                    <span className="mono" style={{ fontWeight:700 }}>{v.placa}</span>
                    {v.total_lavados >= 5 && (
                      <span className="frecuente-badge">★ FRECUENTE</span>
                    )}
                  </td>
                  <td><Badge tipo={v.tipo_vehiculo} /></td>
                  <td>
                    <span style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:'1.1rem', color:'var(--acc)' }}>
                      {v.total_lavados}
                    </span>
                  </td>
                  <td className="mono text-muted" style={{ fontSize:11 }}>{v.primer_lavado}</td>
                  <td className="mono text-muted" style={{ fontSize:11 }}>{v.ultimo_lavado}</td>
                  <td className="mono text-green" style={{ fontWeight:600 }}>${fmt(v.total_gastado)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}