import { useState, useEffect } from 'react'
import {
  getAdicionales, crearAdicional, actualizarAdicional, eliminarAdicional,
  getConfig, actualizarPerfil,
  getVehiculos, crearVehiculo, actualizarVehiculo, eliminarVehiculo
} from '../../services/api'
import { useToast } from '../../components/Toast'

const EMOJIS = ['🚗', '🚕', '🚙', '🚌', '🚎', '🏎️', '🚓', '🚑', '🚒', '🚐', '🛻', '🚚', '🚛', '🚜', '🛵', '🏍️', '🚲', '🛴', '🚁', '✈️']

export default function Config() {
  const toast = useToast()

  // Data State
  const [adicionales, setAdicionales] = useState([])
  const [vehiculos, setVehiculos] = useState([])
  const [perfil, setPerfil] = useState({ nombre: '', ciudad: '', telefono: '', activar_lealtad: false, meta_lealtad: 5 })

  // Edit States
  const [nuevoAdNombre, setNuevoAdNombre] = useState('')
  const [nuevoAdPrecio, setNuevoAdPrecio] = useState('')
  const [editAdPrecios, setEditAdPrecios] = useState({})

  const [nuevoVehNombre, setNuevoVehNombre] = useState('')
  const [nuevoVehPrecio, setNuevoVehPrecio] = useState('')
  const [nuevoVehIcono, setNuevoVehIcono] = useState('🚗')
  const [editVehPrecios, setEditVehPrecios] = useState({})

  const [expandedVeh, setExpandedVeh] = useState(null)
  const [nuevaSubNombre, setNuevaSubNombre] = useState('')
  const [nuevaSubEtiqueta, setNuevaSubEtiqueta] = useState('')
  const [nuevaSubPrecio, setNuevaSubPrecio] = useState('')

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
        telefono: conf.telefono || '',
        activar_lealtad: conf.activar_lealtad || false,
        meta_lealtad: conf.meta_lealtad || 5
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
        telefono: perfil.telefono,
        activar_lealtad: perfil.activar_lealtad,
        meta_lealtad: parseInt(perfil.meta_lealtad) || 5
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

  async function handleActualizarVehiculo(id, field, value) {
    try {
      let payload = {}
      if (field === 'precio') {
        payload.precio = parseInt(value) || 0
      } else {
        payload[field] = value.trim()
      }
      await actualizarVehiculo(id, payload)
      if (field !== 'precio') await cargarTodo()
      toast?.('✔ Vehículo actualizado')
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

  // ── SUBCATEGORÍAS ───────────────────────────────
  async function handleAgregarSubcategoria(v) {
    if (!nuevaSubNombre.trim() || !nuevaSubEtiqueta.trim()) return toast?.('Falta el nombre o etiqueta de la subcategoría')
    const subs = [...(v.subcategorias || [])]
    if (subs.find(s => s.nombre.toLowerCase() === nuevaSubNombre.toLowerCase())) return toast?.('La subcategoría ya existe')

    subs.push({
      nombre: nuevaSubNombre.trim().toLowerCase(),
      etiqueta: nuevaSubEtiqueta.trim(),
      precio_extra: parseInt(nuevaSubPrecio) || 0
    })

    try {
      await actualizarVehiculo(v.id, { subcategorias: subs })
      setNuevaSubNombre('')
      setNuevaSubEtiqueta('')
      setNuevaSubPrecio('')
      await cargarTodo()
      toast?.('✔ Subcategoría agregada')
    } catch (e) {
      toast?.('Error al agregar subcategoría')
    }
  }

  async function handleActualizarSubcategoria(v, idx, field, value) {
    const subs = [...(v.subcategorias || [])]
    if (field === 'precio_extra') {
      subs[idx].precio_extra = parseInt(value) || 0
    } else {
      subs[idx][field] = value.trim()
    }
    try {
      await actualizarVehiculo(v.id, { subcategorias: subs })
      await cargarTodo()
      toast?.('✔ Subcategoría actualizada')
    } catch (e) {
      toast?.('Error al actualizar subcategoría')
    }
  }

  async function handleEliminarSubcategoria(v, idx) {
    if (!confirm(`¿Eliminar la subcategoría "${v.subcategorias[idx].etiqueta}"?`)) return
    const subs = [...v.subcategorias]
    subs.splice(idx, 1)
    try {
      await actualizarVehiculo(v.id, { subcategorias: subs })
      await cargarTodo()
      toast?.('🗑 Subcategoría eliminada')
    } catch (e) {
      toast?.('Error al eliminar subcategoría')
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

  if (loading) return <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--mut)' }}>Cargando Panel de Control...</div>

  return (
    <div style={{ paddingBottom: '2rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontFamily: "'Outfit',sans-serif", fontSize: 'clamp(1.8rem, 5vw, 2.4rem)', letterSpacing: 0.5, color: 'var(--acc)', margin: 0, textShadow: '0 0 15px rgba(0,212,255,0.3)' }}>
          Panel de Configuración
        </h1>
        <p style={{ color: 'var(--mut)', fontSize: '1rem', marginTop: 4, fontFamily: "'Inter', sans-serif" }}>Personaliza los valores base de tu negocio dinámicamente.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>

        {/* ================= PERFIL ================= */}
        <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', borderTop: '4px solid var(--acc)', padding: '1.5rem' }}>
          <div className="card-title" style={{ margin: 0 }}>🏢 Perfil del Lavadero</div>

          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--mut)', marginBottom: '4px', display: 'block' }}>Nombre del Negocio</label>
            <input value={perfil.nombre} onChange={e => setPerfil({ ...perfil, nombre: e.target.value })}
              style={{ width: '100%', padding: '0.8rem', background: 'var(--sur)', border: '1px solid var(--brd)', borderRadius: 8, color: 'var(--txt)', fontWeight: 'bold' }} />
          </div>

          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--mut)', marginBottom: '4px', display: 'block' }}>Ciudad</label>
            <input value={perfil.ciudad} onChange={e => setPerfil({ ...perfil, ciudad: e.target.value })}
              style={{ width: '100%', padding: '0.8rem', background: 'var(--sur)', border: '1px solid var(--brd)', borderRadius: 8, color: 'var(--txt)' }} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', padding: '1rem', background: 'rgba(0,230,118,0.05)', borderRadius: 8, border: '1px dashed rgba(0,230,118,0.3)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ color: 'var(--txt)', fontWeight: 'bold', fontSize: '0.9rem' }}>Plan de Fidelización</div>
                <div style={{ color: 'var(--mut)', fontSize: '0.75rem', marginTop: 2 }}>Mostrar visitas del cliente y aplicar descuento</div>
              </div>
              <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                <input type="checkbox" checked={perfil.activar_lealtad} onChange={e => setPerfil({ ...perfil, activar_lealtad: e.target.checked })} style={{ display: 'none' }} />
                <div style={{ width: 40, height: 20, background: perfil.activar_lealtad ? 'var(--acc3)' : 'var(--sur2)', borderRadius: 20, position: 'relative', transition: 'background 0.3s' }}>
                  <div style={{ position: 'absolute', top: 2, left: perfil.activar_lealtad ? 22 : 2, width: 16, height: 16, background: '#fff', borderRadius: '50%', transition: 'left 0.3s' }} />
                </div>
              </label>
            </div>
            {perfil.activar_lealtad && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--mut)' }}>Lavados para recompensa:</span>
                <input type="number" value={perfil.meta_lealtad} onChange={e => setPerfil({ ...perfil, meta_lealtad: e.target.value })}
                  style={{ width: 60, padding: '0.4rem', background: 'var(--sur)', border: '1px solid var(--brd)', borderRadius: 4, color: 'var(--txt)', textAlign: 'center' }} />
              </div>
            )}
          </div>

          <button className="btn-primary" onClick={handleGuardarPerfil} disabled={savingPerfil} style={{ marginTop: '0.5rem', padding: '0.9rem', width: '100%' }}>
            {savingPerfil ? 'Guardando...' : 'Guardar Cambios de Perfil'}
          </button>
        </div>

        {/* ================= VEHÍCULOS ================= */}
        <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', borderTop: '4px solid #00d4ff', padding: '1.5rem' }}>
          <div className="card-title" style={{ margin: 0, marginBottom: '1rem' }}>🚗 Catálogo de Vehículos</div>

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.8rem', marginBottom: '1.5rem' }}>
            {vehiculos.length === 0 ? <span style={{ color: 'var(--mut)', fontSize: '0.9rem' }}>Sin vehículos configurados</span> :
              vehiculos.map(v => (
                <div key={v.id} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', background: 'var(--sur)', padding: '0.6rem 0.8rem', borderRadius: 8, border: '1px solid var(--brd)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.8rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, minWidth: '200px' }}>
                      <select value={v.icono} onChange={e => handleActualizarVehiculo(v.id, 'icono', e.target.value)}
                        style={{ fontSize: '1.2em', width: '40px', textAlign: 'center', background: 'transparent', border: 'none', borderBottom: '1px dashed var(--mut)', outline: 'none', padding: 0, cursor: 'pointer', appearance: 'none' }} title="Ícono">
                        {!EMOJIS.includes(v.icono) && <option value={v.icono}>{v.icono}</option>}
                        {EMOJIS.map(em => <option key={em} value={em}>{em}</option>)}
                      </select>
                      <input defaultValue={v.nombre} onBlur={e => handleActualizarVehiculo(v.id, 'nombre', e.target.value)}
                        style={{ fontWeight: '600', fontSize: '1.05rem', color: 'var(--txt)', background: 'transparent', border: 'none', borderBottom: '1px dashed var(--acc)', outline: 'none', flex: 1, minWidth: '100px', padding: '0 4px' }} title="Nombre de categoría" />

                      <button onClick={() => setExpandedVeh(expandedVeh === v.id ? null : v.id)} style={{ background: 'var(--sur2)', border: '1px solid var(--brd)', color: 'var(--acc)', cursor: 'pointer', fontSize: '0.75rem', padding: '4px 10px', borderRadius: 20, whiteSpace: 'nowrap', transition: 'all 0.2s', fontWeight: 600 }}
                        onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--acc)'} onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--brd)'}>
                        {expandedVeh === v.id ? 'Ocultar Subcategorías' : `Subcategorías (${v.subcategorias?.length || 0})`}
                      </button>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ color: 'var(--mut)', fontSize: '1.1rem' }}>$</span>
                      <input type="number" value={editVehPrecios[v.id] ?? v.precio} onChange={e => setEditVehPrecios(p => ({ ...p, [v.id]: e.target.value }))}
                        onBlur={() => handleActualizarVehiculo(v.id, 'precio', editVehPrecios[v.id])}
                        style={{ background: 'transparent', border: 'none', borderBottom: '1px solid var(--acc)', color: 'var(--txt)', fontFamily: "'DM Mono',monospace", fontSize: 14, padding: '2px', width: 75, textAlign: 'right', outline: 'none' }} />
                      <button onClick={() => handleEliminarVehiculo(v.id, v.nombre)} style={{ background: 'transparent', border: 'none', color: 'var(--dan)', cursor: 'pointer', padding: '4px', opacity: 0.6 }}>✖</button>
                    </div>
                  </div>

                  {expandedVeh === v.id && (
                    <div style={{ padding: '0.8rem', marginTop: '0.5rem', background: 'rgba(0,0,0,0.2)', borderRadius: 8, border: '1px dashed var(--brd)' }}>
                      <div style={{ fontSize: '0.8rem', color: 'var(--mut)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: 1 }}>Subcategorías de {v.nombre}</div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginBottom: '1rem' }}>
                        {!v.subcategorias || v.subcategorias.length === 0 ? <span style={{ fontSize: '0.8rem', color: 'var(--mut)' }}>No hay subcategorías.</span> :
                          v.subcategorias.map((s, idx) => (
                            <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.9rem', padding: '0.6rem 0.8rem', background: 'rgba(255,255,255,0.03)', borderRadius: 8, flexWrap: 'wrap', gap: '0.8rem', border: '1px solid rgba(255,255,255,0.06)', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, minWidth: '180px' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                                  <input defaultValue={s.etiqueta} onBlur={e => handleActualizarSubcategoria(v, idx, 'etiqueta', e.target.value)}
                                    style={{ background: 'transparent', border: 'none', borderBottom: '1px dashed var(--acc2)', color: 'var(--acc2)', fontWeight: '800', fontSize: '0.95rem', width: '100%', outline: 'none', paddingBottom: 2 }} title="Etiqueta visible" />
                                  <span style={{ color: 'var(--mut)', fontSize: '0.7rem', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>ID: <input defaultValue={s.nombre} onBlur={e => handleActualizarSubcategoria(v, idx, 'nombre', e.target.value.toLowerCase())} style={{ background: 'transparent', border: 'none', borderBottom: '1px dashed var(--mut)', color: 'var(--mut)', fontSize: '0.75rem', width: '60px', outline: 'none' }} title="Identificador interno" /></span>
                                </div>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', background: 'rgba(0,0,0,0.2)', padding: '0.4rem 0.8rem', borderRadius: 20 }}>
                                <span style={{ color: 'var(--mut)', fontSize: '0.9rem', fontWeight: 600 }}>+ $</span>
                                <input type="number" defaultValue={s.precio_extra} onBlur={e => handleActualizarSubcategoria(v, idx, 'precio_extra', e.target.value)}
                                  style={{ background: 'transparent', border: 'none', borderBottom: '1px solid var(--acc2)', color: 'var(--txt)', fontFamily: "'DM Mono',monospace", fontSize: 14, fontWeight: 700, padding: '2px', width: 60, textAlign: 'right', outline: 'none' }} />
                                <button onClick={() => handleEliminarSubcategoria(v, idx)} style={{ background: 'var(--dan)', border: 'none', color: '#fff', cursor: 'pointer', width: '22px', height: '22px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', marginLeft: 4, opacity: 0.8, transition: 'all 0.2s' }}
                                  onMouseEnter={e => e.currentTarget.style.opacity = 1} onMouseLeave={e => e.currentTarget.style.opacity = 0.8}>✖</button>
                              </div>
                            </div>
                          ))
                        }
                      </div>

                      <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', flexWrap: 'wrap' }}>
                        <input value={nuevaSubNombre} onChange={e => setNuevaSubNombre(e.target.value)} placeholder="ID (ej: suv)" style={{ flex: 1, background: 'var(--sur2)', border: 'none', borderRadius: 4, padding: '0.4rem', color: 'var(--txt)', fontSize: '0.8rem', minWidth: 60 }} />
                        <input value={nuevaSubEtiqueta} onChange={e => setNuevaSubEtiqueta(e.target.value)} placeholder="Etiqueta (ej: SUV +3k)" style={{ flex: 1.5, background: 'var(--sur2)', border: 'none', borderRadius: 4, padding: '0.4rem', color: 'var(--txt)', fontSize: '0.8rem', minWidth: 100 }} />
                        <div style={{ display: 'flex', alignItems: 'center', background: 'var(--sur2)', borderRadius: 4, padding: '0 0.4rem' }}>
                          <span style={{ color: 'var(--mut)', fontSize: '0.8rem' }}>+ $</span>
                          <input type="number" value={nuevaSubPrecio} onChange={e => setNuevaSubPrecio(e.target.value)} placeholder="0" style={{ width: 60, background: 'transparent', border: 'none', padding: '0.4rem', color: 'var(--txt)', fontSize: '0.8rem', outline: 'none' }} />
                        </div>
                        <button onClick={() => handleAgregarSubcategoria(v)} style={{ background: 'rgba(126,255,110,0.1)', color: 'var(--acc3)', border: '1px solid var(--acc3)', borderRadius: 4, padding: '0.3rem 0.8rem', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.8rem' }}>Add</button>
                      </div>
                    </div>
                  )}
                </div>
              ))
            }
          </div>

          <div style={{ padding: '1rem', background: 'var(--sur)', borderRadius: 8, border: '1px dashed var(--acc2)' }}>
            <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--mut)', marginBottom: '0.5rem' }}>Nuevo Tipo de Vehículo</span>
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <select value={nuevoVehIcono} onChange={e => setNuevoVehIcono(e.target.value)} style={{ width: '55px', textAlign: 'center', background: 'var(--sur2)', border: 'none', borderRadius: 4, color: 'var(--txt)', fontSize: '1.2rem', padding: '0 4px', cursor: 'pointer' }}>
                {!EMOJIS.includes(nuevoVehIcono) && <option value={nuevoVehIcono}>{nuevoVehIcono}</option>}
                {EMOJIS.map(em => <option key={em} value={em}>{em}</option>)}
              </select>
              <input value={nuevoVehNombre} onChange={e => setNuevoVehNombre(e.target.value)} placeholder="Ej: Super Mula" style={{ flex: 1, background: 'var(--sur2)', border: 'none', borderRadius: 4, padding: '0.5rem', color: 'var(--txt)' }} />
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input type="number" value={nuevoVehPrecio} onChange={e => setNuevoVehPrecio(e.target.value)} placeholder="Precio Base $" style={{ flex: 1, background: 'var(--sur2)', border: 'none', borderRadius: 4, padding: '0.5rem', color: 'var(--txt)' }} />
              <button onClick={handleAgregarVehiculo} style={{ background: 'rgba(0, 212, 255, 0.1)', color: 'var(--acc2)', border: '1px solid var(--acc2)', borderRadius: 4, padding: '0 1rem', cursor: 'pointer', fontWeight: 'bold' }}>+ Add</button>
            </div>
          </div>
        </div>

        {/* ================= ADICIONALES ================= */}
        <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', borderTop: '4px solid #aa3bff', padding: '1.5rem' }}>
          <div className="card-title" style={{ margin: 0, marginBottom: '1rem' }}>➕ Servicios Adicionales</div>

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.8rem', marginBottom: '1.5rem' }}>
            {adicionales.length === 0 ? <span style={{ color: 'var(--mut)', fontSize: '0.9rem' }}>Sin adicionales configurados</span> :
              adicionales.map(a => (
                <div key={a.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--sur)', padding: '0.6rem 0.8rem', borderRadius: 8, border: '1px solid var(--brd)' }}>
                  <span style={{ fontWeight: '500', fontSize: '0.95rem' }}>{a.nombre}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ color: 'var(--mut)', fontSize: '1.1rem' }}>$</span>
                    <input type="number" value={editAdPrecios[a.id] ?? a.precio} onChange={e => setEditAdPrecios(p => ({ ...p, [a.id]: e.target.value }))}
                      onBlur={() => handleActualizarAdicional(a.id)}
                      style={{ background: 'transparent', border: 'none', borderBottom: '1px solid var(--acc)', color: 'var(--txt)', fontFamily: "'DM Mono',monospace", fontSize: 14, padding: '2px', width: 70, textAlign: 'right', outline: 'none' }} />
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