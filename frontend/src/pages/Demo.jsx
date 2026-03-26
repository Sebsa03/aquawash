import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import UpgradeModal from '../components/UpgradeModal'

const TIPOS  = { moto:'Moto', carro:'Carro', furgon:'Furgón', camion:'Camión', bus:'Bus' }
const ICONS  = { moto:'🏍',  carro:'🚗',   furgon:'🚐',    camion:'🚚',    bus:'🚌'  }
const BCLASS = { moto:'badge-moto', carro:'badge-carro', furgon:'badge-furgon', camion:'badge-camion', bus:'badge-bus' }
const PRECIOS = { moto:10000, carro:15000, furgon:20000, camion:25000, bus:30000 }
const ADICIONALES_CAT = [
  {id:'a1', nombre:'Aspirado',        precio:5000},
  {id:'a2', nombre:'Encerado',        precio:8000},
  {id:'a3', nombre:'Lav. Motor',      precio:12000},
  {id:'a4', nombre:'Rines',           precio:6000},
  {id:'a5', nombre:'Ambientador',     precio:3000},
]

const DEMO_MAX_LAVADOS = 10
const DEMO_MAX_EMP     = 2

function fmt(n)  { return Number(n||0).toLocaleString('es-CO') }
function fmtK(n) {
  n = Number(n||0)
  if (n >= 1000000) return (n/1000000).toFixed(1)+'M'
  if (n >= 1000)    return (n/1000).toFixed(0)+'k'
  return String(n)
}
function horaActual() {
  const n = new Date()
  return `${String(n.getHours()).padStart(2,'0')}:${String(n.getMinutes()).padStart(2,'0')}`
}
function hoy() { return new Date().toISOString().split('T')[0] }

export default function Demo() {
  const navigate = useNavigate()
  const [sec, setSec]             = useState('nuevo')
  const [upgrade, setUpgrade]     = useState(null)
  const [empNuevos, setEmpNuevos] = useState(0)
  const [empleados, setEmpleados] = useState(['Carlos Pérez','Andrés Gómez','Luis Torres'])
  const [nuevoEmp, setNuevoEmp]   = useState('')
  const [selAdd, setSelAdd]       = useState({})
  const [stab, setStab]           = useState('hoy')
  const [rtab, setRtab]           = useState('hoy')
  const [buscarH, setBuscarH]     = useState('')
  const [buscarV, setBuscarV]     = useState('')
  const [tipoF, setTipoF]         = useState('')
  const [cfgPrecios, setCfgPrecios] = useState({...PRECIOS})
  const [cfgAdics, setCfgAdics]   = useState(ADICIONALES_CAT.map(a=>({...a})))
  const [hora, setHora]           = useState(horaActual())
  const [fecha, setFecha]         = useState('')

  const [form, setForm] = useState({
    tipo:'', placa:'', empleado:'', hora: horaActual(), nota:''
  })

  const [lavados, setLavados] = useState([
    {id:1, fecha:hoy(), hora:'08:15', tipo:'carro',  placa:'ABC123', emp:'Carlos Pérez',  adics:[{nombre:'Encerado',precio:8000}],   base:15000, adic:8000,  total:23000},
    {id:2, fecha:hoy(), hora:'09:42', tipo:'moto',   placa:'XYZ789', emp:'Andrés Gómez', adics:[],                                   base:10000, adic:0,     total:10000},
    {id:3, fecha:hoy(), hora:'10:30', tipo:'furgon', placa:'DEF456', emp:'Carlos Pérez',  adics:[{nombre:'Aspirado',precio:5000},{nombre:'Lav. Motor',precio:12000}], base:20000, adic:17000, total:37000},
    {id:4, fecha:hoy(), hora:'11:15', tipo:'carro',  placa:'GHI321', emp:'Luis Torres',   adics:[{nombre:'Aspirado',precio:5000}],   base:15000, adic:5000,  total:20000},
  ])

  useEffect(() => {
    const n = new Date()
    const d = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb']
    const m = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']
    setFecha(`${d[n.getDay()]} ${n.getDate()} ${m[n.getMonth()]}`)
    setHora(`${String(n.getHours()).padStart(2,'0')}:${String(n.getMinutes()).padStart(2,'0')}`)
    const id = setInterval(() => {
      const t = new Date()
      setHora(`${String(t.getHours()).padStart(2,'0')}:${String(t.getMinutes()).padStart(2,'0')}`)
    }, 30000)
    return () => clearInterval(id)
  }, [])

  const precioBase = cfgPrecios[form.tipo] || 0
  const adicsSelec = cfgAdics.filter(a => selAdd[a.id])
  const precioAdic = adicsSelec.reduce((s,a)=>s+a.precio,0)
  const precioTotal = precioBase + precioAdic

  function registrar() {
    if (lavados.length >= DEMO_MAX_LAVADOS) { setUpgrade('lavados'); return }
    if (!form.tipo)     { alert('Selecciona el tipo de vehículo'); return }
    if (!form.placa)    { alert('Ingresa la placa'); return }
    if (!form.empleado) { alert('Selecciona el empleado'); return }
    const nuevo = {
      id: Date.now(), fecha: hoy(), hora: form.hora,
      tipo: form.tipo, placa: form.placa.toUpperCase(),
      emp: form.empleado,
      adics: adicsSelec.map(a=>({nombre:a.nombre,precio:a.precio})),
      base: precioBase, adic: precioAdic, total: precioTotal
    }
    setLavados(l => [nuevo, ...l])
    setForm({ tipo:'', placa:'', empleado:'', hora: horaActual(), nota:'' })
    setSelAdd({})
    const rest = DEMO_MAX_LAVADOS - lavados.length - 1
    if (rest <= 0) setTimeout(() => setUpgrade('lavados'), 800)
  }

  function agregarEmp() {
    if (empNuevos >= DEMO_MAX_EMP) { setUpgrade('empleados'); return }
    if (!nuevoEmp.trim()) return
    if (empleados.includes(nuevoEmp.trim())) { alert('Ya existe'); return }
    setEmpleados(e => [...e, nuevoEmp.trim()])
    setEmpNuevos(n => n+1)
    setNuevoEmp('')
    if (empNuevos + 1 >= DEMO_MAX_EMP) setTimeout(() => setUpgrade('empleados'), 800)
  }

  const filtH = lavados.filter(l => {
    if (tipoF && l.tipo !== tipoF) return false
    if (buscarH && !l.placa.toLowerCase().includes(buscarH.toLowerCase()) && !l.emp.toLowerCase().includes(buscarH.toLowerCase())) return false
    return true
  })

  const vehiculos = Object.values(lavados.reduce((m,l) => {
    if (!m[l.placa]) m[l.placa] = {placa:l.placa, tipo:l.tipo, count:0, total:0}
    m[l.placa].count++; m[l.placa].total+=l.total; return m
  }, {})).sort((a,b)=>b.count-a.count).filter(v=>v.placa.toLowerCase().includes(buscarV.toLowerCase()))

  const tot = lavados.reduce((s,l)=>s+l.total,0)
  const adic = lavados.reduce((s,l)=>s+l.adic,0)
  const maxTipo = Math.max(...Object.keys(TIPOS).map(t=>lavados.filter(l=>l.tipo===t).length),1)

  const rankData = empleados.map(e => {
    const mis = lavados.filter(l=>l.emp===e)
    return { nombre:e, count:mis.length, total:mis.reduce((s,l)=>s+l.total,0) }
  }).sort((a,b)=>b.count-a.count)
  const maxRank = Math.max(...rankData.map(r=>r.count),1)
  const medals = ['gold','silver','bronze']

  const navItems = [
    {id:'nuevo',    label:'＋ Nuevo'},
    {id:'historial',label:'📋 Historial'},
    {id:'stats',    label:'📊 Stats'},
    {id:'vehiculos',label:'🚗 Vehículos'},
    {id:'empleados',label:'👷 Empleados'},
    {id:'config',   label:'⚙️ Config'},
  ]

  const UPGRADE_MSG = {
    lavados:   'Alcanzaste el límite de 10 lavados en demo. Suscríbete para registros ilimitados.',
    empleados: 'En el plan completo puedes agregar empleados sin límite.',
    adicionales:'Agregar nuevos adicionales está disponible en el plan Básico o Pro.',
    exportar:  'La exportación de datos está disponible en el Plan Pro.',
    default:   'Desbloquea todas las funciones sin límites.',
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', minHeight:'100vh', background:'var(--bg)' }}>

      {/* BANNER DEMO */}
      <div style={{
        background:'rgba(255,107,43,0.12)', borderBottom:'1px solid rgba(255,107,43,0.3)',
        padding:'7px 14px', display:'flex', alignItems:'center',
        justifyContent:'space-between', flexWrap:'wrap', gap:8
      }}>
        <div style={{ display:'flex', alignItems:'center', gap:8, fontSize:12 }}>
          <span style={{ background:'var(--acc2)', color:'#000', fontWeight:700, padding:'2px 8px', borderRadius:20, fontSize:10, fontFamily:"'DM Mono',monospace" }}>MODO DEMO</span>
          <span style={{ color:'var(--mut)' }}>Lavados: <b style={{ color: lavados.length >= 8 ? 'var(--dan)' : 'var(--acc2)' }}>{lavados.length}/{DEMO_MAX_LAVADOS}</b></span>
          <span style={{ color:'var(--mut)' }}>Empleados nuevos: <b style={{ color: empNuevos >= DEMO_MAX_EMP ? 'var(--dan)' : 'var(--acc2)' }}>{empNuevos}/{DEMO_MAX_EMP}</b></span>
          <span style={{ color:'var(--mut)' }}>Exportar: <b style={{ color:'var(--dan)' }}>Bloqueado</b></span>
        </div>
        <button className="btn-primary" style={{ fontSize:11, padding:'5px 12px' }}
          onClick={() => navigate('/registro')}>
          🚀 Obtener plan completo
        </button>
      </div>

      {/* HEADER */}
      <header style={{
        background:'var(--sur)', borderBottom:'1px solid var(--brd)',
        padding:'0 14px', display:'flex', alignItems:'center',
        justifyContent:'space-between', height:52,
        position:'sticky', top:0, zIndex:50
      }}>
        <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:'1.3rem', letterSpacing:2, color:'var(--acc)' }}>
          💧 <span style={{ color:'var(--txt)' }}>AQUA</span>WASH
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ fontFamily:"'DM Mono',monospace", fontSize:10, color:'var(--mut)', textAlign:'right', lineHeight:1.5 }}>
            {fecha}<br/>{hora}
          </div>
          <div style={{ background:'rgba(255,107,43,.15)', border:'1px solid rgba(255,107,43,.3)', color:'var(--acc2)', borderRadius:20, padding:'2px 8px', fontSize:10, fontWeight:700, cursor:'pointer' }}
            onClick={() => setUpgrade('default')}>DEMO</div>
        </div>
      </header>

      {/* NAV */}
      <nav style={{ background:'var(--sur)', borderBottom:'1px solid var(--brd)', display:'flex', overflowX:'auto', scrollbarWidth:'none' }}>
        {navItems.map(n => (
          <button key={n.id}
            onClick={() => setSec(n.id)}
            style={{
              background:'none', border:'none',
              borderBottom: sec===n.id ? '2px solid var(--acc)' : '2px solid transparent',
              color: sec===n.id ? 'var(--acc)' : 'var(--mut)',
              fontFamily:"'DM Sans',sans-serif", fontSize:11, fontWeight:500,
              padding:'10px 13px', cursor:'pointer', whiteSpace:'nowrap',
              textTransform:'uppercase', letterSpacing:.5
            }}>
            {n.label}
          </button>
        ))}
      </nav>

      {/* CONTENIDO */}
      <main style={{ flex:1, padding:'14px', maxWidth:900, margin:'0 auto', width:'100%' }}>

        {/* NUEVO LAVADO */}
        {sec === 'nuevo' && (
          <div>
            <div style={{ marginBottom:'1rem' }}>
              <h1 style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:'1.5rem', letterSpacing:2 }}>Registrar Lavado</h1>
              <div style={{ fontSize:11, color:'var(--mut)', marginTop:4 }}>
                Lavados restantes: <b style={{ color:'var(--acc2)' }}>{DEMO_MAX_LAVADOS - lavados.length}</b>/10
              </div>
              <div style={{ height:5, background:'var(--brd)', borderRadius:3, marginTop:6, overflow:'hidden', maxWidth:200 }}>
                <div style={{ height:'100%', background: lavados.length>=8?'var(--dan)':'var(--acc2)', borderRadius:3, width:`${(lavados.length/DEMO_MAX_LAVADOS*100).toFixed(0)}%`, transition:'width .3s' }}/>
              </div>
            </div>
            <div className="card" style={{ borderColor:'rgba(0,212,255,.2)' }}>
              <div className="form-grid" style={{ marginBottom:'1rem' }}>
                <div className="form-group">
                  <label className="form-label">Tipo de Vehículo</label>
                  <select className="input-base" value={form.tipo} onChange={e=>setForm(f=>({...f,tipo:e.target.value}))}>
                    <option value="">— Seleccionar —</option>
                    {Object.keys(TIPOS).map(t=><option key={t} value={t}>{ICONS[t]} {TIPOS[t]}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Placa / ID</label>
                  <input className="input-base" placeholder="ABC-123" value={form.placa}
                    onChange={e=>setForm(f=>({...f,placa:e.target.value.toUpperCase()}))} autoComplete="off"/>
                </div>
                <div className="form-group">
                  <label className="form-label">Empleado</label>
                  <select className="input-base" value={form.empleado} onChange={e=>setForm(f=>({...f,empleado:e.target.value}))}>
                    <option value="">— Seleccionar —</option>
                    {empleados.map(e=><option key={e} value={e}>{e}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Hora de Ingreso</label>
                  <input className="input-base" type="time" value={form.hora} onChange={e=>setForm(f=>({...f,hora:e.target.value}))}/>
                </div>
              </div>

              <div style={{ marginBottom:'1rem' }}>
                <div className="form-label" style={{ marginBottom:6 }}>Servicios Adicionales</div>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(155px,1fr))', gap:6 }}>
                  {cfgAdics.map(a => (
                    <label key={a.id} style={{
                      display:'flex', alignItems:'center', gap:6,
                      background: selAdd[a.id] ? 'rgba(0,212,255,.06)' : 'var(--sur2)',
                      border: `1px solid ${selAdd[a.id]?'var(--acc)':'var(--brd)'}`,
                      borderRadius:6, padding:'6px 8px', cursor:'pointer', fontSize:12, userSelect:'none'
                    }}>
                      <input type="checkbox" checked={!!selAdd[a.id]}
                        onChange={()=>setSelAdd(s=>({...s,[a.id]:!s[a.id]}))}
                        style={{ accentColor:'var(--acc)', width:13, height:13, flexShrink:0 }}/>
                      <span>{a.nombre}</span>
                      <span style={{ marginLeft:'auto', color:'var(--mut)', fontFamily:"'DM Mono',monospace", fontSize:10 }}>+${fmt(a.precio)}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="form-group" style={{ marginBottom:'1rem' }}>
                <label className="form-label">Nota (opcional)</label>
                <input className="input-base" placeholder="Observaciones..." value={form.nota}
                  onChange={e=>setForm(f=>({...f,nota:e.target.value}))}/>
              </div>

              <div className="precio-preview">
                <div style={{ fontSize:12, color:'var(--mut)', flex:1 }}>
                  {form.tipo
                    ? `Base ${TIPOS[form.tipo]}: $${fmt(precioBase)}${adicsSelec.length?`  +  ${adicsSelec.map(a=>a.nombre).join(', ')}: $${fmt(precioAdic)}`:''}`
                    : 'Selecciona el tipo de vehículo'}
                </div>
                <div className="precio-total">${fmt(precioTotal)}</div>
              </div>

              <div style={{ display:'flex', gap:10, marginTop:'1rem', flexWrap:'wrap' }}>
                <button className="btn-primary" onClick={registrar}>✔ Registrar</button>
                <button className="btn-secondary" onClick={()=>{setForm({tipo:'',placa:'',empleado:'',hora:horaActual(),nota:''});setSelAdd({})}}>↺ Limpiar</button>
              </div>
            </div>
          </div>
        )}

        {/* HISTORIAL */}
        {sec === 'historial' && (
          <div>
            <h1 style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:'1.5rem', letterSpacing:2, marginBottom:'1rem' }}>Historial</h1>
            <div className="search-bar">
              <input placeholder="Buscar placa..." value={buscarH} onChange={e=>setBuscarH(e.target.value)}/>
              <select value={tipoF} onChange={e=>setTipoF(e.target.value)}>
                <option value="">Todos</option>
                {Object.keys(TIPOS).map(t=><option key={t} value={t}>{TIPOS[t]}</option>)}
              </select>
            </div>
            {filtH.length === 0
              ? <div className="empty-state">🔍 Sin registros</div>
              : <div className="table-wrap"><table>
                  <thead><tr><th>#</th><th>Hora</th><th>Tipo</th><th>Placa</th><th>Empleado</th><th>Adicionales</th><th>Total</th><th></th></tr></thead>
                  <tbody>
                    {filtH.map((l,i)=>(
                      <tr key={l.id}>
                        <td className="mono text-muted">{filtH.length-i}</td>
                        <td className="mono">{l.hora}</td>
                        <td><span className={`badge ${BCLASS[l.tipo]}`}>{ICONS[l.tipo]} {TIPOS[l.tipo]}</span></td>
                        <td className="mono" style={{ fontWeight:700 }}>{l.placa}</td>
                        <td><span className="emp-tag">{l.emp}</span></td>
                        <td style={{ fontSize:11, color:'var(--mut)' }}>{l.adics.map(a=>a.nombre).join(', ')||'—'}</td>
                        <td className="mono text-green" style={{ fontWeight:700 }}>${fmt(l.total)}</td>
                        <td><button className="del-btn" onClick={()=>setLavados(ls=>ls.filter(x=>x.id!==l.id))}>✕</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table></div>
            }
            {filtH.length > 0 && (
              <div style={{ marginTop:8, fontSize:12, color:'var(--mut)', display:'flex', gap:16 }}>
                <span>{filtH.length} registros</span>
                <span style={{ color:'var(--acc3)', fontWeight:600 }}>Total: ${fmt(filtH.reduce((s,l)=>s+l.total,0))}</span>
              </div>
            )}
          </div>
        )}

        {/* ESTADÍSTICAS */}
        {sec === 'stats' && (
          <div>
            <h1 style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:'1.5rem', letterSpacing:2, marginBottom:'1rem' }}>Estadísticas</h1>
            <div className="tabs">
              {[{v:'hoy',l:'Hoy'},{v:'total',l:'Total'}].map(t=>(
                <button key={t.v} className={`tab ${stab===t.v?'active':''}`} onClick={()=>setStab(t.v)}>{t.l}</button>
              ))}
            </div>
            <div className="stats-grid">
              <div className="stat-card blue"><div className="stat-label">Vehículos</div><div className="stat-value">{lavados.length}</div></div>
              <div className="stat-card green"><div className="stat-label">Ingresos</div><div className="stat-value">${fmtK(tot)}</div><div className="stat-sub">${fmt(tot)}</div></div>
              <div className="stat-card orange"><div className="stat-label">Adicionales</div><div className="stat-value">${fmtK(adic)}</div></div>
              <div className="stat-card red"><div className="stat-label">Promedio</div><div className="stat-value">${lavados.length?fmtK(Math.round(tot/lavados.length)):0}</div></div>
            </div>
            <div className="card">
              <div className="card-title">📈 Por Tipo de Vehículo</div>
              {Object.keys(TIPOS).map(tipo => {
                const cnt = lavados.filter(l=>l.tipo===tipo).length
                const rev = lavados.filter(l=>l.tipo===tipo).reduce((s,l)=>s+l.total,0)
                return (
                  <div key={tipo} className="bar-tipo">
                    <span className="bar-lbl">{ICONS[tipo]} {TIPOS[tipo]}</span>
                    <div className="bar-bg"><div className="bar-fill" style={{ width:`${(cnt/maxTipo*100).toFixed(0)}%` }}/></div>
                    <span className="bar-cnt">{cnt}</span>
                    <span className="bar-rev">${fmt(rev)}</span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* VEHÍCULOS */}
        {sec === 'vehiculos' && (
          <div>
            <h1 style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:'1.5rem', letterSpacing:2, marginBottom:'1rem' }}>Vehículos</h1>
            <div className="search-bar">
              <input placeholder="Buscar placa..." value={buscarV} onChange={e=>setBuscarV(e.target.value)}/>
            </div>
            {vehiculos.length === 0
              ? <div className="empty-state">🚗 Sin vehículos</div>
              : <div className="table-wrap"><table>
                  <thead><tr><th>Placa</th><th>Tipo</th><th>Lavados</th><th>Total</th></tr></thead>
                  <tbody>
                    {vehiculos.map(v=>(
                      <tr key={v.placa}>
                        <td className="mono" style={{ fontWeight:700 }}>
                          {v.placa}
                          {v.count>=5 && <span className="frecuente-badge">★ FRECUENTE</span>}
                        </td>
                        <td><span className={`badge ${BCLASS[v.tipo]}`}>{ICONS[v.tipo]} {TIPOS[v.tipo]}</span></td>
                        <td><span style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:'1.1rem', color:'var(--acc)' }}>{v.count}</span></td>
                        <td className="mono text-green" style={{ fontWeight:600 }}>${fmt(v.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table></div>
            }
          </div>
        )}

        {/* EMPLEADOS */}
        {sec === 'empleados' && (
          <div>
            <h1 style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:'1.5rem', letterSpacing:2, marginBottom:'1rem' }}>Empleados</h1>
            <div className="card">
              <div className="card-title">👷 Gestionar Empleados</div>
              <div style={{ fontSize:11, color:'var(--mut)', marginBottom:8 }}>
                Puedes agregar máximo <b style={{ color:'var(--acc2)' }}>2 empleados nuevos</b> en demo.{' '}
                <span style={{ color:'var(--acc)', cursor:'pointer', textDecoration:'underline' }} onClick={()=>setUpgrade('empleados')}>Actualiza para ilimitados →</span>
              </div>
              <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:'1rem' }}>
                <input className="input-base" style={{ flex:1, minWidth:160 }} placeholder="Nombre del empleado"
                  value={nuevoEmp} onChange={e=>setNuevoEmp(e.target.value)}
                  onKeyDown={e=>e.key==='Enter'&&agregarEmp()}/>
                <button className="btn-primary" onClick={agregarEmp} disabled={empNuevos>=DEMO_MAX_EMP}>+ Agregar</button>
              </div>
              <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
                {empleados.map(e=>(
                  <div key={e} style={{ display:'flex', alignItems:'center', gap:5, background:'var(--sur2)', border:'1px solid var(--brd)', borderRadius:20, padding:'3px 12px 3px 14px' }}>
                    <span style={{ fontSize:13 }}>{e}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="card">
              <div className="card-title">🏆 Ranking</div>
              <div className="tabs">
                {[{v:'hoy',l:'Hoy'},{v:'total',l:'Total'}].map(t=>(
                  <button key={t.v} className={`tab ${rtab===t.v?'active':''}`} onClick={()=>setRtab(t.v)}>{t.l}</button>
                ))}
              </div>
              {rankData.map((r,i)=>(
                <div key={r.nombre} className="rank-item">
                  <div className={`rank-num ${medals[i]||''}`}>{i+1}</div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontWeight:600, fontSize:13 }}>{r.nombre}</div>
                    <div style={{ fontSize:11, color:'var(--mut)' }}>${fmt(r.total)} generados</div>
                  </div>
                  <div className="rank-bar-bg"><div className="rank-bar" style={{ width:`${(r.count/maxRank*100).toFixed(0)}%` }}/></div>
                  <div className="rank-count">{r.count}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CONFIG */}
        {sec === 'config' && (
          <div>
            <h1 style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:'1.5rem', letterSpacing:2, marginBottom:'1rem' }}>Configuración</h1>
            <div className="card">
              <div className="card-title">💰 Precios Base</div>
              <p style={{ fontSize:12, color:'var(--acc3)', marginBottom:12 }}>✔ En modo demo puedes editar los precios libremente.</p>
              {Object.keys(TIPOS).map(t=>(
                <div key={t} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'7px 0', borderBottom:'1px solid var(--brd)', gap:10 }}>
                  <span style={{ fontSize:13 }}>{ICONS[t]} {TIPOS[t]}</span>
                  <input type="number" value={cfgPrecios[t]}
                    onChange={e=>setCfgPrecios(p=>({...p,[t]:parseInt(e.target.value)||0}))}
                    style={{ background:'var(--sur2)', border:'1px solid var(--brd)', borderRadius:6, color:'var(--txt)', fontFamily:"'DM Mono',monospace", fontSize:12, padding:'5px 8px', width:100, outline:'none', textAlign:'right' }}/>
                </div>
              ))}
            </div>
            <div className="card">
              <div className="card-title">➕ Servicios Adicionales</div>
              <p style={{ fontSize:12, color:'var(--mut)', marginBottom:12 }}>
                Puedes editar los precios existentes.{' '}
                <span style={{ color:'var(--acc)', cursor:'pointer', textDecoration:'underline' }} onClick={()=>setUpgrade('adicionales')}>Agregar nuevos solo en plan completo →</span>
              </p>
              {cfgAdics.map(a=>(
                <div key={a.id} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'7px 0', borderBottom:'1px solid var(--brd)', gap:10 }}>
                  <span style={{ fontSize:13 }}>{a.nombre}</span>
                  <input type="number" value={a.precio}
                    onChange={e=>setCfgAdics(ads=>ads.map(x=>x.id===a.id?{...x,precio:parseInt(e.target.value)||0}:x))}
                    style={{ background:'var(--sur2)', border:'1px solid var(--brd)', borderRadius:6, color:'var(--txt)', fontFamily:"'DM Mono',monospace", fontSize:12, padding:'5px 8px', width:100, outline:'none', textAlign:'right' }}/>
                </div>
              ))}
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 0', gap:10, opacity:.4, pointerEvents:'none' }}>
                <span style={{ fontSize:12, color:'var(--mut)' }}>🔒 Agregar nuevos adicionales</span>
                <span style={{ fontSize:11, color:'var(--acc2)' }}>Solo en plan completo</span>
              </div>
            </div>
            <div className="card" style={{ textAlign:'center' }}>
              <div style={{ fontSize:'1.5rem', marginBottom:8 }}>🚀</div>
              <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:'1.2rem', letterSpacing:2, color:'var(--acc)', marginBottom:6 }}>
                ¿Listo para el plan completo?
              </div>
              <p style={{ fontSize:12, color:'var(--mut)', marginBottom:14 }}>Sin límites. Exportación, cierre de caja y más.</p>
              <button className="btn-primary" onClick={()=>navigate('/registro')}>Ver planes y precios</button>
            </div>
          </div>
        )}

      </main>

      <UpgradeModal
        open={!!upgrade}
        mensaje={UPGRADE_MSG[upgrade] || UPGRADE_MSG.default}
        onClose={() => setUpgrade(null)}
      />
    </div>
  )
}