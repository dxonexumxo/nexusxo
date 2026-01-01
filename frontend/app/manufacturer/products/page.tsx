'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Papa from 'papaparse'
import { supabase } from '@/utils/supabase'

type Product = {
  id: string
  sku: string
  product_name: string
  category: string | null
  description: string | null
  price: number | null
  stock_quantity: number | null
  attributes_json: Record<string, any> | null
  image_urls: string[] | null
  created_at: string
  updated_at: string | null
}

type StockFilter = 'all' | 'in_stock' | 'low_stock' | 'out_of_stock'
type SortOption = 'name_asc' | 'name_desc' | 'price_asc' | 'price_desc' | 'recent'

export default function ManufacturerProductsPage() {
  const router = useRouter()
  const [userId, setUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [products, setProducts] = useState<Product[]>([])
  const [productsLoading, setProductsLoading] = useState(false)
  const [totalProducts, setTotalProducts] = useState(0)
  const [totalToday, setTotalToday] = useState(0)
  const [lowStockCount, setLowStockCount] = useState(0)
  const [categories, setCategories] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [stockFilter, setStockFilter] = useState<StockFilter>('all')
  const [sortOption, setSortOption] = useState<SortOption>('recent')
  const [currentPage, setCurrentPage] = useState(1)
  const [deletingProductId, setDeletingProductId] = useState<string | null>(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [productToDelete, setProductToDelete] = useState<Product | null>(null)
  const productsPerPage = 20

  useEffect(() => {
    const getUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          setUserId(user.id)
        } else {
          router.push('/manufacturer/login')
        }
      } catch (error) {
        console.error('Error fetching user:', error)
        router.push('/manufacturer/login')
      } finally {
        setLoading(false)
      }
    }
    getUser()
  }, [router])

  useEffect(() => {
    if (userId) {
      fetchProducts()
      fetchStats()
      fetchCategories()
    }
  }, [userId, currentPage, categoryFilter, stockFilter, sortOption, searchQuery])

  const fetchProducts = async () => {
    if (!userId) return

    setProductsLoading(true)
    try {
      let query = supabase
        .from('product_data')
        .select('id, sku, product_name, category, price, stock_quantity, image_urls, updated_at, created_at', { count: 'exact' })
        .eq('manufacturer_id', userId)

      // Apply search filter
      if (searchQuery) {
        query = query.or(`sku.ilike.%${searchQuery}%,product_name.ilike.%${searchQuery}%`)
      }

      // Apply category filter
      if (categoryFilter !== 'all') {
        query = query.eq('category', categoryFilter)
      }

      // Apply stock filter
      if (stockFilter === 'in_stock') {
        query = query.gte('stock_quantity', 10)
      } else if (stockFilter === 'low_stock') {
        query = query.and('stock_quantity.lt.10,stock_quantity.gte.0')
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
        case 'recent':
        default:
          query = query.order('updated_at', { ascending: false, nullsFirst: false })
            .order('created_at', { ascending: false })
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
        setProducts(data || [])
        setTotalProducts(count || 0)
      }
    } catch (err) {
      console.error('Error:', err)
    } finally {
      setProductsLoading(false)
    }
  }

  const fetchStats = async () => {
    if (!userId) return

    try {
      // Total products
      const { count: totalCount } = await supabase
        .from('product_data')
        .select('*', { count: 'exact', head: true })
        .eq('manufacturer_id', userId)

      // Products added today
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const { count: todayCount } = await supabase
        .from('product_data')
        .select('*', { count: 'exact', head: true })
        .eq('manufacturer_id', userId)
        .gte('created_at', today.toISOString())

      // Low stock products
      const { count: lowStock } = await supabase
        .from('product_data')
        .select('*', { count: 'exact', head: true })
        .eq('manufacturer_id', userId)
        .or('stock_quantity.is.null,stock_quantity.lt.10')

      setTotalProducts(totalCount || 0)
      setTotalToday(todayCount || 0)
      setLowStockCount(lowStock || 0)
    } catch (err) {
      console.error('Error fetching stats:', err)
    }
  }

  const fetchCategories = async () => {
    if (!userId) return

    try {
      const { data, error } = await supabase
        .from('product_data')
        .select('category')
        .eq('manufacturer_id', userId)
        .not('category', 'is', null)

      if (!error && data) {
        const uniqueCategories = Array.from(new Set(data.map((p) => p.category).filter(Boolean))) as string[]
        setCategories(uniqueCategories.sort())
      }
    } catch (err) {
      console.error('Error fetching categories:', err)
    }
  }

  const handleDelete = async () => {
    if (!productToDelete || !userId) return

    setDeletingProductId(productToDelete.id)
    try {
      const { error } = await supabase
        .from('product_data')
        .delete()
        .eq('id', productToDelete.id)
        .eq('manufacturer_id', userId)

      if (error) {
        console.error('Error deleting product:', error)
        alert('Failed to delete product: ' + error.message)
      } else {
        setShowDeleteModal(false)
        setProductToDelete(null)
        fetchProducts()
        fetchStats()
      }
    } catch (err) {
      console.error('Error:', err)
      alert('An error occurred while deleting the product')
    } finally {
      setDeletingProductId(null)
    }
  }

  const handleExport = async () => {
    if (!userId) return

    try {
      const { data: allProducts, error } = await supabase
        .from('product_data')
        .select('*')
        .eq('manufacturer_id', userId)
        .order('product_name', { ascending: true })

      if (error) {
        alert('Failed to export products: ' + error.message)
        return
      }

      if (!allProducts || allProducts.length === 0) {
        alert('No products to export')
        return
      }

      // Convert to CSV
      const csv = Papa.unparse(allProducts.map((p) => ({
        SKU: p.sku,
        'Product Name': p.product_name,
        Category: p.category || '',
        Description: p.description || '',
        Price: p.price || '',
        'Stock Quantity': p.stock_quantity || '',
        'Created At': p.created_at,
        'Updated At': p.updated_at || '',
      })))

      // Download
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `products_export_${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Error exporting:', err)
      alert('An error occurred while exporting products')
    }
  }

  const openDeleteModal = (product: Product) => {
    setProductToDelete(product)
    setShowDeleteModal(true)
  }

  const getStockColor = (stock: number | null) => {
    if (stock === null || stock === undefined) return 'text-red-600'
    if (stock >= 50) return 'text-green-600'
    if (stock >= 10) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getStockBadgeColor = (stock: number | null) => {
    if (stock === null || stock === undefined) return 'bg-red-100 text-red-800'
    if (stock >= 50) return 'bg-green-100 text-green-800'
    if (stock >= 10) return 'bg-yellow-100 text-yellow-800'
    return 'bg-red-100 text-red-800'
  }

  const formatRelativeTime = (dateString: string | null) => {
    if (!dateString) return 'Never'
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`
    if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`
    if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`
    return date.toLocaleDateString()
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((word) => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const formatPrice = (price: number | null) => {
    if (price === null || price === undefined) return '-'
    return `$${price.toFixed(2)}`
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
          <h1 className="text-3xl font-extrabold text-gray-900">Product Catalog Management</h1>
        </div>

        {/* Stats Cards */}
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
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Added Today</p>
                <p className="text-2xl font-semibold text-gray-900">{totalToday}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Low/No Stock</p>
                <p className="text-2xl font-semibold text-gray-900">{lowStockCount}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mb-6 flex flex-wrap gap-4">
          <Link
            href="/manufacturer/upload"
            className="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700 transition-colors"
          >
            Upload New Products
          </Link>
          <button
            onClick={handleExport}
            className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            Export All Products
          </button>
        </div>

        {/* Search and Filters - Sticky */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6 sticky top-0 z-10">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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

            <div className="grid grid-cols-2 gap-2">
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

              <select
                value={sortOption}
                onChange={(e) => {
                  setSortOption(e.target.value as SortOption)
                  setCurrentPage(1)
                }}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              >
                <option value="recent">Recently Updated</option>
                <option value="name_asc">Name (A-Z)</option>
                <option value="name_desc">Name (Z-A)</option>
                <option value="price_asc">Price (Low-High)</option>
                <option value="price_desc">Price (High-Low)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Products Table */}
        {productsLoading ? (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <div className="text-gray-600">Loading products...</div>
          </div>
        ) : products.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No products found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchQuery || categoryFilter !== 'all' || stockFilter !== 'all'
                ? 'Try adjusting your filters'
                : 'Get started by uploading your first product catalog'}
            </p>
            {!searchQuery && categoryFilter === 'all' && stockFilter === 'all' && (
              <div className="mt-6">
                <Link
                  href="/manufacturer/upload"
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                >
                  Upload Your First Products
                </Link>
              </div>
            )}
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Product
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        SKU
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Category
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Price
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Stock
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Last Updated
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {products.map((product) => (
                      <tr key={product.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => router.push(`/manufacturer/products/${product.id}`)}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0">
                              <div className="relative w-12 h-12">
                                {product.image_urls && product.image_urls.length > 0 ? (
                                  <>
                                    <img
                                      src={product.image_urls[0]}
                                      alt={product.product_name}
                                      className="w-12 h-12 rounded object-cover"
                                    />
                                    {product.image_urls.length > 1 && (
                                      <span className="absolute -bottom-1 -right-1 bg-blue-600 text-white text-xs px-1 rounded">
                                        {product.image_urls.length}
                                      </span>
                                    )}
                                  </>
                                ) : (
                                  <div className="w-12 h-12 rounded bg-gray-200 flex items-center justify-center text-gray-600 font-semibold">
                                    {product.product_name[0].toUpperCase()}
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{product.product_name}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{product.sku}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {product.category ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              {product.category}
                            </span>
                          ) : (
                            <span className="text-sm text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatPrice(product.price)}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStockBadgeColor(product.stock_quantity)}`}>
                            {product.stock_quantity ?? 'N/A'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatRelativeTime(product.updated_at || product.created_at)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              onClick={() => router.push(`/manufacturer/products/${product.id}`)}
                              className="text-indigo-600 hover:text-indigo-900"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => openDeleteModal(product)}
                              className="text-red-600 hover:text-red-900"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden space-y-4">
              {products.map((product) => (
                <div key={product.id} className="bg-white rounded-xl shadow-lg p-4">
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      <div className="relative w-12 h-12">
                        {product.image_urls && product.image_urls.length > 0 ? (
                          <>
                            <img
                              src={product.image_urls[0]}
                              alt={product.product_name}
                              className="w-12 h-12 rounded object-cover"
                            />
                            {product.image_urls.length > 1 && (
                              <span className="absolute -bottom-1 -right-1 bg-blue-600 text-white text-xs px-1 rounded">
                                {product.image_urls.length}
                              </span>
                            )}
                          </>
                        ) : (
                          <div className="w-12 h-12 rounded bg-gray-200 flex items-center justify-center text-gray-600 font-semibold">
                            {product.product_name[0].toUpperCase()}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-medium text-gray-900 truncate">{product.product_name}</h3>
                      <p className="text-sm text-gray-500 mt-1">SKU: {product.sku}</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {product.category && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                            {product.category}
                          </span>
                        )}
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getStockBadgeColor(product.stock_quantity)}`}>
                          Stock: {product.stock_quantity ?? 'N/A'}
                        </span>
                        <span className="text-xs text-gray-500">{formatPrice(product.price)}</span>
                      </div>
                      <div className="mt-2 text-xs text-gray-500">
                        Updated {formatRelativeTime(product.updated_at || product.created_at)}
                      </div>
                      <div className="mt-3 flex space-x-2">
                        <button
                          onClick={() => router.push(`/manufacturer/products/${product.id}`)}
                          className="flex-1 px-3 py-1.5 text-xs font-medium text-indigo-600 border border-indigo-600 rounded hover:bg-indigo-50"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => openDeleteModal(product)}
                          className="flex-1 px-3 py-1.5 text-xs font-medium text-red-600 border border-red-600 rounded hover:bg-red-50"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-6 flex items-center justify-between bg-white rounded-xl shadow-lg p-4">
                <div className="text-sm text-gray-700">
                  Showing{' '}
                  <span className="font-medium">
                    {(currentPage - 1) * productsPerPage + 1} to {Math.min(currentPage * productsPerPage, totalProducts)}
                  </span>{' '}
                  of <span className="font-medium">{totalProducts}</span> results
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <div className="flex space-x-1">
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
                  </div>
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && productToDelete && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
            <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Delete Product</h3>
              <p className="text-sm text-gray-500 mb-6">
                Are you sure you want to delete <span className="font-medium">{productToDelete.product_name}</span> (SKU:{' '}
                {productToDelete.sku})? This action cannot be undone.
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowDeleteModal(false)
                    setProductToDelete(null)
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deletingProductId === productToDelete.id}
                  className="px-4 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {deletingProductId === productToDelete.id ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
