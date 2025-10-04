# Freemium Detail Page Implementation Plan

## Current Analysis

The Detail page (`src/components/Detail.tsx`) currently has these key components:

### Existing Structure

1. **MarketAnalysisSummary** - Basic market overview
2. **PriceAnalysisDisplay** - Entry points, stop loss, profit targets, risk assessment
3. **TechnicalIndicatorsDisplay** - RSI, EMA, MACD, Bollinger Bands, Fibonacci
4. **Article** - AI-enhanced technical analysis report

### Current Authentication Flow

- If user is not authenticated → Shows signup prompt
- If authenticated → Shows full content

## New Freemium Strategy

### User Experience Flow

```
Free User (Not Authenticated)
├── Sees full layout and interface
├── Basic data: Price, basic charts, template analysis
├── Premium sections: Values blurred with "Unlock" overlays
└── Strong CTAs to purchase credits

Authenticated User (No Credits)
├── Sees full layout and interface
├── Same as free user experience
└── Credit purchase options instead of signup

Authenticated User (Has Credits)
├── Full access to all features
└── Credit usage tracking
```

## Component Modifications Required

### 1. PaywallGuard Component

Create a flexible wrapper that can blur/hide content based on user status:

```tsx
// src/components/PaywallGuard.tsx
interface PaywallGuardProps {
  children: React.ReactNode
  requiredCredits?: number
  fallbackContent?: React.ReactNode
  blurLevel?: 'light' | 'medium' | 'heavy'
  showUnlockPrompt?: boolean
  featureName?: string
  coinSymbol?: string
}
```

**Three Display Modes:**

- **Blur Mode**: Show blurred content with unlock overlay
- **Placeholder Mode**: Show fake/default data
- **Block Mode**: Completely hide content with upgrade prompt

### 2. Data Layer Changes

#### Backend DTO Modifications

```typescript
// Current API response
interface CoinAnalysisResponse {
  price: number
  rsi: number
  ema12: number
  ema26: number
  macd: MACDData
  priceAnalysis: PriceAnalysis
  // ... other data
}

// New Freemium Response
interface FreemiumCoinAnalysisResponse {
  // Always included (free tier)
  price: number
  basicChart: OHLCV[]
  coinName: string
  marketCap?: number

  // Premium data (null/placeholder for free users)
  premiumData: {
    rsi: number | null
    ema12: number | null
    ema26: number | null
    macd: MACDData | null
    priceAnalysis: PriceAnalysis | null
    bollingerBands: BollingerBands | null
    fibonacciExtensions: FibonacciData | null
    aiAnalysis: string | null
    volumeProfile: VolumeProfile | null
  } | null

  // Metadata
  isPremiumUser: boolean
  creditsRequired: number
  creditsAvailable: number
}
```

#### Default/Placeholder Values

```typescript
const PLACEHOLDER_VALUES = {
  rsi: 50.0, // Neutral RSI
  ema12: 0, // Will be calculated as percentage of current price
  ema26: 0,
  macd: { MACD: 0, signal: 0, histogram: 0 },
  priceAnalysis: {
    entryPoints: {
      conservative: 0, // Show as % of current price
      moderate: 0,
      aggressive: 0,
    },
    stopLoss: { price: 0, percentage: 5 },
    profitTargets: {
      target1: 0,
      target2: 0,
      target3: 0,
      riskRewardRatio: 2.0,
    },
    confidence: 0.5,
    timeHorizon: 'medium-term',
    riskAssessment: 'Upgrade to view detailed risk analysis',
  },
}
```

### 3. Visual Design Strategy

#### Blur Effects with CSS

```css
.premium-blur-light {
  filter: blur(2px);
  -webkit-filter: blur(2px);
  transition: filter 0.3s ease;
}

.premium-blur-medium {
  filter: blur(4px);
  -webkit-filter: blur(4px);
}

.premium-blur-heavy {
  filter: blur(8px);
  -webkit-filter: blur(8px);
}

.premium-overlay {
  position: relative;
}

.premium-overlay::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(
    135deg,
    rgba(59, 130, 246, 0.1) 0%,
    rgba(147, 51, 234, 0.1) 100%
  );
  backdrop-filter: blur(2px);
  border-radius: inherit;
  z-index: 1;
}

.unlock-prompt {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 2;
  text-align: center;
  background: white;
  dark:background: rgb(31, 41, 55);
  padding: 1rem;
  border-radius: 0.5rem;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
}
```

#### Component-Specific Blur Strategy

**PriceAnalysisDisplay**

- Entry Points: Show placeholder percentages, blur actual prices
- Stop Loss: Show generic 5% below entry
- Profit Targets: Show 1:2 risk-reward ratio
- Risk Assessment: Show generic text

**TechnicalIndicatorsDisplay**

- Basic indicators: Blur all values
- Advanced indicators: Completely hidden
- Fibonacci Extensions: Show levels but blur prices

**Article Component**

- Show first 2 sentences of template analysis
- Blur/hide AI-generated content
- Show "Continue reading..." prompt

### 4. Updated Component Structure

#### Modified Detail.tsx

```tsx
export function Detail() {
  // ... existing code ...

  const { user, isAuthenticated } = useAuth()
  const { credits, hasCredits } = useCredits() // New hook

  const canAccessPremium = isAuthenticated && hasCredits(1)

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      {/* ... header ... */}

      <main className="px-2 py-4">
        {/* Free Content - Always Visible */}
        <div className="mb-6">
          <BasicPriceDisplay price={price} cryptoName={cryptoName} />
        </div>

        {/* Premium Content with Paywall Guards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {/* Price Analysis - Blurred for free users */}
          <PaywallGuard
            requiredCredits={1}
            blurLevel="medium"
            featureName="Price Analysis"
            coinSymbol={cryptoName}
          >
            <PriceAnalysisDisplay
              analysis={
                canAccessPremium ? priceAnalysis : placeholderPriceAnalysis
              }
              isLoading={isPriceAnalyzing}
              error={priceAnalysisError}
            />
          </PaywallGuard>

          {/* Technical Indicators - Mixed free/premium */}
          <PaywallGuard
            requiredCredits={1}
            blurLevel="light"
            featureName="Advanced Indicators"
            coinSymbol={cryptoName}
          >
            <TechnicalIndicatorsDisplay
              ohlcvData={ohlcvData}
              currentPrice={price || 0}
              isLoading={loading}
              showAdvanced={canAccessPremium}
            />
          </PaywallGuard>

          {/* AI Analysis - Heavily restricted */}
          <PaywallGuard
            requiredCredits={1}
            blurLevel="heavy"
            featureName="AI Technical Analysis"
            coinSymbol={cryptoName}
          >
            <Article
              text={canAccessPremium ? article.text : truncatedArticle}
              confidence={article.confidence}
              isEnhanced={enhancedMode}
              showTitle={false}
              showAIBadge={false}
            />
          </PaywallGuard>
        </div>
      </main>
    </div>
  )
}
```

#### New PaywallGuard Component

```tsx
// src/components/PaywallGuard.tsx
import React from 'react'
import { useAuth } from '../hooks/useAuth'
import { useCredits } from '../hooks/useCredits'
import { BuyCreditButton } from './BuyCreditButton'

interface PaywallGuardProps {
  children: React.ReactNode
  requiredCredits?: number
  blurLevel?: 'light' | 'medium' | 'heavy'
  featureName: string
  coinSymbol?: string
  showPreview?: boolean
}

export const PaywallGuard: React.FC<PaywallGuardProps> = ({
  children,
  requiredCredits = 1,
  blurLevel = 'medium',
  featureName,
  coinSymbol,
  showPreview = true,
}) => {
  const { isAuthenticated, user } = useAuth()
  const { credits, hasCredits } = useCredits()

  const canAccess = isAuthenticated && hasCredits(requiredCredits)

  // If user has access, show content normally
  if (canAccess) {
    return <>{children}</>
  }

  // If no access, show blurred content with unlock prompt
  const blurClass = {
    light: 'premium-blur-light',
    medium: 'premium-blur-medium',
    heavy: 'premium-blur-heavy',
  }[blurLevel]

  return (
    <div className="premium-overlay relative">
      {/* Blurred content */}
      {showPreview && (
        <div className={blurClass} style={{ pointerEvents: 'none' }}>
          {children}
        </div>
      )}

      {/* Unlock overlay */}
      <div className="unlock-prompt">
        <div className="mb-3">
          <div className="w-12 h-12 mx-auto mb-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
            <svg
              className="w-6 h-6 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>
          <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
            Unlock {featureName}
          </h4>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
            {coinSymbol
              ? `Get detailed ${featureName.toLowerCase()} for ${coinSymbol}`
              : `Access ${featureName.toLowerCase()}`}
          </p>
        </div>

        <div className="space-y-2">
          <div className="text-xs text-blue-600 dark:text-blue-400 font-medium">
            {requiredCredits} credit • $0.25
          </div>

          <BuyCreditButton
            size="sm"
            requiredCredits={requiredCredits}
            coinSymbol={coinSymbol}
            onPurchaseComplete={() => window.location.reload()}
          />

          {!isAuthenticated && (
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
              Free account • Pay per analysis
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
```

### 5. Enhanced Technical Components

#### Modified TechnicalIndicatorsDisplay

```tsx
export function TechnicalIndicatorsDisplay({
  ohlcvData,
  currentPrice,
  isLoading = false,
  showAdvanced = false, // New prop
  className = '',
}: TechnicalIndicatorsDisplayProps & { showAdvanced?: boolean }) {
  // ... existing code ...

  return (
    <div
      className={`bg-white dark:bg-gray-800 rounded-lg border p-6 ${className}`}
    >
      {/* Basic Indicators - Always shown but blurred for free users */}
      <div className="space-y-4">
        <h4 className="text-md font-medium text-gray-900 dark:text-white">
          Basic Indicators
        </h4>

        {/* Show placeholder/blurred values for free users */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              RSI (14)
            </span>
            <span className="font-medium text-gray-900 dark:text-white">
              {showAdvanced ? formatValue(analysis?.rsi) : '••.•'}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              EMA 12
            </span>
            <span className="font-medium text-gray-900 dark:text-white">
              {showAdvanced ? formatPrice(analysis?.ema12) : '$••,•••.••'}
            </span>
          </div>

          {/* ... more indicators ... */}
        </div>
      </div>

      {/* Advanced Indicators - Only for premium users */}
      {showAdvanced ? (
        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
          <h4 className="text-md font-medium text-gray-900 dark:text-white mb-3">
            Advanced Indicators
          </h4>
          {/* Full advanced indicators */}
          {/* ... existing advanced indicator code ... */}
        </div>
      ) : (
        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="text-center py-6">
            <svg
              className="w-8 h-8 mx-auto mb-2 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
            <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">
              Advanced Indicators
            </div>
            <div className="text-xs text-gray-400">
              Bollinger Bands, Stochastic RSI, Volume Profile
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
```

#### Modified Article Component

```tsx
// src/components/Article.tsx
interface ArticleProps {
  text: string
  confidence: number
  isEnhanced: boolean
  showTitle?: boolean
  showAIBadge?: boolean
  isPremium?: boolean // New prop
  previewLength?: number // New prop
}

export const Article: React.FC<ArticleProps> = ({
  text,
  confidence,
  isEnhanced,
  showTitle = true,
  showAIBadge = true,
  isPremium = true,
  previewLength = 150,
}) => {
  // For free users, show truncated version
  const displayText = isPremium
    ? text
    : `${text.substring(0, previewLength)}...`

  return (
    <div className="space-y-4">
      {/* Article content */}
      <div
        className={`prose dark:prose-invert ${!isPremium ? 'premium-preview' : ''}`}
      >
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{displayText}</ReactMarkdown>
      </div>

      {/* Continue reading prompt for free users */}
      {!isPremium && (
        <div className="border-t pt-4 text-center">
          <div className="text-sm text-gray-500 dark:text-gray-400 mb-3">
            Continue reading to see full AI analysis, trading signals, and
            market insights
          </div>
          <BuyCreditButton size="sm" variant="primary" requiredCredits={1} />
        </div>
      )}

      {/* Confidence indicator - only for premium */}
      {isPremium && confidence > 0 && (
        <div className="flex items-center justify-between pt-4 border-t">
          <span className="text-sm text-gray-600 dark:text-gray-400">
            Analysis Confidence
          </span>
          <div className="flex items-center space-x-2">
            <div className="w-20 h-2 bg-gray-200 dark:bg-gray-700 rounded-full">
              <div
                className="h-2 bg-gradient-to-r from-red-400 via-yellow-400 to-green-400 rounded-full"
                style={{ width: `${confidence * 100}%` }}
              />
            </div>
            <span className="text-sm font-medium">
              {Math.round(confidence * 100)}%
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
```

## Implementation Phases

### Phase 1: Core PaywallGuard Component (Week 1)

1. Create `PaywallGuard` component with blur effects
2. Add CSS for premium overlays and blur effects
3. Create `useCredits` hook for credit management
4. Test blur effects and unlock prompts

### Phase 2: Component Updates (Week 2)

1. Update `TechnicalIndicatorsDisplay` with free/premium modes
2. Modify `PriceAnalysisDisplay` to show placeholder data
3. Update `Article` component with preview mode
4. Add placeholder data generators

### Phase 3: Backend Integration (Week 3)

1. Modify API responses to include premium flags
2. Implement credit checking logic
3. Add usage tracking
4. Test data flow and premium unlocking

### Phase 4: Polish & Optimization (Week 4)

1. Refine blur effects and animations
2. A/B test unlock prompt designs
3. Add analytics tracking for conversion
4. Optimize performance of blurred content

## Expected Conversion Benefits

### Psychological Advantages

- **FOMO Effect**: Users see exactly what they're missing
- **Low Friction**: No signup required to see value
- **Clear Value Prop**: Specific features for specific price ($0.25)
- **Instant Gratification**: One-click purchase → immediate unlock

### UX Improvements

- **Full Context**: Users understand the complete offering
- **Visual Appeal**: Blurred content looks premium and polished
- **Price Anchoring**: $0.25 feels extremely reasonable
- **Mobile Friendly**: Works great on all device sizes

This freemium approach should significantly increase conversion rates while providing an excellent user experience that showcases the full value of TradeInsight's crypto analysis platform.
