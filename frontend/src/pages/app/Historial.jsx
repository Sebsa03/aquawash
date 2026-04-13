import { useState, useEffect, useCallback } from 'react'
import { getLavados, actualizarEstadoLavado, actualizarLavado, getEmpleados, getAdicionales } from '../../services/api'
import { useToast } from '../../components/Toast'
import { useAuth } from '../../context/AuthContext'

function fmt(n) { return Number(n || 0).toLocaleString('es-CO') }

const ESTADOS = [
  { key: 'espera',    label: 'Espera' },
  { key: 'lavando',   label: 'Lavando' },
  { key: 'terminado', label: 'Terminado' },
  { key: 'entregado', label: 'Entregado' }
]

export default function Historial() {
  const toast = useToast()
  const { role } = useAuth()
  
  // Data State
  const [lavados, setLavados] = useState([])
  const [empleados, setEmpleados] = useState([])
  const [adicionales, setAdicionales] = useState([])
  
  // UI State
  const [loading, setLoading] = useState(true)
  const [modoVisual, setModoVisual] = useState('monitor') // 'monitor' | 'historial'
  const [buscar, setBuscar]   = useState('')
  const [tipo, setTipo]       = useState('')
  const [estado, setEstado]   = useState('')
  const [periodo, setPeriodo] = useState('hoy')
  
  // Modal State
  const [editando, setEditando] = useState(null) // null or lavado object
  const [form, setForm] = useState({})
  const [selAdd, setSelAdd] = useState({})

  const cargar = useCallback(async () => {
    setLoading(true)
    try {
      const [data, emps, adics] = await Promise.all([
        getLavados({ periodo, ...(tipo && { tipo }), ...(estado && { estado }) }),
        getEmpleados(),
        getAdicionales()
      ])
      setLavados(data)
      setEmpleados(emps)
      setAdicionales(adics)
    } catch (e) {
      toast?.('Error cargando datos')
    } finally {
      setLoading(false)
    }
  }, [periodo, tipo, estado])

  useEffect(() => { cargar() }, [cargar])

  // ACTIONS
  async function handleCambiarEstado(id, nuevoEstado) {
    let motivo = null
    if (nuevoEstado === 'cancelado') {
      motivo = window.prompt("Motivo de la cancelación (Requerido):")
      if (!motivo || motivo.trim() === '') {
        return toast?.('Debe especificar un motivo para cancelar')
      }
    }
    
    try {
      const res = await actualizarEstadoLavado(id, nuevoEstado, motivo)
      setLavados(prev => prev.map(l => (l.id === id ? res : l)))
      toast?.(`Lavado ${nuevoEstado}`)
    } catch (e) {
      toast?.('Error actualizando estado')
    }
  }

  function openEdit(lavado) {
    setEditando(lavado)
    setForm({
      placa: lavado.placa,
      cliente_nombre: lavado.cliente_nombre || '',
      cliente_telefono: lavado.cliente_telefono || '',
      empleado_id: lavado.empleado_id || '',
      nota: lavado.nota || ''
    })
    
    const inicialAdics = {}
    if (lavado.adicionales_aplicados) {
      lavado.adicionales_aplicados.forEach(a => inicialAdics[a.id] = true)
    }
    setSelAdd(inicialAdics)
  }

  async function saveEdit(e) {
    e.preventDefault()
    try {
      const adicsSeleccionados = adicionales.filter(a => selAdd[a.id])
      const data = {
        ...form,
        empleado_id: form.empleado_id ? Number(form.empleado_id) : null,
        adicionales_aplicados: adicsSeleccionados
      }
      
      const res = await actualizarLavado(editando.id, data)
      setLavados(prev => prev.map(l => l.id === editando.id ? res : l))
      setEditando(null)
      toast?.('Lavado actualizado')
    } catch (error) {
      console.error(error)
      toast?.(`Error al editar lavado: ${error.message}`)
    }
  }

  const filtrados = lavados.filter(l => {
    if (!buscar) return true
    const q = buscar.toLowerCase()
    return l.placa.toLowerCase().includes(q) ||
           (l.cliente_nombre && l.cliente_nombre.toLowerCase().includes(q)) ||
           (l.cliente_telefono && l.cliente_telefono.includes(q))
  })

  const fTime = (timeStr) => timeStr ? String(timeStr).slice(0, 5) : '--:--'

  // Edit Modal Overlay Render
  const renderEditModal = () => {
    if (!editando) return null
    return (
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        background: 'rgba(0,0,0,0.8)', zIndex: 9999, display: 'flex',
        alignItems: 'center', justifyContent: 'center', padding: '1rem'
      }}>
        <div style={{
          background: 'var(--sur)', border: '2px solid var(--brd)',
          borderRadius: 12, padding: '2rem', width: '100%', maxWidth: '500px',
          maxHeight: '90vh', overflowY: 'auto'
        }}>
          <h2 style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: '2rem', color: 'var(--txt)', marginTop: 0 }}>
            Editar Lavado {editando.placa}
          </h2>
          <form onSubmit={saveEdit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: 4, color: 'var(--mut)', fontSize: '0.85rem' }}>Placa</label>
              <input required value={form.placa} onChange={e => setForm(f => ({...f, placa: e.target.value}))}
                style={{ width: '100%', padding: '0.8rem', borderRadius: 8, background: 'var(--sur2)', border: '1px solid var(--brd)', color: 'var(--txt)' }}
              />
            </div>
            
            <div style={{ display: 'flex', gap: '1rem' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: 4, color: 'var(--mut)', fontSize: '0.85rem' }}>Dueño</label>
                <input value={form.cliente_nombre} onChange={e => setForm(f => ({...f, cliente_nombre: e.target.value}))}
                  style={{ width: '100%', padding: '0.8rem', borderRadius: 8, background: 'var(--sur2)', border: '1px solid var(--brd)', color: 'var(--txt)' }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: 4, color: 'var(--mut)', fontSize: '0.85rem' }}>Teléfono</label>
                <input value={form.cliente_telefono} onChange={e => setForm(f => ({...f, cliente_telefono: e.target.value}))}
                  style={{ width: '100%', padding: '0.8rem', borderRadius: 8, background: 'var(--sur2)', border: '1px solid var(--brd)', color: 'var(--txt)' }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: 4, color: 'var(--mut)', fontSize: '0.85rem' }}>Empleado</label>
              <select value={form.empleado_id} onChange={e => setForm(f => ({...f, empleado_id: e.target.value}))}
                style={{ width: '100%', padding: '0.8rem', borderRadius: 8, background: 'var(--sur2)', border: '1px solid var(--brd)', color: 'var(--txt)' }}>
                <option value="">Selecciona Operario</option>
                {empleados.map(emp => (
                  <option key={emp.id} value={emp.id}>{emp.nombre}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: 4, color: 'var(--mut)', fontSize: '0.85rem' }}>Adicionales</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                {adicionales.map(a => (
                  <button type="button" key={a.id}
                    onClick={() => setSelAdd(s => ({ ...s, [a.id]: !s[a.id] }))}
                    style={{
                      padding: '0.5rem', borderRadius: 8, border: `1px solid ${selAdd[a.id] ? 'var(--acc)' : 'var(--brd)'}`,
                      background: selAdd[a.id] ? 'rgba(0,212,255,0.1)' : 'var(--sur2)',
                      color: selAdd[a.id] ? 'var(--txt)' : 'var(--mut)', cursor: 'pointer', textAlign: 'left'
                    }}>
                    <span style={{ fontSize: '0.9rem', display: 'block' }}>{a.nombre}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: 4, color: 'var(--mut)', fontSize: '0.85rem' }}>Nota</label>
              <input value={form.nota} onChange={e => setForm(f => ({...f, nota: e.target.value}))}
                style={{ width: '100%', padding: '0.8rem', borderRadius: 8, background: 'var(--sur2)', border: '1px solid var(--brd)', color: 'var(--txt)' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
              <button type="button" onClick={() => setEditando(null)} style={{ flex: 1, padding: '1rem', background: 'var(--sur2)', border: 'none', borderRadius: 8, color: 'var(--txt)', cursor: 'pointer', fontWeight: 600 }}>Cancelar</button>
              <button className="btn-primary" type="submit" style={{ flex: 1, padding: '1rem', borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 600 }}>Guardar Cambios</button>
            </div>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {renderEditModal()}
      
      <div style={{ marginBottom: '1.2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: '2rem', letterSpacing: 2, margin: 0, color: 'var(--acc)' }}>
          {role === 'dueno' ? (modoVisual === 'monitor' ? '🟢 Operaciones en Vivo' : '📆 Archivo Histórico') : '📆 Historial de Lavados'}
        </h1>
        
        {role === 'dueno' && (
          <div style={{ display: 'flex', gap: 8, background: 'rgba(0,0,0,0.3)', padding: 4, borderRadius: 8 }}>
            <button 
              className={`tab ${modoVisual === 'monitor' ? 'active' : ''}`} 
              onClick={() => { setModoVisual('monitor'); setPeriodo('hoy'); }}
              style={{ padding: '6px 14px', fontSize: 13, border: 'none' }}>
              Monitor
            </button>
            <button 
              className={`tab ${modoVisual === 'historial' ? 'active' : ''}`} 
              onClick={() => { setModoVisual('historial'); setPeriodo('semana'); }}
              style={{ padding: '6px 14px', fontSize: 13, border: 'none' }}>
              Historial
            </button>
          </div>
        )}
      </div>

      <div className="search-bar">
        <input
          placeholder="Buscar por placa, cliente o teléfono..."
          value={buscar}
          onChange={e => setBuscar(e.target.value)}
        />
        <select value={tipo} onChange={e => setTipo(e.target.value)}>
          <option value="">Todos los vehículos</option>
          <option value="moto">Moto</option>
          <option value="carro">Carro</option>
          <option value="furgon">Furgón</option>
          <option value="camion">Camión</option>
          <option value="bus">Bus</option>
        </select>
        <select value={estado} onChange={e => setEstado(e.target.value)} style={{ minWidth: 140 }}>
          <option value="">Todos los estados</option>
          <option value="espera">En Espera</option>
          <option value="lavando">Lavando</option>
          <option value="terminado">Terminado</option>
          <option value="entregado">Entregado</option>
          <option value="cancelado">Cancelados</option>
        </select>
      </div>

      {(role !== 'dueno' || modoVisual === 'historial') && (
        <div className="tabs" style={{ marginBottom: '1.5rem' }}>
          {[
            { v: 'hoy',    l: 'Hoy' },
            { v: 'semana', l: 'Última Semana' },
            { v: 'mes',    l: 'Mes' },
            { v: 'todo',   l: 'Todo' },
          ].map(t => (
            <button key={t.v} className={`tab ${periodo === t.v ? 'active' : ''}`}
              onClick={() => setPeriodo(t.v)}>
              {t.l}
            </button>
          ))}
        </div>
      )}

      {(() => {
        if (filtrados.length === 0) return null;
        
        const cTotal = filtrados.length;
        const cEspera = filtrados.filter(f => f.estado_actual === 'espera').length;
        const cLavando = filtrados.filter(f => f.estado_actual === 'lavando').length;
        const cTerminado = filtrados.filter(f => f.estado_actual === 'terminado').length;
        const cEntregado = filtrados.filter(f => f.estado_actual === 'entregado').length;
        const cCancelado = filtrados.filter(f => f.estado_actual === 'cancelado').length;
        const totalDinero = filtrados.filter(f => f.estado_actual !== 'cancelado').reduce((s, l) => s + l.precio_total, 0);

        return (
          <div style={{ marginBottom: '1.2rem', padding: '1rem', background: 'var(--sur2)', border: '1px solid var(--brd)', borderRadius: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
              <div style={{ display: 'flex', gap: '0.8rem', flexWrap: 'wrap', alignItems: 'center' }}>
                <span style={{ fontSize: 13, background: 'rgba(255,255,255,0.05)', padding: '6px 12px', borderRadius: 20, color: '#fff' }}>General: <strong>{cTotal}</strong></span>
                <span style={{ fontSize: 13, background: 'rgba(255,255,255,0.05)', padding: '6px 12px', borderRadius: 20, color: 'var(--mut)' }}>⏳ Espera: <strong style={{color:'#fff'}}>{cEspera}</strong></span>
                <span style={{ fontSize: 13, background: 'rgba(0,212,255,0.1)',   padding: '6px 12px', borderRadius: 20, color: 'var(--acc)' }}>💦 Lavando: <strong>{cLavando}</strong></span>
                <span style={{ fontSize: 13, background: 'rgba(126,255,110,0.1)', padding: '6px 12px', borderRadius: 20, color: 'var(--acc3)' }}>✅ Terminado: <strong>{cTerminado}</strong></span>
                <span style={{ fontSize: 13, background: 'rgba(255,255,255,0.1)', padding: '6px 12px', borderRadius: 20, color: '#fff' }}>🚗 Entregado: <strong>{cEntregado}</strong></span>
                <span style={{ fontSize: 13, background: 'rgba(255,68,68,0.1)', padding: '6px 12px', borderRadius: 20, color: 'var(--dan)' }}>🚫 Cancelado: <strong>{cCancelado}</strong></span>
              </div>
              <div style={{ fontSize: '1rem', color: 'var(--mut)', textAlign: 'right' }}>
                Total Acumulado: <strong style={{ color: 'var(--acc3)', fontFamily: "'DM Mono',monospace", fontSize: '1.4rem', marginLeft: 8 }}>${fmt(totalDinero)}</strong>
              </div>
            </div>
          </div>
        )
      })()}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--mut)' }}>Cargando...</div>
      ) : filtrados.length === 0 ? (
        <div className="empty-state">🔍 Sin registros para mostrar</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', paddingBottom: '1rem' }}>
          {filtrados.map((l) => {
            const isCancelado = l.estado_actual === 'cancelado'
            const isFinished = l.estado_actual === 'entregado'
            const indexEstadoActual = ESTADOS.findIndex(e => e.key === (l.estado_actual || 'espera'))
            
            return (
              <div key={l.id} style={{
                background: 'var(--sur2)', border: '1px solid var(--brd)',
                borderRadius: 12, padding: '1rem 1.2rem',
                display: 'flex', flexDirection: 'column', gap: '0.8rem',
                position: 'relative', overflow: 'hidden',
                opacity: isCancelado ? 0.6 : 1
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <span style={{ fontSize: '1.4rem', fontWeight: 800, fontFamily: "'DM Mono',monospace", textDecoration: isCancelado ? 'line-through' : 'none' }}>{l.placa}</span>
                    <span style={{ 
                      fontSize: '0.75rem', fontWeight: 700, padding: '2px 8px', borderRadius: 20, 
                      textTransform: 'uppercase', background: 'rgba(255,255,255,0.05)', color: 'var(--mut)' 
                    }}>
                      {l.tipo_vehiculo} {l.subcategoria ? `(${l.subcategoria})` : ''}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <span style={{ fontSize: '1.4rem', fontWeight: 700, fontFamily: "'DM Mono',monospace", color: isCancelado ? 'var(--dan)' : 'var(--acc3)' }}>
                      ${fmt(l.precio_total)}
                    </span>
                    {!isCancelado && role !== 'dueno' && (
                      <button className="del-btn" style={{ background: 'transparent', color: 'var(--acc2)', padding: '4px' }} onClick={() => openEdit(l)}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>
                      </button>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', fontSize: '0.9rem', color: 'var(--mut)' }}>
                  {l.empleado_nombre && (
                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                      <span title="Operario">👷</span> <span style={{ color: 'var(--txt)', fontWeight: 'bold' }}>{l.empleado_nombre}</span>
                    </div>
                  )}
                  {l.cliente_nombre && (
                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                      <span title="Cliente">👤</span> <span style={{ color: 'var(--txt)' }}>{l.cliente_nombre}</span>
                    </div>
                  )}
                  {l.cliente_telefono && (
                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                      <span title="Teléfono">📞</span> <span style={{ color: 'var(--txt)' }}>{l.cliente_telefono}</span>
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: '0.4rem' }}>
                    <span title="Nivel de suciedad">💧</span> <span style={{ color: 'var(--txt)', textTransform: 'capitalize' }}>{l.nivel_suciedad || 'Ligero'}</span>
                  </div>
                  {l.adicionales_aplicados?.length > 0 && (
                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                      <span title="Adicionales">➕</span> 
                      <span style={{ color: 'var(--txt)' }}>{l.adicionales_aplicados.map(a => a.nombre).join(', ')}</span>
                    </div>
                  )}
                  {l.nota && (
                    <div style={{ display: 'flex', gap: '0.4rem', width: '100%', fontStyle: 'italic', color: 'var(--acc2)' }}>
                      <span title="Nota">📝</span> <span>{l.nota}</span>
                    </div>
                  )}
                </div>

                {isCancelado ? (
                  <div style={{ marginTop: '0.5rem', background: 'rgba(255, 68, 68, 0.1)', border: '1px solid var(--dan)', padding: '1rem', borderRadius: 8 }}>
                    <div style={{ color: 'var(--dan)', fontWeight: 800, fontSize: '1.2rem', letterSpacing: 1 }}>CANCELADO - {fTime(l.hora_cancelado)}</div>
                    <div style={{ color: 'var(--txt)', marginTop: '0.3rem', fontSize: '0.9rem' }}>Motivo: {l.motivo_cancelacion}</div>
                  </div>
                ) : (
                  <div style={{ 
                    marginTop: '0.5rem', display: 'flex', alignItems: 'center', 
                    justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem',
                    background: 'rgba(0,0,0,0.2)', padding: '0.8rem', borderRadius: 8
                  }}>
                    {ESTADOS.map((estado, idx) => {
                      const isCompleted = idx <= indexEstadoActual
                      const isCurrent = idx === indexEstadoActual
                      
                      let horaStr = '--:--'
                      if (estado.key === 'espera') horaStr = fTime(l.hora_ingreso)
                      else if (estado.key === 'lavando') horaStr = fTime(l.hora_lavando)
                      else if (estado.key === 'terminado') horaStr = fTime(l.hora_terminado)
                      else if (estado.key === 'entregado') horaStr = fTime(l.hora_entregado)

                      return (
                        <div key={estado.key} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, minWidth: '70px' }}>
                          <button 
                            disabled={role === 'dueno'}
                            onClick={() => handleCambiarEstado(l.id, estado.key)}
                            style={{
                              background: isCurrent ? 'var(--acc)' : isCompleted ? 'rgba(0,212,255,0.2)' : 'var(--sur)',
                              color: isCurrent ? '#000' : isCompleted ? 'var(--acc)' : 'var(--mut)',
                              border: `1px solid ${isCompleted ? 'var(--acc)' : 'var(--brd)'}`,
                              borderRadius: 20, padding: '0.3rem 0.6rem', fontSize: '0.75rem', fontWeight: 700,
                              cursor: role === 'dueno' ? 'default' : 'pointer', transition: 'all 0.2s', width: '100%', maxWidth: '100px',
                              textTransform: 'uppercase', letterSpacing: 0.5,
                              opacity: role === 'dueno' && !isCurrent && !isCompleted ? 0.3 : 1
                          }}>
                            {estado.label}
                          </button>
                          <span style={{ marginTop: '0.4rem', fontSize: '0.75rem', fontFamily: "'DM Mono',monospace", color: isCompleted ? 'var(--txt)' : 'var(--mut)' }}>
                            {horaStr}
                          </span>
                        </div>
                      )
                    })}
                    
                    {role !== 'dueno' && (
                      <button onClick={() => handleCambiarEstado(l.id, 'cancelado')}
                        style={{
                          marginLeft: 'auto', background: 'rgba(255,68,68,0.1)', color: 'var(--dan)',
                          border: '1px solid var(--dan)', borderRadius: 20, padding: '0.3rem 0.6rem',
                          fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', textTransform: 'uppercase'
                        }}>
                        Cancelar
                      </button>
                    )}
                  </div>
                )}
                
              </div>
            )
          })}
        </div>
      )}

    </div>
  )
}