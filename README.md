# TradeInsight

A professional cryptocurrency analysis platform with AI-enhanced insights, premium subscriptions, and enterprise-grade deployment. Built with React, TypeScript, and modern DevOps practices.

## Features

### 🚀 Core Features
- **Real-time Data**: Live cryptocurrency prices from multiple APIs
- **Technical Analysis**: RSI, EMA, MACD indicators with visualizations
- **AI-Enhanced Summaries**: OpenAI GPT-4 and Ollama powered article generation
- **Smart Fallbacks**: Template-based articles when AI is unavailable
- **Enhanced Mode Toggle**: Users can choose between AI and template modes
- **Responsive Design**: Clean grid layout with dark/light themes

### 💰 Monetization (Phase 4)
- **User Authentication**: Secure Auth0 integration with JWT tokens
- **Premium Subscriptions**: $9.99/month Stripe-powered billing
- **Paywall System**: Feature gating for premium AI analysis
- **User Dashboard**: Subscription management and billing portal

### 🛡️ Security & Compliance
- **GDPR Compliance**: Cookie consent and privacy controls
- **Data Protection**: Encrypted user data with Supabase
- **Payment Security**: PCI-compliant Stripe integration
- **Monitoring**: Error tracking and performance analytics

### 🔧 DevOps & Quality
- **CI/CD Pipeline**: Automated testing, security scanning, and deployment
- **Multi-Environment**: Staging and production deployments
- **TDD Approach**: Comprehensive test coverage with Vitest
- **Type Safety**: Full TypeScript implementation

## Tech Stack

### Frontend & Core
- **Frontend:** React 19, TypeScript, Vite
- **Styling:** Tailwind CSS with dark/light themes
- **Routing:** React Router v7 with protected routes
- **State Management:** React Context with custom hooks

### AI & Data
- **AI Integration:** OpenAI GPT-4 API + Ollama (local LLMs)
- **Caching:** In-memory LLM response cache (5-minute TTL)
- **APIs:** CoinGecko, Coinbase Pro for real-time data
- **Technical Indicators:** Custom RSI, EMA, MACD calculations

### Monetization & Auth
- **Authentication:** Auth0 with React SDK
- **Database:** Supabase (PostgreSQL) for users and subscriptions
- **Payments:** Stripe Checkout and subscription management
- **Monitoring:** Pino logging with structured analytics

### DevOps & Testing
- **Testing:** Vitest with @testing-library (TDD approach)
- **Linting:** ESLint, Prettier with TypeScript rules
- **CI/CD:** GitHub Actions with security scanning
- **Deployment:** Vercel with staging/production environments
- **Performance:** Lighthouse CI and Core Web Vitals monitoring

## Setup

### Quick Start (Basic Features)

1. **Clone and Install**:
   ```bash
   git clone <repo-url>
   cd tradeinsight
   npm install
   ```

2. **Basic Configuration**:
   ```bash
   cp .env.example .env
   # Edit .env with your API keys (see Configuration section below)
   ```

3. **Start Development**:
   ```bash
   npm run dev
   ```

### Full Production Setup (Phase 4)

1. **Database Setup** (Supabase):
   ```sql
   -- Create users table
   CREATE TABLE users (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     auth0_id TEXT UNIQUE NOT NULL,
     email TEXT NOT NULL,
     name TEXT,
     picture TEXT,
     subscription_id UUID,
     created_at TIMESTAMP DEFAULT NOW(),
     updated_at TIMESTAMP DEFAULT NOW()
   );

   -- Create subscriptions table
   CREATE TABLE subscriptions (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     user_id UUID REFERENCES users(id),
     stripe_subscription_id TEXT UNIQUE NOT NULL,
     status TEXT NOT NULL,
     price_id TEXT NOT NULL,
     current_period_start TIMESTAMP NOT NULL,
     current_period_end TIMESTAMP NOT NULL,
     cancel_at_period_end BOOLEAN DEFAULT FALSE,
     created_at TIMESTAMP DEFAULT NOW(),
     updated_at TIMESTAMP DEFAULT NOW()
   );
   ```

2. **Environment Configuration**:
   ```bash
   # Copy and configure all environment variables
   cp .env.example .env
   # Fill in all production values (see Configuration section)
   ```

3. **Deploy with CI/CD**:
   ```bash
   # Push to main branch triggers automatic deployment
   git push origin main
   ```

## Scripts

### Development
- `npm run dev` - Start development server with hot reload
- `npm run preview` - Preview production build locally

### Building
- `npm run build` - Build for production with TypeScript compilation

### Testing & Quality
- `npm run test` - Run complete test suite with Vitest
- `npm run test:ui` - Run tests with interactive UI
- `npm run lint` - Run ESLint with TypeScript rules
- `npm run lint:fix` - Fix auto-fixable ESLint issues
- `npm run format` - Format code with Prettier

### Production Commands
- `npm ci` - Clean install for production deployments
- `npm run build && npm run preview` - Full production test

## Project Structure

```
src/
├── components/          # React components
│   ├── Overview.tsx     # Main cryptocurrency grid
│   ├── Detail.tsx       # Individual crypto details
│   ├── Article.tsx      # AI-enhanced summaries
│   ├── PaywallGuard.tsx # Premium feature protection
│   ├── UpgradeButton.tsx # Subscription management
│   ├── CookieBanner.tsx # GDPR compliance
│   └── __tests__/       # Component tests
├── contexts/            # React contexts
│   ├── ThemeContext.tsx # Dark/light theme
│   ├── AuthContext.tsx  # User authentication
│   └── __tests__/       # Context tests
├── hooks/               # Custom React hooks
│   ├── useCoinbaseData.ts
│   ├── useTopCryptos.ts
│   └── useAuth.ts       # Authentication hook
├── services/            # External integrations
│   ├── stripe.ts        # Payment processing
│   ├── monitoring.ts    # Analytics and logging
│   └── __tests__/       # Service tests
├── utils/               # Utility functions
│   ├── article.ts       # AI article generation
│   ├── indicators.ts    # Technical analysis
│   └── __tests__/       # Unit tests
├── types/               # TypeScript definitions
│   └── auth.ts          # Authentication types
└── config/              # Configuration
    └── supabase.ts      # Database configuration

.github/
├── workflows/
│   ├── ci.yml          # Basic CI pipeline
│   └── deploy.yml      # Production deployment
implementations/         # Phase documentation
CLAUDE.md               # Project documentation
```

## Configuration

### Environment Variables

Create a `.env` file based on `.env.example`:

```bash
# Authentication (Auth0) - Required for user features
VITE_AUTH0_DOMAIN=your-auth0-domain.auth0.com
VITE_AUTH0_CLIENT_ID=your_auth0_client_id
VITE_AUTH0_AUDIENCE=your_auth0_api_audience

# Database (Supabase) - Required for user data
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Payments (Stripe) - Required for subscriptions
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_key
VITE_STRIPE_PRICE_ID_MONTHLY=price_your_monthly_price_id

# AI Providers - Optional but recommended
VITE_OPENAI_API_KEY=your_openai_api_key        # For cloud AI
VITE_OLLAMA_URL=http://localhost:11434         # For local AI

# Monitoring - Optional for production
VITE_MONITORING_ENDPOINT=https://your-logs-endpoint
VITE_ANALYTICS_ENDPOINT=https://your-analytics-endpoint
VITE_ERROR_TRACKING_ENDPOINT=https://your-errors-endpoint
```

### Feature Tiers

#### Free Tier (No Configuration)
- Basic cryptocurrency data and charts
- Template-based market analysis
- Technical indicators (RSI, EMA, MACD)
- Dark/light theme toggle

#### Enhanced Tier (AI Configuration)
- All free features +
- AI-powered market analysis (OpenAI/Ollama)
- Smart fallback chain with caching
- Provider selection and performance monitoring

#### Premium Tier (Full Configuration)
- All enhanced features +
- User authentication and profiles
- Premium AI analysis with advanced prompts
- Subscription management and billing
- Export capabilities and advanced features
- Priority support and monitoring

## Architecture

### Phase Implementation
- **Phase 1**: Core cryptocurrency dashboard with real-time data
- **Phase 2**: Technical indicators and chart visualizations
- **Phase 3**: AI-enhanced analysis with multi-LLM support
- **Phase 4**: Monetization, authentication, and production deployment

### LLM Integration
- **Multi-Provider Support**: Ollama (local) and OpenAI (cloud)
- **Smart Fallback**: Ollama → OpenAI → Template with automatic recovery
- **Caching Strategy**: 5-minute in-memory cache with provider-specific keys
- **Error Handling**: Graceful degradation with user feedback

### Subscription Model
- **Free**: Template analysis, basic indicators
- **Premium ($9.99/month)**: AI-enhanced analysis, advanced features
- **Enterprise**: Custom pricing, dedicated support

## Deployment

### CI/CD Pipeline

The application uses GitHub Actions for automated deployment:

1. **Security Scanning**: Trivy vulnerability detection
2. **Quality Checks**: ESLint, TypeScript, and test coverage
3. **Build Process**: Production optimization and artifact generation
4. **Staging Deployment**: Vercel staging environment with Lighthouse auditing
5. **Production Deployment**: Automated promotion with monitoring

### Manual Deployment

```bash
# Build and deploy to Vercel
npm run build
npx vercel --prod

# Or deploy to other platforms
npm run build
# Upload dist/ folder to your hosting provider
```

### Monitoring & Analytics

- **Error Tracking**: Structured logging with Pino
- **Performance**: Lighthouse CI and Core Web Vitals
- **User Analytics**: Engagement tracking and feature usage
- **Subscription Metrics**: Revenue and churn analysis

## Contributing

### Development Workflow

1. **TDD Approach**: Write tests before implementation
2. **Feature Branches**: Create branches for new features
3. **Code Quality**: Use ESLint, Prettier, and TypeScript
4. **Testing**: Ensure 85%+ test coverage for new code
5. **Documentation**: Update README and inline comments

### Testing Strategy

```bash
# Run specific test suites
npm test src/components/__tests__/
npm test src/services/__tests__/
npm test src/contexts/__tests__/

# Run tests with coverage
npm test -- --coverage

# Test AI providers (requires configuration)
npm test src/utils/__tests__/article.test.ts
```

### Code Quality

- **Type Safety**: Strict TypeScript with no `any` types
- **Error Handling**: Comprehensive try-catch with user feedback
- **Performance**: Lazy loading, caching, and optimization
- **Security**: Environment variables, input validation, HTTPS
- **Accessibility**: ARIA labels, keyboard navigation, screen readers

## Troubleshooting

### Common Issues

**Auth0 Configuration**:
```bash
# If authentication isn't working
- Check VITE_AUTH0_DOMAIN and VITE_AUTH0_CLIENT_ID
- Verify callback URLs in Auth0 dashboard
- Ensure audience is configured for API access
```

**Supabase Connection**:
```bash
# If database features aren't working
- Verify VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
- Check RLS policies in Supabase dashboard
- Ensure tables are created with proper schema
```

**Stripe Integration**:
```bash
# If payments aren't working
- Check VITE_STRIPE_PUBLISHABLE_KEY matches environment
- Verify price IDs in Stripe dashboard
- Test with Stripe test cards
```

**AI Providers**:
```bash
# If AI features aren't working
- Ollama: Check service is running on localhost:11434
- OpenAI: Verify API key has sufficient credits
- Check network connectivity and CORS settings
```

## Performance

- **First Paint**: <2s with optimized builds
- **Lighthouse Score**: 90+ across all categories
- **Bundle Size**: <500KB gzipped with code splitting
- **API Response**: <1s for cryptocurrency data
- **AI Generation**: 3-10s with caching optimization

## Security

- **HTTPS Only**: All production traffic encrypted
- **Environment Variables**: Sensitive data never committed
- **JWT Validation**: Secure token-based authentication
- **PCI Compliance**: Stripe handles all payment processing
- **GDPR Ready**: Cookie consent and data protection

## License

MIT License - see LICENSE file for details

---

**TradeInsight** - Professional cryptocurrency analysis with AI-powered insights and premium subscription features.