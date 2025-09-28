import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { DarkModeToggle } from '../DarkModeToggle'

describe('DarkModeToggle', () => {
  it('should toggle dark mode on click', () => {
    const mockToggle = vi.fn()
    render(<DarkModeToggle isDark={false} onToggle={mockToggle} />)

    const button = screen.getByRole('button')
    fireEvent.click(button)

    expect(mockToggle).toHaveBeenCalled()
  })

  it('should display correct icon based on mode', () => {
    const { rerender } = render(
      <DarkModeToggle isDark={false} onToggle={() => {}} />
    )
    expect(screen.getByText('🌙')).toBeInTheDocument()

    rerender(<DarkModeToggle isDark={true} onToggle={() => {}} />)
    expect(screen.getByText('☀️')).toBeInTheDocument()
  })
})