import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { Article } from '../Article'

describe('Article', () => {
  it('should display article text and confidence score', () => {
    const text = 'Bitcoin is trading at $50000.'
    const confidence = 75

    render(<Article text={text} confidence={confidence} />)

    expect(screen.getByText(text)).toBeInTheDocument()
    expect(screen.getByText('Confidence Score: 75%')).toBeInTheDocument()
  })

  it('should apply dark mode classes', () => {
    const text = 'Test article'
    const confidence = 50

    render(<Article text={text} confidence={confidence} />)

    // Assuming the component has dark mode classes
    const container = screen.getByText(text).closest('div')
    expect(container).toHaveClass('bg-white', 'dark:bg-gray-800')
  })
})