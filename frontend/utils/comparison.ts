// Utility functions for product comparison feature

const STORAGE_KEY = 'comparison_products'
export const MAX_PRODUCTS = 4

export interface ComparisonStorage {
  productIds: string[]
  expiresAt: string
}

// Helper functions for localStorage
export const getComparisonProducts = (): string[] => {
  if (typeof window === 'undefined') return []
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return []
    const parsed: ComparisonStorage = JSON.parse(stored)
    // Check if it's expired (7 days)
    if (parsed.expiresAt && new Date(parsed.expiresAt) < new Date()) {
      localStorage.removeItem(STORAGE_KEY)
      return []
    }
    return parsed.productIds || []
  } catch {
    return []
  }
}

export const saveComparisonProducts = (productIds: string[]) => {
  if (typeof window === 'undefined') return
  try {
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7) // 7 days
    const storage: ComparisonStorage = {
      productIds: productIds.slice(0, MAX_PRODUCTS),
      expiresAt: expiresAt.toISOString()
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(storage))
    // Dispatch custom event to notify components of the update
    window.dispatchEvent(new Event('comparisonUpdated'))
  } catch (err) {
    console.error('Error saving comparison products:', err)
  }
}

export const addToComparison = (productId: string): boolean => {
  const current = getComparisonProducts()
  if (current.includes(productId)) return false
  if (current.length >= MAX_PRODUCTS) return false
  const updated = [...current, productId]
  saveComparisonProducts(updated)
  return true
}

export const removeFromComparison = (productId: string) => {
  const current = getComparisonProducts()
  const updated = current.filter(id => id !== productId)
  saveComparisonProducts(updated)
}

export const clearComparison = () => {
  if (typeof window === 'undefined') return
  localStorage.removeItem(STORAGE_KEY)
  // Dispatch custom event to notify components of the update
  window.dispatchEvent(new Event('comparisonUpdated'))
}

export const isInComparison = (productId: string): boolean => {
  const current = getComparisonProducts()
  return current.includes(productId)
}
