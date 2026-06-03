import React from 'react'
import ReactDOM from 'react-dom/client'
import { GoogleOAuthProvider } from '@react-oauth/google'
import App from './App.jsx'
import './styles/global.css'

const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID

ReactDOM.createRoot(document.getElementById('root')).render(
  clientId
    ? <GoogleOAuthProvider clientId={clientId}>
        <React.StrictMode>
          <App />
        </React.StrictMode>
      </GoogleOAuthProvider>
    : <React.StrictMode>
        <App />
      </React.StrictMode>
)