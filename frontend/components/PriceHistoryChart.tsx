'use client'

import { useMemo } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Dot,
} from 'recharts'
import { PriceHistoryEntry } from '@/utils/priceHistory'

interface PriceHistoryChartProps {
  history: PriceHistoryEntry[]
  currentPrice: number | null
  height?: number
}

interface ChartDataPoint {
  date: string
  dateLabel: string
  price: number
  oldPrice: number | null
  source: string
}

const formatDate = (dateString: string): string => {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined,
  })
}

const formatDateForTooltip = (dateString: string): string => {
  const date = new Date(dateString)
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload as ChartDataPoint
    return (
      <div className="bg-white border border-gray-300 rounded-lg shadow-lg p-3">
        <p className="text-sm font-semibold text-gray-900 mb-2">
          {formatDateForTooltip(data.date)}
        </p>
        {data.oldPrice !== null && data.oldPrice !== data.price && (
          <p className="text-xs text-gray-600 mb-1">
            <span className="font-medium">Old:</span> ${data.oldPrice.toFixed(2)} →{' '}
            <span className="font-medium">New:</span> ${data.price.toFixed(2)}
          </p>
        )}
        {data.oldPrice === null || data.oldPrice === data.price ? (
          <p className="text-xs text-gray-600 mb-1">
            <span className="font-medium">Price:</span> ${data.price.toFixed(2)}
          </p>
        ) : null}
        <p className="text-xs text-gray-500 capitalize">
          Source: {data.source.replace('_', ' ')}
        </p>
      </div>
    )
  }
  return null
}


export default function PriceHistoryChart({
  history,
  currentPrice,
  height = 300,
}: PriceHistoryChartProps) {
  const chartData: ChartDataPoint[] = useMemo(() => {
    if (history.length === 0) {
      return []
    }

    // Include current price as the last point if it's different from the last history entry
    const lastHistoryPrice = history[history.length - 1].new_price
    const dataPoints: ChartDataPoint[] = history.map((entry) => ({
      date: entry.changed_at,
      dateLabel: formatDate(entry.changed_at),
      price: entry.new_price,
      oldPrice: entry.old_price,
      source: entry.change_source,
    }))

    // Add current price if it's different from the last recorded price
    if (currentPrice !== null && currentPrice !== lastHistoryPrice) {
      dataPoints.push({
        date: new Date().toISOString(),
        dateLabel: 'Current',
        price: currentPrice,
        oldPrice: lastHistoryPrice,
        source: 'current',
      })
    }

    return dataPoints
  }, [history, currentPrice])

  if (history.length === 0 && currentPrice === null) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        No price data available
      </div>
    )
  }

  return (
    <div className="w-full">
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
          <XAxis
            dataKey="dateLabel"
            stroke="#6B7280"
            style={{ fontSize: '12px' }}
            tick={{ fill: '#6B7280' }}
          />
          <YAxis
            stroke="#6B7280"
            style={{ fontSize: '12px' }}
            tick={{ fill: '#6B7280' }}
            tickFormatter={(value) => `$${value.toFixed(2)}`}
            domain={['dataMin - 1', 'dataMax + 1']}
          />
          <Tooltip content={<CustomTooltip />} />
          <Line
            type="monotone"
            dataKey="price"
            stroke="#4F46E5"
            strokeWidth={2}
            dot={(props: any) => {
              const { cx, cy, index } = props
              // Check if this is the last point by comparing index with chartData length
              const isLast = index === chartData.length - 1
              return (
                <Dot
                  cx={cx}
                  cy={cy}
                  r={isLast ? 6 : 4}
                  fill={isLast ? '#4F46E5' : '#818CF8'}
                  stroke={isLast ? '#312E81' : '#6366F1'}
                  strokeWidth={isLast ? 2 : 1}
                />
              )
            }}
            activeDot={{ r: 6, fill: '#312E81' }}
          />
        </LineChart>
      </ResponsiveContainer>
      <div className="mt-4 flex items-center justify-center text-xs text-gray-500">
        <div className="flex items-center gap-2">
          <div className="w-3 h-0.5 bg-indigo-500"></div>
          <span>Price over time</span>
        </div>
      </div>
    </div>
  )
}
