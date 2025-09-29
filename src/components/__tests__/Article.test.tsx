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

    // Check for actual dark mode classes that exist in the component
    const textElement = screen.getByText(text)
    expect(textElement).toHaveClass('text-gray-700', 'dark:text-gray-300')
    
    // Check confidence score has dark mode classes
    const confidenceElement = screen.getByText('Confidence Score: 50%')
    expect(confidenceElement).toHaveClass('text-blue-600', 'dark:text-blue-400')
  })
})