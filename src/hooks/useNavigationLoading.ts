import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'

export function useNavigationLoading() {
  const [isNavigating, setIsNavigating] = useState(false)
  const location = useLocation()

  useEffect(() => {
    // Show loading on location change
    setIsNavigating(true)
    
    // Hide loading after a brief delay to allow page to render
    const timer = setTimeout(() => {
      setIsNavigating(false)
    }, 150)

    return () => clearTimeout(timer)
  }, [location])

  return { isNavigating, setIsNavigating }
}