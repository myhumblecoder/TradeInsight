interface DarkModeToggleProps {
  isDark: boolean
  onToggle: () => void
}

export const DarkModeToggle = ({ isDark, onToggle }: DarkModeToggleProps) => {
  return (
    <button
      onClick={onToggle}
      className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200"
      aria-label="Toggle dark mode"
    >
      {isDark ? '☀️' : '🌙'}
    </button>
  )
}
