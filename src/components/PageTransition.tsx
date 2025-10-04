import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'

interface PageTransitionProps {
  children: React.ReactNode
}

export function PageTransition({ children }: PageTransitionProps) {
  const [displayLocation, setDisplayLocation] = useState(useLocation())
  const [transitionStage, setTransitionStage] = useState<
    'fade-in' | 'fade-out' | 'visible'
  >('visible')
  const location = useLocation()

  useEffect(() => {
    if (location !== displayLocation) {
      setTransitionStage('fade-out')
    }
  }, [location, displayLocation])

  useEffect(() => {
    if (transitionStage === 'fade-out') {
      const timer = setTimeout(() => {
        setDisplayLocation(location)
        setTransitionStage('fade-in')
      }, 150)
      return () => clearTimeout(timer)
    } else if (transitionStage === 'fade-in') {
      const timer = setTimeout(() => {
        setTransitionStage('visible')
      }, 150)
      return () => clearTimeout(timer)
    }
  }, [transitionStage, location])

  return (
    <div
      className={`
        transition-opacity duration-150 ease-in-out
        ${transitionStage === 'fade-out' ? 'opacity-0' : 'opacity-100'}
        ${transitionStage === 'fade-in' ? 'opacity-0' : ''}
        ${transitionStage === 'visible' ? 'opacity-100' : ''}
      `}
    >
      {children}
    </div>
  )
}
