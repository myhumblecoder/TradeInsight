import { Routes, Route } from 'react-router-dom'
import { Overview } from './components/Overview'
import { Detail } from './components/Detail'
import { ErrorBoundary } from './components/ErrorBoundary'
import { ThemeProvider } from './contexts/ThemeContext'

function App() {
  return (
    <ThemeProvider>
      <ErrorBoundary>
        <Routes>
          <Route path="/" element={<Overview />} />
          <Route path="/crypto/:id" element={<Detail />} />
        </Routes>
      </ErrorBoundary>
    </ThemeProvider>
  )
}

export default App
