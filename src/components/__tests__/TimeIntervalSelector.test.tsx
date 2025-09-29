import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { TimeIntervalSelector } from '../TimeIntervalSelector'
import type { TimeInterval } from '../../utils/timeIntervals'

describe('TimeIntervalSelector', () => {
  const mockOnChange = vi.fn()

  beforeEach(() => {
    mockOnChange.mockClear()
  })

  it('should render with default selected interval', () => {
    render(<TimeIntervalSelector selectedInterval="1d" onIntervalChange={mockOnChange} />)
    
    const select = screen.getByRole('combobox')
    expect(select).toBeInTheDocument()
    expect(select).toHaveValue('1d')
  })

  it('should render grouped options correctly', () => {
    render(<TimeIntervalSelector selectedInterval="1d" onIntervalChange={mockOnChange} />)
    
    // Check for specific options by their text content
    expect(screen.getByText('5 Minutes')).toBeInTheDocument()
    expect(screen.getByText('15 Minutes')).toBeInTheDocument()
    expect(screen.getByText('30 Minutes')).toBeInTheDocument()
    expect(screen.getByText('1 Hour')).toBeInTheDocument()
    expect(screen.getByText('4 Hours')).toBeInTheDocument()
    expect(screen.getByText('1 Day')).toBeInTheDocument()
    expect(screen.getByText('1 Week')).toBeInTheDocument()
  })

  it('should call onIntervalChange when selection changes', () => {
    render(<TimeIntervalSelector selectedInterval="1d" onIntervalChange={mockOnChange} />)
    
    const select = screen.getByRole('combobox')
    fireEvent.change(select, { target: { value: '1h' } })
    
    expect(mockOnChange).toHaveBeenCalledWith('1h')
    expect(mockOnChange).toHaveBeenCalledTimes(1)
  })

  it('should apply custom className', () => {
    const customClass = 'custom-selector-class'
    render(
      <TimeIntervalSelector 
        selectedInterval="1d" 
        onIntervalChange={mockOnChange} 
        className={customClass}
      />
    )
    
    const select = screen.getByRole('combobox')
    expect(select).toHaveClass(customClass)
  })

  it('should be disabled when disabled prop is true', () => {
    render(
      <TimeIntervalSelector 
        selectedInterval="1d" 
        onIntervalChange={mockOnChange}
        disabled={true}
      />
    )
    
    const select = screen.getByRole('combobox')
    expect(select).toBeDisabled()
  })

  it('should render all supported intervals as options with correct values', () => {
    render(<TimeIntervalSelector selectedInterval="1d" onIntervalChange={mockOnChange} />)
    
    const intervals: TimeInterval[] = ['5m', '15m', '30m', '1h', '4h', '1d', '1w']
    const select = screen.getByRole('combobox')
    
    intervals.forEach(interval => {
      const option = select.querySelector(`option[value="${interval}"]`)
      expect(option).toBeInTheDocument()
      expect(option).toHaveAttribute('value', interval)
    })
  })
})