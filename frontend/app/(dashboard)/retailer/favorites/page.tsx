'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/utils/supabase'
import { getFavoritesForRetailer, removeFavorite, FavoriteProduct } from '@/utils/favorites'
import FavoriteButton from '@/components/FavoriteButton'

type SortOption = 'recent' | 'price_asc' | 'price_desc' | 'name_asc'

export default function RetailerFavoritesPage() {
  const router = useRouter()
  const [retailerId, setRetailerId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [favorites, setFavorites] = useState<FavoriteProduct[]>([])
  const [filteredFavorites, setFilteredFavorites] = useState<FavoriteProduct[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [sortOption, setSortOption] = useState<SortOption>('recent')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [error, setError] = useState<string | null>(null)
  const favoritesPerPage = 24

  useEffect(() => {
    const getUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          setRetailerId(user.id)
        } else {
          router.push('/retailer/login')
        }
      } catch (error) {
        console.error('Error fetching user:', error)
        router.push('/retailer/login')
      } finally {
        setLoading(false)
      }
    }
    getUser()
  }, [router])

  useEffect(() => {
    if (retailerId) {
      fetchFavorites()
    }
  }, [retailerId])

  useEffect(() => {
    if (favorites.length > 0) {
      // Extract unique categories
      const uniqueCategories = Array.from(
        new Set(favorites.map(f => f.category).filter(Boolean))
      ).sort() as string[]
      setCategories(uniqueCategories)
    }
    applyFilters()
  }, [favorites, sortOption, categoryFilter])

  const fetchFavorites = async () => {
    if (!retailerId) return

    setLoading(true)
    setError(null)

    try {
      // Step 1: Get accessible manufacturers
      const { data: accessData, error: accessError } = await supabase
        .from('retailer_data_access')
        .select('manufacturer_id')
        .eq('retailer_id', retailerId)
        .eq('access_granted', true)

      if (accessError) {
        console.error('Error fetching access data:', accessError)
        throw accessError
      }

      const accessibleManufacturerIds = accessData?.map(a => a.manufacturer_id) || []

      if (accessibleManufacturerIds.length === 0) {
        setFavorites([])
        setLoading(false)
        return
      }

      // Step 2: Fetch all favorite records for the retailer
      const { data: favoritesData, error: favoritesError } = await supabase
        .from('retailer_favorites')
        .select('id, product_id, created_at')
        .eq('retailer_id', retailerId)
        .order('created_at', { ascending: false })

      if (favoritesError) {
        console.error('Error fetching favorites:', favoritesError)
        console.error('Error details:', JSON.stringify(favoritesError, null, 2))
        throw favoritesError
      }

      if (!favoritesData || favoritesData.length === 0) {
        setFavorites([])
        setLoading(false)
        return
      }

      const productIds = favoritesData.map(f => f.product_id)

      if (productIds.length === 0) {
        setFavorites([])
        setLoading(false)
        return
      }

      // Step 3: Fetch product data
      const { data: productsData, error: productsError } = await supabase
        .from('product_data')
        .select('id, sku, product_name, category, description, price, stock_quantity, image_urls, attributes_json, manufacturer_id')
        .in('id', productIds)

      if (productsError) {
        console.error('Error fetching products:', productsError)
        throw productsError
      }

      if (!productsData || productsData.length === 0) {
        setFavorites([])
        setLoading(false)
        return
      }

      // Filter products by accessible manufacturers
      const accessibleProducts = productsData.filter(p => 
        accessibleManufacturerIds.includes(p.manufacturer_id)
      )

      if (accessibleProducts.length === 0) {
        setFavorites([])
        setLoading(false)
        return
      }

      // Step 4: Get manufacturer names
      const manufacturerIds = Array.from(new Set(accessibleProducts.map(p => p.manufacturer_id)))
      const { data: manufacturersData, error: mfgError } = await supabase
        .from('manufacturers')
        .select('id, company_name')
        .in('id', manufacturerIds)

      if (mfgError) {
        console.error('Error fetching manufacturers:', mfgError)
        throw mfgError
      }

      // Step 5: Create maps for easy lookup
      const manufacturerMap = new Map(
        (manufacturersData || []).map(m => [m.id, m.company_name])
      )
      const favoriteDateMap = new Map(
        favoritesData.map(f => [f.product_id, f.created_at])
      )
      const favoriteIdMap = new Map(
        favoritesData.map(f => [f.product_id, f.id])
      )

      // Step 6: Combine and format the data
      const formatted = accessibleProducts.map(product => {
        const createdAt = favoriteDateMap.get(product.id) || new Date().toISOString()
        return {
          id: favoriteIdMap.get(product.id) || product.id,
          product_id: product.id,
          created_at: createdAt,
          product_name: product.product_name,
          sku: product.sku,
          category: product.category,
          description: product.description,
          price: product.price,
          stock_quantity: product.stock_quantity,
          image_urls: product.image_urls,
          attributes_json: product.attributes_json,
          manufacturer_id: product.manufacturer_id,
          manufacturer_name: manufacturerMap.get(product.manufacturer_id) || 'Unknown'
        }
      })

      // Sort by created_at date (most recent first)
      formatted.sort((a, b) => {
        const dateA = new Date(a.created_at).getTime()
        const dateB = new Date(b.created_at).getTime()
        return dateB - dateA
      })

      setFavorites(formatted)
    } catch (err: any) {
      console.error('Error fetching favorites:', err)
      setError('Failed to load favorites. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const applyFilters = () => {
    let filtered = [...favorites]

    // Apply category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(f => f.category === categoryFilter)
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortOption) {
        case 'price_asc':
          return (a.price || 0) - (b.price || 0)
        case 'price_desc':
          return (b.price || 0) - (a.price || 0)
        case 'name_asc':
          return a.product_name.localeCompare(b.product_name)
        case 'recent':
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      }
    })

    setFilteredFavorites(filtered)
    setCurrentPage(1) // Reset to first page when filters change
  }

  const handleRemoveFavorite = async (productId: string) => {
    if (!retailerId) return

    try {
      await removeFavorite(retailerId, productId)
      // Optimistically update UI
      setFavorites(prev => prev.filter(f => f.id !== productId))
    } catch (err: any) {
      console.error('Error removing favorite:', err)
      // Refetch on error
      fetchFavorites()
    }
  }

  const getStockStatus = (stock: number | null) => {
    if (stock === null || stock === undefined || stock < 1) {
      return { label: 'Out of Stock', className: 'bg-red-100 text-red-800' }
    }
    if (stock < 10) {
      return { label: 'Low Stock', className: 'bg-yellow-100 text-yellow-800' }
    }
    return { label: 'In Stock', className: 'bg-green-100 text-green-800' }
  }

  const formatPrice = (price: number | null) => {
    if (price === null || price === undefined) return 'N/A'
    return `$${price.toFixed(2)}`
  }

  const totalPages = Math.ceil(filteredFavorites.length / favoritesPerPage)
  const paginatedFavorites = filteredFavorites.slice(
    (currentPage - 1) * favoritesPerPage,
    currentPage * favoritesPerPage
  )

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-gray-600">Loading favorites...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <nav className="flex mb-4" aria-label="Breadcrumb">
            <ol className="flex items-center space-x-2 text-sm text-gray-500">
              <li>
                <Link href="/retailer" className="hover:text-gray-700">
                  Dashboard
                </Link>
              </li>
              <li>
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </li>
              <li className="text-gray-900 font-medium">Favorites</li>
            </ol>
          </nav>
          <h1 className="text-3xl font-extrabold text-gray-900">Favorites</h1>
          <p className="mt-2 text-sm text-gray-600">
            Products you saved for later
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-red-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-red-700">{error}</span>
              <button
                onClick={fetchFavorites}
                className="ml-auto text-red-700 underline hover:text-red-900"
              >
                Retry
              </button>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && favorites.length === 0 && (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <svg
              className="mx-auto h-16 w-16 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
              />
            </svg>
            <h3 className="mt-4 text-lg font-medium text-gray-900">No Favorites Yet</h3>
            <p className="mt-2 text-sm text-gray-500">
              You haven't saved any products yet. Start browsing to find products you like!
            </p>
            <div className="mt-6">
              <Link
                href="/retailer/products"
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
              >
                Browse Products
              </Link>
            </div>
          </div>
        )}

        {/* Filters and Products */}
        {favorites.length > 0 && (
          <>
            {/* Filters */}
            <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Category Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category
                  </label>
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  >
                    <option value="all">All Categories</option>
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Sort Option */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sort By
                  </label>
                  <select
                    value={sortOption}
                    onChange={(e) => setSortOption(e.target.value as SortOption)}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  >
                    <option value="recent">Recently Added</option>
                    <option value="price_asc">Price (Low → High)</option>
                    <option value="price_desc">Price (High → Low)</option>
                    <option value="name_asc">Name (A → Z)</option>
                  </select>
                </div>
              </div>

              <div className="mt-4 text-sm text-gray-600">
                Showing {filteredFavorites.length} of {favorites.length} favorite{favorites.length !== 1 ? 's' : ''}
              </div>
            </div>

            {/* Products Grid */}
            {filteredFavorites.length === 0 ? (
              <div className="bg-white rounded-xl shadow-lg p-12 text-center">
                <h3 className="text-lg font-medium text-gray-900">No Products Match Filters</h3>
                <p className="mt-2 text-sm text-gray-500">
                  Try adjusting your category filter to see more results.
                </p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
                  {paginatedFavorites.map((product) => {
                    const stockStatus = getStockStatus(product.stock_quantity)
                    const imageUrl = product.image_urls && product.image_urls.length > 0 ? product.image_urls[0] : null

                    return (
                      <div
                        key={product.id}
                        className="bg-white rounded-lg shadow hover:shadow-lg transition p-4 relative"
                      >
                        {/* Favorite Button - Top Right */}
                        <div className="absolute top-2 right-2 z-10">
                          <FavoriteButton
                            productId={product.id}
                            retailerId={retailerId}
                            initialIsFavorite={true}
                            compact={true}
                            onChange={(isFavorite) => {
                              if (!isFavorite) {
                                handleRemoveFavorite(product.id)
                              }
                            }}
                          />
                        </div>

                        {/* Product Image */}
                        <div className="aspect-square bg-gray-100 rounded mb-3 overflow-hidden">
                          {imageUrl ? (
                            <img
                              src={imageUrl}
                              alt={product.product_name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                              <svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                                />
                              </svg>
                            </div>
                          )}
                        </div>

                        {/* Product Info */}
                        <div className="space-y-2">
                          {/* Manufacturer */}
                          <div className="text-xs text-gray-500">{product.manufacturer_name}</div>

                          {/* Product Name */}
                          <h3 className="font-semibold text-gray-900 line-clamp-2 min-h-[2.5rem]">
                            {product.product_name}
                          </h3>

                          {/* SKU */}
                          <div className="text-xs text-gray-500">SKU: {product.sku}</div>

                          {/* Category */}
                          {product.category && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                              {product.category}
                            </span>
                          )}

                          {/* Price and Stock */}
                          <div className="flex items-center justify-between pt-2">
                            <span className="text-xl font-bold text-indigo-600">
                              {formatPrice(product.price)}
                            </span>
                            <span className={`text-xs px-2 py-1 rounded ${stockStatus.className}`}>
                              {stockStatus.label}
                            </span>
                          </div>

                          {/* View Details Button */}
                          <Link
                            href={`/retailer/products/${product.id}`}
                            className="block w-full text-center bg-indigo-600 text-white py-2 rounded hover:bg-indigo-700 transition-colors mt-3"
                          >
                            View Details
                          </Link>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="bg-white rounded-xl shadow-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-700">
                        Showing{' '}
                        <span className="font-medium">
                          {(currentPage - 1) * favoritesPerPage + 1} to {Math.min(currentPage * favoritesPerPage, filteredFavorites.length)}
                        </span>{' '}
                        of <span className="font-medium">{filteredFavorites.length}</span> results
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                          disabled={currentPage === 1}
                          className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Previous
                        </button>
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                          let pageNum
                          if (totalPages <= 5) {
                            pageNum = i + 1
                          } else if (currentPage <= 3) {
                            pageNum = i + 1
                          } else if (currentPage >= totalPages - 2) {
                            pageNum = totalPages - 4 + i
                          } else {
                            pageNum = currentPage - 2 + i
                          }

                          return (
                            <button
                              key={pageNum}
                              onClick={() => setCurrentPage(pageNum)}
                              className={`px-3 py-2 border rounded-md text-sm font-medium ${
                                currentPage === pageNum
                                  ? 'bg-indigo-600 text-white border-indigo-600'
                                  : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                              }`}
                            >
                              {pageNum}
                            </button>
                          )
                        })}
                        <button
                          onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                          disabled={currentPage === totalPages}
                          className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}
