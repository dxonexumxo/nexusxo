'use client'

import { PriceHistoryStats } from '@/utils/priceHistory'

interface PriceHistoryStatsProps {
  stats: PriceHistoryStats
  isRetailer?: boolean
}

export default function PriceHistoryStats({ stats, isRetailer = false }: PriceHistoryStatsProps) {
  const formatPrice = (price: number | null) => {
    if (price === null) return 'N/A'
    return `$${price.toFixed(2)}`
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })
  }

  const formatSource = (source: string) => {
    return source.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase())
  }

  if (isRetailer) {
    // Retailer view - simplified stats
    return (
      <div className="space-y-4">
        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
          <div className="text-sm text-indigo-600 font-medium mb-1">Current Price</div>
          <div className="text-2xl font-bold text-gray-900">{formatPrice(stats.currentPrice)}</div>
        </div>

        {stats.firstPrice !== null && stats.currentPrice !== null && (
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="text-sm text-gray-600 font-medium mb-1">Price Change</div>
            <div className="text-lg font-semibold text-gray-900">
              {stats.priceChangePercent !== null && (
                <span
                  className={stats.priceChangePercent >= 0 ? 'text-green-600' : 'text-red-600'}
                >
                  {stats.priceChangePercent >= 0 ? '+' : ''}
                  {stats.priceChangePercent.toFixed(1)}%
                </span>
              )}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {formatPrice(stats.firstPrice)} → {formatPrice(stats.currentPrice)}
            </div>
          </div>
        )}

        {stats.maxPrice !== null && (
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="text-sm text-gray-600 font-medium mb-1">Highest Price</div>
            <div className="text-lg font-semibold text-gray-900">{formatPrice(stats.maxPrice)}</div>
          </div>
        )}

        {stats.minPrice !== null && (
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="text-sm text-gray-600 font-medium mb-1">Lowest Price</div>
            <div className="text-lg font-semibold text-gray-900">{formatPrice(stats.minPrice)}</div>
          </div>
        )}

        {stats.lastChange && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div className="text-sm text-gray-600 font-medium mb-2">Last Change</div>
            <div className="text-xs text-gray-500 mb-1">{formatDate(stats.lastChange.date)}</div>
            {stats.lastChange.oldPrice !== null && (
              <div className="text-sm text-gray-700">
                {formatPrice(stats.lastChange.oldPrice)} → {formatPrice(stats.lastChange.newPrice)}
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  // Manufacturer view - detailed stats
  return (
    <div className="space-y-4">
      <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
        <div className="text-sm text-indigo-600 font-medium mb-1">Current Price</div>
        <div className="text-2xl font-bold text-gray-900">{formatPrice(stats.currentPrice)}</div>
      </div>

      {stats.firstPrice !== null && (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="text-sm text-gray-600 font-medium mb-1">First Recorded Price</div>
          <div className="text-lg font-semibold text-gray-900">{formatPrice(stats.firstPrice)}</div>
        </div>
      )}

      {stats.minPrice !== null && (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="text-sm text-gray-600 font-medium mb-1">Minimum Price</div>
          <div className="text-lg font-semibold text-gray-900">{formatPrice(stats.minPrice)}</div>
        </div>
      )}

      {stats.maxPrice !== null && (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="text-sm text-gray-600 font-medium mb-1">Maximum Price</div>
          <div className="text-lg font-semibold text-gray-900">{formatPrice(stats.maxPrice)}</div>
        </div>
      )}

      {stats.averagePrice !== null && (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="text-sm text-gray-600 font-medium mb-1">Average Price</div>
          <div className="text-lg font-semibold text-gray-900">{formatPrice(stats.averagePrice)}</div>
        </div>
      )}

      {stats.lastChange && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="text-sm text-gray-600 font-medium mb-2">Last Change</div>
          <div className="text-xs text-gray-500 mb-1">{formatDate(stats.lastChange.date)}</div>
          {stats.lastChange.oldPrice !== null ? (
            <div className="text-sm text-gray-700 mb-1">
              {formatPrice(stats.lastChange.oldPrice)} → {formatPrice(stats.lastChange.newPrice)}
            </div>
          ) : (
            <div className="text-sm text-gray-700 mb-1">
              {formatPrice(stats.lastChange.newPrice)}
            </div>
          )}
          <div className="text-xs text-gray-500 capitalize">
            Source: {formatSource(stats.lastChange.source)}
          </div>
        </div>
      )}
    </div>
  )
}
