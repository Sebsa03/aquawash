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
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
          {filtrados.map(v => (
            <div key={v.placa} className="card" style={{ padding: '1.2rem', marginBottom: 0, position: 'relative', overflow: 'hidden' }}>
              {v.total_lavados >= 5 && (
                <div style={{ position: 'absolute', top: 0, right: 0, background: 'rgba(255,215,0,0.2)', color: '#ffd700', padding: '4px 12px', fontSize: '10px', fontWeight: 'bold', borderBottomLeftRadius: '8px' }}>
                  ★ FRECUENTE
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <span className="mono" style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fff', textShadow: '0 0 10px rgba(255,255,255,0.2)' }}>{v.placa}</span>
                <Badge tipo={v.tipo_vehiculo} />
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '1rem' }}>
                <div>
                  <div style={{ fontSize: '10px', color: 'var(--mut)', textTransform: 'uppercase', letterSpacing: 1 }}>Lavados Totales</div>
                  <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:'1.8rem', color:'var(--acc)' }}>{v.total_lavados}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '10px', color: 'var(--mut)', textTransform: 'uppercase', letterSpacing: 1 }}>Inversión</div>
                  <div style={{ fontFamily:"'DM Mono',monospace", fontSize:'1.2rem', color:'var(--acc3)', fontWeight: 'bold' }}>${fmt(v.total_gastado)}</div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem', fontSize: '10px', color: 'rgba(255,255,255,0.3)', fontFamily: "'DM Mono', monospace" }}>
                <span>1ra vez: {v.primer_lavado}</span>
                <span>Última: {v.ultimo_lavado}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}