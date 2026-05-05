import { useState, useEffect } from 'react'
import { getInventario, crearProducto, editarProducto, eliminarProducto, getRecetas, crearReceta, eliminarReceta, getMovimientosInventario, crearMovimientoInventario, getVehiculos, getAdicionales } from '../../services/api'
import { useToast } from '../../components/Toast'

function fmt(n) { return Number(n || 0).toLocaleString('es-CO') }

export default function Inventario() {
  const toast = useToast()
  const [activeTab, setActiveTab] = useState('stock') // stock | recetas | movimientos
  const [subTabMovimientos, setSubTabMovimientos] = useState('consumos') // consumos | manuales
  
  // Data
  const [productos, setProductos] = useState([])
  const [recetas, setRecetas] = useState([])
  const [movimientos, setMovimientos] = useState([])
  const [vehiculosRaw, setVehiculosRaw] = useState([])
  const [adicionalesOpciones, setAdicionalesOpciones] = useState([])
  
  const [loading, setLoading] = useState(true)

  // Forms Stock
  const [showStockModal, setShowStockModal] = useState(false)
  const [editProduct, setEditProduct] = useState(null)
  const [formStock, setFormStock] = useState({ nombre: '', cantidad: '', unidad: 'ml', stock_minimo: '' })
  
  // Forms Movimientos (Ajuste manual)
  const [showMovModal, setShowMovModal] = useState(false)
  const [formMov, setFormMov] = useState({ producto_id: '', tipo: 'entrada', cantidad: '', motivo: '' })

  // Forms Recetas
  const [showRecetaModal, setShowRecetaModal] = useState(false)
  const [formReceta, setFormReceta] = useState({ producto_id: '', tipo_servicio: 'base', vehiculo_base: '', subcategoria_base: '', nombre_servicio: '', cantidad: '', unidad_input: '' })

  useEffect(() => {
    cargarDatos()
    getVehiculos().then(data => {
      if (data) setVehiculosRaw(data)
    }).catch(e => console.error(e))

    getAdicionales().then(data => {
      if (data) setAdicionalesOpciones(data.map(a => a.nombre))
    }).catch(e => console.error(e))
  }, [])

  async function cargarDatos() {
    setLoading(true)
    try {
      const [p, r, m] = await Promise.all([ getInventario(), getRecetas(), getMovimientosInventario() ])
      setProductos(p)
      setRecetas(r)
      setMovimientos(m)
    } catch (e) {
      toast?.('Error cargando inventario')
    } finally {
      setLoading(false)
    }
  }

  // ---- HANDLERS STOCK ----
  function openNewProduct() {
    setEditProduct(null)
    setFormStock({ nombre: '', cantidad: '', unidad: 'ml', stock_minimo: '500' })
    setShowStockModal(true)
  }
  
  function openEditProduct(p) {
    setEditProduct(p.id)
    setFormStock({ nombre: p.nombre, cantidad: p.cantidad, unidad: p.unidad, stock_minimo: p.stock_minimo })
    setShowStockModal(true)
  }

  async function handleSaveProduct(e) {
    e.preventDefault()
    if (!formStock.nombre.trim()) return toast?.('Ingresa un nombre')
    try {
      if (editProduct) {
        await editarProducto(editProduct, {
          nombre: formStock.nombre,
          cantidad: parseFloat(formStock.cantidad) || 0,
          unidad: formStock.unidad,
          stock_minimo: parseFloat(formStock.stock_minimo) || 0
        })
        toast?.('✔ Producto actualizado')
      } else {
        await crearProducto({
          nombre: formStock.nombre,
          cantidad: parseFloat(formStock.cantidad) || 0,
          unidad: formStock.unidad,
          stock_minimo: parseFloat(formStock.stock_minimo) || 0
        })
        toast?.('✔ Producto creado')
      }
      setShowStockModal(false)
      cargarDatos()
    } catch (e) {
      toast?.(e.message || 'Error al guardar producto')
    }
  }

  async function handleDeleteProduct(id) {
    if (!confirm('¿Eliminar este producto? Se eliminarán también sus recetas y movimientos.')) return
    try {
      await eliminarProducto(id)
      toast?.('🗑 Producto eliminado')
      cargarDatos()
    } catch(e) {
      toast?.('Error al eliminar')
    }
  }

  // ---- HANDLERS MOVIMIENTOS ----
  function openNewMovimiento() {
    setFormMov({ producto_id: productos.length > 0 ? productos[0].id : '', tipo: 'entrada', cantidad: '', motivo: '' })
    setShowMovModal(true)
  }

  async function handleSaveMovimiento(e) {
    e.preventDefault()
    if (!formMov.producto_id || !formMov.cantidad) return toast?.('Llena todos los campos')
    try {
      await crearMovimientoInventario({
        producto_id: parseInt(formMov.producto_id),
        tipo: formMov.tipo,
        cantidad: parseFloat(formMov.cantidad),
        motivo: formMov.motivo
      })
      toast?.('✔ Movimiento registrado')
      setShowMovModal(false)
      cargarDatos()
    } catch (e) {
      toast?.(e.message || 'Error al registrar')
    }
  }

  // ---- HANDLERS RECETAS ----
  function openNewReceta() {
    setFormReceta({ producto_id: productos.length > 0 ? productos[0].id : '', tipo_servicio: 'base', vehiculo_base: '', subcategoria_base: '', nombre_servicio: '', cantidad: '', unidad_input: productos.length > 0 ? productos[0].unidad : '' })
    setShowRecetaModal(true)
  }

  async function handleSaveReceta(e) {
    e.preventDefault()
    let nombreFinal = formReceta.nombre_servicio
    
    if (formReceta.tipo_servicio === 'base') {
      if (!formReceta.vehiculo_base) return toast?.('Selecciona un vehículo base')
      nombreFinal = formReceta.subcategoria_base || formReceta.vehiculo_base
    } else {
      if (!formReceta.nombre_servicio) return toast?.('Selecciona un servicio adicional')
    }

    if (!formReceta.producto_id || !nombreFinal || !formReceta.cantidad) return toast?.('Llena todos los campos')
    
    try {
      let finalCant = parseFloat(formReceta.cantidad)
      const baseUnit = productos.find(p => p.id == formReceta.producto_id)?.unidad
      
      // Conversión automática a la unidad base del producto
      if (baseUnit === 'litros' && formReceta.unidad_input === 'ml') finalCant = finalCant / 1000
      if (baseUnit === 'ml' && formReceta.unidad_input === 'litros') finalCant = finalCant * 1000
      if (baseUnit === 'kg' && formReceta.unidad_input === 'gr') finalCant = finalCant / 1000
      if (baseUnit === 'gr' && formReceta.unidad_input === 'kg') finalCant = finalCant * 1000

      await crearReceta({
        producto_id: parseInt(formReceta.producto_id),
        tipo_servicio: formReceta.tipo_servicio,
        nombre_servicio: nombreFinal,
        cantidad: finalCant
      })
      toast?.('✔ Receta configurada')
      setShowRecetaModal(false)
      cargarDatos()
    } catch (e) {
      toast?.(e.message || 'Error al configurar receta')
    }
  }

  async function handleDeleteReceta(id) {
    if(!confirm('¿Eliminar esta receta?')) return
    try {
      await eliminarReceta(id)
      toast?.('🗑 Receta eliminada')
      cargarDatos()
    } catch(e) { toast?.('Error') }
  }
  const consumos = movimientos.filter(m => m.tipo === 'consumo')
  const manuales = movimientos.filter(m => m.tipo !== 'consumo')

  const consumosAgrupados = Object.values(consumos.reduce((acc, m) => {
    const key = m.motivo || `sin-motivo-${m.id}`
    if (!acc[key]) {
      acc[key] = {
        motivo: m.motivo || 'Consumo Automático',
        fecha: m.fecha,
        items: []
      }
    }
    acc[key].items.push(m)
    return acc
  }, {})).sort((a, b) => new Date(b.fecha) - new Date(a.fecha))

  return (
    <div style={{ paddingBottom: '2rem' }}>
      <div style={{ marginBottom:'1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontFamily:"'Outfit',sans-serif", fontSize:'clamp(1.8rem, 5vw, 2.4rem)', letterSpacing:0.5, color: 'var(--acc)', margin: 0, textShadow: '0 0 15px rgba(0,212,255,0.3)' }}>
            Inventario y Recetas
          </h1>
          <p style={{ color:'var(--mut)', fontSize: '1rem', marginTop: 4, fontFamily: "'Inter', sans-serif" }}>Automatización de consumo de insumos.</p>
        </div>
      </div>

      <div className="tabs" style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem', borderBottom: '1px solid var(--brd)', overflowX: 'auto' }}>
        <button className={`tab ${activeTab === 'stock' ? 'active' : ''}`} onClick={() => setActiveTab('stock')}
          style={{ padding: '0.8rem 1.5rem', background: 'none', border: 'none', color: activeTab === 'stock' ? 'var(--acc)' : 'var(--mut)', borderBottom: activeTab === 'stock' ? '3px solid var(--acc)' : '3px solid transparent', fontSize: '1rem', fontWeight: 600, cursor: 'pointer', whiteSpace:'nowrap' }}>
          📦 Stock Actual
        </button>
        <button className={`tab ${activeTab === 'recetas' ? 'active' : ''}`} onClick={() => setActiveTab('recetas')}
          style={{ padding: '0.8rem 1.5rem', background: 'none', border: 'none', color: activeTab === 'recetas' ? 'var(--acc)' : 'var(--mut)', borderBottom: activeTab === 'recetas' ? '3px solid var(--acc)' : '3px solid transparent', fontSize: '1rem', fontWeight: 600, cursor: 'pointer', whiteSpace:'nowrap' }}>
          ⚙️ Automatización (Recetas)
        </button>
        <button className={`tab ${activeTab === 'movimientos' ? 'active' : ''}`} onClick={() => setActiveTab('movimientos')}
          style={{ padding: '0.8rem 1.5rem', background: 'none', border: 'none', color: activeTab === 'movimientos' ? 'var(--acc)' : 'var(--mut)', borderBottom: activeTab === 'movimientos' ? '3px solid var(--acc)' : '3px solid transparent', fontSize: '1rem', fontWeight: 600, cursor: 'pointer', whiteSpace:'nowrap' }}>
          📋 Historial de Uso
        </button>
      </div>

      {loading ? (
        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--mut)' }}>Cargando inventario...</div>
      ) : (
        <>
          {/* TAB STOCK */}
          {activeTab === 'stock' && (
            <div style={{ animation: 'fadeIn 0.3s ease' }}>
              <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
                <button className="btn-primary" onClick={openNewProduct} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  ➕ Nuevo Insumo
                </button>
                <button className="btn-secondary" onClick={openNewMovimiento} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.05)', border: '1px solid var(--brd)' }}>
                  🔄 Ajuste Manual (Entrada/Salida)
                </button>
              </div>

              {productos.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--mut)', background: 'var(--sur2)', borderRadius: 8 }}>
                  No hay productos en tu inventario. Haz clic en "Nuevo Insumo".
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1rem' }}>
                  {productos.map(p => {
                    const isBajo = p.cantidad <= p.stock_minimo
                    return (
                      <div key={p.id} className="glass-panel" style={{ padding: '1.5rem', borderLeft: `4px solid ${isBajo ? 'var(--dan)' : 'var(--acc3)'}`, background: isBajo ? 'rgba(255,68,68,0.05)' : 'var(--sur2)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <h3 style={{ margin: 0, color: 'var(--txt)', fontSize: '1.1rem' }}>{p.nombre}</h3>
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button onClick={() => openEditProduct(p)} style={{ background: 'transparent', border: 'none', color: 'var(--acc)', cursor: 'pointer' }}>✏️</button>
                            <button onClick={() => handleDeleteProduct(p.id)} style={{ background: 'transparent', border: 'none', color: 'var(--dan)', cursor: 'pointer' }}>✖</button>
                          </div>
                        </div>
                        
                        <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                          <span style={{ fontSize: '2.2rem', fontWeight: 800, fontFamily: "'Outfit', sans-serif", color: isBajo ? 'var(--dan)' : 'var(--acc3)' }}>
                            {fmt(p.cantidad)}
                          </span>
                          <span style={{ color: 'var(--mut)', fontWeight: 600 }}>{p.unidad}</span>
                        </div>
                        
                        {isBajo && (
                          <div style={{ marginTop: '0.5rem', color: 'var(--dan)', fontSize: '0.8rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 4 }}>
                            ⚠️ Stock bajo (Mín: {p.stock_minimo})
                          </div>
                        )}
                        {!isBajo && (
                          <div style={{ marginTop: '0.5rem', color: 'var(--mut)', fontSize: '0.8rem' }}>
                            Stock mínimo: {p.stock_minimo} {p.unidad}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB RECETAS */}
          {activeTab === 'recetas' && (
            <div style={{ animation: 'fadeIn 0.3s ease' }}>
              <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <p style={{ color: 'var(--mut)', margin: 0 }}>Define cuánto insumo gasta cada servicio. Se descontará automáticamente al "Terminar" un vehículo.</p>
                <button className="btn-primary" onClick={openNewReceta}>➕ Configurar Receta</button>
              </div>

              {recetas.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--mut)', background: 'var(--sur2)', borderRadius: 8 }}>
                  No hay recetas. Configura una para automatizar el inventario.
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }} className="glass-panel">
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ background: 'var(--sur)', color: 'var(--mut)', textTransform: 'uppercase', fontSize: '0.8rem' }}>
                        <th style={{ padding: '1rem' }}>Desencadenador (Servicio)</th>
                        <th style={{ padding: '1rem' }}>Producto a descontar</th>
                        <th style={{ padding: '1rem' }}>Cantidad (Consumo)</th>
                        <th style={{ padding: '1rem', width: 50 }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {recetas.map(r => (
                        <tr key={r.id} style={{ borderTop: '1px solid var(--brd)' }}>
                          <td style={{ padding: '1rem' }}>
                            <span style={{ background: r.tipo_servicio === 'base' ? 'rgba(0,212,255,0.1)' : 'rgba(255,217,0,0.1)', color: r.tipo_servicio === 'base' ? 'var(--acc)' : '#ffd900', padding: '2px 8px', borderRadius: 4, fontSize: '0.75rem', fontWeight: 'bold', textTransform: 'uppercase', marginRight: '8px' }}>
                              {r.tipo_servicio}
                            </span>
                            <span style={{ color: 'var(--txt)', fontWeight: 'bold', textTransform: 'capitalize' }}>{r.nombre_servicio}</span>
                          </td>
                          <td style={{ padding: '1rem', color: 'var(--txt)' }}>{r.producto_nombre}</td>
                          <td style={{ padding: '1rem', color: 'var(--dan)', fontFamily: "'JetBrains Mono', monospace", fontWeight: 'bold' }}>
                            - {fmt(r.cantidad)} {r.producto_unidad}
                          </td>
                          <td style={{ padding: '1rem' }}>
                            <button onClick={() => handleDeleteReceta(r.id)} style={{ background: 'none', border: 'none', color: 'var(--dan)', cursor: 'pointer', fontSize: '1.2rem' }}>✖</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB HISTORIAL DE USO */}
          {activeTab === 'movimientos' && (
            <div style={{ animation: 'fadeIn 0.3s ease' }}>
              
              {/* SUB-TABS */}
              <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
                <button 
                  onClick={() => setSubTabMovimientos('consumos')}
                  style={{
                    padding: '0.6rem 1.2rem', borderRadius: 20, cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem',
                    background: subTabMovimientos === 'consumos' ? 'rgba(0,212,255,0.1)' : 'transparent',
                    color: subTabMovimientos === 'consumos' ? 'var(--acc)' : 'var(--mut)',
                    border: `1px solid ${subTabMovimientos === 'consumos' ? 'rgba(0,212,255,0.3)' : 'var(--brd)'}`,
                    transition: 'all 0.2s'
                  }}>
                  🧪 Consumos por Lavado
                </button>
                <button 
                  onClick={() => setSubTabMovimientos('manuales')}
                  style={{
                    padding: '0.6rem 1.2rem', borderRadius: 20, cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem',
                    background: subTabMovimientos === 'manuales' ? 'rgba(0,230,118,0.1)' : 'transparent',
                    color: subTabMovimientos === 'manuales' ? 'var(--acc3)' : 'var(--mut)',
                    border: `1px solid ${subTabMovimientos === 'manuales' ? 'rgba(0,230,118,0.3)' : 'var(--brd)'}`,
                    transition: 'all 0.2s'
                  }}>
                  📦 Ingresos / Ajustes Manuales
                </button>
              </div>

              {subTabMovimientos === 'consumos' && (
                <div>
                  {consumosAgrupados.length === 0 ? (
                    <div className="empty-state">No hay consumos automáticos registrados.</div>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
                      {consumosAgrupados.map((grupo, i) => (
                        <div key={i} className="glass-panel" style={{ padding: '1.2rem', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <h4 style={{ margin: 0, color: 'var(--acc)', fontSize: '1rem', lineHeight: 1.4, textTransform: 'uppercase' }}>
                              {grupo.motivo.replace(/Consumo aut. Lavado #\d+ - Placa /i, 'LAVADO - ')}
                            </h4>
                            <span style={{ fontSize: '0.8rem', color: 'var(--mut)', whiteSpace: 'nowrap' }}>
                              {new Date(grupo.fecha).toLocaleDateString('es-CO')}
                            </span>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', background: 'rgba(0,0,0,0.2)', padding: '0.8rem', borderRadius: 8 }}>
                            {grupo.items.map(item => (
                              <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ color: 'var(--txt)', fontSize: '0.9rem' }}>{item.producto_nombre}</span>
                                <span style={{ fontFamily: "'JetBrains Mono', monospace", color: 'var(--dan)', fontSize: '0.9rem', fontWeight: 'bold' }}>
                                  - {fmt(item.cantidad)} {item.producto_unidad}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {subTabMovimientos === 'manuales' && (
                <div>
                  {manuales.length === 0 ? (
                    <div className="empty-state">No hay ingresos o ajustes manuales registrados.</div>
                  ) : (
                    <div className="glass-panel" style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                          <tr style={{ background: 'var(--sur)', color: 'var(--mut)', textTransform: 'uppercase', fontSize: '0.8rem' }}>
                            <th style={{ padding: '1rem' }}>Fecha y Hora</th>
                            <th style={{ padding: '1rem' }}>Tipo</th>
                            <th style={{ padding: '1rem' }}>Producto</th>
                            <th style={{ padding: '1rem' }}>Cantidad</th>
                            <th style={{ padding: '1rem' }}>Motivo / Nota</th>
                          </tr>
                        </thead>
                        <tbody>
                          {manuales.map(m => (
                            <tr key={m.id} style={{ borderTop: '1px solid var(--brd)' }}>
                              <td style={{ padding: '1rem', color: 'var(--mut)', fontSize: '0.9rem' }}>{new Date(m.fecha).toLocaleString('es-CO')}</td>
                              <td style={{ padding: '1rem' }}>
                                <span style={{ 
                                  background: m.tipo === 'entrada' ? 'rgba(0,230,118,0.1)' : 'rgba(255,68,68,0.1)',
                                  color: m.tipo === 'entrada' ? 'var(--acc3)' : 'var(--dan)',
                                  padding: '2px 8px', borderRadius: 4, fontSize: '0.75rem', fontWeight: 'bold', textTransform: 'uppercase'
                                }}>
                                  {m.tipo}
                                </span>
                              </td>
                              <td style={{ padding: '1rem', color: 'var(--txt)', fontWeight: 'bold' }}>{m.producto_nombre}</td>
                              <td style={{ padding: '1rem', fontFamily: "'JetBrains Mono', monospace", fontWeight: 'bold', color: m.tipo === 'entrada' ? 'var(--acc3)' : 'var(--dan)' }}>
                                {m.tipo === 'entrada' ? '+' : '-'} {fmt(m.cantidad)} {m.producto_unidad}
                              </td>
                              <td style={{ padding: '1rem', color: 'var(--mut)', fontSize: '0.85rem' }}>{m.motivo || '-'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* MODAL STOCK */}
      {showStockModal && (
        <div className="modal-overlay">
          <div className="modal-content glass-panel" style={{ maxWidth: 400 }}>
            <h2 style={{ marginTop: 0 }}>{editProduct ? 'Editar Producto' : 'Nuevo Producto'}</h2>
            <form onSubmit={handleSaveProduct} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label>Nombre del insumo</label>
                <input required placeholder="Ej: Cera Líquida, Champú" value={formStock.nombre} onChange={e => setFormStock({...formStock, nombre: e.target.value})} className="input-field" />
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <label>Cantidad Inicial</label>
                  <input type="number" step="0.01" required value={formStock.cantidad} onChange={e => setFormStock({...formStock, cantidad: e.target.value})} className="input-field" />
                </div>
                <div style={{ flex: 1 }}>
                  <label>Unidad</label>
                  <select value={formStock.unidad} onChange={e => setFormStock({...formStock, unidad: e.target.value})} className="input-field">
                    <option value="ml">Mililitros (ml)</option>
                    <option value="litros">Litros (L)</option>
                    <option value="gr">Gramos (gr)</option>
                    <option value="unidades">Unidades (ud)</option>
                  </select>
                </div>
              </div>
              <div>
                <label>Stock Mínimo (Alerta)</label>
                <input type="number" step="0.01" required value={formStock.stock_minimo} onChange={e => setFormStock({...formStock, stock_minimo: e.target.value})} className="input-field" />
              </div>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button type="button" className="btn-secondary" style={{ flex: 1 }} onClick={() => setShowStockModal(false)}>Cancelar</button>
                <button type="submit" className="btn-primary" style={{ flex: 1 }}>Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL MOVIMIENTO */}
      {showMovModal && (
        <div className="modal-overlay">
          <div className="modal-content glass-panel" style={{ maxWidth: 400 }}>
            <h2 style={{ marginTop: 0 }}>Ajuste Manual de Stock</h2>
            <form onSubmit={handleSaveMovimiento} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label>Producto</label>
                <select className="input-field" required value={formMov.producto_id} onChange={e => setFormMov({...formMov, producto_id: e.target.value})}>
                  <option value="">Selecciona...</option>
                  {productos.map(p => <option key={p.id} value={p.id}>{p.nombre} ({p.unidad})</option>)}
                </select>
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <label>Tipo de Ajuste</label>
                  <select className="input-field" value={formMov.tipo} onChange={e => setFormMov({...formMov, tipo: e.target.value})}>
                    <option value="entrada">Entrada (+)</option>
                    <option value="salida">Salida (-)</option>
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <label>Cantidad</label>
                  <input type="number" step="0.01" required value={formMov.cantidad} onChange={e => setFormMov({...formMov, cantidad: e.target.value})} className="input-field" placeholder="Ej: 1000" />
                </div>
              </div>
              <div>
                <label>Motivo</label>
                <input className="input-field" placeholder="Ej: Llegó pedido, Se derramó..." value={formMov.motivo} onChange={e => setFormMov({...formMov, motivo: e.target.value})} />
              </div>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button type="button" className="btn-secondary" style={{ flex: 1 }} onClick={() => setShowMovModal(false)}>Cancelar</button>
                <button type="submit" className="btn-primary" style={{ flex: 1, background: formMov.tipo === 'entrada' ? 'var(--acc3)' : '#ffd900', color: '#000' }}>Confirmar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL RECETA */}
      {showRecetaModal && (
        <div className="modal-overlay">
          <div className="modal-content glass-panel" style={{ maxWidth: 450 }}>
            <h2 style={{ marginTop: 0 }}>Nueva Automatización</h2>
            <p style={{ color: 'var(--mut)', fontSize: '0.85rem', marginBottom: '1rem' }}>Configura cuánto producto se gasta automáticamente en un servicio.</p>
            <form onSubmit={handleSaveReceta} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              
              <div>
                <label>¿Qué evento dispara el consumo?</label>
                <select className="input-field" value={formReceta.tipo_servicio} onChange={e => setFormReceta({...formReceta, tipo_servicio: e.target.value, nombre_servicio: '', vehiculo_base: '', subcategoria_base: ''})}>
                  <option value="base">Un Tipo de Vehículo (Lavado Base)</option>
                  <option value="adicional">Un Servicio Adicional</option>
                </select>
              </div>

              {formReceta.tipo_servicio === 'base' ? (
                <>
                  <div>
                    <label>Selecciona el Vehículo</label>
                    <select className="input-field" required value={formReceta.vehiculo_base} onChange={e => setFormReceta({...formReceta, vehiculo_base: e.target.value, subcategoria_base: ''})}>
                      <option value="">Selecciona...</option>
                      {vehiculosRaw.map(v => <option key={v.id} value={v.nombre}>{v.nombre}</option>)}
                    </select>
                  </div>
                  
                  {/* Si el vehículo seleccionado tiene subcategorías, mostramos el segundo select */}
                  {formReceta.vehiculo_base && vehiculosRaw.find(v => v.nombre === formReceta.vehiculo_base)?.subcategorias?.length > 0 && (
                    <div style={{ animation: 'fadeIn 0.3s ease' }}>
                      <label>Subcategoría (Opcional)</label>
                      <select className="input-field" value={formReceta.subcategoria_base} onChange={e => setFormReceta({...formReceta, subcategoria_base: e.target.value})}>
                        <option value="">Aplicar a todo tipo de {formReceta.vehiculo_base} (General)</option>
                        {vehiculosRaw.find(v => v.nombre === formReceta.vehiculo_base).subcategorias.map(sub => (
                          <option key={sub.nombre} value={sub.nombre}>Específico para: {sub.nombre}</option>
                        ))}
                      </select>
                      <p style={{ margin: '4px 0 0 0', fontSize: '0.75rem', color: 'var(--mut)' }}>
                        Si seleccionas una subcategoría, este consumo solo aplicará a ella.
                      </p>
                    </div>
                  )}
                </>
              ) : (
                <div>
                  <label>Selecciona el Servicio Adicional</label>
                  <select className="input-field" required value={formReceta.nombre_servicio} onChange={e => setFormReceta({...formReceta, nombre_servicio: e.target.value})}>
                    <option value="">Selecciona...</option>
                    {adicionalesOpciones.map(a => <option key={a} value={a}>{a}</option>)}
                  </select>
                </div>
              )}

              <div style={{ borderTop: '1px dashed var(--brd)', margin: '0.5rem 0' }}></div>

              <div>
                <label>¿Qué producto se gasta?</label>
                <select className="input-field" required value={formReceta.producto_id} onChange={e => {
                  const pid = e.target.value;
                  const p = productos.find(pr => pr.id == pid);
                  setFormReceta({...formReceta, producto_id: pid, unidad_input: p ? p.unidad : ''});
                }}>
                  <option value="">Selecciona...</option>
                  {productos.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                </select>
              </div>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <label>Cantidad</label>
                  <input type="number" step="0.01" required value={formReceta.cantidad} onChange={e => setFormReceta({...formReceta, cantidad: e.target.value})} className="input-field" placeholder="Ej: 50" />
                </div>
                {formReceta.producto_id ? (
                  <div style={{ flex: 1 }}>
                    <label>Unidad</label>
                    <select className="input-field" value={formReceta.unidad_input} onChange={e => setFormReceta({...formReceta, unidad_input: e.target.value})}>
                      {['ml', 'litros'].includes(productos.find(p => p.id == formReceta.producto_id)?.unidad) ? (
                        <>
                          <option value="ml">Mililitros (ml)</option>
                          <option value="litros">Litros (L)</option>
                        </>
                      ) : ['gr', 'kg'].includes(productos.find(p => p.id == formReceta.producto_id)?.unidad) ? (
                        <>
                          <option value="gr">Gramos (gr)</option>
                          <option value="kg">Kilos (kg)</option>
                        </>
                      ) : (
                        <option value="unidades">Unidades (ud)</option>
                      )}
                    </select>
                  </div>
                ) : (
                  <div style={{ flex: 1 }}></div>
                )}
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button type="button" className="btn-secondary" style={{ flex: 1 }} onClick={() => setShowRecetaModal(false)}>Cancelar</button>
                <button type="submit" className="btn-primary" style={{ flex: 1 }}>Guardar Receta</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ESTILOS GLOBALES PARA MODALES SIMPLES */}
      <style>{`
        .modal-overlay {
          position: fixed; top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(0,0,0,0.8); backdrop-filter: blur(5px);
          display: flex; align-items: center; justify-content: center; z-index: 9999;
          padding: 1rem;
        }
        .modal-content {
          width: 100%; padding: 2rem; border-radius: 12px;
          animation: slideUp 0.3s ease; border: 1px solid rgba(0,212,255,0.2);
        }
        .input-field {
          width: 100%; padding: 0.8rem; background: var(--sur2); border: 1px solid var(--brd);
          border-radius: 6px; color: var(--txt); outline: none; margin-top: 4px;
        }
        .input-field:focus { border-color: var(--acc); }
        label { font-size: 0.85rem; color: var(--mut); font-weight: bold; }
        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  )
}
