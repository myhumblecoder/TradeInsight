# TradeInsight

A React TypeScript cryptocurrency analysis dashboard that provides technical indicators and AI-enhanced market summaries. Built with modern tools and following TDD principles.

## Features

- **Real-time Data**: Live cryptocurrency prices from multiple APIs
- **Technical Analysis**: RSI, EMA, MACD indicators with visualizations
- **AI-Enhanced Summaries**: OpenAI GPT-4 powered article generation
- **Smart Fallbacks**: Template-based articles when AI is unavailable
- **Enhanced Mode Toggle**: Users can choose between AI and template modes
- **Responsive Design**: Clean grid layout with dark/light themes
- **Comprehensive Testing**: TDD approach with unit and integration tests

## Tech Stack

- **Frontend:** React 19, TypeScript, Vite
- **Styling:** Tailwind CSS
- **AI Integration:** OpenAI GPT-4 API
- **Testing:** Vitest with @testing-library
- **Linting:** ESLint, Prettier
- **APIs:** CoinGecko, Coinbase Pro

## Setup

1. Clone the repository:

   ```bash
   git clone <repo-url>
   cd tradeinsight
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   # Create .env file with LLM configuration
   cat > .env << EOF
   # OpenAI API key (optional - for cloud AI)
   VITE_OPENAI_API_KEY=your_openai_api_key_here
   
   # Ollama URL (optional - defaults to localhost:11434)
   VITE_OLLAMA_URL=http://localhost:11434
   EOF
   ```

4. Start development server:

   ```bash
   npm run dev
   ```

5. Build for production:
   ```bash
   npm run build
   ```

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run test` - Run test suite
- `npm run test:ui` - Run tests with UI
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint issues
- `npm run format` - Format code with Prettier
- `npm run preview` - Preview production build

## Project Structure

```
src/
├── components/          # React components
│   ├── Overview.tsx     # Main cryptocurrency grid
│   ├── Detail.tsx       # Individual crypto details
│   ├── Article.tsx      # AI-enhanced summaries
│   └── DarkModeToggle.tsx
├── hooks/               # Custom React hooks
│   ├── useCoinbaseData.ts
│   └── useTopCryptos.ts
├── utils/               # Utility functions
│   ├── article.ts       # Article generation logic
│   ├── indicators.ts    # Technical analysis
│   └── __tests__/       # Unit tests
├── contexts/            # React contexts
└── __tests__/           # Component tests

implementations/         # Phase documentation
CLAUDE.md               # Project documentation
```

## Phase 3: LLM Enhancement

This project implements AI-enhanced article generation with the following features:

### ✅ Implemented Features
- **Multi-LLM Support**: Choose between Ollama (local) and OpenAI (cloud)
- **Smart Fallback Chain**: Ollama → OpenAI → Template with automatic recovery
- **Enhanced Mode Toggle**: User choice between AI and template modes
- **Provider Selection**: Dropdown to choose Ollama or OpenAI
- **In-Memory Caching**: 5-minute cache with provider-specific keys
- **Error Handling**: Comprehensive error handling with graceful degradation
- **Testing**: TDD approach with simplified mocking strategies

### LLM Providers
- **Ollama (Default)**: Free local inference with your models
- **OpenAI**: Premium cloud API with GPT-4
- **Template**: Fast template-based fallback

### Environment Setup
```bash
# Optional - Ollama configuration
VITE_OLLAMA_URL=http://localhost:11434

# Optional - OpenAI configuration  
VITE_OPENAI_API_KEY=your_openai_api_key_here
```

### Usage
1. **Enhanced Mode OFF**: Template-based articles (instant, no costs)
2. **Enhanced Mode ON + Ollama**: Local AI generation (free, requires Ollama)
3. **Enhanced Mode ON + OpenAI**: Cloud AI generation (premium, requires API key)
4. **Auto-fallback**: Ollama → OpenAI → Template if providers fail

## Contributing

1. Follow TDD principles - write tests first
2. Use ESLint and Prettier for code quality
3. Test both AI and fallback modes
4. Keep it simple and maintainable

## License

MIT
