import { useState, useEffect } from 'react'
import {
  getAdicionales, crearAdicional, actualizarAdicional, eliminarAdicional,
  getConfig, actualizarPerfil,
  getVehiculos, crearVehiculo, actualizarVehiculo, eliminarVehiculo
} from '../../services/api'
import { useToast } from '../../components/Toast'

export default function Config() {
  const toast = useToast()
  
  // Data State
  const [adicionales, setAdicionales] = useState([])
  const [vehiculos, setVehiculos] = useState([])
  const [perfil, setPerfil] = useState({ nombre: '', ciudad: '', telefono: '' })
  
  // Edit States
  const [nuevoAdNombre, setNuevoAdNombre] = useState('')
  const [nuevoAdPrecio, setNuevoAdPrecio] = useState('')
  const [editAdPrecios, setEditAdPrecios] = useState({})
  
  const [nuevoVehNombre, setNuevoVehNombre] = useState('')
  const [nuevoVehPrecio, setNuevoVehPrecio] = useState('')
  const [nuevoVehIcono, setNuevoVehIcono] = useState('🚗')
  const [editVehPrecios, setEditVehPrecios] = useState({})

  // Form State
  const [loading, setLoading] = useState(true)
  const [savingPerfil, setSavingPerfil] = useState(false)

  useEffect(() => {
    cargarTodo()
  }, [])

  async function cargarTodo() {
    setLoading(true)
    try {
      const [adics, vehics, conf] = await Promise.all([
        getAdicionales(),
        getVehiculos(),
        getConfig()
      ])
      
      setAdicionales(adics)
      const adPrecios = {}
      adics.forEach(a => { adPrecios[a.id] = a.precio })
      setEditAdPrecios(adPrecios)

      setVehiculos(vehics)
      const vehPrecios = {}
      vehics.forEach(v => { vehPrecios[v.id] = v.precio })
      setEditVehPrecios(vehPrecios)

      setPerfil({
        nombre: conf.nombre || '',
        ciudad: conf.ciudad || '',
        telefono: conf.telefono || ''
      })
    } catch (e) {
      toast?.('Error cargando configuración')
    } finally {
      setLoading(false)
    }
  }

  // ── PERFIL ──────────────────────────────────────
  async function handleGuardarPerfil() {
    setSavingPerfil(true)
    try {
      await actualizarPerfil({
        nombre: perfil.nombre,
        ciudad: perfil.ciudad,
        telefono: perfil.telefono
      })
      toast?.('✔ Perfil guardado exitosamente')
    } catch (e) {
      toast?.('Error al guardar perfil')
    } finally {
      setSavingPerfil(false)
    }
  }

  // ── VEHÍCULOS CATÁLOGO ──────────────────────────
  async function handleAgregarVehiculo() {
    if (!nuevoVehNombre.trim()) return toast?.('Ingresa el nombre del vehículo')
    try {
      await crearVehiculo({
        nombre: nuevoVehNombre.trim(),
        precio: parseInt(nuevoVehPrecio) || 0,
        icono: nuevoVehIcono || '🚗'
      })
      setNuevoVehNombre('')
      setNuevoVehPrecio('')
      await cargarTodo()
      toast?.(`✔ Vehículo "${nuevoVehNombre}" agregado`)
    } catch (e) {
      toast?.(`Error: Revisa que el nombre no exista ya`)
    }
  }

  async function handleActualizarVehiculo(id) {
    try {
      await actualizarVehiculo(id, { precio: parseInt(editVehPrecios[id]) || 0 })
      toast?.('✔ Precio base actualizado')
    } catch (e) {
      toast?.('Error al actualizar vehículo')
    }
  }

  async function handleEliminarVehiculo(id, nombre) {
    if (!confirm(`¿Estás seguro de eliminar "${nombre}"? \nEsto no eliminará lavados pasados, pero ya no se podrá seleccionar.`)) return
    try {
      await eliminarVehiculo(id)
      await cargarTodo()
      toast?.(`🗑 Vehículo eliminado`)
    } catch (e) {
      toast?.('Error al eliminar vehículo')
    }
  }

  // ── ADICIONALES ─────────────────────────────────
  async function handleAgregarAdicional() {
    if (!nuevoAdNombre.trim()) return toast?.('Ingresa el nombre del servicio')
    try {
      await crearAdicional(nuevoAdNombre.trim(), parseInt(nuevoAdPrecio) || 0)
      setNuevoAdNombre('')
      setNuevoAdPrecio('')
      await cargarTodo()
      toast?.(`✔ Adicional agregado`)
    } catch (e) {
      toast?.(`Error: ${e.message}`)
    }
  }

  async function handleActualizarAdicional(id) {
    try {
      await actualizarAdicional(id, parseInt(editAdPrecios[id]) || 0)
      toast?.('✔ Precio adicional actualizado')
    } catch (e) {
      toast?.('Error al actualizar')
    }
  }

  async function handleEliminarAdicional(id, nombre) {
    if (!confirm(`¿Eliminar el servicio "${nombre}"?`)) return
    try {
      await eliminarAdicional(id)
      await cargarTodo()
      toast?.(`🗑 Adicional eliminado`)
    } catch (e) {
      toast?.('Error al eliminar')
    }
  }

  if (loading) return <div style={{ textAlign:'center', padding:'3rem', color:'var(--mut)' }}>Cargando Panel de Control...</div>

  return (
    <div style={{ paddingBottom: '2rem' }}>
      <div style={{ marginBottom:'2rem' }}>
        <h1 style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:'2.2rem', letterSpacing:1, color: 'var(--acc)' }}>
          Panel de Configuración
        </h1>
        <p style={{ color:'var(--mut)', fontSize: '0.95rem' }}>Personaliza los valores base de tu negocio dinámicamente.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
        
        {/* ================= PERFIL ================= */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', borderTop: '4px solid var(--acc)' }}>
          <div className="card-title">🏢 Perfil del Lavadero</div>
          
          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--mut)', marginBottom: '4px', display: 'block' }}>Nombre del Negocio</label>
            <input value={perfil.nombre} onChange={e => setPerfil({...perfil, nombre: e.target.value})}
              style={{ width: '100%', padding: '0.8rem', background: 'var(--sur)', border: '1px solid var(--brd)', borderRadius: 8, color: 'var(--txt)', fontWeight: 'bold' }} />
          </div>
          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--mut)', marginBottom: '4px', display: 'block' }}>Teléfono (Contacto)</label>
            <input value={perfil.telefono} onChange={e => setPerfil({...perfil, telefono: e.target.value})}
              style={{ width: '100%', padding: '0.8rem', background: 'var(--sur)', border: '1px solid var(--brd)', borderRadius: 8, color: 'var(--txt)' }} />
          </div>
          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--mut)', marginBottom: '4px', display: 'block' }}>Ciudad</label>
            <input value={perfil.ciudad} onChange={e => setPerfil({...perfil, ciudad: e.target.value})}
              style={{ width: '100%', padding: '0.8rem', background: 'var(--sur)', border: '1px solid var(--brd)', borderRadius: 8, color: 'var(--txt)' }} />
          </div>
          
          <button className="btn-primary" onClick={handleGuardarPerfil} disabled={savingPerfil} style={{ marginTop: '0.5rem', padding: '0.9rem', width: '100%' }}>
            {savingPerfil ? 'Guardando...' : 'Guardar Cambios de Perfil'}
          </button>
        </div>

        {/* ================= VEHÍCULOS ================= */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', borderTop: '4px solid #00d4ff' }}>
          <div className="card-title" style={{ marginBottom: '1rem' }}>🚗 Catálogo de Vehículos</div>
          
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.8rem', marginBottom: '1.5rem' }}>
            {vehiculos.length === 0 ? <span style={{ color: 'var(--mut)', fontSize: '0.9rem' }}>Sin vehículos configurados</span> :
              vehiculos.map(v => (
                <div key={v.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--sur)', padding: '0.6rem 0.8rem', borderRadius: 8, border: '1px solid var(--brd)' }}>
                  <span style={{ fontWeight: '600' }}><span style={{ fontSize: '1.2em', marginRight: 6 }}>{v.icono}</span> {v.nombre}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ color: 'var(--mut)', fontSize: '1.1rem' }}>$</span>
                    <input type="number" value={editVehPrecios[v.id] ?? v.precio} onChange={e => setEditVehPrecios(p => ({ ...p, [v.id]: e.target.value }))}
                      onBlur={() => handleActualizarVehiculo(v.id)}
                      style={{ background:'transparent', border:'none', borderBottom:'1px solid var(--acc)', color:'var(--txt)', fontFamily:"'DM Mono',monospace", fontSize:14, padding:'2px', width:75, textAlign:'right', outline: 'none' }} />
                    <button onClick={() => handleEliminarVehiculo(v.id, v.nombre)} style={{ background: 'transparent', border: 'none', color: 'var(--dan)', cursor: 'pointer', padding: '4px', opacity: 0.6 }}>✖</button>
                  </div>
                </div>
              ))
            }
          </div>

          <div style={{ padding: '1rem', background: 'var(--sur)', borderRadius: 8, border: '1px dashed var(--acc2)' }}>
            <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--mut)', marginBottom: '0.5rem' }}>Nuevo Tipo de Vehículo</span>
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <input value={nuevoVehIcono} onChange={e => setNuevoVehIcono(e.target.value)} placeholder="🚗" maxLength={2} style={{ width: '45px', textAlign: 'center', background: 'var(--sur2)', border: 'none', borderRadius: 4, color: 'var(--txt)' }} />
              <input value={nuevoVehNombre} onChange={e => setNuevoVehNombre(e.target.value)} placeholder="Ej: Super Mula" style={{ flex: 1, background: 'var(--sur2)', border: 'none', borderRadius: 4, padding: '0.5rem', color: 'var(--txt)' }} />
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
               <input type="number" value={nuevoVehPrecio} onChange={e => setNuevoVehPrecio(e.target.value)} placeholder="Precio Base $" style={{ flex: 1, background: 'var(--sur2)', border: 'none', borderRadius: 4, padding: '0.5rem', color: 'var(--txt)' }} />
               <button onClick={handleAgregarVehiculo} style={{ background: 'rgba(0, 212, 255, 0.1)', color: 'var(--acc2)', border: '1px solid var(--acc2)', borderRadius: 4, padding: '0 1rem', cursor: 'pointer', fontWeight: 'bold' }}>+ Add</button>
            </div>
          </div>
        </div>

        {/* ================= ADICIONALES ================= */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', borderTop: '4px solid #aa3bff' }}>
          <div className="card-title" style={{ marginBottom: '1rem' }}>➕ Servicios Adicionales</div>
          
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.8rem', marginBottom: '1.5rem' }}>
            {adicionales.length === 0 ? <span style={{ color: 'var(--mut)', fontSize: '0.9rem' }}>Sin adicionales configurados</span> :
              adicionales.map(a => (
                <div key={a.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--sur)', padding: '0.6rem 0.8rem', borderRadius: 8, border: '1px solid var(--brd)' }}>
                  <span style={{ fontWeight: '500', fontSize: '0.95rem' }}>{a.nombre}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ color: 'var(--mut)', fontSize: '1.1rem' }}>$</span>
                    <input type="number" value={editAdPrecios[a.id] ?? a.precio} onChange={e => setEditAdPrecios(p => ({ ...p, [a.id]: e.target.value }))}
                      onBlur={() => handleActualizarAdicional(a.id)}
                      style={{ background:'transparent', border:'none', borderBottom:'1px solid var(--acc)', color:'var(--txt)', fontFamily:"'DM Mono',monospace", fontSize:14, padding:'2px', width:70, textAlign:'right', outline: 'none' }} />
                    <button onClick={() => handleEliminarAdicional(a.id, a.nombre)} style={{ background: 'transparent', border: 'none', color: 'var(--dan)', cursor: 'pointer', padding: '4px', opacity: 0.6 }}>✖</button>
                  </div>
                </div>
              ))
            }
          </div>

          <div style={{ padding: '1rem', background: 'var(--sur)', borderRadius: 8, border: '1px dashed var(--accent)' }}>
            <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--mut)', marginBottom: '0.5rem' }}>Nuevo Adicional</span>
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <input value={nuevoAdNombre} onChange={e => setNuevoAdNombre(e.target.value)} placeholder="Ej: Cera Brillante" style={{ flex: 1, background: 'var(--sur2)', border: 'none', borderRadius: 4, padding: '0.5rem', color: 'var(--txt)' }} />
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
               <input type="number" value={nuevoAdPrecio} onChange={e => setNuevoAdPrecio(e.target.value)} placeholder="Precio $" style={{ flex: 1, background: 'var(--sur2)', border: 'none', borderRadius: 4, padding: '0.5rem', color: 'var(--txt)' }} />
               <button onClick={handleAgregarAdicional} style={{ background: 'var(--accent-bg)', color: 'var(--accent)', border: '1px solid var(--accent)', borderRadius: 4, padding: '0 1rem', cursor: 'pointer', fontWeight: 'bold' }}>+ Add</button>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}