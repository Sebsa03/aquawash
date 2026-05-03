import { useState, useEffect } from 'react'
import ExcelJS from 'exceljs'
import { saveAs } from 'file-saver'
import {
  getResumen, getPorTipo, getRankingDetalle,
  getTendenciaDiaria, getHorasPico, getRecurrentes, getServicios, getConfig, actualizarPerfil,
  getTendencia
} from '../../services/api'
import StatCard from '../../components/StatCard'
import { useToast } from '../../components/Toast'
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts'
import { VEHICLE_TYPES as TIPOS, VEHICLE_ICONS as ICONS, CHART_COLORS as COLORS } from '../../utils/constants'

function fmt(n)  { return Number(n || 0).toLocaleString('es-CO') }
function fmtK(n) {
  n = Number(n || 0)
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M'
  if (n >= 1000)    return (n / 1000).toFixed(0) + 'k'
  return String(n)
}

export default function Estadisticas() {
  const toast = useToast()
  const [periodo, setPeriodo] = useState('mes')
  const [loading, setLoading] = useState(true)

  // Datos
  const [resumen, setResumen] = useState(null)
  const [porTipo, setPorTipo] = useState([])
  const [ranking, setRanking] = useState([])
  const [tendencia, setTendencia] = useState([])
  const [tendenciaHistorica, setTendenciaHistorica] = useState([])
  const [horasPico, setHorasPico] = useState([])
  const [recurrentes, setRecurrentes] = useState({ total_clientes_unicos: 0, recurrentes: 0, nuevos: 0 })
  const [servicios, setServicios] = useState([])
  
  // Meta Mensual
  const [metaMensual, setMetaMensual] = useState(0)
  const [editandoMeta, setEditandoMeta] = useState(false)
  const [nuevaMeta, setNuevaMeta] = useState('')

  useEffect(() => {
    async function cargar() {
      setLoading(true)
      try {
        const [r, t, rD, tend, tendHist, hrs, rec, serv, conf] = await Promise.all([
          getResumen(periodo),
          getPorTipo(periodo),
          getRankingDetalle(periodo),
          getTendenciaDiaria(periodo),
          getTendencia(),
          getHorasPico(periodo),
          getRecurrentes(), // Recurrentes no depende de periodo en el backend actual, pero lo ideal es total
          getServicios(periodo),
          getConfig()
        ])
        setResumen(r)
        setPorTipo(t)
        setTendencia(tend)
        setTendenciaHistorica(tendHist)
        setHorasPico(hrs)
        setRecurrentes(rec)
        setServicios(serv)
        setMetaMensual(conf?.meta_mensual || 0)
        setNuevaMeta(conf?.meta_mensual || 0)
        
        // Agrupar ranking_detalle
        const emps = {}
        rD.forEach(d => {
          if (!emps[d.empleado_id]) {
            emps[d.empleado_id] = {
              empleado_id: d.empleado_id,
              empleado_nombre: d.empleado_nombre,
              total_ingresos: 0,
              total_lavados: 0,
              minutos_promedio: 0,
              vehiculo_favorito: d.tipo_vehiculo,
              max_lavados_vehiculo: d.total_lavados
            }
          } else {
            if (d.total_lavados > emps[d.empleado_id].max_lavados_vehiculo) {
              emps[d.empleado_id].vehiculo_favorito = d.tipo_vehiculo
              emps[d.empleado_id].max_lavados_vehiculo = d.total_lavados
            }
          }
          emps[d.empleado_id].total_ingresos += d.total_ingresos
          emps[d.empleado_id].total_lavados  += d.total_lavados
          emps[d.empleado_id].minutos_promedio = d.minutos_promedio 
        })
        setRanking(Object.values(emps).sort((a,b) => b.total_lavados - a.total_lavados))
      } catch (e) {
        toast?.('Error cargando panel gerencial')
      } finally {
        setLoading(false)
      }
    }
    cargar()
  }, [periodo])

  const guardarMeta = async () => {
    try {
      await actualizarPerfil({ meta_mensual: parseInt(nuevaMeta) })
      setMetaMensual(parseInt(nuevaMeta))
      setEditandoMeta(false)
      toast?.('Meta mensual actualizada', 'success')
    } catch(e) {
      toast?.('Error al guardar meta', 'error')
    }
  }

  const progresoMeta = metaMensual > 0 ? Math.min((resumen?.ingresos / metaMensual) * 100, 100) : 0
  const recurrentePct = recurrentes.total_clientes_unicos > 0 ? (recurrentes.recurrentes / recurrentes.total_clientes_unicos * 100).toFixed(1) : 0

  const exportarExcel = async () => {
    const workbook = new ExcelJS.Workbook()
    workbook.creator = 'AquaWash'
    
    // Configuración Base de las hojas secundarias (Empiezan en Columna B para margen)
    const setupPremiumSheet = (sheet, title, columns) => {
      // Dejar Columna A como margen
      sheet.getColumn('A').width = 3
      
      // Mapear columnas desde B
      columns.forEach((col, idx) => {
        const xlCol = sheet.getColumn(idx + 2) // B es 2
        xlCol.key = col.key
        xlCol.width = col.width
      })
      
      sheet.views = [{ state: 'frozen', ySplit: 5, xSplit: 1, showGridLines: false }]
      
      // Fila 1: Margen
      sheet.getRow(1).height = 15

      // Fila 2: Título
      const lastColStr = String.fromCharCode(65 + columns.length) // B, C, D...
      sheet.mergeCells(`B2:${lastColStr}2`)
      const tCell = sheet.getCell('B2')
      tCell.value = `AQUAWASH - ${title.toUpperCase()}`
      tCell.font = { name: 'Segoe UI', size: 16, bold: true, color: { argb: 'FFFFFFFF' } }
      tCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F172A' } }
      tCell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 }
      sheet.getRow(2).height = 40

      // Fila 3: Subtítulo
      sheet.mergeCells(`B3:${lastColStr}3`)
      const sCell = sheet.getCell('B3')
      sCell.value = `Periodo: ${periodo.toUpperCase()} | Fecha: ${new Date().toLocaleDateString('es-CO')} ${new Date().toLocaleTimeString('es-CO')}`
      sCell.font = { name: 'Segoe UI', size: 10, color: { argb: 'FF64748B' } }
      sCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } }
      sCell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 }
      sheet.getRow(3).height = 25

      // Fila 4: Espacio
      sheet.getRow(4).height = 10

      // Fila 5: Headers
      const hRow = sheet.getRow(5)
      columns.forEach((col, i) => {
        const cell = hRow.getCell(i + 2)
        cell.value = col.header
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } }
        cell.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FFF8FAFC' } }
        cell.alignment = { vertical: 'middle', horizontal: 'center' }
        cell.border = { 
          top: {style:'medium',color:{argb:'FF0F172A'}}, 
          bottom: {style:'medium',color:{argb:'FF0F172A'}},
          left: {style:'thin',color:{argb:'FF334155'}}, 
          right: {style:'thin',color:{argb:'FF334155'}}
        }
      })
      hRow.height = 30
      
      // AutoFilter
      sheet.autoFilter = `B5:${lastColStr}5`

      return 6 // Siguiente fila libre
    }

    const applyDataRowStyle = (row, index, colCount) => {
      row.height = 24
      const isZebra = index % 2 === 0
      for (let i = 2; i <= colCount + 1; i++) {
        const cell = row.getCell(i)
        cell.font = { name: 'Segoe UI', size: 10, color: { argb: 'FF334155' } }
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: isZebra ? 'FFFFFFFF' : 'FFF8FAFC' } }
        cell.border = { 
          bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } }, 
          left: {style:'thin', color:{argb:'FFF1F5F9'}}, 
          right: {style:'thin', color:{argb:'FFF1F5F9'}} 
        }
        cell.alignment = { vertical: 'middle' }
      }
    }

    // --- HOJA 1: DASHBOARD ---
    const wsDash = workbook.addWorksheet('Dashboard', { views: [{ showGridLines: false }] })
    wsDash.getColumn('A').width = 3
    wsDash.getColumn('B').width = 40
    wsDash.getColumn('C').width = 40
    wsDash.getColumn('D').width = 40

    wsDash.getRow(1).height = 15
    wsDash.mergeCells('B2:D2')
    const dTitle = wsDash.getCell('B2')
    dTitle.value = 'RESUMEN EJECUTIVO - AQUAWASH'
    dTitle.font = { name: 'Segoe UI', size: 22, bold: true, color: { argb: 'FFFFFFFF' } }
    dTitle.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F172A' } }
    dTitle.alignment = { vertical: 'middle', horizontal: 'center' }
    wsDash.getRow(2).height = 60

    wsDash.mergeCells('B3:D3')
    const dSub = wsDash.getCell('B3')
    dSub.value = `Datos Consolidados del Periodo: ${periodo.toUpperCase()}`
    dSub.font = { name: 'Segoe UI', size: 12, italic: true, color: { argb: 'FF64748B' } }
    dSub.alignment = { vertical: 'middle', horizontal: 'center' }
    wsDash.getRow(3).height = 30

    // Función para crear tarjeta KPI
    const createKpiCard = (sheet, row, col, title, value, isMoney = false, isPercent = false) => {
      const cellTitle = sheet.getCell(row, col)
      cellTitle.value = title.toUpperCase()
      cellTitle.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FF94A3B8' } } // slate-400
      cellTitle.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } } // slate-800
      cellTitle.alignment = { vertical: 'bottom', horizontal: 'center', indent: 1 }
      cellTitle.border = { top: {style:'medium',color:{argb:'FF0F172A'}}, left: {style:'medium',color:{argb:'FF0F172A'}}, right: {style:'medium',color:{argb:'FF0F172A'}} }
      
      const cellVal = sheet.getCell(row + 1, col)
      cellVal.value = value
      cellVal.font = { name: 'Segoe UI', size: 24, bold: true, color: { argb: 'FF0F172A' } }
      cellVal.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFFFF' } }
      cellVal.alignment = { vertical: 'middle', horizontal: 'center' }
      cellVal.border = { bottom: {style:'medium',color:{argb:'FF0F172A'}}, left: {style:'medium',color:{argb:'FF0F172A'}}, right: {style:'medium',color:{argb:'FF0F172A'}} }
      
      if (isMoney) cellVal.numFmt = '"$"#,##0'
      if (isPercent) cellVal.numFmt = '0.0"%"'
    }

    wsDash.getRow(4).height = 20
    wsDash.getRow(5).height = 30
    wsDash.getRow(6).height = 60
    createKpiCard(wsDash, 5, 2, 'Ingresos Totales', resumen?.ingresos || 0, true)
    createKpiCard(wsDash, 5, 3, 'Vehículos Atendidos', resumen?.vehiculos || 0)
    createKpiCard(wsDash, 5, 4, 'Ticket Promedio', Math.round(resumen?.promedio || 0), true)

    wsDash.getRow(7).height = 20
    wsDash.getRow(8).height = 30
    wsDash.getRow(9).height = 60
    createKpiCard(wsDash, 8, 2, 'Tasa de Retención', parseFloat(recurrentePct) / 100, false, true)
    createKpiCard(wsDash, 8, 3, 'Meta Mensual', metaMensual, true)
    createKpiCard(wsDash, 8, 4, 'Progreso Meta', parseFloat(progresoMeta) / 100, false, true)
    
    // --- HOJA 2: RANKING ---
    const wsRanking = workbook.addWorksheet('Ranking Operarios')
    const colsRanking = [
      { header: 'POSICIÓN', key: 'pos', width: 14 },
      { header: 'OPERARIO', key: 'nombre', width: 35 },
      { header: 'INGRESOS ($)', key: 'ingresos', width: 22 },
      { header: 'LAVADOS', key: 'lavados', width: 15 },
      { header: 'MIN PROM.', key: 'min', width: 15 },
      { header: 'VEHÍCULO FAVORITO', key: 'fav', width: 25 }
    ]
    let rowNumRanking = setupPremiumSheet(wsRanking, 'RANKING DE OPERARIOS', colsRanking)
    ranking.forEach((rData, i) => {
      const row = wsRanking.getRow(rowNumRanking++)
      row.values = [null, i + 1, rData.empleado_nombre, rData.total_ingresos, rData.total_lavados, rData.minutos_promedio, TIPOS[rData.vehiculo_favorito] || rData.vehiculo_favorito]
      applyDataRowStyle(row, i, colsRanking.length)
      
      const cPos = row.getCell(2)
      cPos.alignment = { ...cPos.alignment, horizontal: 'center' }
      if (i === 0) cPos.font = { ...cPos.font, bold: true, color: { argb: 'FFB45309' } } // Oro adaptado
      if (i === 1) cPos.font = { ...cPos.font, bold: true, color: { argb: 'FF64748B' } }
      if (i === 2) cPos.font = { ...cPos.font, bold: true, color: { argb: 'FF92400E' } }
      
      const cIngr = row.getCell(4)
      cIngr.numFmt = '"$"#,##0'
      cIngr.font = { ...cIngr.font, bold: true, color: { argb: 'FF0F172A' } }
    })

    // --- HOJA 3: TIPOS VEHICULO ---
    const wsTipos = workbook.addWorksheet('Distribución Vehículos')
    const colsTipos = [
      { header: 'TIPO DE VEHÍCULO', key: 'tipo', width: 45 },
      { header: 'CANTIDAD ATENDIDA', key: 'total', width: 45 }
    ]
    let rowNumTipos = setupPremiumSheet(wsTipos, 'DISTRIBUCIÓN POR TIPO DE VEHÍCULO', colsTipos)
    porTipo.forEach((t, i) => {
      const row = wsTipos.getRow(rowNumTipos++)
      row.values = [null, TIPOS[t.tipo_vehiculo] || t.tipo_vehiculo, t.total]
      applyDataRowStyle(row, i, colsTipos.length)
      row.getCell(3).alignment = { ...row.getCell(3).alignment, horizontal: 'center' }
      row.getCell(3).font = { ...row.getCell(3).font, bold: true }
    })

    // --- HOJA 4: TENDENCIA ---
    const wsTendencia = workbook.addWorksheet('Tendencia Ingresos')
    const colsTendencia = [
      { header: 'DÍA', key: 'dia', width: 45 },
      { header: 'INGRESOS ($)', key: 'ingresos', width: 45 }
    ]
    let rowNumTendencia = setupPremiumSheet(wsTendencia, 'TENDENCIA DE INGRESOS DIARIOS', colsTendencia)
    tendencia.forEach((t, i) => {
      const row = wsTendencia.getRow(rowNumTendencia++)
      row.values = [null, t.dia, t.ingresos]
      applyDataRowStyle(row, i, colsTendencia.length)
      row.getCell(3).numFmt = '"$"#,##0'
      row.getCell(2).alignment = { ...row.getCell(2).alignment, horizontal: 'center' }
    })

    // --- AUTO-AJUSTE DINÁMICO DE COLUMNAS ---
    const autoFitSheet = (sheet, columnsDef) => {
      for (let i = 2; i <= columnsDef.length + 1; i++) {
        let maxLength = 0
        sheet.getColumn(i).eachCell({ includeEmpty: true }, (cell, rowNumber) => {
          if (rowNumber >= 5 && cell.value !== null && cell.value !== undefined) {
            const extraPadding = cell.numFmt ? 6 : 4
            // Multiplicamos por 1.2 para dar margen a letras mayúsculas anchas (como la M, W, o tipografía en negrita)
            const strLen = Math.ceil(cell.value.toString().length * 1.2) + extraPadding
            if (strLen > maxLength) maxLength = strLen
          }
        })
        const minWidth = columnsDef[i - 2].width || 12
        sheet.getColumn(i).width = Math.min(Math.max(maxLength, minWidth), 75)
      }
    }

    autoFitSheet(wsRanking, colsRanking)
    autoFitSheet(wsTipos, colsTipos)
    autoFitSheet(wsTendencia, colsTendencia)

    const buffer = await workbook.xlsx.writeBuffer()
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    saveAs(blob, `Reporte_Ejecutivo_Estadisticas_${periodo}_${new Date().toISOString().slice(0, 10)}.xlsx`)
  }

  return (
    <div className="animate-fade-in">
      {/* CABECERA */}
      <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize:'clamp(1.8rem, 5vw, 2.2rem)', margin: 0, textShadow: '0 0 20px rgba(0,212,255,0.3)' }}>
            Panel Gerencial
          </h1>
          <p style={{ fontSize:14, color:'var(--mut)', marginTop:4, fontFamily: "'Inter', sans-serif" }}>
            Visión panorámica e inteligencia de negocio
          </p>
        </div>

        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <button className="btn-secondary" onClick={exportarExcel} title="Exportar a Excel" style={{ background: 'var(--acc)', color: '#000', fontWeight: 'bold', border: 'none', boxShadow: '0 4px 10px rgba(0, 212, 255, 0.3)' }}>
            📊 Exportar Excel
          </button>
          <div className="tabs" style={{ marginBottom: 0 }}>
            {[
              { v:'hoy',    l:'Hoy' },
              { v:'semana', l:'Última Semana' },
              { v:'mes',    l:'Mes' },
              { v:'total',  l:'Total' },
            ].map(t => (
              <button key={t.v} className={`tab ${periodo === t.v ? 'active' : ''}`} onClick={() => setPeriodo(t.v)}>
                {t.l}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="empty-state">
          <div style={{ width: 40, height: 40, border: '3px solid var(--brd)', borderTopColor: 'var(--acc)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
          <div>Procesando métricas...</div>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* META MENSUAL (Si es periodo mes) */}
          {periodo === 'mes' && (
            <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ fontSize: 24 }}>🎯</div>
                  <div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--mut)', textTransform: 'uppercase', fontWeight: 600, letterSpacing: 1 }}>Meta Mensual</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      {editandoMeta ? (
                        <>
                          <input type="number" className="input-base" style={{ width: 120, padding: '0.4rem' }} value={nuevaMeta} onChange={e => setNuevaMeta(e.target.value)} />
                          <button className="btn-primary" style={{ padding: '0.4rem 0.8rem' }} onClick={guardarMeta}>Guardar</button>
                          <button className="btn-secondary" style={{ padding: '0.4rem 0.8rem' }} onClick={() => setEditandoMeta(false)}>X</button>
                        </>
                      ) : (
                        <>
                          <span style={{ fontSize: '1.4rem', fontWeight: 700, color: '#fff' }}>${fmt(metaMensual)}</span>
                          <button className="del-btn" onClick={() => setEditandoMeta(true)}>✏️</button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: progresoMeta >= 100 ? 'var(--acc3)' : 'var(--acc)' }}>
                    {progresoMeta.toFixed(1)}%
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--mut)' }}>Completado</div>
                </div>
              </div>
              
              <div style={{ height: 10, background: 'rgba(255,255,255,0.05)', borderRadius: 10, overflow: 'hidden' }}>
                <div style={{ 
                  height: '100%', 
                  width: `${progresoMeta}%`, 
                  background: progresoMeta >= 100 ? 'var(--acc3)' : 'linear-gradient(90deg, var(--acc), #00ffcc)',
                  transition: 'width 1s cubic-bezier(0.4, 0, 0.2, 1)',
                  boxShadow: '0 0 10px rgba(0,212,255,0.5)'
                }} />
              </div>
            </div>
          )}

          {/* STATS GLOBALES */}
          <div className="stats-grid" style={{ marginBottom: 0 }}>
            <StatCard label="Ingresos Totales" value={`$${fmtK(resumen?.ingresos)}`} color="green" sub={`$${fmt(resumen?.ingresos)}`} />
            <StatCard label="Vehículos Atendidos" value={resumen?.vehiculos ?? 0} color="blue" sub="Lavados finalizados" />
            <StatCard label="Ticket Promedio" value={`$${fmtK(Math.round(resumen?.promedio ?? 0))}`} color="orange" sub="Gasto por cliente" />
            <div className="stat-card blue" style={{ padding: '1.5rem' }}>
              <div className="stat-label">Tasa de Retención</div>
              <div className="stat-value" style={{ color: '#fff' }}>{recurrentePct}%</div>
              <div className="stat-sub">Clientes Recurrentes</div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem' }}>
            
            {/* TENDENCIA DE INGRESOS */}
            <div className="glass-panel" style={{ padding: '1.5rem', height: 350 }}>
              <div className="card-title" style={{ marginBottom: '1rem', fontSize: '1.1rem' }}>📈 Tendencia de Ingresos</div>
              <ResponsiveContainer width="100%" height="85%">
                <LineChart data={tendencia} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <XAxis dataKey="dia" stroke="var(--mut)" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="var(--mut)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={v => `$${fmtK(v)}`} />
                  <Tooltip 
                    contentStyle={{ background: 'rgba(20,22,31,0.9)', border: '1px solid var(--brd)', borderRadius: 8, backdropFilter: 'blur(10px)' }}
                    itemStyle={{ color: 'var(--acc)', fontWeight: 600 }}
                    formatter={(val) => [`$${fmt(val)}`, 'Ingresos']}
                  />
                  <Line type="monotone" dataKey="ingresos" stroke="var(--acc)" strokeWidth={3} dot={{ r: 4, fill: 'var(--sur2)', strokeWidth: 2 }} activeDot={{ r: 6, fill: 'var(--acc)' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* TIPOS DE VEHICULO */}
            <div className="glass-panel" style={{ padding: '1.5rem', height: 350 }}>
              <div className="card-title" style={{ marginBottom: '1rem', fontSize: '1.1rem' }}>🚗 Distribución por Vehículo</div>
              <div style={{ display: 'flex', height: '85%', alignItems: 'center' }}>
                <ResponsiveContainer width="50%" height="100%">
                  <PieChart>
                    <Pie data={porTipo} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="total">
                      {porTipo.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ background: 'rgba(20,22,31,0.9)', border: '1px solid var(--brd)', borderRadius: 8 }}
                      formatter={(val, name, props) => [val, TIPOS[props.payload.tipo_vehiculo]]}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ width: '50%', paddingLeft: '1rem', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                  {porTipo.map((t, idx) => (
                    <div key={t.tipo_vehiculo} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.9rem' }}>
                        <div style={{ width: 10, height: 10, borderRadius: '50%', background: COLORS[idx % COLORS.length] }}></div>
                        {ICONS[t.tipo_vehiculo]} {TIPOS[t.tipo_vehiculo]}
                      </div>
                      <div style={{ fontWeight: 600 }}>{t.total}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* HORAS PICO */}
            <div className="glass-panel" style={{ padding: '1.5rem', height: 350 }}>
              <div className="card-title" style={{ marginBottom: '1rem', fontSize: '1.1rem' }}>⏰ Horas Pico</div>
              <ResponsiveContainer width="100%" height="85%">
                <BarChart data={horasPico} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
                  <XAxis dataKey="hora" stroke="var(--mut)" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="var(--mut)" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip 
                    cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                    contentStyle={{ background: 'rgba(20,22,31,0.9)', border: '1px solid var(--brd)', borderRadius: 8 }}
                  />
                  <Bar dataKey="lavados" fill="var(--acc2)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* RANKING EMPLEADOS */}
            <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
              <div className="card-title" style={{ marginBottom: '1rem', fontSize: '1.1rem' }}>🏆 Rendimiento de Operarios</div>
              <div style={{ overflowY: 'auto', flex: 1, paddingRight: '0.5rem' }}>
                {ranking.map((r, idx) => (
                  <div key={r.empleado_id} className="rank-item" style={{ marginBottom: '0.8rem' }}>
                    <div className={`rank-num ${idx === 0 ? 'gold' : idx === 1 ? 'silver' : idx === 2 ? 'bronze' : ''}`}>#{idx + 1}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: '1rem', color: '#fff' }}>{r.empleado_nombre}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--mut)', marginTop: 4 }}>Especialista: {ICONS[r.vehiculo_favorito]} {TIPOS[r.vehiculo_favorito]}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ color: 'var(--acc)', fontWeight: 700, fontSize: '1.1rem' }}>${fmt(r.total_ingresos)}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--mut)' }}>{r.total_lavados} lavados</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* GRÁFICO HISTÓRICO SEMESTRAL (NUEVO) */}
          <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1.5rem' }}>
            <div className="card-title" style={{ margin: 0 }}>📈 Histórico de Ingresos (Últimos 6 meses)</div>
            
            <div style={{ width: '100%', height: 350 }}>
              {tendenciaHistorica.length === 0 ? <div className="empty-state">Sin datos históricos suficientes</div> : (
                <ResponsiveContainer>
                  <BarChart data={tendenciaHistorica} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <XAxis dataKey="mes" stroke="var(--mut)" tick={{ fontSize: 12 }} />
                    <YAxis stroke="var(--mut)" tick={{ fontSize: 12 }} tickFormatter={val => `$${fmtK(val)}`} />
                    <Tooltip 
                      contentStyle={{ background: 'rgba(28,31,46,0.95)', border: '1px solid var(--brd)', borderRadius: 8, backdropFilter: 'blur(10px)', color: '#fff' }}
                      itemStyle={{ color: '#fff', fontWeight: 'bold' }}
                      formatter={(value) => [`$${fmt(value)}`, 'Ingresos']}
                      labelStyle={{ color: 'var(--acc)' }}
                      cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                    />
                    <Bar dataKey="ingresos" fill="url(#colorHist)" radius={[6, 6, 0, 0]} />
                    <defs>
                      <linearGradient id="colorHist" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--acc3)" stopOpacity={0.8}/>
                        <stop offset="100%" stopColor="var(--acc3)" stopOpacity={0.2}/>
                      </linearGradient>
                    </defs>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

        </div>
      )}
    </div>
  )
}