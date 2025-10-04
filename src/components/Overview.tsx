import { Link } from 'react-router-dom'
import { DarkModeToggle } from './DarkModeToggle'
import { useTopCryptos } from '../hooks/useTopCryptos'
import { useTheme } from '../contexts/ThemeContext'
import { usePageTransition } from '../hooks/usePageTransition'

// Map crypto IDs to display names for consistency
const cryptoDisplayNames: Record<string, string> = {
  bitcoin: 'Bitcoin',
  ethereum: 'Ethereum',
  xrp: 'XRP',
  ripple: 'XRP', // In case API returns 'ripple' as ID
  // Add more as needed
}

export function Overview() {
  const { isDark, toggleDarkMode } = useTheme()
  const { data: cryptos, loading, error } = useTopCryptos()
  const { isTransitioning } = usePageTransition()

  if (loading)
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 transition-colors flex items-center justify-center">
        <div className="text-gray-900 dark:text-white">
          Loading top cryptocurrencies...
        </div>
      </div>
    )

  if (error)
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 transition-colors flex items-center justify-center">
        <div className="text-red-500">{error}</div>
      </div>
    )

  return (
    <div
      className={`min-h-screen bg-gray-100 dark:bg-gray-900 transition-colors page-container ${isTransitioning ? 'transitioning' : ''}`}
    >
      <header className="flex justify-between items-center px-2 sm:px-4 lg:px-6 xl:px-8 py-4 bg-white dark:bg-gray-800 shadow">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">
          MyHumbleCrypto
        </h1>
        <DarkModeToggle isDark={isDark} onToggle={toggleDarkMode} />
      </header>
      <main className="px-2 py-4 sm:px-4 lg:px-6 xl:px-8 transition-opacity duration-150 ease-in-out">
        <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">
          Top Cryptocurrencies
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 2xl:grid-cols-8 gap-3 sm:gap-4">
          {cryptos.map((crypto) => (
            <Link
              key={crypto.id}
              to={`/crypto/${crypto.id}`}
              className="block p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-shadow"
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {cryptoDisplayNames[crypto.id] || crypto.name}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 uppercase">
                    {crypto.symbol}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-gray-900 dark:text-white">
                    ${crypto.current_price.toLocaleString()}
                  </p>
                  <p
                    className={`text-sm font-medium ${
                      crypto.price_change_percentage_24h >= 0
                        ? 'text-green-600 dark:text-green-400'
                        : 'text-red-600 dark:text-red-400'
                    }`}
                  >
                    {crypto.price_change_percentage_24h >= 0 ? '+' : ''}
                    {crypto.price_change_percentage_24h.toFixed(2)}%
                  </p>
                </div>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Market Cap: ${(crypto.market_cap / 1e9).toFixed(2)}B
              </p>
            </Link>
          ))}
        </div>
      </main>
    </div>
  )
}
