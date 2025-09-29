import { getIntervalsByCategory, formatTimeInterval, type TimeInterval } from '../utils/timeIntervals'

interface TimeIntervalSelectorProps {
  selectedInterval: TimeInterval
  onIntervalChange: (interval: TimeInterval) => void
  className?: string
  disabled?: boolean
}

export function TimeIntervalSelector({ 
  selectedInterval, 
  onIntervalChange, 
  className = '',
  disabled = false 
}: TimeIntervalSelectorProps) {
  const intervalsByCategory = getIntervalsByCategory()

  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    onIntervalChange(event.target.value as TimeInterval)
  }

  const baseClassName = "px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"

  return (
    <select
      value={selectedInterval}
      onChange={handleChange}
      disabled={disabled}
      className={`${baseClassName} ${className}`.trim()}
    >
      {Object.entries(intervalsByCategory).map(([category, intervals]) => (
        <optgroup key={category} label={category}>
          {intervals.map(interval => (
            <option key={interval} value={interval}>
              {formatTimeInterval(interval)}
            </option>
          ))}
        </optgroup>
      ))}
    </select>
  )
}