# TradeInsight

A React TypeScript application for cryptocurrency analysis, providing informative narratives on price, stop loss, bid/sell, and time length with confidence scores. Built with Vite, Tailwind CSS, and Coinbase APIs.

## Features

- Real-time cryptocurrency data from Coinbase
- Technical indicators (RSI, EMA, MACD)
- Narrative articles explaining trading concepts
- Confidence scoring for recommendations
- Light/dark mode toggle

## Tech Stack

- **Frontend:** React 19, TypeScript, Vite
- **Styling:** Tailwind CSS
- **Linting:** ESLint, Prettier
- **Testing:** Vitest
- **APIs:** Coinbase Public/Pro APIs

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
   - Copy `.env.example` to `.env`
   - Add your API keys if required

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
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint issues
- `npm run format` - Format code with Prettier
- `npm run preview` - Preview production build

## Project Structure

```
src/
├── components/     # UI components
├── hooks/          # Custom React hooks
├── utils/          # Utility functions
└── types/          # TypeScript types

docs/               # Documentation
tests/              # Test files
```

## Contributing

1. Follow the code style with ESLint and Prettier
2. Write tests for new features
3. Use TDD approach for development

## License

MIT
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
globalIgnores(['dist']),
{
files: ['**/*.{ts,tsx}'],
extends: [
// Other configs...
// Enable lint rules for React
reactX.configs['recommended-typescript'],
// Enable lint rules for React DOM
reactDom.configs.recommended,
],
languageOptions: {
parserOptions: {
project: ['./tsconfig.node.json', './tsconfig.app.json'],
tsconfigRootDir: import.meta.dirname,
},
// other options...
},
},
])

```

```
