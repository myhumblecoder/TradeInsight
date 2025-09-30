import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'https://api.coingecko.com/api/v3',
        changeOrigin: true,
        rewrite: (path: string) => path.replace(/^\/api/, ''),
      },
    },
  },
  // @ts-expect-error - Vitest config
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    dangerouslyIgnoreUnhandledErrors: true,
    testTimeout: 6000, // 6 second timeout for all tests to prevent CI hangs
    hookTimeout: 3000, // 3 second timeout for hooks (beforeEach, etc)
    // Force timeouts in CI environment
    teardownTimeout: 3000, // 3 second timeout for cleanup
    // Pool options for CI stability
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: true, // Use single fork to prevent resource issues in CI
      }
    },
    // Temporarily exclude Firebase service tests due to missing dependencies
    exclude: [
      '**/node_modules/**',
      'src/services/__tests__/firebase-*.test.ts'
    ]
  },
})
