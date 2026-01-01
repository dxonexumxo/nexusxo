// Utility functions for product price history

import { supabase } from './supabase'

export interface PriceHistoryEntry {
  id: string
  product_id: string
  old_price: number | null
  new_price: number
  changed_at: string
  changed_by: string | null
  change_source: string
}

export interface PriceHistoryStats {
  currentPrice: number | null
  firstPrice: number | null
  minPrice: number | null
  maxPrice: number | null
  averagePrice: number | null
  lastChange: {
    date: string
    oldPrice: number | null
    newPrice: number
    source: string
  } | null
  priceChangePercent: number | null
}

/**
 * Get price history for a product
 */
export async function getProductPriceHistory(productId: string): Promise<PriceHistoryEntry[]> {
  try {
    const { data, error } = await supabase
      .from('product_price_history')
      .select('*')
      .eq('product_id', productId)
      .order('changed_at', { ascending: true })

    if (error) {
      console.error('Error fetching price history:', error)
      throw error
    }

    return data || []
  } catch (error) {
    console.error('Error in getProductPriceHistory:', error)
    throw error
  }
}

/**
 * Calculate price history statistics
 */
export function calculatePriceHistoryStats(
  history: PriceHistoryEntry[],
  currentPrice: number | null
): PriceHistoryStats {
  if (history.length === 0) {
    return {
      currentPrice,
      firstPrice: null,
      minPrice: null,
      maxPrice: null,
      averagePrice: null,
      lastChange: null,
      priceChangePercent: null,
    }
  }

  const prices = history.map(h => h.new_price)
  const firstPrice = history[0].new_price
  const minPrice = Math.min(...prices)
  const maxPrice = Math.max(...prices)
  const averagePrice = prices.reduce((sum, price) => sum + price, 0) / prices.length

  const lastChange = history[history.length - 1]
  const lastChangeData = {
    date: lastChange.changed_at,
    oldPrice: lastChange.old_price,
    newPrice: lastChange.new_price,
    source: lastChange.change_source,
  }

  // Calculate percentage change from first to current
  let priceChangePercent: number | null = null
  if (firstPrice !== null && currentPrice !== null && firstPrice !== 0) {
    priceChangePercent = ((currentPrice - firstPrice) / firstPrice) * 100
  }

  return {
    currentPrice,
    firstPrice,
    minPrice,
    maxPrice,
    averagePrice,
    lastChange: lastChangeData,
    priceChangePercent,
  }
}

/**
 * Filter price history by date range
 */
export function filterPriceHistoryByDateRange(
  history: PriceHistoryEntry[],
  days: number | null
): PriceHistoryEntry[] {
  if (!days) {
    return history
  }

  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - days)

  return history.filter(entry => new Date(entry.changed_at) >= cutoffDate)
}
