import { Routes, Route } from 'react-router-dom'
import { Overview } from './Overview'
import { Detail } from './Detail'
import { ErrorBoundary } from './ErrorBoundary'
import { CookieBanner } from './CookieBanner'
import { ThemeProvider } from '../contexts/ThemeContext'
import { AuthProvider } from '../contexts/AuthContext'

export const AppContent = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ErrorBoundary>
          <Routes>
            <Route path="/" element={<Overview />} />
            <Route path="/crypto/:id" element={<Detail />} />
          </Routes>
          <CookieBanner />
        </ErrorBoundary>
      </AuthProvider>
    </ThemeProvider>
  )
}

export const AppContentWithoutAuth = () => {
  return (
    <ThemeProvider>
      <ErrorBoundary>
        <Routes>
          <Route path="/" element={<Overview />} />
          <Route path="/crypto/:id" element={<Detail />} />
        </Routes>
        <CookieBanner />
      </ErrorBoundary>
    </ThemeProvider>
  )
}