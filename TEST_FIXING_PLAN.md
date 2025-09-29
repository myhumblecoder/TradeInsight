# Test Fixing Plan - Remaining 16 Failures

## Current Status
- ✅ **Fixed: 9 tests** (from 25 → 16 failures)
- 🔧 **CI Infrastructure**: Completely resolved (Node.js 18 → 20)
- 📊 **Progress**: 36% reduction in test failures
- 🎯 **Remaining**: 16 failing tests across 8 test files

## Phase 1: Module Loading & Mocking Issues (Priority: High)
**Target: 2 Stripe tests**

### Issues
- `loadStripe` mock not working due to module evaluation timing
- `stripePromise` created before test mocks are applied

### Solution Strategy
1. **Option A: Module-level mocking**
   ```typescript
   vi.mock('@stripe/stripe-js', async () => {
     const actual = await vi.importActual('@stripe/stripe-js')
     return {
       ...actual,
       loadStripe: vi.fn()
     }
   })
   ```

2. **Option B: Dynamic imports**
   - Refactor stripe service to use dynamic imports
   - Create testable wrapper around `loadStripe`

3. **Option C: Test isolation**
   - Use `vi.doMock()` for per-test mocking
   - Reset modules between tests

### Files to modify
- `src/services/__tests__/stripe.test.ts` (lines 77-113)
- Possibly `src/services/stripe.ts` (refactor if needed)

## Phase 2: API Hook Testing (Priority: High)
**Target: 4 API/Network tests**

### Issues
- `useTopCryptos` and `useCoinbaseData` hooks with complex async behavior
- setTimeout delays (1000ms) causing test timeouts
- Cache interference between tests
- Fetch mocking not properly handled

### Solution Strategy
1. **Timer Management**
   ```typescript
   beforeEach(() => {
     vi.useFakeTimers({ shouldAdvanceTime: true })
   })
   
   // In tests
   await act(async () => {
     vi.advanceTimersByTime(1000)
   })
   ```

2. **Cache Isolation**
   - Clear hook caches between tests
   - Mock cache or disable in test environment

3. **Better Fetch Mocking**
   ```typescript
   const mockFetch = vi.fn()
   global.fetch = mockFetch
   
   mockFetch.mockImplementation(() =>
     Promise.resolve({
       ok: true,
       status: 200,
       json: () => Promise.resolve(mockData)
     })
   )
   ```

### Files to modify
- `src/hooks/__tests__/useTopCryptos.test.tsx`
- `src/hooks/__tests__/useCoinbaseData.test.tsx`  
- `src/hooks/useTopCryptos.ts` (consider test-friendly refactor)
- `src/hooks/useCoinbaseData.ts` (consider test-friendly refactor)

## Phase 3: Component Integration Tests (Priority: Medium)
**Target: 10+ component tests**

### Issues
- Components depend on API hooks that are failing
- Loading states and error handling not properly mocked
- Complex component interactions

### Solution Strategy
1. **Mock hook dependencies**
   ```typescript
   vi.mock('../hooks/useTopCryptos', () => ({
     useTopCryptos: () => ({
       data: mockData,
       loading: false,
       error: null
     })
   }))
   ```

2. **Test component isolation**
   - Focus on component logic, not integration
   - Mock all external dependencies

3. **Gradual fixing approach**
   - Fix hooks first (Phase 2)
   - Component tests may resolve automatically

### Files to modify
- `src/components/__tests__/TechnicalIndicatorsDisplay.test.tsx`
- `src/components/__tests__/MarketAnalysisSummary.test.tsx`
- `src/components/__tests__/Detail.test.tsx`
- Other component test files as needed

## Phase 4: Test Infrastructure Improvements (Priority: Low)
**Target: Long-term stability**

### Improvements
1. **Test utilities**
   - Create reusable test helpers
   - Standardized mocking patterns
   - Common test setup functions

2. **Test configuration**
   - Optimize vitest config for better performance
   - Add test environment consistency checks
   - Configure appropriate timeouts

3. **Documentation**
   - Testing patterns guide
   - Mock setup examples
   - Troubleshooting common issues

### Files to create/modify
- `src/test/testUtils.ts` (new)
- `src/test/mockHelpers.ts` (new)
- `vitest.config.ts` (tune settings)
- `TESTING.md` (documentation)

## Implementation Order

### Week 1: Critical Infrastructure
1. **Day 1-2**: Phase 1 - Fix Stripe module loading issues
2. **Day 3-5**: Phase 2 - Fix API hooks with timeouts and caching

### Week 2: Component Stabilization  
1. **Day 1-3**: Phase 3 - Fix component tests (should be easier after Phase 2)
2. **Day 4-5**: Phase 4 - Test infrastructure improvements

## Success Metrics

| Phase | Target | Current | Goal |
|-------|--------|---------|------|
| Phase 1 | 2 tests | 2 failing | 0 failing |
| Phase 2 | 4 tests | 4 failing | 0 failing |  
| Phase 3 | 10 tests | 10 failing | ≤2 failing |
| **Total** | **16 tests** | **16 failing** | **≤2 failing** |

## Risk Assessment

### High Risk
- **Module mocking complexity**: May require significant refactoring
- **Timer/async interactions**: Complex debugging

### Medium Risk  
- **Component test dependencies**: May cascade from hook fixes
- **Cache behavior**: Hard to predict in test environment

### Low Risk
- **Test infrastructure**: Additive improvements only

## Rollback Strategy
- Keep current working test fixes
- Each phase is independent - can abort any phase without affecting others
- Maintain feature branches for experimental approaches

## Notes
- Run tests after each fix to ensure no regressions
- Consider splitting large test files if they become unwieldy
- Monitor test execution time - aim for <30s total test suite