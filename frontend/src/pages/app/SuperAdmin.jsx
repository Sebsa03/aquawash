import { useState, useEffect } from 'react'
import { getTodosLavaderos, actualizarEstadoLavadero } from '../../services/api'
import Toast, { useToast } from '../../components/Toast'

export default function SuperAdmin() {
  const toast = useToast()
  const [lavaderos, setLavaderos] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    cargarLavaderos()
  }, [])

  async function cargarLavaderos() {
    setLoading(true)
    try {
      const data = await getTodosLavaderos()
      setLavaderos(data)
    } catch (e) {
      toast?.('Error cargando lavaderos: ' + e.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleCambioEstado(id, nuevoEstado) {
    try {
      await actualizarEstadoLavadero(id, nuevoEstado)
      toast?.('✔ Estado actualizado')
      cargarLavaderos()
    } catch (e) {
      toast?.('Error actualizando estado')
    }
  }

  if (loading) return <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--mut)' }}>Cargando Panel Maestro...</div>

  return (
    <div style={{ paddingBottom: '2rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontFamily: "'Outfit',sans-serif", fontSize: 'clamp(1.8rem, 5vw, 2.4rem)', color: '#ff3b30', margin: 0, textShadow: '0 0 15px rgba(255,59,48,0.3)' }}>
          👑 Consola Super Admin
        </h1>
        <p style={{ color: 'var(--mut)', marginTop: 4 }}>Control global de Inquilinos (Lavaderos)</p>
      </div>

      <div className="glass-panel" style={{ padding: '1rem', overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--brd)', color: 'var(--mut)' }}>
              <th style={{ padding: '1rem' }}>ID</th>
              <th style={{ padding: '1rem' }}>Nombre</th>
              <th style={{ padding: '1rem' }}>Ciudad</th>
              <th style={{ padding: '1rem' }}>Email / Tel</th>
              <th style={{ padding: '1rem' }}>Plan</th>
              <th style={{ padding: '1rem' }}>Estado</th>
              <th style={{ padding: '1rem' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {lavaderos.map(l => (
              <tr key={l.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <td style={{ padding: '1rem', color: 'var(--mut)' }}>#{l.id}</td>
                <td style={{ padding: '1rem', fontWeight: 'bold' }}>{l.nombre}</td>
                <td style={{ padding: '1rem' }}>{l.ciudad}</td>
                <td style={{ padding: '1rem' }}>
                  <div>{l.email}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--mut)' }}>{l.telefono}</div>
                </td>
                <td style={{ padding: '1rem' }}>
                  <span style={{ background: 'rgba(255,255,255,0.1)', padding: '2px 8px', borderRadius: 12, fontSize: '0.8rem' }}>{l.plan}</span>
                </td>
                <td style={{ padding: '1rem' }}>
                  <span style={{ 
                    color: l.estado_suscripcion === 'activo' ? '#00e676' : l.estado_suscripcion === 'suspendido' ? '#ff3b30' : 'var(--acc2)',
                    fontWeight: 'bold', textTransform: 'uppercase', fontSize: '0.8rem'
                  }}>
                    {l.estado_suscripcion}
                  </span>
                </td>
                <td style={{ padding: '1rem' }}>
                  <select 
                    value={l.estado_suscripcion} 
                    onChange={e => handleCambioEstado(l.id, e.target.value)}
                    style={{ background: 'var(--sur2)', color: 'var(--txt)', border: '1px solid var(--brd)', borderRadius: 4, padding: '4px' }}
                  >
                    <option value="activo">Activo</option>
                    <option value="trial">Trial</option>
                    <option value="suspendido">Suspender</option>
                    <option value="cancelado">Cancelar</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Toast />
    </div>
  )
}
