export default function Feedback({ error, message }) {
  if (!error && !message) return null

  return (
    <>
      {error && (
        <div style={{ background:'rgba(255,71,87,0.1)', border:'1px solid rgba(255,71,87,0.3)', borderRadius:6, padding:'10px 14px', fontSize:13, color:'var(--dan)', marginBottom:14, textAlign:'center' }}>
          {error}
        </div>
      )}
      {message && (
        <div style={{ background:'rgba(0,214,255,0.1)', border:'1px solid rgba(0,212,255,0.3)', borderRadius:6, padding:'10px 14px', fontSize:13, color:'var(--acc)', marginBottom:14, textAlign:'center' }}>
          {message}
        </div>
      )}
    </>
  )
}
