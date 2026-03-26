import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { registro as apiRegistro } from '../services/api'
import { useAuth } from '../context/AuthContext'

const planes = [
  {
    id: 'basico', nombre: 'Basico', precio: '$35.000',
    desc: 'Para lavaderos que estan comenzando',
    features: ['Registro ilimitado de lavados','Historial y filtros','Estadisticas','Gestion de empleados','Ranking semanal'],
    bloqueados: ['Cierre de caja','Etiquetas de estado','Exportacion de datos']
  },
  {
    id: 'pro', nombre: 'Pro', precio: '$75.000', popular: true,
    desc: 'Para lavaderos que quieren crecer',
    features: ['Todo lo del plan Basico','Cierre de caja del dia','Etiquetas de estado','Exportacion de datos JSON','Cliente frecuente','Soporte prioritario'],
    bloqueados: []
  }
]

export default function Register() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [paso, setPaso]       = useState(1)
  const [planSel, setPlanSel] = useState('pro')
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState(null)
  const [form, setForm]       = useState({
    nombre_lavadero: '', ciudad: '', telefono: '',
    email: '', password: '', confirmar: ''
  })

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    if (form.password !== form.confirmar) return setError('Las contrasenas no coinciden')
    if (form.password.length < 8) return setError('La contrasena debe tener al menos 8 caracteres')
    if (!form.nombre_lavadero.trim()) return setError('El nombre del lavadero es obligatorio')

    setLoading(true)
    try {
      const data = await apiRegistro({
        nombre:   form.nombre_lavadero.trim(),
        ciudad:   form.ciudad,
        telefono: form.telefono,
        email:    form.email,
        password: form.password,
        plan:     planSel
      })
      localStorage.setItem('aw_token', data.access_token)
      navigate('/app/dashboard')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight:'100vh', background:'var(--bg)', padding:'1.5rem 1rem' }}>

      <div style={{ textAlign:'center', marginBottom:24 }}>
        <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:'1.5rem', letterSpacing:3, color:'var(--acc)', cursor:'pointer' }}
          onClick={() => navigate('/')}>
          AQUAWASH
        </div>
        <p style={{ fontSize:12, color:'var(--mut)', marginTop:4 }}>7 dias gratis sin tarjeta</p>
      </div>

      {/* Indicador de pasos */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8, marginBottom:24 }}>
        {[1,2].map(n => (
          <div key={n} style={{ display:'flex', alignItems:'center', gap:8 }}>
            <div style={{
              width:28, height:28, borderRadius:'50%',
              background: paso >= n ? 'var(--acc)' : 'var(--sur2)',
              border: `1px solid ${paso >= n ? 'var(--acc)' : 'var(--brd)'}`,
              color: paso >= n ? '#000' : 'var(--mut)',
              display:'flex', alignItems:'center', justifyContent:'center',
              fontSize:12, fontWeight:700
            }}>{n}</div>
            <span style={{ fontSize:12, color: paso >= n ? 'var(--txt)' : 'var(--mut)' }}>
              {n === 1 ? 'Elige tu plan' : 'Crea tu cuenta'}
            </span>
            {n < 2 && <div style={{ width:28, height:1, background: paso > n ? 'var(--acc)' : 'var(--brd)' }} />}
          </div>
        ))}
      </div>

      {/* PASO 1 */}
      {paso === 1 && (
        <div style={{ maxWidth:660, margin:'0 auto' }}>
          <h2 style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:'1.6rem', letterSpacing:2, textAlign:'center', marginBottom:20 }}>
            Elige tu plan
          </h2>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(260px,1fr))', gap:16, marginBottom:20 }}>
            {planes.map(plan => (
              <div key={plan.id} onClick={() => setPlanSel(plan.id)} style={{
                background: planSel === plan.id ? 'rgba(0,212,255,0.04)' : 'var(--sur)',
                border: `2px solid ${planSel === plan.id ? 'var(--acc)' : 'var(--brd)'}`,
                borderRadius:14, padding:'1.4rem', cursor:'pointer',
                transition:'all 0.2s', position:'relative'
              }}>
                {plan.popular && (
                  <div style={{
                    position:'absolute', top:-12, left:'50%', transform:'translateX(-50%)',
                    background:'var(--acc)', color:'#000', fontSize:10, fontWeight:700,
                    padding:'2px 12px', borderRadius:20, whiteSpace:'nowrap'
                  }}>POPULAR</div>
                )}
                <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
                  <div style={{
                    width:18, height:18, borderRadius:'50%',
                    border: `2px solid ${planSel === plan.id ? 'var(--acc)' : 'var(--brd)'}`,
                    display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0
                  }}>
                    {planSel === plan.id && <div style={{ width:8, height:8, borderRadius:'50%', background:'var(--acc)' }} />}
                  </div>
                  <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:'1.2rem', letterSpacing:1, color: planSel === plan.id ? 'var(--acc)' : 'var(--txt)' }}>
                    {plan.nombre}
                  </div>
                </div>
                <div style={{ fontSize:12, color:'var(--mut)', marginBottom:8 }}>{plan.desc}</div>
                <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:'2rem', color: planSel === plan.id ? 'var(--acc)' : 'var(--txt)', marginBottom:12 }}>
                  {plan.precio}
                </div>
                {plan.features.map(f => (
                  <div key={f} style={{ fontSize:12, display:'flex', gap:7, marginBottom:5 }}>
                    <span style={{ color:'var(--acc3)', fontWeight:700, flexShrink:0 }}>✓</span>{f}
                  </div>
                ))}
                {plan.bloqueados.map(f => (
                  <div key={f} style={{ fontSize:12, display:'flex', gap:7, marginBottom:5, color:'var(--mut)' }}>
                    <span style={{ flexShrink:0 }}>✗</span>{f}
                  </div>
                ))}
              </div>
            ))}
          </div>
          <div style={{ textAlign:'center' }}>
            <button className="btn-primary" style={{ fontSize:15, padding:'12px 36px', borderRadius:8 }}
              onClick={() => setPaso(2)}>
              Continuar con plan {planes.find(p => p.id === planSel)?.nombre} →
            </button>
            <div style={{ marginTop:8, fontSize:12, color:'var(--mut)' }}>7 dias gratis sin tarjeta</div>
          </div>
        </div>
      )}

      {/* PASO 2 */}
      {paso === 2 && (
        <div style={{ maxWidth:460, margin:'0 auto' }}>
          <div style={{
            background:'var(--sur)', border:'1px solid var(--acc)',
            borderRadius:10, padding:'10px 16px', marginBottom:18,
            display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:8
          }}>
            <span style={{ fontFamily:"'Bebas Neue',sans-serif", color:'var(--acc)', letterSpacing:1 }}>
              Plan {planes.find(p => p.id === planSel)?.nombre}
            </span>
            <button onClick={() => setPaso(1)}
              style={{ background:'none', border:'none', color:'var(--acc)', fontSize:12, cursor:'pointer', textDecoration:'underline' }}>
              Cambiar
            </button>
          </div>

          <div style={{ background:'var(--sur)', border:'1px solid var(--brd)', borderRadius:14, padding:'1.8rem' }}>
            <h2 style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:'1.3rem', letterSpacing:2, marginBottom:18 }}>
              Crea tu cuenta
            </h2>
            <form onSubmit={handleSubmit}>
              <div className="form-grid" style={{ marginBottom:12 }}>
                <div className="form-group">
                  <label className="form-label">Nombre del lavadero</label>
                  <input className="input-base" name="nombre_lavadero"
                    placeholder="Ej: Lavadero El Diamante"
                    value={form.nombre_lavadero} onChange={handleChange} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Ciudad</label>
                  <input className="input-base" name="ciudad"
                    placeholder="Ej: Valledupar"
                    value={form.ciudad} onChange={handleChange} />
                </div>
              </div>
              <div className="form-group" style={{ marginBottom:12 }}>
                <label className="form-label">Telefono (opcional)</label>
                <input className="input-base" name="telefono"
                  placeholder="3001234567"
                  value={form.telefono} onChange={handleChange} />
              </div>
              <div className="form-group" style={{ marginBottom:12 }}>
                <label className="form-label">Correo electronico</label>
                <input className="input-base" type="email" name="email"
                  placeholder="tu@correo.com"
                  value={form.email} onChange={handleChange} required />
              </div>
              <div className="form-grid" style={{ marginBottom:12 }}>
                <div className="form-group">
                  <label className="form-label">Contrasena</label>
                  <input className="input-base" type="password" name="password"
                    placeholder="Min. 8 caracteres"
                    value={form.password} onChange={handleChange} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Confirmar</label>
                  <input className="input-base" type="password" name="confirmar"
                    placeholder="Repite la contrasena"
                    value={form.confirmar} onChange={handleChange} required />
                </div>
              </div>

              <div style={{ marginBottom:14 }}>
                {[
                  { ok: form.password.length >= 8, txt:'Minimo 8 caracteres' },
                  { ok: form.password === form.confirmar && form.confirmar.length > 0, txt:'Las contrasenas coinciden' }
                ].map(r => (
                  <div key={r.txt} style={{ display:'flex', alignItems:'center', gap:6, fontSize:11, color: r.ok ? 'var(--acc3)' : 'var(--mut)', marginBottom:3 }}>
                    <span>{r.ok ? '✓' : '○'}</span>{r.txt}
                  </div>
                ))}
              </div>

              {error && (
                <div style={{ background:'rgba(255,71,87,0.1)', border:'1px solid rgba(255,71,87,0.3)', borderRadius:6, padding:'8px 12px', fontSize:12, color:'var(--dan)', marginBottom:12 }}>
                  {error}
                </div>
              )}

              <button className="btn-primary" type="submit" disabled={loading}
                style={{ width:'100%', padding:'0.75rem', fontSize:14 }}>
                {loading ? 'Creando cuenta...' : 'Crear cuenta gratis'}
              </button>
            </form>
          </div>

          <div style={{ textAlign:'center', marginTop:12, fontSize:12, color:'var(--mut)' }}>
            Ya tienes cuenta?{' '}
            <Link to="/login" style={{ color:'var(--acc)' }}>Inicia sesion</Link>
          </div>
        </div>
      )}
    </div>
  )
}