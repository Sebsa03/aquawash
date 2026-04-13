import { useState, useEffect } from 'react'
import { getResumen, getTendencia } from '../../services/api'
import { useToast } from '../../components/Toast'

function fmt(n) { return Number(n || 0).toLocaleString('es-CO') }

export default function Auditoria() {
  const toast = useToast()
  
  const [resAct, setResAct] = useState(null)
  const [resPas, setResPas] = useState(null)
  const [tendencia, setTendencia] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function cargar() {
      setLoading(true)
      try {
        const [rA, rP, t] = await Promise.all([
          getResumen('mes'),
          getResumen('mes_pasado'),
          getTendencia()
        ])
        setResAct(rA)
        setResPas(rP)
        setTendencia(t)
      } catch (e) {
        toast?.('Error cargando finanzas')
      } finally {
        setLoading(false)
      }
    }
    cargar()
  }, [])

  // Comparativa de crecimiento
  const deltaIngresos = (resAct?.ingresos || 0) - (resPas?.ingresos || 0)
  const pctIngresos   = resPas?.ingresos ? (deltaIngresos / resPas.ingresos * 100) : 0
  const mssgDelta = pctIngresos >= 0 ? `+${pctIngresos.toFixed(1)}%` : `${pctIngresos.toFixed(1)}%`
  const colorDelta = pctIngresos >= 0 ? 'var(--green)' : 'var(--red)'

  const maxTendencia = Math.max(...tendencia.map(t => t.ingresos), 1)

  return (
    <div>
      <div style={{ marginBottom: '1.2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:'1.6rem', letterSpacing:2 }}>
            Central de Finanzas
          </h1>
          <p style={{ fontSize:13, color:'var(--mut)', marginTop:4 }}>
            Análisis de tendencias e ingresos históricos
          </p>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign:'center', padding:'3rem', color:'var(--mut)' }}>Compilando inteligencia de negocio...</div>
      ) : (
        <>
          {/* Bloque Financiero Comparativo */}
          <div className="card" style={{ marginBottom: '1.2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'linear-gradient(145deg, rgba(255,255,255,0.05), rgba(0,0,0,0.3))' }}>
            <div>
              <div style={{ color:'var(--mut)', fontSize:12, textTransform:'uppercase', letterSpacing:1.5, fontWeight: 'bold' }}>Ingresos Brutos - Este Mes</div>
              <div style={{ fontSize:'2.5rem', fontFamily:"'Bebas Neue',cursive", color:'var(--acc3)', textShadow: '0 0 20px rgba(126,255,110,0.3)' }}>
                ${fmt(resAct?.ingresos)} <span style={{fontSize:'1.2rem', color:'rgba(255,255,255,0.5)', textShadow:'none'}}>COP</span>
              </div>
            </div>
            <div style={{ textAlign:'right', background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}>
              <div style={{ color:'var(--mut)', fontSize:12, textTransform: 'uppercase', letterSpacing: 1 }}>vs Mes Anterior</div>
              <div style={{ fontSize:'1.5rem', fontWeight:'bold', color: colorDelta, textShadow: `0 0 10px ${colorDelta}` }}>
                {mssgDelta}
              </div>
              <div style={{ fontSize:11, color:'var(--mut)' }}>(${fmt(Math.abs(deltaIngresos))})</div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: '1.2rem' }}>
            
            {/* Gráfico de Tendencia */}
            <div className="card" style={{ padding: 0 }}>
               <div className="card-title" style={{ padding: '1.2rem 1.2rem 0', color: '#fff' }}>
                 📈 Tendencia de Ingresos (Últimos 6 meses)
               </div>
               
               {tendencia.length === 0 ? (
                 <div className="empty-state">No hay suficientes datos históricos</div>
               ) : (
                 <div style={{ padding: '2rem 1.2rem 1.2rem', display: 'flex', alignItems: 'flex-end', gap: '0.8rem', height: 250 }}>
                   {tendencia.map((t, idx) => {
                     const heightPct = (t.ingresos / maxTendencia) * 100
                     return (
                       <div key={idx} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', height: '100%', position: 'relative' }}>
                         <div style={{ fontSize: 10, color: '#fff', fontWeight: 600, marginBottom: 8, whiteSpace: 'nowrap' }}>${fmt(t.ingresos)}</div>
                         {/* Bar */}
                         <div style={{ 
                           width: '100%', 
                           maxWidth: '60px', 
                           height: `${heightPct}%`, 
                           minHeight: '4px',
                           background: idx === tendencia.length - 1 ? 'linear-gradient(0deg, rgba(126,255,110,0.5) 0%, rgba(126,255,110,1) 100%)' : 'linear-gradient(0deg, rgba(0,212,255,0.3) 0%, rgba(0,212,255,0.8) 100%)',
                           borderTopLeftRadius: 6,
                           borderTopRightRadius: 6,
                           boxShadow: idx === tendencia.length - 1 ? '0 0 15px rgba(126,255,110,0.4)' : 'none',
                           transition: 'height 0.5s ease'
                         }}></div>
                         <div style={{ fontSize: 11, color: 'var(--mut)', marginTop: 8 }}>{t.mes}</div>
                       </div>
                     )
                   })}
                 </div>
               )}
            </div>

            <div className="card" style={{ padding: '1.2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="card-title" style={{ marginBottom: 0 }}>💡 Desglose Analítico Mensual</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem' }}>
                
                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: 8, border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ fontSize: 11, color: 'var(--mut)', textTransform: 'uppercase', marginBottom: 4 }}>Total Lavados</div>
                  <div style={{ fontSize: '2rem', fontWeight: '900', color: '#fff' }}>
                    {resAct?.vehiculos || 0}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--mut)', marginTop: 4 }}>autos atendidos</div>
                </div>

                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: 8, border: '1px solid rgba(0,212,255,0.1)' }}>
                  <div style={{ fontSize: 11, color: 'var(--mut)', textTransform: 'uppercase', marginBottom: 4 }}>Ticket Promedio</div>
                  <div style={{ fontSize: '2rem', fontWeight: '900', color: 'var(--acc)', textShadow: '0 0 10px rgba(0,212,255,0.2)' }}>
                    ${fmt(resAct?.promedio)}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--mut)', marginTop: 4 }}>por cada vehículo</div>
                </div>

                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: 8, border: '1px solid rgba(126,255,110,0.1)' }}>
                  <div style={{ fontSize: 11, color: 'var(--mut)', textTransform: 'uppercase', marginBottom: 4 }}>Ingresos Adicionales</div>
                  <div style={{ fontSize: '2rem', fontWeight: '900', color: 'var(--acc3)', textShadow: '0 0 10px rgba(126,255,110,0.2)' }}>
                    ${fmt(resAct?.adicionales)}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--mut)', marginTop: 4 }}>extras y propinas</div>
                </div>

              </div>
            </div>

          </div>
        </>
      )}
    </div>
  )
}
