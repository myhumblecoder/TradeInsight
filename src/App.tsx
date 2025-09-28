import { useAuth0 } from '@auth0/auth0-react'
import { AppContent, AppContentWithoutAuth } from './components/AppContent'

function App() {
  const domain = import.meta.env.VITE_AUTH0_DOMAIN
  const clientId = import.meta.env.VITE_AUTH0_CLIENT_ID
  const hasAuth0Config = domain && clientId

  if (!hasAuth0Config) {
    return <AppContentWithoutAuth />
  }

  return <AppWithAuth0 />
}

function AppWithAuth0() {
  const { isLoading } = useAuth0()

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    )
  }

  return <AppContent />
}

export default App
