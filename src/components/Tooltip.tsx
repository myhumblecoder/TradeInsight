import { useState, useRef, useEffect } from 'react'

interface TooltipProps {
  content: string
  children: React.ReactNode
  position?: 'top' | 'bottom' | 'left' | 'right'
  className?: string
}

export function Tooltip({
  content,
  children,
  position = 'top',
  className = '',
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [actualPosition, setActualPosition] = useState(position)
  const tooltipRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isVisible && tooltipRef.current && triggerRef.current) {
      const tooltipRect = tooltipRef.current.getBoundingClientRect()
      const triggerRect = triggerRef.current.getBoundingClientRect()
      const viewportWidth = window.innerWidth
      const viewportHeight = window.innerHeight

      let newPosition = position

      // Check if tooltip goes off screen and adjust position
      if (position === 'top' && triggerRect.top - tooltipRect.height < 0) {
        newPosition = 'bottom'
      } else if (
        position === 'bottom' &&
        triggerRect.bottom + tooltipRect.height > viewportHeight
      ) {
        newPosition = 'top'
      } else if (
        position === 'right' &&
        triggerRect.right + tooltipRect.width > viewportWidth
      ) {
        newPosition = 'left'
      } else if (
        position === 'left' &&
        triggerRect.left - tooltipRect.width < 0
      ) {
        newPosition = 'right'
      }

      setActualPosition(newPosition)
    }
  }, [isVisible, position])

  const getTooltipPositionClasses = () => {
    const baseClasses =
      'absolute z-50 px-2 py-1 text-xs text-white bg-gray-900 dark:bg-gray-700 rounded shadow-lg whitespace-nowrap'

    switch (actualPosition) {
      case 'top':
        return `${baseClasses} bottom-full left-1/2 transform -translate-x-1/2 mb-2`
      case 'bottom':
        return `${baseClasses} top-full left-1/2 transform -translate-x-1/2 mt-2`
      case 'left':
        return `${baseClasses} right-full top-1/2 transform -translate-y-1/2 mr-2`
      case 'right':
        return `${baseClasses} left-full top-1/2 transform -translate-y-1/2 ml-2`
      default:
        return baseClasses
    }
  }

  const getArrowClasses = () => {
    const baseClasses =
      'absolute w-2 h-2 bg-gray-900 dark:bg-gray-700 transform rotate-45'

    switch (actualPosition) {
      case 'top':
        return `${baseClasses} top-full left-1/2 transform -translate-x-1/2 -translate-y-1/2`
      case 'bottom':
        return `${baseClasses} bottom-full left-1/2 transform -translate-x-1/2 translate-y-1/2`
      case 'left':
        return `${baseClasses} left-full top-1/2 transform -translate-x-1/2 -translate-y-1/2`
      case 'right':
        return `${baseClasses} right-full top-1/2 transform translate-x-1/2 -translate-y-1/2`
      default:
        return baseClasses
    }
  }

  return (
    <div
      ref={triggerRef}
      className={`relative inline-block ${className}`}
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
      onFocus={() => setIsVisible(true)}
      onBlur={() => setIsVisible(false)}
    >
      {children}
      {isVisible && (
        <div
          ref={tooltipRef}
          className={getTooltipPositionClasses()}
          role="tooltip"
        >
          {content}
          <div className={getArrowClasses()} />
        </div>
      )}
    </div>
  )
}
