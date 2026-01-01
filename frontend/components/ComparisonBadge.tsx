'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { getComparisonProducts } from '@/utils/comparison'

export default function ComparisonBadge() {
  const [comparisonCount, setComparisonCount] = useState(0)

  useEffect(() => {
    // Initial load
    const updateCount = () => {
      const productIds = getComparisonProducts()
      setComparisonCount(productIds.length)
    }
    updateCount()

    // Listen for storage changes (when comparison is updated in other tabs/windows)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'comparison_products') {
        updateCount()
      }
    }

    // Listen for custom storage event (when comparison is updated in same tab)
    const handleCustomStorageChange = () => {
      updateCount()
    }

    window.addEventListener('storage', handleStorageChange)
    window.addEventListener('comparisonUpdated', handleCustomStorageChange)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('comparisonUpdated', handleCustomStorageChange)
    }
  }, [])

  if (comparisonCount === 0) {
    return null
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <Link href="/retailer/compare">
        <div className="bg-indigo-600 text-white px-6 py-3 rounded-full shadow-lg hover:bg-indigo-700 flex items-center space-x-2 transition-all duration-200 hover:scale-105 animate-pulse">
          <svg
            className="w-5 h-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            />
          </svg>
          <span className="font-medium">Compare ({comparisonCount})</span>
        </div>
      </Link>
    </div>
  )
}
