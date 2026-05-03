import { useState, useEffect } from 'react'
import { getResumenCaja, getEgresos, crearEgreso, eliminarEgreso, getCierreCaja, getCierresCaja, crearCierreCaja } from '../../services/api'
import { useToast } from '../../components/Toast'

function fmt(n) { return Number(n || 0).toLocaleString('es-CO') }

function getLocalDateStr() {
  const d = new Date()
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset())
  return d.toISOString().slice(0,10)
}

export default function Caja() {
  const toast = useToast()
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('diario') // 'diario' | 'historial'
  
  // Date State (Diario)
  const [fecha, setFecha] = useState(getLocalDateStr())
  
  // Data (Diario)
  const [resumen, setResumen] = useState({
    ingresos_efectivo: 0, ingresos_tarjeta: 0, ingresos_transferencia: 0,
    ingresos_total: 0, egresos_total: 0, utilidad_neta: 0
  })
  const [egresos, setEgresos] = useState([])
  const [cierre, setCierre] = useState(null)
  
  // Form Egreso
  const [nuevoConcepto, setNuevoConcepto] = useState('')
  const [nuevoMonto, setNuevoMonto] = useState('')
  const [savingEgreso, setSavingEgreso] = useState(false)

  // Cierre de caja Form
  const [closing, setClosing] = useState(false)
  const [showCloseModal, setShowCloseModal] = useState(false)
  const [observacionTemp, setObservacionTemp] = useState('')

  // Historial de Cierres
  const [cierresHistoricos, setCierresHistoricos] = useState([])
  const [loadingHistorial, setLoadingHistorial] = useState(false)

  useEffect(() => {
    if (activeTab === 'diario') {
      cargarCajaDiaria()
    } else {
      cargarHistorialCierres()
    }
  }, [fecha, activeTab])

  async function cargarCajaDiaria() {
    setLoading(true)
    try {
      const [resCaja, listaEgresos, estadoCierre] = await Promise.all([
        getResumenCaja(fecha, fecha),
        getEgresos(fecha),
        getCierreCaja(fecha)
      ])
      setResumen(resCaja)
      setEgresos(listaEgresos)
      setCierre(estadoCierre)
    } catch (e) {
      toast?.('Error cargando la caja diaria')
    } finally {
      setLoading(false)
    }
  }

  async function cargarHistorialCierres() {
    setLoadingHistorial(true)
    try {
      const lista = await getCierresCaja()
      setCierresHistoricos(lista)
    } catch (e) {
      toast?.('Error cargando historial de cierres')
    } finally {
      setLoadingHistorial(false)
    }
  }

  async function handleAgregarEgreso(e) {
    e.preventDefault()
    if (cierre) return toast?.('La caja ya está cerrada para esta fecha')
    if (!nuevoConcepto.trim()) return toast?.('Ingresa el concepto del egreso')
    if (!nuevoMonto || isNaN(nuevoMonto) || parseInt(nuevoMonto) <= 0) return toast?.('Ingresa un monto válido')
    
    setSavingEgreso(true)
    try {
      await crearEgreso(nuevoConcepto, nuevoMonto)
      toast?.('✔ Egreso registrado')
      setNuevoConcepto('')
      setNuevoMonto('')
      await cargarCajaDiaria()
    } catch (e) {
      toast?.('Error al registrar egreso')
    } finally {
      setSavingEgreso(false)
    }
  }

  async function handleEliminarEgreso(id, concepto) {
    if (cierre) return toast?.('La caja ya está cerrada')
    if (!confirm(`¿Eliminar el egreso de "${concepto}"?`)) return
    try {
      await eliminarEgreso(id)
      toast?.('🗑 Egreso eliminado')
      await cargarCajaDiaria()
    } catch (e) {
      toast?.('Error al eliminar')
    }
  }

  function confirmarCierreModal() {
    setShowCloseModal(true)
    setObservacionTemp('')
  }

  async function handleCerrarCajaConfirmado() {
    setShowCloseModal(false)
    setClosing(true)
    try {
      await crearCierreCaja({ fecha_cierre: fecha, observaciones: observacionTemp || null })
      toast?.('🔒 Caja cerrada exitosamente')
      await cargarCajaDiaria()
    } catch (e) {
      toast?.(e.message || 'Error al cerrar caja')
    } finally {
      setClosing(false)
    }
  }

  return (
    <div style={{ paddingBottom: '2rem' }}>
      <div style={{ marginBottom:'1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontFamily:"'Outfit',sans-serif", fontSize:'clamp(1.8rem, 5vw, 2.4rem)', letterSpacing:0.5, color: 'var(--acc)', margin: 0, textShadow: '0 0 15px rgba(0,212,255,0.3)' }}>
            Control Financiero
          </h1>
          <p style={{ color:'var(--mut)', fontSize: '1rem', marginTop: 4, fontFamily: "'Inter', sans-serif" }}>Flujo de efectivo y cierres de caja.</p>
        </div>
      </div>

      <div className="tabs" style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem', borderBottom: '1px solid var(--brd)' }}>
        <button 
          className={`tab ${activeTab === 'diario' ? 'active' : ''}`} 
          onClick={() => setActiveTab('diario')}
          style={{ padding: '0.8rem 1.5rem', background: 'none', border: 'none', color: activeTab === 'diario' ? 'var(--acc)' : 'var(--mut)', borderBottom: activeTab === 'diario' ? '3px solid var(--acc)' : '3px solid transparent', fontSize: '1rem', fontWeight: 600, cursor: 'pointer' }}
        >
          Caja Diaria
        </button>
        <button 
          className={`tab ${activeTab === 'historial' ? 'active' : ''}`} 
          onClick={() => setActiveTab('historial')}
          style={{ padding: '0.8rem 1.5rem', background: 'none', border: 'none', color: activeTab === 'historial' ? 'var(--acc)' : 'var(--mut)', borderBottom: activeTab === 'historial' ? '3px solid var(--acc)' : '3px solid transparent', fontSize: '1rem', fontWeight: 600, cursor: 'pointer' }}
        >
          Historial de Cierres
        </button>
      </div>

      {activeTab === 'diario' && (
        <div style={{ animation: 'fadeIn 0.3s ease' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <input 
                type="date" 
                value={fecha} 
                onChange={e => setFecha(e.target.value)}
                style={{ padding: '0.8rem', background: 'var(--sur2)', border: '1px solid var(--acc)', borderRadius: 8, color: 'var(--txt)', fontSize: '1rem', fontFamily: "'JetBrains Mono', monospace", outline: 'none' }}
              />
              {cierre && (
                <span style={{ background: 'rgba(255,68,68,0.1)', color: 'var(--dan)', padding: '6px 12px', borderRadius: 20, fontSize: '0.8rem', fontWeight: 800, border: '1px solid var(--dan)', letterSpacing: 1 }}>
                  🔒 CAJA CERRADA
                </span>
              )}
            </div>
            
            {!cierre && !loading && (
              <button onClick={confirmarCierreModal} disabled={closing} style={{ background: 'var(--dan)', color: '#fff', border: 'none', padding: '0.8rem 1.5rem', borderRadius: 8, fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 15px rgba(255,68,68,0.3)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                {closing ? 'Cerrando...' : '🔒 Cerrar Caja del Día'}
              </button>
            )}
          </div>

          {/* KPI CARDS */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
            <div className="glass-panel" style={{ padding: '1.5rem', borderBottom: '4px solid var(--acc)', display: 'flex', flexDirection: 'column', gap: '0.5rem', opacity: cierre ? 0.8 : 1 }}>
              <span style={{ color: 'var(--mut)', textTransform: 'uppercase', fontSize: '0.8rem', letterSpacing: 1, fontWeight: 700 }}>Total Ingresos</span>
              <span style={{ fontFamily: "'Outfit',sans-serif", fontSize: '2.5rem', fontWeight: 800, color: 'var(--txt)' }}>${fmt(resumen.ingresos_total)}</span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', marginTop: '0.5rem', fontSize: '0.85rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--mut)' }}><span>💵 Efectivo</span> <span style={{ fontFamily: "'JetBrains Mono',monospace" }}>${fmt(resumen.ingresos_efectivo)}</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--mut)' }}><span>💳 Tarjeta</span> <span style={{ fontFamily: "'JetBrains Mono',monospace" }}>${fmt(resumen.ingresos_tarjeta)}</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--mut)' }}><span>🏦 Transferencia</span> <span style={{ fontFamily: "'JetBrains Mono',monospace" }}>${fmt(resumen.ingresos_transferencia)}</span></div>
              </div>
            </div>

            <div className="glass-panel" style={{ padding: '1.5rem', borderBottom: '4px solid var(--dan)', display: 'flex', flexDirection: 'column', gap: '0.5rem', opacity: cierre ? 0.8 : 1 }}>
              <span style={{ color: 'var(--mut)', textTransform: 'uppercase', fontSize: '0.8rem', letterSpacing: 1, fontWeight: 700 }}>Total Egresos</span>
              <span style={{ fontFamily: "'Outfit',sans-serif", fontSize: '2.5rem', fontWeight: 800, color: 'var(--dan)' }}>${fmt(resumen.egresos_total)}</span>
              <span style={{ color: 'var(--mut)', fontSize: '0.85rem', marginTop: 'auto' }}>Dinero que salió de la caja hoy.</span>
            </div>

            <div className="glass-panel" style={{ padding: '1.5rem', borderBottom: `4px solid ${resumen.utilidad_neta >= 0 ? 'var(--acc3)' : 'var(--dan)'}`, display: 'flex', flexDirection: 'column', gap: '0.5rem', background: resumen.utilidad_neta >= 0 ? 'rgba(0,230,118,0.05)' : 'rgba(255,68,68,0.05)', opacity: cierre ? 0.8 : 1 }}>
              <span style={{ color: 'var(--mut)', textTransform: 'uppercase', fontSize: '0.8rem', letterSpacing: 1, fontWeight: 700 }}>Utilidad Neta</span>
              <span style={{ fontFamily: "'Outfit',sans-serif", fontSize: '2.5rem', fontWeight: 800, color: resumen.utilidad_neta >= 0 ? 'var(--acc3)' : 'var(--dan)' }}>
                ${fmt(resumen.utilidad_neta)}
              </span>
              <span style={{ color: 'var(--mut)', fontSize: '0.85rem', marginTop: 'auto' }}>Ingresos menos egresos.</span>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
            
            {/* REGISTRAR EGRESO */}
            <div className="glass-panel" style={{ padding: '1.5rem', alignSelf: 'start', opacity: cierre ? 0.5 : 1, pointerEvents: cierre ? 'none' : 'auto' }}>
              <h2 style={{ fontSize: '1.2rem', color: 'var(--txt)', margin: 0, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                💸 Registrar Egreso
              </h2>
              <form onSubmit={handleAgregarEgreso} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--mut)', marginBottom: '4px', display: 'block' }}>Concepto o Detalle</label>
                  <input 
                    placeholder="Ej: Pago de energía, Insumos..."
                    value={nuevoConcepto} onChange={e => setNuevoConcepto(e.target.value)} disabled={cierre !== null}
                    style={{ width: '100%', padding: '0.8rem', background: 'var(--sur2)', border: '1px solid var(--brd)', borderRadius: 8, color: 'var(--txt)', outline: 'none' }} 
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--mut)', marginBottom: '4px', display: 'block' }}>Monto a descontar ($)</label>
                  <input 
                    type="number" placeholder="0"
                    value={nuevoMonto} onChange={e => setNuevoMonto(e.target.value)} disabled={cierre !== null}
                    style={{ width: '100%', padding: '0.8rem', background: 'var(--sur2)', border: '1px solid var(--brd)', borderRadius: 8, color: 'var(--txt)', fontFamily: "'JetBrains Mono', monospace", outline: 'none' }} 
                  />
                </div>
                <button type="submit" className="btn-primary" disabled={savingEgreso || cierre !== null} style={{ background: 'var(--dan)', padding: '0.8rem', marginTop: '0.5rem', borderRadius: 8, fontWeight: 'bold' }}>
                  {savingEgreso ? 'Registrando...' : 'Registrar Salida'}
                </button>
              </form>
            </div>

            {/* LISTA DE EGRESOS */}
            <div className="glass-panel" style={{ padding: '1.5rem' }}>
              <h2 style={{ fontSize: '1.2rem', color: 'var(--txt)', margin: 0, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                📋 Lista de Egresos
              </h2>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                {loading ? (
                  <span style={{ color: 'var(--mut)', textAlign: 'center', padding: '1rem' }}>Cargando...</span>
                ) : egresos.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '2rem 1rem', background: 'rgba(255,255,255,0.02)', borderRadius: 8, border: '1px dashed var(--brd)', color: 'var(--mut)' }}>
                    No hay egresos en esta fecha.
                  </div>
                ) : (
                  egresos.map(e => (
                    <div key={e.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.8rem 1rem', background: 'var(--sur2)', borderRadius: 8, borderLeft: '3px solid var(--dan)' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <span style={{ color: 'var(--txt)', fontWeight: 600 }}>{e.concepto}</span>
                        <span style={{ color: 'var(--mut)', fontSize: '0.75rem' }}>{new Date(e.fecha).toLocaleTimeString('es-CO')}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <span style={{ fontFamily: "'JetBrains Mono', monospace", color: 'var(--dan)', fontWeight: 700 }}>
                          -${fmt(e.monto)}
                        </span>
                        {!cierre && (
                          <button onClick={() => handleEliminarEgreso(e.id, e.concepto)} style={{ background: 'transparent', border: 'none', color: 'var(--mut)', cursor: 'pointer', padding: '4px', opacity: 0.6 }}>✖</button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>
        </div>
      )}

      {activeTab === 'historial' && (
        <div className="glass-panel" style={{ padding: '1.5rem', animation: 'fadeIn 0.3s ease' }}>
          <h2 style={{ fontSize: '1.2rem', color: 'var(--txt)', margin: 0, marginBottom: '1.5rem' }}>📅 Registro Histórico de Cierres</h2>
          
          {loadingHistorial ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--mut)' }}>Cargando historial...</div>
          ) : cierresHistoricos.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--mut)', background: 'var(--sur2)', borderRadius: 8 }}>No hay cierres de caja registrados aún.</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '800px' }}>
                <thead>
                  <tr style={{ background: 'var(--sur)', color: 'var(--mut)', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: 1 }}>
                    <th style={{ padding: '1rem', borderBottom: '1px solid var(--brd)' }}>Fecha Cierre</th>
                    <th style={{ padding: '1rem', borderBottom: '1px solid var(--brd)' }}>Hora de Cierre</th>
                    <th style={{ padding: '1rem', borderBottom: '1px solid var(--brd)' }}>Ingresos</th>
                    <th style={{ padding: '1rem', borderBottom: '1px solid var(--brd)' }}>Egresos</th>
                    <th style={{ padding: '1rem', borderBottom: '1px solid var(--brd)' }}>Utilidad Neta</th>
                    <th style={{ padding: '1rem', borderBottom: '1px solid var(--brd)' }}>Observaciones</th>
                  </tr>
                </thead>
                <tbody>
                  {cierresHistoricos.map(c => (
                    <tr key={c.id} style={{ borderBottom: '1px solid var(--brd)', transition: 'background 0.2s', ':hover': { background: 'rgba(255,255,255,0.02)' } }}>
                      <td style={{ padding: '1rem', fontWeight: 600, color: 'var(--txt)' }}>{c.fecha_cierre}</td>
                      <td style={{ padding: '1rem', color: 'var(--mut)', fontSize: '0.9rem' }}>{new Date(c.creado_en).toLocaleTimeString('es-CO')}</td>
                      <td style={{ padding: '1rem', color: 'var(--acc)', fontFamily: "'JetBrains Mono',monospace", fontWeight: 700 }}>
                        ${fmt(c.ingresos_efectivo + c.ingresos_tarjeta + c.ingresos_transferencia)}
                      </td>
                      <td style={{ padding: '1rem', color: 'var(--dan)', fontFamily: "'JetBrains Mono',monospace", fontWeight: 700 }}>
                        ${fmt(c.egresos_total)}
                      </td>
                      <td style={{ padding: '1rem', color: c.utilidad_neta >= 0 ? 'var(--acc3)' : 'var(--dan)', fontFamily: "'JetBrains Mono',monospace", fontWeight: 800 }}>
                        ${fmt(c.utilidad_neta)}
                      </td>
                      <td style={{ padding: '1rem', color: 'var(--mut)', fontSize: '0.85rem' }}>{c.observaciones || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* MODAL DE CIERRE DE CAJA */}
      {showCloseModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)',
          zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
        }}>
          <div style={{
            background: 'rgba(20, 22, 31, 0.95)',
            border: '1px solid var(--dan)',
            boxShadow: '0 10px 40px rgba(0,0,0,0.5), 0 0 30px rgba(255, 68, 68, 0.15)',
            borderRadius: 16, maxWidth: 450, width: '100%', padding: '2.5rem',
            animation: 'fadeIn 0.3s ease'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
              <div style={{ fontSize: '2.5rem', background: 'rgba(255,68,68,0.1)', width: 60, height: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%' }}>
                🔒
              </div>
              <div>
                <h2 style={{ fontFamily: "'Outfit',sans-serif", fontSize: '1.5rem', color: '#fff', margin: 0, letterSpacing: 0.5 }}>Cierre de Caja</h2>
                <div style={{ color: 'var(--mut)', fontSize: '0.9rem', marginTop: 4 }}>Fecha: <strong style={{color:'var(--acc)'}}>{fecha}</strong></div>
              </div>
            </div>
            
            <p style={{ color: 'var(--txt)', lineHeight: 1.5, margin: '0 0 1.5rem 0', fontSize: '0.95rem', background: 'rgba(255,68,68,0.05)', padding: '1rem', borderRadius: 8, borderLeft: '3px solid var(--dan)' }}>
              ¿Estás seguro de cerrar la caja? Al confirmar, <strong>se congelarán los ingresos y egresos de este día</strong>. No podrás registrar, editar ni eliminar lavados ni salidas de dinero para esta fecha.
            </p>

            <div style={{ marginBottom: '2rem' }}>
              <label style={{ display: 'block', color: 'var(--mut)', fontSize: '0.85rem', marginBottom: '0.5rem' }}>Observaciones (Opcional):</label>
              <textarea 
                placeholder="Ej: Faltó billete de 2.000, Sobró efectivo..."
                value={observacionTemp}
                onChange={e => setObservacionTemp(e.target.value)}
                style={{
                  width: '100%', padding: '1rem', background: 'var(--sur2)', border: '1px solid var(--brd)',
                  borderRadius: 8, color: 'var(--txt)', outline: 'none', resize: 'vertical', minHeight: '80px',
                  fontFamily: "'Inter', sans-serif"
                }}
                onFocus={e => e.target.style.borderColor = 'var(--acc)'}
                onBlur={e => e.target.style.borderColor = 'var(--brd)'}
              />
            </div>

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <button 
                onClick={() => setShowCloseModal(false)} 
                style={{ 
                  padding: '0.8rem 1.5rem', borderRadius: 8, background: 'rgba(255,255,255,0.05)', 
                  color: 'var(--txt)', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', fontWeight: 'bold', transition: 'all 0.2s'
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
              >
                Cancelar
              </button>
              <button 
                onClick={handleCerrarCajaConfirmado} 
                style={{ 
                  padding: '0.8rem 1.5rem', borderRadius: 8, background: 'var(--dan)', 
                  color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 'bold', boxShadow: '0 4px 15px rgba(255,71,87,0.3)', transition: 'all 0.2s'
                }}
                onMouseEnter={e => e.currentTarget.style.filter = 'brightness(1.1)'}
                onMouseLeave={e => e.currentTarget.style.filter = 'none'}
              >
                Cerrar Caja Definitivamente
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
