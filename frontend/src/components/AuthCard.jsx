import { Link } from 'react-router-dom'

export default function AuthCard({ title, description, children, backTo = '/login', backText = 'Volver al inicio de sesión' }) {
  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', padding:'1rem' }}>
      <div style={{ background:'var(--sur)', border:'1px solid var(--brd)', borderRadius:14, padding:'2rem 1.8rem', width:'100%', maxWidth:420 }}>
        <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:'1.75rem', letterSpacing:3, color:'var(--acc)', textAlign:'center', marginBottom:14 }}>
          {title}
        </div>
        {description && (
          <p style={{ color:'var(--mut)', fontSize:13, marginBottom:18, textAlign:'center' }}>
            {description}
          </p>
        )}

        {children}

        <div style={{ marginTop:18, textAlign:'center', color:'var(--mut)', fontSize:13 }}>
          <Link to={backTo} style={{ color:'var(--acc)' }}>{backText}</Link>
        </div>
      </div>
    </div>
  )
}
