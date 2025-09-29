import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MarkdownRenderer } from '../MarkdownRenderer'

describe('MarkdownRenderer', () => {
  it('should render basic markdown content', () => {
    const content = `# Market Analysis
    
This is a **bold** statement about the market.

- First point
- Second point

> This is a blockquote with important information.

\`inline code\` and normal text.`

    render(<MarkdownRenderer content={content} />)

    expect(screen.getByText('Market Analysis')).toBeInTheDocument()
    expect(screen.getByText('bold')).toBeInTheDocument()
    expect(screen.getByText('First point')).toBeInTheDocument()
    expect(screen.getByText('Second point')).toBeInTheDocument()
  })

  it('should render headers with correct styling', () => {
    const content = `# H1 Header
## H2 Header
### H3 Header
#### H4 Header`

    render(<MarkdownRenderer content={content} />)

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('H1 Header')
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('H2 Header')
    expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent('H3 Header')
    expect(screen.getByRole('heading', { level: 4 })).toHaveTextContent('H4 Header')
  })

  it('should render lists correctly', () => {
    const content = `
Unordered list:
- Item 1
- Item 2

Ordered list:
1. First
2. Second`

    render(<MarkdownRenderer content={content} />)

    const unorderedList = document.querySelector('ul')
    const orderedList = document.querySelector('ol')

    expect(unorderedList).toBeInTheDocument()
    expect(orderedList).toBeInTheDocument()
    expect(screen.getByText('Item 1')).toBeInTheDocument()
    expect(screen.getByText('First')).toBeInTheDocument()
  })

  it('should render code blocks and inline code', () => {
    const content = `This is \`inline code\` in a sentence.

\`\`\`javascript
function test() {
  return "hello world";
}
\`\`\``

    render(<MarkdownRenderer content={content} />)

    // Check for inline code
    const inlineCode = document.querySelector('code:not(.block)')
    expect(inlineCode).toHaveTextContent('inline code')

    // Check for code block
    const codeBlock = document.querySelector('code.block')
    expect(codeBlock).toBeInTheDocument()
  })

  it('should render blockquotes', () => {
    const content = `> This is a blockquote
> with multiple lines`

    render(<MarkdownRenderer content={content} />)

    const blockquote = document.querySelector('blockquote')
    expect(blockquote).toBeInTheDocument()
    expect(blockquote).toHaveTextContent('This is a blockquote with multiple lines')
  })

  it('should render tables when using GFM', () => {
    const content = `| Column 1 | Column 2 |
|----------|----------|
| Cell 1   | Cell 2   |
| Cell 3   | Cell 4   |`

    render(<MarkdownRenderer content={content} />)

    const table = document.querySelector('table')
    expect(table).toBeInTheDocument()
    expect(screen.getByText('Column 1')).toBeInTheDocument()
    expect(screen.getByText('Cell 1')).toBeInTheDocument()
  })

  it('should apply custom className', () => {
    const content = '# Test'
    render(<MarkdownRenderer content={content} className="custom-class" />)

    const container = document.querySelector('.markdown-content')
    expect(container).toHaveClass('custom-class')
  })

  it('should handle empty content gracefully', () => {
    render(<MarkdownRenderer content="" />)

    const container = document.querySelector('.markdown-content')
    expect(container).toBeInTheDocument()
    expect(container).toBeEmptyDOMElement()
  })
})