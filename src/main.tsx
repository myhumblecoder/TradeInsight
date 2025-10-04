import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Auth0Provider } from '@auth0/auth0-react'
import './index.css'
import App from './App.tsx'
import AuthProvider from './contexts/AuthContext'

const domain = import.meta.env.VITE_AUTH0_DOMAIN
const clientId = import.meta.env.VITE_AUTH0_CLIENT_ID
const audience = import.meta.env.VITE_AUTH0_AUDIENCE

if (!domain || !clientId) {
  console.warn(
    'Auth0 configuration missing. Authentication features will be disabled.'
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      {domain && clientId ? (
        <Auth0Provider
          domain={domain}
          clientId={clientId}
          authorizationParams={{
            redirect_uri: window.location.origin,
            audience: audience,
            scope: 'openid profile email',
          }}
        >
          <AuthProvider>
            <App />
          </AuthProvider>
        </Auth0Provider>
      ) : (
        <AuthProvider>
          <App />
        </AuthProvider>
      )}
    </BrowserRouter>
  </StrictMode>
)
