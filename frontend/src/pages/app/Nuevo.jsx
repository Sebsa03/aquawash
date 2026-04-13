import { useState, useEffect } from 'react'
import { getEmpleados, getAdicionales, crearLavado, getVehiculos } from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../components/Toast'

// --- CONSTANTS ---
const SUBCATEGORIAS = {
  carro:  { sedan: 'Sedán', suv: 'SUV +3k', pickup: 'Pickup +4k', van: 'Van +5k', deportivo: 'Deportivo +6k' },
  camion: { sencillo: 'Sencillo', mediano: 'Mediano +5k', grande: 'Grande +10k', tractocamion: 'Tractocamión +15k' },
  bus:    { buseta: 'Buseta', microbus: 'Microbús +3k', bus: 'Bus +8k', articulado: 'Articulado +12k' },
  furgon: { pequeno: 'Pequeño', mediano: 'Mediano +2k', grande: 'Grande +4k', refrigerado: 'Refrigerado +6k' },
}
const SUBPRECIOS = {
  carro:  { sedan: 0, suv: 3000, pickup: 4000, van: 5000, deportivo: 6000 },
  camion: { sencillo: 0, mediano: 5000, grande: 10000, tractocamion: 15000 },
  bus:    { buseta: 0, microbus: 3000, bus: 8000, articulado: 12000 },
  furgon: { pequeno: 0, mediano: 2000, grande: 4000, refrigerado: 6000 },
}
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

const EMPTY = { tipo_vehiculo: '', placa: '', empleado_id: '', hora_ingreso: horaActual(), nota: '', subcategoria: '', nivel_suciedad: 'ligero', cliente_nombre: '', cliente_telefono: '' }

// --- COMPONENT ---
export default function Nuevo() {
  const { role } = useAuth()
  const toast = useToast()
  
  const isDemo = (() => {
    try {
      const token = localStorage.getItem('aw_token')
      return token && JSON.parse(atob(token.split('.')[1])).email === 'demo@aquawash.com'
    } catch(e) { return false }
  })()
  const [empleados, setEmpleados]   = useState([])
  const [adicionales, setAdicionales] = useState([])
  const [vehiculos, setVehiculos]   = useState([])
  const [loading, setLoading]       = useState(false)
  const [selAdd, setSelAdd]         = useState({})
  const [form, setForm]             = useState(EMPTY)

  useEffect(() => {
    Promise.all([getEmpleados(), getAdicionales(), getVehiculos()])
      .then(([emps, adds, vehs]) => {
        setEmpleados(emps)
        setAdicionales(adds)
        setVehiculos(vehs)
      })
      .catch(() => toast?.('Error cargando datos'))
  }, [])

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
  const subExtra       = SUBPRECIOS[form.tipo_vehiculo.toLowerCase()]?.[form.subcategoria] ?? 0
  const factor         = LAVADOS[form.nivel_suciedad]?.factor ?? 1
  const adicsSelec     = adicionales.filter(a => selAdd[a.id])
  const precioAdics    = adicsSelec.reduce((s, a) => s + a.precio, 0)
  const precioTotal    = Math.round((precioBase + subExtra) * factor) + precioAdics

  const tieneSubcat = SUBCATEGORIAS[form.tipo_vehiculo.toLowerCase()]

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
      })
      toast?.(`Lavado registrado — $${fmt(precioTotal)}`)
      setForm({ ...EMPTY, hora_ingreso: horaActual() })
      setSelAdd({})
    } catch (err) {
      toast?.(`Error: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  // LARGER STYLES
  const labelStyle = { marginBottom: '0.4rem', fontSize: '0.9rem', color: 'var(--mut)', textTransform: 'uppercase', letterSpacing: 1, fontWeight: 600 }
  const inputStyle = { padding: '0.8rem 1rem', fontSize: '1.2rem', borderRadius: 8, background: 'var(--sur2)', border: '1px solid var(--brd)', color: 'var(--txt)', outline: 'none', width: '100%', transition: 'border-color 0.2s', fontFamily: "'DM Mono', monospace" }

  return (
    <div style={{ padding: '0.5rem 1rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%' }}>

      {/* ── HEADER ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px solid var(--brd)' }}>
        <h1 style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: '2.4rem', letterSpacing: 3, color: 'var(--acc)', margin: 0 }}>
          Registrar Lavado
        </h1>
        <div style={{ fontFamily: "'DM Mono',monospace", fontSize: '2.8rem', fontWeight: 700, color: 'var(--acc3)', letterSpacing: 1, lineHeight: 1 }}>
          ${fmt(precioTotal)}
        </div>
      </div>

      {/* ── BODY ── */}
      <form onSubmit={handleSubmit} style={{ flex: 1, display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '1.5rem', overflow: 'hidden' }}>

        {/* ══ COLUMNA IZQUIERDA: Datos del vehículo ══ */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem', overflowY: 'auto', paddingRight: '0.5rem' }}>

          {/* Tipo de vehículo */}
          <div>
            <div style={labelStyle}>Tipo de vehículo</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem' }}>
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
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <label style={labelStyle}>Placa</label>
              <input style={inputStyle} name="placa" placeholder="ABC-123"
                value={form.placa} autoComplete="off" required
                onChange={e => setForm(f => ({ ...f, placa: e.target.value.toUpperCase() }))} 
                onFocus={e => e.target.style.borderColor = 'var(--acc)'}
                onBlur={e => e.target.style.borderColor = 'var(--brd)'}
              />
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
            <select style={{...inputStyle, fontFamily: "'DM Sans', sans-serif"}} name="empleado_id" value={form.empleado_id} onChange={handleChange} required
              onFocus={e => e.target.style.borderColor = 'var(--acc)'}
              onBlur={e => e.target.style.borderColor = 'var(--brd)'}
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
                {Object.entries(SUBCATEGORIAS[form.tipo_vehiculo.toLowerCase()]).map(([key, lbl]) => (
                  <button key={key} type="button"
                    onClick={() => setForm(f => ({ ...f, subcategoria: key }))}
                    style={{
                      padding: '0.4rem 0.8rem', borderRadius: 20, fontSize: '0.9rem', fontWeight: 600,
                      border: `2px solid ${form.subcategoria === key ? 'var(--acc2)' : 'var(--brd)'}`,
                      background: form.subcategoria === key ? 'rgba(255,107,43,0.12)' : 'var(--sur2)',
                      color: form.subcategoria === key ? 'var(--acc2)' : 'var(--mut)',
                      cursor: 'pointer', transition: 'all 0.15s', flexGrow: 1, minWidth: '80px'
                    }}>
                    {lbl}
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
                  <div style={{ fontSize: '0.85rem', fontWeight: 500, opacity: 0.8, marginTop: 4 }}>Factor: ×{info.factor}</div>
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <label style={labelStyle}>Dueño / Cliente (opcional)</label>
              <input style={{...inputStyle, fontFamily: "'DM Sans', sans-serif"}} name="cliente_nombre" placeholder="Nombre completo"
                value={form.cliente_nombre} onChange={handleChange}
                onFocus={e => e.target.style.borderColor = 'var(--acc)'}
                onBlur={e => e.target.style.borderColor = 'var(--brd)'}
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <label style={labelStyle}>Teléfono (opcional)</label>
              <input style={{...inputStyle, fontFamily: "'DM Sans', sans-serif"}} name="cliente_telefono" placeholder="+57 320..."
                value={form.cliente_telefono} onChange={handleChange}
                onFocus={e => e.target.style.borderColor = 'var(--acc)'}
                onBlur={e => e.target.style.borderColor = 'var(--brd)'}
              />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
            <label style={labelStyle}>Nota (opcional)</label>
            <input style={{...inputStyle, fontFamily: "'DM Sans', sans-serif"}} name="nota" placeholder="Observaciones adicionales..."
              value={form.nota} onChange={handleChange} 
              onFocus={e => e.target.style.borderColor = 'var(--acc)'}
              onBlur={e => e.target.style.borderColor = 'var(--brd)'}
            />
          </div>
        </div>

        {/* ══ COLUMNA DERECHA: Adicionales y Resumen ══ */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', overflow: 'hidden' }}>

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', paddingBottom: '0.5rem' }}>
            <div style={labelStyle}>Añadir Servicios Adicionales</div>
            <div style={{
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
                      <span style={{ fontSize: '0.9rem', fontWeight: 700, fontFamily: "'DM Mono',monospace", color: 'var(--acc)', marginTop: 6 }}>
                        +${fmt(a.precio)}
                      </span>
                    </button>
                  ))
              }
            </div>
          </div>

          <div style={{
            background: 'var(--sur2)', border: '2px solid var(--brd)', borderRadius: 12,
            padding: '1.2rem', fontSize: '1rem', color: 'var(--mut)',
            display: 'flex', flexDirection: 'column', gap: '0.6rem',
            boxShadow: '0 -10px 30px rgba(0,0,0,0.3)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Base {form.tipo_vehiculo ? form.tipo_vehiculo.toUpperCase() : '—'}</span>
              <span style={{ color: 'var(--txt)', fontFamily: "'DM Mono',monospace", fontWeight: 500 }}>${fmt(precioBase)}</span>
            </div>
            {subExtra > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Subcategoría extra</span>
                <span style={{ color: 'var(--acc2)', fontFamily: "'DM Mono',monospace", fontWeight: 500 }}>+${fmt(subExtra)}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Nivel: {LAVADOS[form.nivel_suciedad]?.label}</span>
              <span style={{ color: 'var(--txt)', fontFamily: "'DM Mono',monospace", fontWeight: 500 }}>
                ×{LAVADOS[form.nivel_suciedad]?.factor} = ${fmt(Math.round((precioBase + subExtra) * factor))}
              </span>
            </div>
            {adicsSelec.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--acc)' }}>
                  <span>Adicionales ({adicsSelec.length})</span>
                  <span style={{ fontFamily: "'DM Mono',monospace", fontWeight: 600 }}>+${fmt(precioAdics)}</span>
                </div>
                {adicsSelec.map(a => (
                  <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', paddingLeft: '1rem', color: 'var(--mut)' }}>
                    <span>↳ {a.nombre}</span>
                    <span style={{ fontFamily: "'DM Mono',monospace" }}>+${fmt(a.precio)}</span>
                  </div>
                ))}
              </div>
            )}
            <div style={{ height: 1, background: 'var(--brd)', margin: '0.5rem 0' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--txt)', fontSize: '1.2rem', fontWeight: 700 }}>Total</span>
              <span style={{ fontFamily: "'DM Mono',monospace", fontSize: '2rem', fontWeight: 700, color: 'var(--acc3)', lineHeight: 1 }}>${fmt(precioTotal)}</span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.8rem' }}>
            <button type="button" className="btn-secondary"
              onClick={() => { setForm({ ...EMPTY, hora_ingreso: horaActual() }); setSelAdd({}) }}
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