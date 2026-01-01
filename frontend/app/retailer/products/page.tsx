'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/utils/supabase'
import { addToComparison, getComparisonProducts, MAX_PRODUCTS } from '@/utils/comparison'
import { getFavoriteProductIds } from '@/utils/favorites'
import FavoriteButton from '@/components/FavoriteButton'

type Product = {
  id: string
  sku: string
  product_name: string
  category: string | null
  description: string | null
  price: number | null
  stock_quantity: number | null
  image_urls: string[] | null
  manufacturer_id: string
  manufacturer_name?: string
}

type Manufacturer = {
  id: string
  company_name: string
  product_count: number
}

type StockFilter = 'all' | 'in_stock' | 'low_stock' | 'out_of_stock'
type SortOption = 'name_asc' | 'name_desc' | 'price_asc' | 'price_desc'

export default function RetailerProductsPage() {
  const router = useRouter()
  const [retailerId, setRetailerId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [products, setProducts] = useState<Product[]>([])
  const [productsLoading, setProductsLoading] = useState(false)
  const [manufacturers, setManufacturers] = useState<Manufacturer[]>([])
  const [accessibleManufacturerIds, setAccessibleManufacturerIds] = useState<string[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedManufacturer, setSelectedManufacturer] = useState<string>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [priceMin, setPriceMin] = useState<string>('')
  const [priceMax, setPriceMax] = useState<string>('')
  const [stockFilter, setStockFilter] = useState<StockFilter>('all')
  const [sortOption, setSortOption] = useState<SortOption>('name_asc')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalProducts, setTotalProducts] = useState(0)
  const [totalCategories, setTotalCategories] = useState(0)
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set())
  const [comparisonCount, setComparisonCount] = useState(0)
  const [favoriteProductIds, setFavoriteProductIds] = useState<Set<string>>(new Set())
  const productsPerPage = 24

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
      fetchAccessibleManufacturers()
    }
  }, [retailerId])

  useEffect(() => {
    if (accessibleManufacturerIds.length > 0) {
      fetchManufacturers()
      fetchProducts()
      fetchCategories()
      fetchStats()
    }
  }, [accessibleManufacturerIds])

  useEffect(() => {
    if (retailerId) {
      fetchFavoriteIds()
    }
  }, [retailerId])

  useEffect(() => {
    if (accessibleManufacturerIds.length > 0) {
      fetchProducts()
    }
  }, [currentPage, selectedManufacturer, categoryFilter, stockFilter, sortOption, searchQuery, priceMin, priceMax])

  useEffect(() => {
    // Load comparison count from localStorage
    const comparisonIds = getComparisonProducts()
    setComparisonCount(comparisonIds.length)
  }, [])

  const fetchAccessibleManufacturers = async () => {
    if (!retailerId) return

    try {
      // Get accessible manufacturers from retailer_data_access
      const { data: accessData, error: accessError } = await supabase
        .from('retailer_data_access')
        .select('manufacturer_id')
        .eq('retailer_id', retailerId)
        .eq('access_granted', true)

      if (accessError) {
        console.error('Error fetching access data:', accessError)
        return
      }

      if (!accessData || accessData.length === 0) {
        setAccessibleManufacturerIds([])
        return
      }

      const manufacturerIds = accessData.map(a => a.manufacturer_id)
      setAccessibleManufacturerIds(manufacturerIds)
    } catch (err) {
      console.error('Error:', err)
    }
  }

  const fetchManufacturers = async () => {
    if (accessibleManufacturerIds.length === 0) return

    try {
      const { data: manufacturerData, error } = await supabase
        .from('manufacturers')
        .select('id, company_name')
        .in('id', accessibleManufacturerIds)

      if (error) {
        console.error('Error fetching manufacturers:', error)
        return
      }

      // Get product counts for each manufacturer
      const manufacturersWithCounts: Manufacturer[] = await Promise.all(
        (manufacturerData || []).map(async (mfg) => {
          const { count } = await supabase
            .from('product_data')
            .select('*', { count: 'exact', head: true })
            .eq('manufacturer_id', mfg.id)

          return {
            id: mfg.id,
            company_name: mfg.company_name,
            product_count: count || 0,
          }
        })
      )

      setManufacturers(manufacturersWithCounts)
    } catch (err) {
      console.error('Error:', err)
    }
  }

  const fetchProducts = async () => {
    if (accessibleManufacturerIds.length === 0) {
      setProducts([])
      setTotalProducts(0)
      return
    }

    setProductsLoading(true)
    try {
      // Determine which manufacturer IDs to query
      const manufacturerIdsToQuery = selectedManufacturer === 'all' 
        ? accessibleManufacturerIds 
        : [selectedManufacturer]

      let query = supabase
        .from('product_data')
        .select('id, sku, product_name, category, description, price, stock_quantity, image_urls, manufacturer_id', { count: 'exact' })
        .in('manufacturer_id', manufacturerIdsToQuery)

      // Apply search filter
      if (searchQuery) {
        query = query.or(`sku.ilike.%${searchQuery}%,product_name.ilike.%${searchQuery}%`)
      }

      // Apply category filter
      if (categoryFilter !== 'all') {
        query = query.eq('category', categoryFilter)
      }

      // Apply price range filter
      if (priceMin) {
        const min = parseFloat(priceMin)
        if (!isNaN(min)) {
          query = query.gte('price', min)
        }
      }
      if (priceMax) {
        const max = parseFloat(priceMax)
        if (!isNaN(max)) {
          query = query.lte('price', max)
        }
      }

      // Apply stock filter
      if (stockFilter === 'in_stock') {
        query = query.gte('stock_quantity', 10)
      } else if (stockFilter === 'low_stock') {
        query = query.and('stock_quantity.lt.10,stock_quantity.gte.1')
      } else if (stockFilter === 'out_of_stock') {
        query = query.or('stock_quantity.is.null,stock_quantity.lt.1')
      }

      // Apply sorting
      switch (sortOption) {
        case 'name_asc':
          query = query.order('product_name', { ascending: true })
          break
        case 'name_desc':
          query = query.order('product_name', { ascending: false })
          break
        case 'price_asc':
          query = query.order('price', { ascending: true, nullsFirst: false })
          break
        case 'price_desc':
          query = query.order('price', { ascending: false, nullsFirst: false })
          break
      }

      // Apply pagination
      const { data, error, count } = await query.range(
        (currentPage - 1) * productsPerPage,
        currentPage * productsPerPage - 1
      )

      if (error) {
        console.error('Error fetching products:', error)
      } else {
        // Get manufacturer names for products
        const manufacturerIds = Array.from(new Set((data || []).map(p => p.manufacturer_id)))
        let manufacturerMap = new Map<string, string>()

        if (manufacturerIds.length > 0) {
          const { data: mfgData } = await supabase
            .from('manufacturers')
            .select('id, company_name')
            .in('id', manufacturerIds)

          manufacturerMap = new Map((mfgData || []).map(m => [m.id, m.company_name]))
        }

        const productsWithManufacturers = (data || []).map(product => ({
          ...product,
          manufacturer_name: manufacturerMap.get(product.manufacturer_id) || 'Unknown',
        }))

        setProducts(productsWithManufacturers)
        setTotalProducts(count || 0)
      }
    } catch (err) {
      console.error('Error:', err)
    } finally {
      setProductsLoading(false)
    }
  }

  const fetchCategories = async () => {
    if (accessibleManufacturerIds.length === 0) return

    try {
      const { data, error } = await supabase
        .from('product_data')
        .select('category')
        .in('manufacturer_id', accessibleManufacturerIds)
        .not('category', 'is', null)

      if (error) {
        console.error('Error fetching categories:', error)
        return
      }

      const uniqueCategories = Array.from(new Set((data || []).map(p => p.category).filter(Boolean))) as string[]
      setCategories(uniqueCategories.sort())
    } catch (err) {
      console.error('Error:', err)
    }
  }

  const fetchStats = async () => {
    if (accessibleManufacturerIds.length === 0) return

    try {
      // Total products
      const { count } = await supabase
        .from('product_data')
        .select('*', { count: 'exact', head: true })
        .in('manufacturer_id', accessibleManufacturerIds)

      // Unique categories
      const { data: categoryData } = await supabase
        .from('product_data')
        .select('category')
        .in('manufacturer_id', accessibleManufacturerIds)
        .not('category', 'is', null)

      const uniqueCats = new Set((categoryData || []).map(p => p.category).filter(Boolean))
      setTotalCategories(uniqueCats.size)
    } catch (err) {
      console.error('Error fetching stats:', err)
    }
  }

  const fetchFavoriteIds = async () => {
    if (!retailerId) return

    try {
      const favoriteIds = await getFavoriteProductIds(retailerId)
      setFavoriteProductIds(new Set(favoriteIds))
    } catch (err) {
      console.error('Error fetching favorite IDs:', err)
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

  const handleToggleSelection = (productId: string) => {
    setSelectedProducts(prev => {
      const newSet = new Set(prev)
      if (newSet.has(productId)) {
        newSet.delete(productId)
      } else {
        newSet.add(productId)
      }
      return newSet
    })
  }

  const handleCompareSelected = () => {
    if (selectedProducts.size === 0) return
    
    let added = 0
    selectedProducts.forEach(productId => {
      if (comparisonCount + added < MAX_PRODUCTS) {
        if (addToComparison(productId)) {
          added++
        }
      }
    })
    
    setComparisonCount(prev => {
      const newCount = Math.min(prev + added, MAX_PRODUCTS)
      return newCount
    })
    
    setSelectedProducts(new Set())
    router.push('/retailer/compare')
  }

  const handleClearSelection = () => {
    setSelectedProducts(new Set())
  }

  const totalPages = Math.ceil(totalProducts / productsPerPage)

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-gray-600">Loading...</div>
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
                <Link href="/retailer/dashboard" className="hover:text-gray-700">
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
              <li className="text-gray-900 font-medium">Browse Products</li>
            </ol>
          </nav>
          <h1 className="text-3xl font-extrabold text-gray-900">Browse Product Catalogs</h1>
          <p className="mt-2 text-sm text-gray-600">
            Explore products from manufacturers you have access to
          </p>
        </div>

        {/* Quick Stats */}
        {accessibleManufacturerIds.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Products</p>
                  <p className="text-2xl font-semibold text-gray-900">{totalProducts}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Manufacturers</p>
                  <p className="text-2xl font-semibold text-gray-900">{manufacturers.length}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Categories</p>
                  <p className="text-2xl font-semibold text-gray-900">{totalCategories}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Empty State - No Access */}
        {accessibleManufacturerIds.length === 0 && !loading && (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <h3 className="mt-4 text-lg font-medium text-gray-900">No Manufacturer Access</h3>
            <p className="mt-2 text-sm text-gray-500">
              You don't have access to any manufacturers yet. Contact manufacturers to request access.
            </p>
            <div className="mt-6">
              <Link
                href="/retailer/dashboard"
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
              >
                Back to Dashboard
              </Link>
            </div>
          </div>
        )}

        {/* Filters and Products */}
        {accessibleManufacturerIds.length > 0 && (
          <>
            {/* Manufacturer Filter */}
            <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filter by Manufacturer
              </label>
              <select
                value={selectedManufacturer}
                onChange={(e) => {
                  setSelectedManufacturer(e.target.value)
                  setCurrentPage(1)
                }}
                className="block w-full md:w-64 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              >
                <option value="all">
                  All Manufacturers ({manufacturers.reduce((sum, m) => sum + m.product_count, 0)} products)
                </option>
                {manufacturers.map((mfg) => (
                  <option key={mfg.id} value={mfg.id}>
                    {mfg.company_name} ({mfg.product_count} products)
                  </option>
                ))}
              </select>
            </div>

            {/* Search and Filters */}
            <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                {/* Search */}
                <div className="md:col-span-2">
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                    <input
                      type="text"
                      placeholder="Search by SKU or product name..."
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value)
                        setCurrentPage(1)
                      }}
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                  </div>
                </div>

                {/* Category */}
                <div>
                  <select
                    value={categoryFilter}
                    onChange={(e) => {
                      setCategoryFilter(e.target.value)
                      setCurrentPage(1)
                    }}
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

                {/* Stock Status */}
                <div>
                  <select
                    value={stockFilter}
                    onChange={(e) => {
                      setStockFilter(e.target.value as StockFilter)
                      setCurrentPage(1)
                    }}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  >
                    <option value="all">All Stock</option>
                    <option value="in_stock">In Stock</option>
                    <option value="low_stock">Low Stock</option>
                    <option value="out_of_stock">Out of Stock</option>
                  </select>
                </div>

                {/* Sort */}
                <div>
                  <select
                    value={sortOption}
                    onChange={(e) => {
                      setSortOption(e.target.value as SortOption)
                      setCurrentPage(1)
                    }}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  >
                    <option value="name_asc">Name A-Z</option>
                    <option value="name_desc">Name Z-A</option>
                    <option value="price_asc">Price Low-High</option>
                    <option value="price_desc">Price High-Low</option>
                  </select>
                </div>
              </div>

              {/* Price Range */}
              <div className="mt-4 grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Min Price</label>
                  <input
                    type="number"
                    placeholder="Min"
                    value={priceMin}
                    onChange={(e) => {
                      setPriceMin(e.target.value)
                      setCurrentPage(1)
                    }}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Max Price</label>
                  <input
                    type="number"
                    placeholder="Max"
                    value={priceMax}
                    onChange={(e) => {
                      setPriceMax(e.target.value)
                      setCurrentPage(1)
                    }}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Products Grid */}
            {productsLoading ? (
              <div className="text-center py-12">
                <div className="text-gray-600">Loading products...</div>
              </div>
            ) : products.length === 0 ? (
              <div className="bg-white rounded-xl shadow-lg p-12 text-center">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                  />
                </svg>
                <h3 className="mt-4 text-lg font-medium text-gray-900">No Products Found</h3>
                <p className="mt-2 text-sm text-gray-500">
                  No products match your filters. Try adjusting your search criteria.
                </p>
              </div>
            ) : (
              <>
                {/* Floating Action Bar */}
                {selectedProducts.size > 0 && (
                  <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 bg-white rounded-lg shadow-2xl border-2 border-indigo-500 p-4 z-50">
                    <div className="flex items-center gap-4">
                      <span className="text-sm font-medium text-gray-700">
                        {selectedProducts.size} product{selectedProducts.size !== 1 ? 's' : ''} selected
                      </span>
                      <button
                        onClick={handleCompareSelected}
                        disabled={comparisonCount >= MAX_PRODUCTS}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Compare Selected {comparisonCount >= MAX_PRODUCTS && `(Max ${MAX_PRODUCTS})`}
                      </button>
                      <button
                        onClick={handleClearSelection}
                        className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-50"
                      >
                        Clear Selection
                      </button>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
                  {products.map((product) => {
                    const stockStatus = getStockStatus(product.stock_quantity)
                    const imageUrl = product.image_urls && product.image_urls.length > 0 ? product.image_urls[0] : null
                    const isSelected = selectedProducts.has(product.id)

                    return (
                      <div
                        key={product.id}
                        className={`bg-white rounded-lg shadow hover:shadow-lg transition p-4 relative ${isSelected ? 'ring-2 ring-indigo-500' : ''}`}
                      >
                        {/* Favorite Button - Top Left */}
                        <div className="absolute top-2 left-2 z-10">
                          <FavoriteButton
                            productId={product.id}
                            retailerId={retailerId}
                            initialIsFavorite={favoriteProductIds.has(product.id)}
                            compact={true}
                            onChange={(isFavorite) => {
                              setFavoriteProductIds(prev => {
                                const newSet = new Set(prev)
                                if (isFavorite) {
                                  newSet.add(product.id)
                                } else {
                                  newSet.delete(product.id)
                                }
                                return newSet
                              })
                            }}
                          />
                        </div>

                        {/* Selection Checkbox - Top Right */}
                        <div className="absolute top-2 right-2 z-10">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleSelection(product.id)}
                            className="w-5 h-5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
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
                          {(currentPage - 1) * productsPerPage + 1} to {Math.min(currentPage * productsPerPage, totalProducts)}
                        </span>{' '}
                        of <span className="font-medium">{totalProducts}</span> results
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
