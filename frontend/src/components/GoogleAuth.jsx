import React from 'react'
import { GoogleLogin } from '@react-oauth/google'

const GOOGLE_ENABLED = Boolean(import.meta.env.VITE_GOOGLE_CLIENT_ID)

export default function GoogleAuth({ onSuccess, onError, helperText }){
  if (GOOGLE_ENABLED) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
        <GoogleLogin onSuccess={onSuccess} onError={onError} />
        <div style={{ textAlign:'center', color:'var(--mut)', fontSize:13, marginTop:8 }}>{helperText}</div>
      </div>
    )
  }

  return (
    <div>
      <button type="button" disabled style={{ width:'100%', padding:'0.9rem', borderRadius:8, border:'1px solid rgba(255,255,255,0.15)', background:'rgba(255,255,255,0.04)', color:'var(--mut)', cursor:'not-allowed' }}>
        Google no configurado
      </button>
    </div>
  )
}
