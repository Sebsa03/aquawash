import { useState, useEffect } from 'react'
import { getEmpleados, getAdicionales, crearLavado } from '../../services/api'
import { useToast } from '../../components/Toast'

const PRECIOS_TIPO = { moto: 0, carro: 0, furgon: 0, camion: 0, bus: 0 }

function fmt(n) { return Number(n || 0).toLocaleString('es-CO') }

function horaActual() {
  const n = new Date()
  return `${String(n.getHours()).padStart(2,'0')}:${String(n.getMinutes()).padStart(2,'0')}`
}

export default function Nuevo() {
  const toast = useToast()
  const [empleados, setEmpleados]   = useState([])
  const [adicionales, setAdicionales] = useState([])
  const [loading, setLoading]       = useState(false)
  const [selAdd, setSelAdd]         = useState({})

  const [form, setForm] = useState({
    tipo_vehiculo: '',
    placa: '',
    empleado_id: '',
    hora_ingreso: horaActual(),
    nota: '',
  })

  const [precioBase, setPrecioBase] = useState(0)

  useEffect(() => {
    async function cargar() {
      try {
        const [emps, adds] = await Promise.all([getEmpleados(), getAdicionales()])
        setEmpleados(emps)
        setAdicionales(adds)
      } catch (e) {
        toast?.('Error cargando datos')
      }
    }
    cargar()
  }, [])

  function handleChange(e) {
    const { name, value } = e.target
    setForm(f => ({ ...f, [name]: value }))
    if (name === 'tipo_vehiculo') setPrecioBase(PRECIOS_TIPO[value] || 0)
  }

  function toggleAdd(id) {
    setSelAdd(s => ({ ...s, [id]: !s[id] }))
  }

  const adicsSeleccionados = adicionales.filter(a => selAdd[a.id])
  const precioAdics = adicsSeleccionados.reduce((s, a) => s + a.precio, 0)
  const precioTotal = precioBase + precioAdics

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.tipo_vehiculo) return toast?.('⚠️ Selecciona el tipo de vehículo')
    if (!form.placa.trim())  return toast?.('⚠️ Ingresa la placa')
    if (!form.empleado_id)   return toast?.('⚠️ Selecciona el empleado')

    setLoading(true)
    try {
      await crearLavado({
        placa: form.placa.toUpperCase(),
        tipo_vehiculo: form.tipo_vehiculo,
        empleado_id: parseInt(form.empleado_id),
        hora_ingreso: form.hora_ingreso + ':00',
        adicionales_aplicados: adicsSeleccionados.map(a => ({ nombre: a.nombre, precio: a.precio })),
        etiquetas_estado: [],
        nota: form.nota || null,
      })
      toast?.(`✔ Lavado registrado — $${fmt(precioTotal)}`)
      setForm({ tipo_vehiculo:'', placa:'', empleado_id:'', hora_ingreso: horaActual(), nota:'' })
      setPrecioBase(0)
      setSelAdd({})
    } catch (e) {
      toast?.(`Error: ${e.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div style={{ marginBottom: '1.2rem' }}>
        <h1 style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: '1.6rem', letterSpacing: 2 }}>
          Registrar Lavado
        </h1>
      </div>

      <div className="card" style={{ borderColor: 'rgba(0,212,255,0.2)' }}>
        <form onSubmit={handleSubmit}>
          <div className="form-grid" style={{ marginBottom: '1rem' }}>

            <div className="form-group">
              <label className="form-label">Tipo de Vehículo</label>
              <select className="input-base" name="tipo_vehiculo"
                value={form.tipo_vehiculo} onChange={handleChange} required>
                <option value="">— Seleccionar —</option>
                <option value="moto">🏍 Moto</option>
                <option value="carro">🚗 Carro</option>
                <option value="furgon">🚐 Furgón</option>
                <option value="camion">🚚 Camión</option>
                <option value="bus">🚌 Bus</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Placa / Identificador</label>
              <input className="input-base" name="placa"
                placeholder="ABC-123"
                value={form.placa}
                onChange={e => setForm(f => ({ ...f, placa: e.target.value.toUpperCase() }))}
                autoComplete="off" required />
            </div>

            <div className="form-group">
              <label className="form-label">Empleado</label>
              <select className="input-base" name="empleado_id"
                value={form.empleado_id} onChange={handleChange} required>
                <option value="">— Seleccionar —</option>
                {empleados.map(e => (
                  <option key={e.id} value={e.id}>{e.nombre}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Hora de Ingreso</label>
              <input className="input-base" type="time" name="hora_ingreso"
                value={form.hora_ingreso} onChange={handleChange} required />
            </div>
          </div>

          {/* Adicionales */}
          <div style={{ marginBottom: '1rem' }}>
            <div className="form-label" style={{ marginBottom: 8 }}>Servicios Adicionales</div>
            {adicionales.length === 0 ? (
              <p style={{ fontSize: 12, color: 'var(--mut)' }}>Sin adicionales configurados</p>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(155px,1fr))', gap: 6 }}>
                {adicionales.map(a => (
                  <label key={a.id}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 6,
                      background: 'var(--sur2)',
                      border: `1px solid ${selAdd[a.id] ? 'var(--acc)' : 'var(--brd)'}`,
                      borderRadius: 6, padding: '6px 8px', cursor: 'pointer',
                      fontSize: 12, userSelect: 'none', transition: 'all 0.15s',
                      background: selAdd[a.id] ? 'rgba(0,212,255,0.06)' : 'var(--sur2)'
                    }}
                  >
                    <input type="checkbox" checked={!!selAdd[a.id]}
                      onChange={() => toggleAdd(a.id)}
                      style={{ accentColor: 'var(--acc)', width: 13, height: 13, flexShrink: 0 }} />
                    <span>{a.nombre}</span>
                    <span style={{ marginLeft: 'auto', color: 'var(--mut)', fontFamily: "'DM Mono',monospace", fontSize: 10 }}>
                      +${fmt(a.precio)}
                    </span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Nota */}
          <div className="form-group" style={{ marginBottom: '1rem' }}>
            <label className="form-label">Nota (opcional)</label>
            <input className="input-base" name="nota"
              placeholder="Observaciones del vehículo..."
              value={form.nota} onChange={handleChange} />
          </div>

          {/* Precio preview */}
          <div className="precio-preview">
            <div style={{ fontSize: 12, color: 'var(--mut)', flex: 1 }}>
              {form.tipo_vehiculo
                ? `Base: $${fmt(precioBase)}${adicsSeleccionados.length ? `  +  ${adicsSeleccionados.map(a => a.nombre).join(', ')}: $${fmt(precioAdics)}` : ''}`
                : 'Selecciona el tipo de vehículo'}
            </div>
            <div className="precio-total">${fmt(precioTotal)}</div>
          </div>

          <div style={{ display: 'flex', gap: 10, marginTop: '1rem', flexWrap: 'wrap' }}>
            <button className="btn-primary" type="submit" disabled={loading}>
              {loading ? 'Registrando...' : '✔ Registrar'}
            </button>
            <button className="btn-secondary" type="button"
              onClick={() => {
                setForm({ tipo_vehiculo:'', placa:'', empleado_id:'', hora_ingreso: horaActual(), nota:'' })
                setPrecioBase(0)
                setSelAdd({})
              }}>
              ↺ Limpiar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}