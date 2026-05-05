import { useState, useEffect, useCallback } from 'react'
import ExcelJS from 'exceljs'
import { saveAs } from 'file-saver'
import { getLavados, actualizarEstadoLavado, actualizarLavado, getEmpleados, getAdicionales } from '../../services/api'
import { useToast } from '../../components/Toast'
import { useAuth } from '../../context/AuthContext'

function fmt(n) { return Number(n || 0).toLocaleString('es-CO') }

import { STATUS_LIST as ESTADOS } from '../../utils/constants'
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
  const [editando, setEditando]       = useState(null)
  const [form, setForm]               = useState({})
  const [selAdd, setSelAdd]           = useState({})
  const [cancelModal, setCancelModal] = useState(null) // { id, nuevoEstado }

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

  // Cómo pedir motivo de cancelación
  function pedirCancelacion(id, nuevoEstado) {
    setCancelModal({ id, nuevoEstado, motivo: '' })
  }

  async function confirmarCancelacion() {
    const { id, nuevoEstado, motivo } = cancelModal
    if (!motivo || motivo.trim() === '') {
      return toast?.('Debe especificar un motivo para cancelar')
    }
    setCancelModal(null)
    try {
      const res = await actualizarEstadoLavado(id, nuevoEstado, motivo.trim())
      setLavados(prev => prev.map(l => (l.id === id ? res : l)))
      toast?.('Lavado cancelado')
    } catch (e) {
      toast?.('Error actualizando estado')
    }
  }

  // ACTIONS
  async function handleCambiarEstado(id, nuevoEstado) {
    if (nuevoEstado === 'cancelado') { pedirCancelacion(id, nuevoEstado); return }
    try {
      const res = await actualizarEstadoLavado(id, nuevoEstado)
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

  const exportToExcel = async () => {
    if (filtrados.length === 0) {
      toast?.('No hay datos para exportar')
      return
    }

    const workbook = new ExcelJS.Workbook()
    workbook.creator = 'AquaWash'
    const sheet = workbook.addWorksheet('Historial de Lavados', {
      views: [{ state: 'frozen', ySplit: 5, xSplit: 1, showGridLines: false }]
    })

    sheet.getColumn('A').width = 3 // Margen
    const columns = [
      { key: 'fecha', width: 14 },
      { key: 'hora_ingreso', width: 12 },
      { key: 'hora_entregado', width: 12 },
      { key: 'placa', width: 14 },
      { key: 'tipo_vehiculo', width: 16 },
      { key: 'subcategoria', width: 18 },
      { key: 'estado', width: 16 },
      { key: 'nivel_suciedad', width: 14 },
      { key: 'precio_base', width: 16 },
      { key: 'precio_adicionales', width: 18 },
      { key: 'precio_total', width: 18 },
      { key: 'empleado', width: 25 },
      { key: 'cliente', width: 25 },
      { key: 'telefono', width: 18 },
      { key: 'metodo_pago', width: 15 },
      { key: 'adicionales', width: 35 },
      { key: 'nota', width: 35 },
      { key: 'motivo_cancelacion', width: 30 }
    ]

    columns.forEach((col, idx) => {
      const xlCol = sheet.getColumn(idx + 2)
      xlCol.key = col.key
      xlCol.width = col.width
    })

    // Fila 1: Margen superior
    sheet.getRow(1).height = 15

    const lastColStr = String.fromCharCode(65 + columns.length)

    // Fila 2: Título Principal
    sheet.mergeCells(`B2:${lastColStr}2`)
    const titleCell = sheet.getCell('B2')
    titleCell.value = 'AQUAWASH - REPORTE DE HISTORIAL DE LAVADOS'
    titleCell.font = { name: 'Segoe UI', size: 16, bold: true, color: { argb: 'FFFFFFFF' } }
    titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F172A' } }
    titleCell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 }
    sheet.getRow(2).height = 40

    // Fila 3: Subtítulo
    sheet.mergeCells(`B3:${lastColStr}3`)
    const subCell = sheet.getCell('B3')
    subCell.value = `Periodo: ${periodo.toUpperCase()} | Fecha de Exportación: ${new Date().toLocaleDateString('es-CO')} ${new Date().toLocaleTimeString('es-CO')}`
    subCell.font = { name: 'Segoe UI', size: 10, color: { argb: 'FF64748B' } }
    subCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } }
    subCell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 }
    sheet.getRow(3).height = 25

    // Fila 4: Espaciador
    sheet.getRow(4).height = 10

    // Fila 5: Cabeceras
    const headers = [
      'FECHA', 'INGRESO', 'ENTREGA', 'PLACA', 'VEHÍCULO', 'SUBCATEGORÍA', 
      'ESTADO', 'SUCIEDAD', 'BASE ($)', 'ADICIONALES ($)', 'TOTAL ($)', 
      'OPERARIO', 'CLIENTE', 'TELÉFONO', 'MÉTODO DE PAGO', 'SERVICIOS ADICIONALES', 'NOTAS', 'MOTIVO CANCELACIÓN'
    ]
    const headerRow = sheet.getRow(5)
    headers.forEach((h, i) => {
      const cell = headerRow.getCell(i + 2)
      cell.value = h
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } }
      cell.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FFF8FAFC' } }
      cell.alignment = { vertical: 'middle', horizontal: 'center' }
      cell.border = {
        top: {style:'medium', color: {argb:'FF0F172A'}},
        bottom: {style:'medium', color: {argb:'FF0F172A'}},
        left: {style:'thin', color: {argb:'FF334155'}},
        right: {style:'thin', color: {argb:'FF334155'}}
      }
    })
    headerRow.height = 30
    
    sheet.autoFilter = `B5:${lastColStr}5`

    // Datos
    let rowNum = 6
    filtrados.forEach((l, index) => {
      const row = sheet.getRow(rowNum++)
      row.values = [
        null,
        l.fecha || '-',
        l.hora_ingreso ? fTime(l.hora_ingreso) : '-',
        l.hora_entregado ? fTime(l.hora_entregado) : '-',
        l.placa?.toUpperCase(),
        l.tipo_vehiculo?.toUpperCase(),
        l.subcategoria || '-',
        l.estado_actual?.toUpperCase() || 'ESPERA',
        l.nivel_suciedad?.toUpperCase() || 'LIGERO',
        l.precio_base || 0,
        l.precio_adicionales || 0,
        l.precio_total || 0,
        l.empleado_nombre || '-',
        l.cliente_nombre || '-',
        l.cliente_telefono || '-',
        l.metodo_pago ? l.metodo_pago.toUpperCase() : 'EFECTIVO',
        (l.adicionales_aplicados || []).map(a => a.nombre).join(', ') || '-',
        l.nota || '-',
        l.motivo_cancelacion || '-'
      ]

      row.height = 24
      const isZebra = index % 2 === 0
      
      for (let i = 2; i <= columns.length + 1; i++) {
        const cell = row.getCell(i)
        cell.font = { name: 'Segoe UI', size: 10, color: { argb: 'FF334155' } }
        cell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true }
        cell.border = { bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } }, left: {style:'thin', color:{argb:'FFF1F5F9'}}, right:{style:'thin', color:{argb:'FFF1F5F9'}} }
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: isZebra ? 'FFFFFFFF' : 'FFF8FAFC' } }
        
        // Centrados
        if ([2,3,4,8,9].includes(i)) cell.alignment = { ...cell.alignment, horizontal: 'center' }

        // Placa
        if (i === 5) cell.font = { name: 'Consolas', bold: true, color: { argb: 'FF0F172A' }, size: 11 }

        // Dinero
        if (i >= 10 && i <= 12) {
          cell.numFmt = '"$"#,##0'
          cell.alignment = { ...cell.alignment, horizontal: 'right' }
          if (i === 12) {
            cell.font = { ...cell.font, bold: true, color: { argb: 'FF0F172A' } }
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: isZebra ? 'FFF1F5F9' : 'FFE2E8F0' } }
          }
        }
        
        // Estados
        if (i === 8) {
          const val = cell.value
          if (val === 'ENTREGADO') cell.font = { bold: true, color: { argb: 'FF059669' } } // emerald-600
          else if (val === 'CANCELADO') cell.font = { bold: true, color: { argb: 'FFE11D48' } } // rose-600
          else if (val === 'LAVANDO') cell.font = { bold: true, color: { argb: 'FF2563EB' } } // blue-600
        }
      }
    })

    // --- AUTO-AJUSTE DINÁMICO DE COLUMNAS ---
    for (let i = 2; i <= columns.length + 1; i++) {
      let maxLength = 0
      sheet.getColumn(i).eachCell({ includeEmpty: true }, (cell, rowNumber) => {
        // Solo medimos desde la fila 5 (Cabeceras) hacia abajo para no ser afectados por los Títulos principales
        if (rowNumber >= 5 && cell.value !== null && cell.value !== undefined) {
          // Si tiene un formato de moneda, es probable que ocupe más visualmente que el número en sí
          const extraPadding = cell.numFmt ? 5 : 2
          const strLen = cell.value.toString().length + extraPadding
          if (strLen > maxLength) maxLength = strLen
        }
      })
      // Fijar el ancho respetando el mínimo original de la columna para no achicar los títulos
      const minWidth = columns[i - 2].width || 12
      sheet.getColumn(i).width = Math.min(Math.max(maxLength + 3, minWidth), 65)
    }

    const buffer = await workbook.xlsx.writeBuffer()
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    saveAs(blob, `AquaWash_Historial_${periodo}_${new Date().toISOString().slice(0, 10)}.xlsx`)
  }

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
          <h2 style={{ fontFamily: "'Outfit',sans-serif", fontSize: '2rem', color: 'var(--txt)', marginTop: 0, textShadow: '0 0 15px rgba(255,255,255,0.2)' }}>
            Editar Lavado {editando.placa}
          </h2>
          <form onSubmit={saveEdit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: 4, color: 'var(--mut)', fontSize: '0.85rem' }}>Placa</label>
              <input required value={form.placa} onChange={e => setForm(f => ({...f, placa: e.target.value}))}
                style={{ width: '100%', padding: '0.8rem', borderRadius: 8, background: 'var(--sur2)', border: '1px solid var(--brd)', color: 'var(--txt)' }}
              />
            </div>
            
            <div className="historial-edit-dueno" style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <div style={{ flex: '1 1 150px' }}>
                <label style={{ display: 'block', marginBottom: 4, color: 'var(--mut)', fontSize: '0.85rem' }}>Dueño</label>
                <input value={form.cliente_nombre} onChange={e => setForm(f => ({...f, cliente_nombre: e.target.value}))}
                  style={{ width: '100%', padding: '0.8rem', borderRadius: 8, background: 'var(--sur2)', border: '1px solid var(--brd)', color: 'var(--txt)' }}
                />
              </div>
              <div style={{ flex: '1 1 150px' }}>
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
              <div className="historial-edit-adics" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '0.5rem' }}>
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

      {/* ── MODAL CANCELACIÓN ── */}
      {cancelModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 2000,
          background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
        }}
          onClick={e => e.target === e.currentTarget && setCancelModal(null)}
        >
          <div style={{
            width: '100%', maxWidth: 420,
            background: 'linear-gradient(145deg, var(--sur), var(--sur2))',
            border: '1px solid rgba(255,71,87,0.35)',
            borderRadius: 16, overflow: 'hidden',
            boxShadow: '0 20px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,71,87,0.15)'
          }}>
            {/* Cabecera roja */}
            <div style={{
              background: 'linear-gradient(90deg, rgba(255,71,87,0.25), rgba(255,71,87,0.08))',
              borderBottom: '1px solid rgba(255,71,87,0.3)',
              padding: '1.2rem 1.5rem', display: 'flex', alignItems: 'center', gap: '0.8rem'
            }}>
              <span style={{ fontSize: '1.5rem' }}>🚫</span>
              <div>
                <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: '1.4rem', letterSpacing: 0.5, color: 'var(--dan)' }}>
                  Cancelar Lavado
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--mut)', marginTop: 2 }}>
                  Esta acción no se puede deshacer
                </div>
              </div>
            </div>

            {/* Cuerpo */}
            <div style={{ padding: '1.4rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <label style={{ fontSize: '0.82rem', color: 'var(--mut)', textTransform: 'uppercase', letterSpacing: 1, fontWeight: 600 }}>
                Motivo de cancelación <span style={{ color: 'var(--dan)' }}>*</span>
              </label>
              <textarea
                autoFocus
                rows={3}
                placeholder="Ej: Cliente no regresó, vehículo retirado..."
                value={cancelModal.motivo}
                onChange={e => setCancelModal(m => ({ ...m, motivo: e.target.value }))}
                style={{
                  width: '100%', padding: '0.8rem 1rem', borderRadius: 10, resize: 'vertical',
                  background: 'var(--bg)', border: '1px solid rgba(255,71,87,0.4)',
                  color: 'var(--txt)', fontSize: '0.95rem', lineHeight: 1.5, outline: 'none',
                  fontFamily: "'Inter',sans-serif", transition: 'border-color 0.2s'
                }}
                onFocus={e => e.target.style.borderColor = 'var(--dan)'}
                onBlur={e  => e.target.style.borderColor = 'rgba(255,71,87,0.4)'}
              />

              {/* Botones */}
              <div style={{ display: 'flex', gap: '0.8rem', marginTop: '0.3rem' }}>
                <button
                  onClick={() => setCancelModal(null)}
                  style={{
                    flex: 1, padding: '0.85rem', borderRadius: 10, border: '1px solid var(--brd)',
                    background: 'var(--sur2)', color: 'var(--txt)', fontWeight: 600, cursor: 'pointer',
                    fontSize: '0.9rem', transition: 'all 0.15s'
                  }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--mut)'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--brd)'}
                >
                  Cerrar
                </button>
                <button
                  onClick={confirmarCancelacion}
                  style={{
                    flex: 2, padding: '0.85rem', borderRadius: 10, border: 'none',
                    background: 'var(--dan)', color: '#fff', fontWeight: 700, cursor: 'pointer',
                    fontSize: '0.95rem', letterSpacing: 0.5, transition: 'all 0.15s'
                  }}
                  onMouseEnter={e => e.currentTarget.style.filter = 'brightness(1.15)'}
                  onMouseLeave={e => e.currentTarget.style.filter = 'none'}
                >
                  🚫 Confirmar Cancelación
                </button>
              </div>
            </div>
          </div>
        </div>
      )}


      <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <h1 style={{ fontFamily: "'Outfit',sans-serif", fontSize: 'clamp(1.6rem, 5vw, 2.2rem)', letterSpacing: 0.5, margin: 0, color: 'var(--acc)', textShadow: '0 0 15px rgba(0,212,255,0.3)' }}>
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

      <div className="search-bar glass-panel" style={{ padding: '0.8rem', marginBottom: '1.5rem', display: 'flex', gap: '0.8rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          placeholder="Buscar por placa, cliente o teléfono..."
          value={buscar}
          onChange={e => setBuscar(e.target.value)}
          style={{ flex: 1, minWidth: 200, padding: '0.6rem 1rem', borderRadius: 8, border: '1px solid var(--brd)', background: 'rgba(255,255,255,0.05)', color: '#fff', outline: 'none', fontFamily: "'Inter', sans-serif" }}
          onFocus={e => e.target.style.borderColor = 'var(--acc)'}
          onBlur={e => e.target.style.borderColor = 'var(--brd)'}
        />
        <select value={tipo} onChange={e => setTipo(e.target.value)} style={{ padding: '0.6rem', borderRadius: 8, border: '1px solid var(--brd)', background: 'rgba(255,255,255,0.05)', color: '#fff', outline: 'none', fontFamily: "'Inter', sans-serif" }}>
          <option value="" style={{color:'#000'}}>Todos los vehículos</option>
          <option value="moto" style={{color:'#000'}}>Moto</option>
          <option value="carro" style={{color:'#000'}}>Carro</option>
          <option value="furgon" style={{color:'#000'}}>Furgón</option>
          <option value="camion" style={{color:'#000'}}>Camión</option>
          <option value="bus" style={{color:'#000'}}>Bus</option>
        </select>
        <select value={estado} onChange={e => setEstado(e.target.value)} style={{ minWidth: 140, padding: '0.6rem', borderRadius: 8, border: '1px solid var(--brd)', background: 'rgba(255,255,255,0.05)', color: '#fff', outline: 'none', fontFamily: "'Inter', sans-serif" }}>
          <option value="" style={{color:'#000'}}>Todos los estados</option>
          <option value="espera" style={{color:'#000'}}>En Espera</option>
          <option value="lavando" style={{color:'#000'}}>Lavando</option>
          <option value="terminado" style={{color:'#000'}}>Terminado</option>
          <option value="entregado" style={{color:'#000'}}>Entregado</option>
          <option value="cancelado" style={{color:'#000'}}>Cancelados</option>
        </select>
        
        <button onClick={exportToExcel} style={{ 
          background: 'var(--acc)', color: '#000', fontWeight: 'bold',
          padding: '0.6rem 1rem', borderRadius: 8, border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: '0.5rem', marginLeft: 'auto',
          boxShadow: '0 4px 10px rgba(0, 212, 255, 0.3)'
        }}>
          📊 Exportar Excel
        </button>
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
          <div className="glass-panel" style={{ marginBottom: '1.5rem', padding: '1rem', width: '100%', overflow: 'hidden' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.8rem', alignItems: 'center' }}>
              <span style={{ fontSize: 13, background: 'rgba(255,255,255,0.05)', padding: '6px 12px', borderRadius: 20, color: '#fff', whiteSpace: 'nowrap', border: '1px solid rgba(255,255,255,0.1)' }}>General: <strong>{cTotal}</strong></span>
              <span style={{ fontSize: 13, background: 'rgba(255,255,255,0.05)', padding: '6px 12px', borderRadius: 20, color: 'var(--mut)', whiteSpace: 'nowrap', border: '1px solid rgba(255,255,255,0.1)' }}>⏳ Espera: <strong style={{color:'#fff'}}>{cEspera}</strong></span>
              <span style={{ fontSize: 13, background: 'rgba(0,212,255,0.1)',   padding: '6px 12px', borderRadius: 20, color: 'var(--acc)', whiteSpace: 'nowrap', border: '1px solid rgba(0,212,255,0.2)' }}>💦 Lavando: <strong>{cLavando}</strong></span>
              <span style={{ fontSize: 13, background: 'rgba(126,255,110,0.1)', padding: '6px 12px', borderRadius: 20, color: 'var(--acc3)', whiteSpace: 'nowrap', border: '1px solid rgba(126,255,110,0.2)' }}>✅ Terminado: <strong>{cTerminado}</strong></span>
              <span style={{ fontSize: 13, background: 'rgba(255,255,255,0.1)', padding: '6px 12px', borderRadius: 20, color: '#fff', whiteSpace: 'nowrap', border: '1px solid rgba(255,255,255,0.2)' }}>🚗 Entregado: <strong>{cEntregado}</strong></span>
              <span style={{ fontSize: 13, background: 'rgba(255,68,68,0.1)',   padding: '6px 12px', borderRadius: 20, color: 'var(--dan)', whiteSpace: 'nowrap', border: '1px solid rgba(255,68,68,0.2)' }}>🚫 Cancelado: <strong>{cCancelado}</strong></span>
              <span style={{ fontSize: '0.9rem', color: 'var(--mut)', marginLeft: 'auto', whiteSpace: 'nowrap' }}>
                Total: <strong style={{ color: 'var(--acc3)', fontFamily: "'JetBrains Mono',monospace", fontSize: '1.2rem', marginLeft: 6, textShadow: '0 0 10px rgba(0,230,118,0.3)' }}>${fmt(totalDinero)}</strong>
              </span>
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
            const indexEstadoActual = ESTADOS.findIndex(e => e.id === (l.estado_actual || 'espera'))
            
            return (
              <div key={l.id} className="glass-panel" style={{
                padding: '1.2rem',
                display: 'flex', flexDirection: 'column', gap: '0.8rem',
                position: 'relative', overflow: 'hidden',
                opacity: isCancelado ? 0.6 : 1,
                transition: 'transform 0.2s ease',
                borderLeft: `4px solid ${isCancelado ? 'var(--dan)' : isFinished ? 'var(--acc3)' : indexEstadoActual === 1 ? 'var(--acc)' : 'var(--mut)'}`
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <span style={{ fontSize: '1.4rem', fontWeight: 800, fontFamily: "'JetBrains Mono',monospace", textDecoration: isCancelado ? 'line-through' : 'none', color: '#fff' }}>{l.placa}</span>
                    <span style={{ 
                      fontSize: '0.75rem', fontWeight: 700, padding: '2px 8px', borderRadius: 20, 
                      textTransform: 'uppercase', background: 'rgba(255,255,255,0.05)', color: 'var(--mut)',
                      border: '1px solid rgba(255,255,255,0.1)'
                    }}>
                      {l.tipo_vehiculo} {l.subcategoria ? `(${l.subcategoria})` : ''}
                    </span>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '1rem', marginTop: '0.5rem' }}>
                    <span style={{ fontSize: '1.4rem', fontWeight: 700, fontFamily: "'JetBrains Mono',monospace", color: isCancelado ? 'var(--dan)' : 'var(--acc3)', textShadow: isCancelado ? 'none' : '0 0 10px rgba(0,230,118,0.2)' }}>
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
                  <div style={{ display: 'flex', gap: '0.4rem' }}>
                    <span title="Método de pago">💳</span> <span style={{ color: 'var(--txt)', textTransform: 'capitalize' }}>{l.metodo_pago || 'Efectivo'}</span>
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
                    {ESTADOS.filter(e => e.id !== 'cancelado').map((estado, idx) => {
                      const isCompleted = idx <= indexEstadoActual
                      const isCurrent = idx === indexEstadoActual
                      
                      let horaStr = '--:--'
                      if (estado.id === 'espera') horaStr = fTime(l.hora_ingreso)
                      else if (estado.id === 'lavando') horaStr = fTime(l.hora_lavando)
                      else if (estado.id === 'terminado') horaStr = fTime(l.hora_terminado)
                      else if (estado.id === 'entregado') horaStr = fTime(l.hora_entregado)

                      return (
                        <div key={estado.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, minWidth: '70px' }}>
                          <button 
                            disabled={role === 'dueno'}
                            onClick={() => handleCambiarEstado(l.id, estado.id)}
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
                          <span style={{ marginTop: '0.4rem', fontSize: '0.75rem', fontFamily: "'JetBrains Mono',monospace", color: isCompleted ? 'var(--txt)' : 'var(--mut)' }}>
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