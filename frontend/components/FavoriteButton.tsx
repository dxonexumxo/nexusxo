'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toggleFavorite, isProductFavorite } from '@/utils/favorites'

interface FavoriteButtonProps {
  productId: string
  retailerId: string | null
  initialIsFavorite?: boolean
  compact?: boolean
  onChange?: (isFavorite: boolean) => void
  className?: string
}

export default function FavoriteButton({
  productId,
  retailerId,
  initialIsFavorite = false,
  compact = false,
  onChange,
  className = '',
}: FavoriteButtonProps) {
  const router = useRouter()
  const [isFavorite, setIsFavorite] = useState(initialIsFavorite)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setIsFavorite(initialIsFavorite)
  }, [initialIsFavorite])

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (!retailerId) {
      router.push('/retailer/login')
      return
    }

    if (loading) return

    // Optimistic update
    const previousState = isFavorite
    setIsFavorite(!previousState)
    setLoading(true)
    setError(null)

    try {
      const newFavoriteState = await toggleFavorite(retailerId, productId)
      setIsFavorite(newFavoriteState)
      onChange?.(newFavoriteState)
    } catch (err: any) {
      // Revert optimistic update on error
      setIsFavorite(previousState)
      setError(err.message || 'Failed to update favorite')
      console.error('Error toggling favorite:', err)
    } finally {
      setLoading(false)
    }
  }

  if (compact) {
    return (
      <button
        onClick={handleClick}
        disabled={loading}
        className={`p-2 rounded-full transition-all duration-200 ${
          isFavorite
            ? 'text-red-500 bg-red-50 hover:bg-red-100'
            : 'text-gray-400 hover:text-red-500 hover:bg-gray-50'
        } ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} ${className}`}
        title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
      >
        {loading ? (
          <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        ) : (
          <svg
            className="w-5 h-5"
            fill={isFavorite ? 'currentColor' : 'none'}
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
            />
          </svg>
        )}
      </button>
    )
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className={`inline-flex items-center gap-2 px-4 py-2 rounded-md border transition-all duration-200 ${
        isFavorite
          ? 'border-red-300 bg-red-50 text-red-700 hover:bg-red-100'
          : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
      } ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} ${className}`}
    >
      {loading ? (
        <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      ) : (
        <svg
          className="w-5 h-5"
          fill={isFavorite ? 'currentColor' : 'none'}
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
          />
        </svg>
      )}
      <span className="text-sm font-medium">
        {isFavorite ? 'Saved to Favorites' : 'Save to Favorites'}
      </span>
    </button>
  )
}
