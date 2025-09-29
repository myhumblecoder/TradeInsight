import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'

export function usePageTransition() {
  const [isTransitioning, setIsTransitioning] = useState(false)
  const location = useLocation()

  useEffect(() => {
    // Start transition when location changes
    setIsTransitioning(true)
    
    // Complete transition after a brief moment to allow CSS animations
    const timer = setTimeout(() => {
      setIsTransitioning(false)
    }, 150)

    return () => clearTimeout(timer)
  }, [location.pathname])

  return { isTransitioning }
}