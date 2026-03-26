import { useState, useEffect } from 'react'
import {
  getAdicionales, crearAdicional,
  actualizarAdicional, eliminarAdicional
} from '../../services/api'
import { useToast } from '../../components/Toast'

const TIPOS = { moto:'Moto', carro:'Carro', furgon:'Furgón', camion:'Camión', bus:'Bus' }
const ICONS = { moto:'🏍',  carro:'🚗',   furgon:'🚐',    camion:'🚚',    bus:'🚌'  }

export default function Config() {
  const toast = useToast()
  const [adicionales, setAdicionales] = useState([])
  const [nuevoNombre, setNuevoNombre] = useState('')
  const [nuevoPrecio, setNuevoPrecio] = useState('')
  const [editPrecios, setEditPrecios] = useState({})
  const [loading, setLoading]         = useState(false)

  useEffect(() => { cargarAdicionales() }, [])

  async function cargarAdicionales() {
    try {
      const data = await getAdicionales()
      setAdicionales(data)
      const precios = {}
      data.forEach(a => { precios[a.id] = a.precio })
      setEditPrecios(precios)
    } catch (e) {
      toast?.('Error cargando adicionales')
    }
  }

  async function handleAgregarAdicional() {
    if (!nuevoNombre.trim()) return toast?.('Ingresa el nombre')
    setLoading(true)
    try {
      await crearAdicional(nuevoNombre.trim(), parseInt(nuevoPrecio) || 0)
      setNuevoNombre('')
      setNuevoPrecio('')
      await cargarAdicionales()
      toast?.(`✔ "${nuevoNombre}" agregado`)
    } catch (e) {
      toast?.(`Error: ${e.message}`)
    } finally {
      setLoading(false)
    }
  }

  async function handleActualizarPrecio(id) {
    try {
      await actualizarAdicional(id, parseInt(editPrecios[id]) || 0)
      toast?.('✔ Precio actualizado')
    } catch (e) {
      toast?.('Error al actualizar')
    }
  }

  async function handleEliminarAdicional(id, nombre) {
    if (!confirm(`¿Eliminar "${nombre}"?`)) return
    try {
      await eliminarAdicional(id)
      await cargarAdicionales()
      toast?.(`"${nombre}" eliminado`)
    } catch (e) {
      toast?.('Error al eliminar')
    }
  }

  return (
    <div>
      <div style={{ marginBottom:'1.2rem' }}>
        <h1 style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:'1.6rem', letterSpacing:2 }}>
          Configuración
        </h1>
      </div>

      {/* Precios base */}
      <div className="card">
        <div className="card-title">💰 Precios Base por Tipo de Vehículo</div>
        <p style={{ fontSize:12, color:'var(--mut)', marginBottom:14 }}>
          Los precios base se configuran directamente en la base de datos.
          Próximamente editable desde aquí.
        </p>
        {Object.keys(TIPOS).map(tipo => (
          <div key={tipo} style={{
            display:'flex', alignItems:'center', justifyContent:'space-between',
            padding:'8px 0', borderBottom:'1px solid var(--brd)', fontSize:13
          }}>
            <span>{ICONS[tipo]} {TIPOS[tipo]}</span>
            <span className="mono text-accent">Configurable</span>
          </div>
        ))}
      </div>

      {/* Adicionales */}
      <div className="card">
        <div className="card-title">➕ Servicios Adicionales</div>

        {adicionales.length === 0 ? (
          <p style={{ fontSize:13, color:'var(--mut)', marginBottom:14 }}>Sin adicionales configurados</p>
        ) : (
          <div style={{ marginBottom:14 }}>
            {adicionales.map(a => (
              <div key={a.id} style={{
                display:'flex', alignItems:'center', justifyContent:'space-between',
                padding:'8px 0', borderBottom:'1px solid var(--brd)', gap:10, flexWrap:'wrap'
              }}>
                <span style={{ fontSize:13, flex:1 }}>{a.nombre}</span>
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <input
                    type="number"
                    value={editPrecios[a.id] ?? a.precio}
                    onChange={e => setEditPrecios(p => ({ ...p, [a.id]: e.target.value }))}
                    onBlur={() => handleActualizarPrecio(a.id)}
                    style={{
                      background:'var(--sur2)', border:'1px solid var(--brd)',
                      borderRadius:6, color:'var(--txt)',
                      fontFamily:"'DM Mono',monospace", fontSize:12,
                      padding:'5px 8px', width:100, outline:'none', textAlign:'right'
                    }}
                  />
                  <button className="del-btn"
                    onClick={() => handleEliminarAdicional(a.id, a.nombre)}>✕</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Agregar nuevo */}
        <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginTop:8 }}>
          <input className="input-base" style={{ flex:2, minWidth:130 }}
            placeholder="Nombre del adicional"
            value={nuevoNombre} onChange={e => setNuevoNombre(e.target.value)} />
          <input className="input-base" type="number" style={{ flex:1, minWidth:90, textAlign:'right' }}
            placeholder="Precio"
            value={nuevoPrecio} onChange={e => setNuevoPrecio(e.target.value)} />
          <button className="btn-primary" onClick={handleAgregarAdicional} disabled={loading}>
            + Agregar
          </button>
        </div>
      </div>

      {/* Zona de peligro */}
      <div className="card" style={{ borderColor:'rgba(255,71,87,0.3)' }}>
        <div className="card-title" style={{ color:'var(--dan)' }}>⚠️ Zona de Peligro</div>
        <p style={{ fontSize:12, color:'var(--mut)', marginBottom:12 }}>
          Esta acción no se puede deshacer.
        </p>
        <button className="btn-danger"
          onClick={() => toast?.('Función disponible próximamente')}>
          🗑 Borrar todos los registros
        </button>
      </div>
    </div>
  )
}