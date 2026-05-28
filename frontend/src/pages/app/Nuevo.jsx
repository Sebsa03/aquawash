import { useState, useEffect, useRef } from 'react'
import { getEmpleados, getAdicionales, crearLavado, getVehiculos, getSugerenciasPlaca, getConfig, getVisitasCliente } from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../components/Toast'
import { PAYMENT_METHODS } from '../../utils/constants'


const LAVADOS = {
  ligero:   { label: 'Ligero',   factor: 1.0, color: 'var(--acc)' },
  medio:    { label: 'Medio',    factor: 1.3, color: 'var(--acc2)' },
  profundo: { label: 'Profundo', factor: 1.6, color: 'var(--dan)' },
}

function fmt(n) { return Number(n || 0).toLocaleString('es-CO') }
function horaActual() {
  const n = new Date()
  return `${String(n.getHours()).padStart(2,'0')}:${String(n.getMinutes()).padStart(2,'0')}`
}

// Genera un formulario vacío con la hora ACTUAL en cada llamada
function makeEmpty() {
  return { tipo_vehiculo: '', placa: '', empleado_id: '', hora_ingreso: horaActual(), nota: '', subcategoria: '', nivel_suciedad: 'ligero', cliente_nombre: '', cliente_telefono: '', metodo_pago: 'efectivo' }
}

// --- COMPONENT ---
export default function Nuevo() {
  const { role, token } = useAuth()
  const toast = useToast()
  
  const isDemo = (() => {
    try {
      return token && JSON.parse(atob(token.split('.')[1])).email === 'demo@aquawash.com'
    } catch(e) { return false }
  })()
  const [empleados, setEmpleados]   = useState([])
  const [adicionales, setAdicionales] = useState([])
  const [vehiculos, setVehiculos]   = useState([])
  const [loading, setLoading]       = useState(false)
  const [selAdd, setSelAdd]         = useState({})
  const [form, setForm]             = useState(makeEmpty)  // lazy init: hora fresca al montar
  const [placaData, setPlacaData]       = useState(null)
  const [sugerencias, setSugerencias]   = useState([])
  const [showSuger, setShowSuger]       = useState(false)
  const [loadingPlaca, setLoadingPlaca] = useState(false)
  const seleccionandoRef = useRef(false) // bloquea re-query al seleccionar del dropdown
  
  const [lealtadActiva, setLealtadActiva] = useState(false)
  const [metaLealtad, setMetaLealtad] = useState(5)
  const [visitas, setVisitas] = useState(0)
  const [loadingVisitas, setLoadingVisitas] = useState(false)

  useEffect(() => {
    Promise.all([getEmpleados(), getAdicionales(), getVehiculos(), getConfig()])
      .then(([emps, adds, vehs, conf]) => {
        setEmpleados(emps)
        setAdicionales(adds)
        setVehiculos(vehs)
        setLealtadActiva(conf.activar_lealtad || false)
        setMetaLealtad(conf.meta_lealtad || 5)
      })
      .catch(() => toast?.('Error cargando datos'))
  }, [])

  // Buscar visitas cuando cambia la placa y la lealtad está activa
  useEffect(() => {
    if (!lealtadActiva) return
    const pla = form.placa?.trim()
    if (!pla || pla.length < 3) {
      setVisitas(0)
      return
    }
    const t = setTimeout(async () => {
      setLoadingVisitas(true)
      try {
        const data = await getVisitasCliente(pla)
        setVisitas(data.visitas || 0)
      } catch (e) {
        setVisitas(0)
      } finally {
        setLoadingVisitas(false)
      }
    }, 600)
    return () => clearTimeout(t)
  }, [form.placa, lealtadActiva])

  // Dropdown de sugerencias de placa — debounce 400ms, 3+ chars
  useEffect(() => {
    if (seleccionandoRef.current) return  // no re-consultar tras seleccionar
    const q = form.placa.trim()
    if (q.length < 3) { setSugerencias([]); setShowSuger(false); return }
    const t = setTimeout(async () => {
      if (seleccionandoRef.current) return
      setLoadingPlaca(true)
      try {
        const lista = await getSugerenciasPlaca(q)
        setSugerencias(lista || [])
        setShowSuger((lista || []).length > 0)
      } catch(e) { setSugerencias([]); setShowSuger(false) }
      finally { setLoadingPlaca(false) }
    }, 400)
    return () => clearTimeout(t)
  }, [form.placa])

  function selectSugerencia(sug) {
    seleccionandoRef.current = true          // bloquear el useEffect
    setSugerencias([])
    setShowSuger(false)
    setPlacaData(sug)
    setForm(f => ({
      ...f,
      placa:            sug.placa,
      tipo_vehiculo:    (sug.tipo_vehiculo    || f.tipo_vehiculo).toLowerCase(),
      subcategoria:     sug.subcategoria     || '',
      cliente_nombre:   sug.cliente_nombre   || '',
      cliente_telefono: sug.cliente_telefono || '',
    }))
    setTimeout(() => { seleccionandoRef.current = false }, 800)  // desbloquear
  }

  function handleChange(e) {
    const { name, value } = e.target
    setForm(f => ({
      ...f, [name]: value,
      ...(name === 'tipo_vehiculo' ? { subcategoria: '' } : {})
    }))
  }

  function toggleAdd(id) { setSelAdd(s => ({ ...s, [id]: !s[id] })) }

  // Calculation
  const vehiculoSeleccionado = vehiculos.find(v => v.nombre.toLowerCase() === form.tipo_vehiculo.toLowerCase())
  const precioBase     = vehiculoSeleccionado?.precio ?? 0
  
  const subcategoriasVehiculo = vehiculoSeleccionado?.subcategorias || []
  const subcategoriaActual = subcategoriasVehiculo.find(s => s.nombre.toLowerCase() === form.subcategoria.toLowerCase())
  const subExtra       = subcategoriaActual?.precio_extra ?? 0
  
  const factor         = LAVADOS[form.nivel_suciedad]?.factor ?? 1
  const adicsSelec     = adicionales.filter(a => selAdd[a.id])
  const precioAdics    = adicsSelec.reduce((s, a) => s + a.precio, 0)
  
  // Lógica simple de descuento por fidelidad: si tiene la cantidad meta o más visitas.
  const tieneDescuentoLealtad = lealtadActiva && visitas >= metaLealtad
  const descuentoPorcentaje = tieneDescuentoLealtad ? 0.10 : 0 // 10%

  let precioTotal = Math.round((precioBase + subExtra) * factor) + precioAdics
  if (tieneDescuentoLealtad) {
    precioTotal = Math.round(precioTotal * (1 - descuentoPorcentaje))
  }

  const tieneSubcat = subcategoriasVehiculo.length > 0

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.tipo_vehiculo) return toast?.('Selecciona el tipo de vehículo')
    if (!form.placa.trim())  return toast?.('Ingresa la placa')
    if (!form.empleado_id)   return toast?.('Selecciona el empleado')

    if (isDemo && role === 'operario') {
      const operarioCount = Number(sessionStorage.getItem('demo_registros_operario') || 0)
      if (operarioCount >= 3) {
        toast?.('Límite de demostración alcanzado. Cámbiate a Admin para seguir probando.')
        alert('Has alcanzado el límite de registros simultáneos (3) para este Operario virtual. ¡Cámbiate a la vista de Administrador en la parte superior para borrar el historial o probar otras funciones!')
        return
      }
      sessionStorage.setItem('demo_registros_operario', operarioCount + 1)
    }

    setLoading(true)
    try {
      await crearLavado({
        placa: form.placa.toUpperCase(),
        tipo_vehiculo: form.tipo_vehiculo,
        empleado_id: parseInt(form.empleado_id),
        hora_ingreso: form.hora_ingreso + ':00',
        adicionales_aplicados: adicsSelec.map(a => ({ nombre: a.nombre, precio: a.precio })),
        etiquetas_estado: [],
        nota: form.nota || null,
        subcategoria: form.subcategoria || null,
        nivel_suciedad: form.nivel_suciedad,
        cliente_nombre: form.cliente_nombre || null,
        cliente_telefono: form.cliente_telefono || null,
        metodo_pago: form.metodo_pago
      })
      toast?.(`Lavado registrado — $${fmt(precioTotal)}`)
      setForm(makeEmpty())
      setSelAdd({})
      setPlacaData(null)
      setSugerencias([])
    } catch (err) {
      toast?.(`Error: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  // LARGER STYLES
  const labelStyle = { marginBottom: '0.4rem', fontSize: '0.85rem', color: 'var(--mut)', textTransform: 'uppercase', letterSpacing: 1, fontWeight: 600 }
  const inputStyle = { padding: '0.8rem 1rem', fontSize: '1.2rem', borderRadius: 8, background: 'rgba(28, 31, 46, 0.5)', border: '1px solid var(--brd)', color: 'var(--txt)', outline: 'none', width: '100%', transition: 'all 0.3s ease', fontFamily: "'JetBrains Mono', monospace" }

  return (
    <div style={{ padding: '0.5rem 1rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%' }}>

      {/* ── HEADER ── */}
      <div className="nuevo-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px solid var(--brd)', gap: '0.5rem', overflow: 'hidden' }}>
        <h1 style={{ fontFamily: "'Outfit',sans-serif", fontSize: 'clamp(1.4rem, 5vw, 2.2rem)', letterSpacing: 0.5, color: '#fff', margin: 0, flexShrink: 1, minWidth: 0, textShadow: '0 0 15px rgba(0,212,255,0.2)' }}>
          Registrar Lavado
        </h1>
        <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: 'clamp(1.6rem, 5vw, 2.8rem)', fontWeight: 800, color: 'var(--acc3)', letterSpacing: 0, lineHeight: 1, flexShrink: 0, whiteSpace: 'nowrap', textShadow: '0 0 20px rgba(0,230,118,0.3)' }}>
          ${fmt(precioTotal)}
        </div>
      </div>

      {/* ── BODY ── */}
      <form onSubmit={handleSubmit} className="nuevo-form">

        {/* ══ COLUMNA IZQUIERDA: Datos del vehículo ══ */}
        <div className="nuevo-col">

          {/* Tipo de vehículo */}
          <div>
            <div style={labelStyle}>Tipo de vehículo</div>
            <div className="nuevo-vehiculos-grid" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem' }}>
              {vehiculos.length > 0
                ? vehiculos.map(v => (
                    <button key={v.id} type="button"
                      onClick={() => setForm(f => ({ ...f, tipo_vehiculo: v.nombre.toLowerCase(), subcategoria: '' }))}
                      style={{
                        padding: '0.5rem 1rem', borderRadius: 30, fontSize: '1rem', fontWeight: 700,
                        border: `2px solid ${form.tipo_vehiculo === v.nombre.toLowerCase() ? 'var(--acc)' : 'var(--brd)'}`,
                        background: form.tipo_vehiculo === v.nombre.toLowerCase() ? 'rgba(0,212,255,0.12)' : 'var(--sur2)',
                        color: form.tipo_vehiculo === v.nombre.toLowerCase() ? 'var(--acc)' : 'var(--mut)',
                        cursor: 'pointer', transition: 'all 0.15s', flexGrow: 1, minWidth: '100px'
                      }}>
                      {v.nombre}
                    </button>
                  ))
                : ['Moto','Carro','Furgón','Camión','Bus'].map(t => (
                    <button key={t} type="button"
                      onClick={() => setForm(f => ({ ...f, tipo_vehiculo: t.toLowerCase(), subcategoria: '' }))}
                      style={{
                        padding: '0.5rem 1rem', borderRadius: 30, fontSize: '1rem', fontWeight: 700,
                        border: `2px solid ${form.tipo_vehiculo === t.toLowerCase() ? 'var(--acc)' : 'var(--brd)'}`,
                        background: form.tipo_vehiculo === t.toLowerCase() ? 'rgba(0,212,255,0.12)' : 'var(--sur2)',
                        color: form.tipo_vehiculo === t.toLowerCase() ? 'var(--acc)' : 'var(--mut)',
                        cursor: 'pointer', transition: 'all 0.15s', flexGrow: 1, minWidth: '100px'
                      }}>
                      {t}
                    </button>
                  ))
              }
            </div>
          </div>

          {/* Placa + Hora */}
          <div className="nuevo-placa-hora">
            <div style={{ display: 'flex', flexDirection: 'column', position: 'relative' }}>
              <label style={labelStyle}>Placa
                {loadingPlaca && <span style={{ marginLeft: 8, fontSize: '0.7rem', color: 'var(--mut)', textTransform: 'none', fontWeight: 400 }}>buscando...</span>}
              </label>
              <input style={inputStyle} name="placa" placeholder="ABC-123"
                value={form.placa} autoComplete="off" required
                onChange={e => { setForm(f => ({ ...f, placa: e.target.value.toUpperCase() })); setPlacaData(null) }}
                onFocus={e => e.target.style.borderColor = 'var(--acc)'}
                onBlur={e => { e.target.style.borderColor = 'var(--brd)'; setTimeout(() => setShowSuger(false), 160) }}
              />
              {lealtadActiva && (form.placa?.length >= 3) && (
                <div style={{ position: 'absolute', right: 15, top: 38, fontSize: '0.8rem', color: visitas > 0 ? 'var(--acc3)' : 'var(--mut)', fontWeight: 'bold' }}>
                  {loadingVisitas ? '...' : `${visitas} visitas`}
                </div>
              )}
              {/* Dropdown de sugerencias */}
              {showSuger && sugerencias.length > 0 && (
                <div style={{
                  position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 999,
                  background: 'var(--sur)', border: '1px solid var(--acc)',
                  borderRadius: 8, marginTop: 2, overflow: 'hidden',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.35)'
                }}>
                  {sugerencias.map(sug => (
                    <div key={sug.placa}
                      onMouseDown={() => selectSugerencia(sug)}
                      style={{
                        padding: '10px 14px', cursor: 'pointer', display: 'flex',
                        justifyContent: 'space-between', alignItems: 'center',
                        borderBottom: '1px solid var(--brd)', transition: 'background 0.15s'
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,212,255,0.08)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: 'var(--acc)', fontSize: '1rem' }}>
                        {sug.placa}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--mut)' }}>
                        {sug.tipo_vehiculo}{sug.cliente_nombre ? ` · ${sug.cliente_nombre}` : ''}
                      </span>
                    </div>
                  ))}
                </div>
              )}
              {/* Badge de confirmación cuando ya se seleccionó */}
              {placaData && !showSuger && (
                <div style={{
                  marginTop: 6, padding: '5px 10px', borderRadius: 6,
                  background: 'rgba(0,200,83,0.1)', border: '1px solid rgba(0,200,83,0.3)',
                  fontSize: '0.76rem', color: 'var(--acc3)', display: 'flex', alignItems: 'center', gap: 5,
                  textTransform: 'none', letterSpacing: 0
                }}>
                  ✅ Placa conocida
                </div>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <label style={labelStyle}>Hora de ingreso</label>
              <input style={inputStyle} type="time" name="hora_ingreso"
                value={form.hora_ingreso} onChange={handleChange} required 
                onFocus={e => e.target.style.borderColor = 'var(--acc)'}
                onBlur={e => e.target.style.borderColor = 'var(--brd)'}
              />
            </div>
          </div>

          {/* Empleado */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <label style={labelStyle}>Asignado a</label>
            <select style={{...inputStyle, fontFamily: "'Inter', sans-serif", fontSize: '1rem'}} name="empleado_id" value={form.empleado_id} onChange={handleChange} required
              onFocus={e => { e.target.style.borderColor = 'var(--acc)'; e.target.style.boxShadow = '0 0 0 3px rgba(0,212,255,0.15)' }}
              onBlur={e => { e.target.style.borderColor = 'var(--brd)'; e.target.style.boxShadow = 'none' }}
            >
              <option value="">-- Seleccionar Trabajador --</option>
              {empleados.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
            </select>
          </div>

          {/* Subcategoría */}
          {tieneSubcat && (
            <div style={{ animation: 'fadeIn 0.3s' }}>
              <div style={labelStyle}>Opciones de tamaño (Subcategoría)</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem' }}>
                {subcategoriasVehiculo.map(sub => (
                  <button key={sub.nombre} type="button"
                    onClick={() => setForm(f => ({ ...f, subcategoria: sub.nombre }))}
                    style={{
                      padding: '0.4rem 0.8rem', borderRadius: 20, fontSize: '0.9rem', fontWeight: 600,
                      border: `2px solid ${form.subcategoria === sub.nombre ? 'var(--acc2)' : 'var(--brd)'}`,
                      background: form.subcategoria === sub.nombre ? 'rgba(255,107,43,0.12)' : 'var(--sur2)',
                      color: form.subcategoria === sub.nombre ? 'var(--acc2)' : 'var(--mut)',
                      cursor: 'pointer', transition: 'all 0.15s', flexGrow: 1, minWidth: '80px'
                    }}>
                    {sub.etiqueta}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Tipo de Lavado */}
          <div>
            <div style={labelStyle}>Nivel de limpieza</div>
            <div style={{ display: 'flex', gap: '0.6rem' }}>
              {Object.entries(LAVADOS).map(([key, info]) => (
                <button key={key} type="button"
                  onClick={() => setForm(f => ({ ...f, nivel_suciedad: key }))}
                  style={{
                    flex: 1, padding: '0.8rem 0.5rem', borderRadius: 10, fontSize: '1rem', fontWeight: 700,
                    border: `2px solid ${form.nivel_suciedad === key ? info.color : 'var(--brd)'}`,
                    background: form.nivel_suciedad === key ? `${info.color}15` : 'var(--sur2)',
                    color: form.nivel_suciedad === key ? info.color : 'var(--mut)',
                    cursor: 'pointer', transition: 'all 0.15s',
                  }}>
                  {info.label}
                </button>
              ))}
            </div>
          </div>

          <div className="nuevo-cliente">
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <label style={labelStyle}>Dueño / Cliente (opcional)</label>
              <input style={{...inputStyle, fontFamily: "'Inter', sans-serif", fontSize: '1rem'}} name="cliente_nombre" placeholder="Nombre completo"
                value={form.cliente_nombre} onChange={handleChange}
                onFocus={e => { e.target.style.borderColor = 'var(--acc)'; e.target.style.boxShadow = '0 0 0 3px rgba(0,212,255,0.15)' }}
                onBlur={e => { e.target.style.borderColor = 'var(--brd)'; e.target.style.boxShadow = 'none' }}
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', position: 'relative' }}>
              <label style={labelStyle}>Teléfono (opcional)</label>
              <input style={{...inputStyle, fontFamily: "'Inter', sans-serif", fontSize: '1rem'}} name="cliente_telefono" placeholder="+57 320..."
                value={form.cliente_telefono} onChange={handleChange}
                onFocus={e => { e.target.style.borderColor = 'var(--acc)'; e.target.style.boxShadow = '0 0 0 3px rgba(0,212,255,0.15)' }}
                onBlur={e => { e.target.style.borderColor = 'var(--brd)'; e.target.style.boxShadow = 'none' }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
            <label style={labelStyle}>Nota (opcional)</label>
            <input style={{...inputStyle, fontFamily: "'Inter', sans-serif", fontSize: '1rem'}} name="nota" placeholder="Observaciones adicionales..."
              value={form.nota} onChange={handleChange} 
              onFocus={e => { e.target.style.borderColor = 'var(--acc)'; e.target.style.boxShadow = '0 0 0 3px rgba(0,212,255,0.15)' }}
              onBlur={e => { e.target.style.borderColor = 'var(--brd)'; e.target.style.boxShadow = 'none' }}
            />
          </div>
        </div>

        {/* ══ COLUMNA DERECHA: Adicionales y Resumen ══ */}
        <div className="nuevo-col-right">

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', paddingBottom: '0.5rem' }}>
            <div style={labelStyle}>Añadir Servicios Adicionales</div>
            <div className="nuevo-adicionales-grid" style={{
              flex: 1, overflowY: 'auto', display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
              gap: '0.6rem', alignContent: 'start',
              paddingRight: '6px',
            }}>
              {adicionales.length === 0
                ? <p style={{ color: 'var(--mut)', fontSize: '1rem', gridColumn: '1/-1', textAlign: 'center', marginTop: '2rem' }}>Sin adicionales configurados</p>
                : adicionales.map(a => (
                    <button key={a.id} type="button" onClick={() => toggleAdd(a.id)}
                      style={{
                        display: 'flex', flexDirection: 'column', alignItems: 'flex-start',
                        padding: '0.8rem 1rem', borderRadius: 10, cursor: 'pointer',
                        border: `2px solid ${selAdd[a.id] ? 'var(--acc)' : 'var(--brd)'}`,
                        background: selAdd[a.id] ? 'rgba(0,212,255,0.08)' : 'var(--sur2)',
                        transition: 'all 0.15s',
                        transform: selAdd[a.id] ? 'translateY(-2px)' : 'none',
                        boxShadow: selAdd[a.id] ? '0 4px 12px rgba(0,212,255,0.1)' : 'none'
                      }}>
                      <span style={{ fontSize: '1rem', fontWeight: 600, color: selAdd[a.id] ? 'var(--txt)' : 'var(--mut)', lineHeight: 1.2 }}>
                        {a.nombre}
                      </span>
                      <span style={{ fontSize: '0.9rem', fontWeight: 700, fontFamily: "'JetBrains Mono',monospace", color: 'var(--acc)', marginTop: 6 }}>
                        +${fmt(a.precio)}
                      </span>
                    </button>
                  ))
              }
            </div>
          </div>

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', paddingBottom: '0.5rem', marginTop: '1rem' }}>
            <div style={labelStyle}>Método de Pago</div>
            <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
              {Object.entries(PAYMENT_METHODS).map(([key, label]) => (
                <button key={key} type="button"
                  onClick={() => setForm(f => ({ ...f, metodo_pago: key }))}
                  style={{
                    flex: 1, minWidth: '120px', padding: '0.6rem 0.5rem', borderRadius: 8, fontSize: '0.9rem', fontWeight: 600,
                    border: `2px solid ${form.metodo_pago === key ? 'var(--acc3)' : 'var(--brd)'}`,
                    background: form.metodo_pago === key ? 'rgba(0,230,118,0.1)' : 'var(--sur2)',
                    color: form.metodo_pago === key ? 'var(--acc3)' : 'var(--mut)',
                    cursor: 'pointer', transition: 'all 0.15s',
                  }}>
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="glass-panel" style={{
            padding: '1.2rem', fontSize: '1rem', color: 'var(--mut)',
            display: 'flex', flexDirection: 'column', gap: '0.6rem',
            border: '1px solid rgba(0,230,118,0.2)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Base {form.tipo_vehiculo ? form.tipo_vehiculo.toUpperCase() : '—'}</span>
              <span style={{ color: 'var(--txt)', fontFamily: "'JetBrains Mono',monospace", fontWeight: 500 }}>${fmt(precioBase)}</span>
            </div>
            {subExtra > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Subcategoría extra</span>
                <span style={{ color: 'var(--acc2)', fontFamily: "'JetBrains Mono',monospace", fontWeight: 500 }}>+${fmt(subExtra)}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Nivel: {LAVADOS[form.nivel_suciedad]?.label}</span>
              <span style={{ color: 'var(--txt)', fontFamily: "'JetBrains Mono',monospace", fontWeight: 500 }}>
                ${fmt(Math.round((precioBase + subExtra) * factor))}
              </span>
            </div>
            {adicsSelec.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--acc)' }}>
                  <span>Adicionales ({adicsSelec.length})</span>
                  <span style={{ fontFamily: "'JetBrains Mono',monospace", fontWeight: 600 }}>+${fmt(precioAdics)}</span>
                </div>
                {adicsSelec.map(a => (
                  <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', paddingLeft: '1rem', color: 'var(--mut)' }}>
                    <span>↳ {a.nombre}</span>
                    <span style={{ fontFamily: "'JetBrains Mono',monospace" }}>+${fmt(a.precio)}</span>
                  </div>
                ))}
              </div>
            )}
            
            {tieneDescuentoLealtad && (
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--acc3)', fontWeight: 'bold', background: 'rgba(0,230,118,0.1)', padding: '6px 10px', borderRadius: 6, marginTop: '0.4rem' }}>
                <span>🎁 Descuento Cliente Frecuente</span>
                <span>-10%</span>
              </div>
            )}

            <div style={{ height: 1, background: 'var(--brd)', margin: '0.5rem 0' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--txt)', fontSize: '1.2rem', fontWeight: 700 }}>Total</span>
              <span style={{ fontFamily: "'Outfit',sans-serif", fontSize: '2.4rem', fontWeight: 800, color: 'var(--acc3)', lineHeight: 1, textShadow: '0 0 15px rgba(0,230,118,0.3)' }}>${fmt(precioTotal)}</span>
            </div>
          </div>

          <div className="nuevo-actions" style={{ display: 'flex', gap: '0.8rem' }}>
            <button type="button" className="btn-secondary"
              onClick={() => { setForm(makeEmpty()); setSelAdd({}) }}
              style={{ flex: 1, padding: '1.2rem', fontSize: '1.1rem', borderRadius: 10, fontWeight: 600 }}>
              Limpiar
            </button>
            <button type="submit" className="btn-primary" disabled={loading}
              style={{ flex: 2.5, padding: '1.2rem', fontSize: '1.2rem', fontWeight: 700, borderRadius: 10, letterSpacing: 1 }}>
              {loading ? 'REGISTRANDO...' : 'REGISTRAR LAVADO'}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}