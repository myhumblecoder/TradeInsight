import { describe, it, expect, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import { Article } from '../Article'

describe('Article Component - Enhanced with Markdown', () => {
  afterEach(() => {
    cleanup()
  })
  it('should render plain text when not enhanced', () => {
    const plainText = 'Bitcoin is trading at $50,000. This is a simple analysis.'
    
    render(<Article text={plainText} confidence={75} isEnhanced={false} />)
    
    expect(screen.getByText('Technical Analysis')).toBeInTheDocument()
    expect(screen.getByText(plainText)).toBeInTheDocument()
    expect(screen.getByText('Confidence Score: 75%')).toBeInTheDocument()
    expect(screen.queryByText('AI Enhanced')).not.toBeInTheDocument()
  })

  it('should render plain text when enhanced but no markdown detected', () => {
    const plainText = 'Bitcoin is trading at $50,000. Simple analysis without markdown.'
    
    render(<Article text={plainText} confidence={80} isEnhanced={true} />)
    
    expect(screen.getByText('AI Enhanced')).toBeInTheDocument()
    expect(screen.getByText(plainText)).toBeInTheDocument()
  })

  it('should render markdown when enhanced and markdown is detected', () => {
    const markdownText = `# Bitcoin Analysis

**Current Status**: Bitcoin is showing strong momentum.

## Key Points:
- Price: $50,000
- RSI: 65 (neutral)
- Trend: **Bullish**

> This analysis suggests a positive outlook for Bitcoin.`
    
    render(<Article text={markdownText} confidence={90} isEnhanced={true} />)
    
    expect(screen.getByText('AI Enhanced')).toBeInTheDocument()
    expect(screen.getAllByRole('heading')[1]).toHaveTextContent('Bitcoin Analysis') // H1 in markdown
    expect(screen.getAllByRole('heading')[2]).toHaveTextContent('Key Points:') // H2 in markdown
    expect(screen.getByText('Price: $50,000')).toBeInTheDocument()
    expect(screen.getByText('Bullish')).toBeInTheDocument()
  })

  it('should detect markdown indicators correctly', () => {
    const testCases = [
      { text: '# Header', shouldBeMarkdown: true },
      { text: '**bold text**', shouldBeMarkdown: true },
      { text: '- list item', shouldBeMarkdown: true },
      { text: '1. numbered item', shouldBeMarkdown: true },
      { text: '`code snippet`', shouldBeMarkdown: true },
      { text: '> blockquote', shouldBeMarkdown: true },
      { text: 'Plain text only', shouldBeMarkdown: false }
    ]

    testCases.forEach(({ text, shouldBeMarkdown }) => {
      render(<Article text={text} confidence={75} isEnhanced={true} />)
      
      if (shouldBeMarkdown) {
        // Should use MarkdownRenderer (indicated by the presence of specific elements)
        const container = document.querySelector('.markdown-content')
        expect(container).toBeInTheDocument()
      }
    })
  })

  it('should show confidence score for all variants', () => {
    const testCases = [
      { text: 'Plain text', isEnhanced: false, confidence: 60 },
      { text: '**Markdown** text', isEnhanced: true, confidence: 85 }
    ]

    testCases.forEach(({ text, isEnhanced, confidence }) => {
      render(<Article text={text} confidence={confidence} isEnhanced={isEnhanced} />)
      expect(screen.getByText(`Confidence Score: ${confidence}%`)).toBeInTheDocument()
    })
  })

  it('should have proper styling and layout', () => {
    const markdownText = '## Analysis\n\nThis is **important** information.'
    
    render(<Article text={markdownText} confidence={88} isEnhanced={true} />)
    
    // Check for proper header styling
    expect(screen.getByText('Technical Analysis')).toBeInTheDocument()
    
    // Check for AI Enhanced badge
    expect(screen.getByText('AI Enhanced')).toBeInTheDocument()
    
    // Check for confidence score section
    expect(screen.getByText('Confidence Score: 88%')).toBeInTheDocument()
  })

  it('should render blockquotes in markdown', () => {
    const markdownWithBlockquote = '> This is an important market insight from our analysis.'
    
    render(<Article text={markdownWithBlockquote} confidence={82} isEnhanced={true} />)
    
    const blockquote = document.querySelector('blockquote')
    expect(blockquote).toBeInTheDocument()
    expect(blockquote).toHaveTextContent('This is an important market insight from our analysis.')
  })

  it('should render lists in markdown', () => {
    const markdownWithLists = `## Trading Signals:

- **Buy Signal**: RSI oversold
- **Sell Signal**: Breaking resistance
- **Hold Signal**: Neutral momentum

1. First priority action
2. Second priority action`
    
    render(<Article text={markdownWithLists} confidence={78} isEnhanced={true} />)
    
    expect(screen.getByText('Buy Signal')).toBeInTheDocument()
    expect(screen.getByText('First priority action')).toBeInTheDocument()
    
    const ul = document.querySelector('ul')
    const ol = document.querySelector('ol')
    expect(ul).toBeInTheDocument()
    expect(ol).toBeInTheDocument()
  })
})