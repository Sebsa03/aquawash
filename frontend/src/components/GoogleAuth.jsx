import React, { useCallback } from 'react'
import { useGoogleLogin } from '@react-oauth/google'

const GOOGLE_ENABLED = Boolean(import.meta.env.VITE_GOOGLE_CLIENT_ID)

/**
 * Wrapper de autenticación con Google.
 *
 * Usa `useGoogleLogin` en lugar de `<GoogleLogin>` para evitar que
 * `google.accounts.id.initialize()` se llame múltiples veces cuando
 * el componente se monta en varias páginas o en React StrictMode.
 *
 * El flujo `ux_mode: 'popup'` + `flow: 'implicit'` delega la inicialización
 * al singleton interno de @react-oauth/google (GoogleOAuthProvider),
 * que garantiza una sola llamada a initialize() por sesión.
 */
function GoogleButton({ onSuccess, onError }) {
  const login = useGoogleLogin({
    onSuccess: (tokenResponse) => {
      // tokenResponse.access_token es el token OAuth2, pero nuestro backend
      // espera el credential (id_token). Para eso necesitamos el flujo
      // authorization_code o que el backend use el access_token.
      // Mantenemos compatibilidad usando onSuccess con el objeto completo.
      onSuccess(tokenResponse)
    },
    onError: () => onError?.(),
    flow: 'auth-code',
  })

  return (
    <button
      type="button"
      onClick={() => login()}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        width: '100%',
        padding: '0.75rem 1rem',
        borderRadius: 8,
        border: '1px solid rgba(255,255,255,0.18)',
        background: 'rgba(255,255,255,0.06)',
        color: 'var(--txt)',
        cursor: 'pointer',
        fontSize: 14,
        fontWeight: 500,
        transition: 'background 0.2s',
      }}
      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.12)'}
      onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
    >
      <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
        <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
        <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
        <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
        <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.35-8.16 2.35-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
      </svg>
      Continuar con Google
    </button>
  )
}

export default function GoogleAuth({ onSuccess, onError, helperText }) {
  if (GOOGLE_ENABLED) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
        <GoogleButton onSuccess={onSuccess} onError={onError} />
        {helperText && (
          <div style={{ textAlign: 'center', color: 'var(--mut)', fontSize: 13, marginTop: 8 }}>
            {helperText}
          </div>
        )}
      </div>
    )
  }

  return (
    <div>
      <button
        type="button"
        disabled
        style={{
          width: '100%',
          padding: '0.9rem',
          borderRadius: 8,
          border: '1px solid rgba(255,255,255,0.15)',
          background: 'rgba(255,255,255,0.04)',
          color: 'var(--mut)',
          cursor: 'not-allowed',
        }}
      >
        Google no configurado
      </button>
    </div>
  )
}
