'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/utils/supabase'
import Papa from 'papaparse'
import { addToComparison, getComparisonProducts, MAX_PRODUCTS } from '@/utils/comparison'
import { isProductFavorite } from '@/utils/favorites'
import FavoriteButton from '@/components/FavoriteButton'
import { getProductPriceHistory, calculatePriceHistoryStats, filterPriceHistoryByDateRange, PriceHistoryEntry } from '@/utils/priceHistory'
import PriceHistoryChart from '@/components/PriceHistoryChart'
import PriceHistoryStats from '@/components/PriceHistoryStats'

type Product = {
  id: string
  sku: string
  product_name: string
  category: string | null
  description: string | null
  price: number | null
  stock_quantity: number | null
  image_urls: string[] | null
  attributes_json: Record<string, any> | null
  manufacturer_id: string
  manufacturer_name?: string
  manufacturer_industry?: string
  manufacturer_email?: string
}

type RelatedProduct = {
  id: string
  sku: string
  product_name: string
  price: number | null
  image_urls: string[] | null
}

type Tab = 'specifications' | 'attributes' | 'priceHistory' | 'manufacturer'

export default function RetailerProductDetailPage() {
  const params = useParams()
  const router = useRouter()
  const productId = params.id as string

  const [retailerId, setRetailerId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [product, setProduct] = useState<Product | null>(null)
  const [relatedProducts, setRelatedProducts] = useState<RelatedProduct[]>([])
  const [mainImage, setMainImage] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<Tab>('specifications')
  const [error, setError] = useState<string | null>(null)
  const [isInComparison, setIsInComparison] = useState(false)
  const [comparisonCount, setComparisonCount] = useState(0)
  const [showToast, setShowToast] = useState(false)
  const [isFavorite, setIsFavorite] = useState(false)
  const [priceHistory, setPriceHistory] = useState<PriceHistoryEntry[]>([])
  const [priceHistoryLoading, setPriceHistoryLoading] = useState(false)
  const [priceHistoryError, setPriceHistoryError] = useState<string | null>(null)
  const [priceHistoryTimeRange, setPriceHistoryTimeRange] = useState<number | null>(null)

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
      }
    }
    getUser()
  }, [router])

  useEffect(() => {
    const fetchProductAndCheckAccess = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/retailer/login')
        return
      }

      setRetailerId(user.id)

      // Fetch product first
      const { data: product, error: productError } = await supabase
        .from('product_data')
        .select(`
          *,
          manufacturers!inner(id, company_name, industry, email)
        `)
        .eq('id', productId)
        .single()

      if (productError || !product) {
        setError('Product not found')
        setLoading(false)
        return
      }

      // CHECK ACCESS: Does retailer have access to this manufacturer?
      const { data: accessData, error: accessError } = await supabase
        .from('retailer_data_access')
        .select('access_granted')
        .eq('retailer_id', user.id)
        .eq('manufacturer_id', product.manufacturer_id)
        .single()

      // If no access or access revoked, show error
      if (accessError || !accessData || !accessData.access_granted) {
        setError('access_denied')
        setLoading(false)
        return
      }

      // Access granted, load product
      setProduct({
        ...product,
        manufacturer_name: product.manufacturers.company_name,
        manufacturer_industry: product.manufacturers.industry || null,
        manufacturer_email: product.manufacturers.email || null,
      })
      setMainImage(product.image_urls?.[0] || null)

      // Fetch related data
      await fetchRelatedProducts(product.manufacturer_id, product.category || null)
      await fetchPriceHistory(productId)
      await checkIfFavorited(user.id, productId)

      setLoading(false)
    }

    if (productId) {
      setLoading(true)
      fetchProductAndCheckAccess()
    }
  }, [productId, router])

  const checkIfFavorited = async (userId: string, prodId: string) => {
    try {
      const favorite = await isProductFavorite(userId, prodId)
      setIsFavorite(favorite)
    } catch (err) {
      console.error('Error checking favorite status:', err)
    }
  }

  const fetchPriceHistory = async (prodId: string) => {
    setPriceHistoryLoading(true)
    setPriceHistoryError(null)

    try {
      const history = await getProductPriceHistory(prodId)
      setPriceHistory(history)
    } catch (err: any) {
      console.error('Error fetching price history:', err)
      setPriceHistoryError('Failed to load price history')
    } finally {
      setPriceHistoryLoading(false)
    }
  }

  useEffect(() => {
    if (product) {
      // Set page title
      document.title = `${product.product_name} | NexusXO`

      // Set main image
      if (product.image_urls && product.image_urls.length > 0) {
        setMainImage(product.image_urls[0])
      }

      // Check if product is in comparison
      const comparisonIds = getComparisonProducts()
      setIsInComparison(comparisonIds.includes(product.id))
      setComparisonCount(comparisonIds.length)
    }
  }, [product, productId])

  const fetchRelatedProducts = async (manufacturerId: string, category: string | null) => {
    try {
      let query = supabase
        .from('product_data')
        .select('id, sku, product_name, price, image_urls')
        .eq('manufacturer_id', manufacturerId)
        .neq('id', productId)
        .limit(4)

      if (category) {
        query = query.eq('category', category)
      }

      const { data, error } = await query

      if (error) {
        console.error('Error fetching related products:', error)
        return
      }

      setRelatedProducts(data || [])
    } catch (err) {
      console.error('Error:', err)
    }
  }

  const handleAddToComparison = () => {
    if (!product) return

    if (comparisonCount >= MAX_PRODUCTS) {
      alert(`You can only compare up to ${MAX_PRODUCTS} products. Please remove a product from comparison first.`)
      return
    }

    if (addToComparison(product.id)) {
      setIsInComparison(true)
      setComparisonCount(prev => prev + 1)
      setShowToast(true)
      setTimeout(() => setShowToast(false), 3000)
    }
  }

  const handleDownloadProduct = () => {
    if (!product) return

    const format = 'csv' // Could add format selector

    if (format === 'csv') {
      const csvData = {
        sku: product.sku,
        product_name: product.product_name,
        category: product.category || '',
        description: product.description || '',
        price: product.price || '',
        stock_quantity: product.stock_quantity || '',
        manufacturer: product.manufacturer_name || '',
        ...(product.attributes_json || {}),
      }

      const csv = Papa.unparse([csvData])
      const blob = new Blob([csv], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${product.sku}_${product.product_name.replace(/[^a-z0-9]/gi, '_')}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } else {
      const jsonData = {
        sku: product.sku,
        product_name: product.product_name,
        category: product.category,
        description: product.description,
        price: product.price,
        stock_quantity: product.stock_quantity,
        manufacturer: product.manufacturer_name,
        attributes: product.attributes_json,
      }

      const json = JSON.stringify(jsonData, null, 2)
      const blob = new Blob([json], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${product.sku}_${product.product_name.replace(/[^a-z0-9]/gi, '_')}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    }
  }

  const getStockStatus = (stock: number | null) => {
    if (stock === null || stock === undefined || stock < 1) {
      return { label: 'Out of Stock', className: 'bg-red-100 text-red-800', badgeClass: 'bg-red-600' }
    }
    if (stock <= 50) {
      return { label: 'Low Stock', className: 'bg-yellow-100 text-yellow-800', badgeClass: 'bg-yellow-600' }
    }
    return { label: 'In Stock', className: 'bg-green-100 text-green-800', badgeClass: 'bg-green-600' }
  }

  const formatPrice = (price: number | null) => {
    if (price === null || price === undefined) return 'N/A'
    return `$${price.toFixed(2)}`
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-gray-600">Loading product...</div>
      </div>
    )
  }

  if (error === 'access_denied') {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="bg-red-50 border-2 border-red-200 rounded-lg p-8 text-center">
          <div className="text-6xl mb-4">🚫</div>
          <h2 className="text-2xl font-bold text-red-900 mb-2">Access Denied</h2>
          <p className="text-red-700 mb-6">
            You don't have access to this product. The manufacturer may have revoked your access.
          </p>
          <div className="flex justify-center space-x-4">
            <Link 
              href="/retailer/manufacturers"
              className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              Browse Manufacturers
            </Link>
            <Link 
              href="/retailer/products"
              className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Back to Products
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (error || !product) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md mx-4 text-center">
          <svg
            className="mx-auto h-12 w-12 text-red-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <h2 className="mt-4 text-xl font-bold text-gray-900">Product Not Found</h2>
          <p className="mt-2 text-sm text-gray-500">
            {error || 'The product you are looking for does not exist.'}
          </p>
          <div className="mt-6">
            <Link
              href="/retailer/products"
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
            >
              Back to Products
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const images = product.image_urls || []
  const stockStatus = getStockStatus(product.stock_quantity)

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8">
      {/* Toast Notification */}
      {showToast && (
        <div className="fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 flex items-center gap-3 animate-in slide-in-from-top">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span>Product added to comparison ({comparisonCount}/{MAX_PRODUCTS})</span>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <nav className="flex mb-4" aria-label="Breadcrumb">
            <ol className="flex items-center space-x-2 text-sm text-gray-500">
              <li>
                <Link href="/retailer/products" className="hover:text-gray-700">
                  Browse Products
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
              {product.manufacturer_name && (
                <>
                  <li>
                    <Link href={`/retailer/products?manufacturer=${product.manufacturer_id}`} className="hover:text-gray-700">
                      {product.manufacturer_name}
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
                </>
              )}
              <li className="text-gray-900 font-medium">{product.product_name}</li>
            </ol>
          </nav>

          <div className="flex items-center justify-between flex-wrap gap-4">
            <Link
              href="/retailer/products"
              className="inline-flex items-center text-sm font-medium text-gray-600 hover:text-gray-900"
            >
              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Products
            </Link>
            <div className="flex items-center gap-3 flex-wrap">
              <FavoriteButton
                productId={productId}
                retailerId={retailerId}
                initialIsFavorite={isFavorite}
                compact={false}
                onChange={(newFavoriteState) => setIsFavorite(newFavoriteState)}
              />
              {isInComparison ? (
                <Link
                  href="/retailer/compare"
                  className="inline-flex items-center px-4 py-2 border border-indigo-300 rounded-md shadow-sm text-sm font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  Already in Comparison
                </Link>
              ) : (
                <button
                  onClick={handleAddToComparison}
                  disabled={comparisonCount >= MAX_PRODUCTS}
                  className="inline-flex items-center px-4 py-2 border border-indigo-300 rounded-md shadow-sm text-sm font-medium text-indigo-700 bg-white hover:bg-indigo-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  title={comparisonCount >= MAX_PRODUCTS ? `Maximum ${MAX_PRODUCTS} products can be compared` : 'Add to comparison'}
                >
                  <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  Add to Compare
                </button>
              )}
              <button
                onClick={handleDownloadProduct}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download Product Data
              </button>
            </div>
          </div>
        </div>

        {/* Product Overview */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            {/* Left Column - Image Gallery (40%) */}
            <div className="lg:col-span-2 space-y-4">
              {/* Main Image */}
              <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                {mainImage ? (
                  <img
                    src={mainImage}
                    alt={product.product_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <div className="text-center">
                      <svg className="w-24 h-24 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                      <div className="text-4xl font-bold text-gray-300">
                        {product.product_name[0].toUpperCase()}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Thumbnail Strip */}
              {images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {images.map((img, i) => (
                    <button
                      key={i}
                      onClick={() => setMainImage(img)}
                      className={`flex-shrink-0 w-20 h-20 rounded border-2 overflow-hidden ${
                        mainImage === img ? 'border-indigo-600' : 'border-gray-200 hover:border-gray-400'
                      }`}
                    >
                      <img src={img} alt={`Thumbnail ${i + 1}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Right Column - Product Info (60%) */}
            <div className="lg:col-span-3 space-y-6">
              {/* Product Name */}
              <div>
                <h1 className="text-4xl font-extrabold text-gray-900 mb-2">{product.product_name}</h1>
                <div className="text-sm text-gray-500">SKU: {product.sku}</div>
              </div>

              {/* Manufacturer */}
              {product.manufacturer_name && (
                <div>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800">
                    {product.manufacturer_name}
                  </span>
                </div>
              )}

              {/* Price */}
              <div>
                <div className="text-5xl font-bold text-indigo-600">{formatPrice(product.price)}</div>
              </div>

              {/* Stock Status */}
              <div>
                <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium ${stockStatus.className}`}>
                  <span className={`w-2 h-2 ${stockStatus.badgeClass} rounded-full mr-2`}></span>
                  {stockStatus.label} {product.stock_quantity !== null && product.stock_quantity >= 1 && `(${product.stock_quantity} available)`}
                </span>
              </div>

              {/* Category */}
              {product.category && (
                <div>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
                    {product.category}
                  </span>
                </div>
              )}

              {/* Description */}
              {product.description && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Description</h3>
                  <p className="text-gray-700 whitespace-pre-wrap">{product.description}</p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-4 pt-4 border-t">
                <button className="px-6 py-3 bg-indigo-600 text-white rounded-md font-medium hover:bg-indigo-700 transition-colors">
                  Request Quote
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Product Details Tabs */}
        <div className="bg-white rounded-xl shadow-lg mb-8">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              {[
                { id: 'specifications', label: 'Specifications' },
                { id: 'attributes', label: 'Additional Attributes' },
                { id: 'priceHistory', label: 'Price Trend' },
                { id: 'manufacturer', label: 'Manufacturer Info' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as Tab)}
                  className={`px-6 py-4 text-sm font-medium border-b-2 ${
                    activeTab === tab.id
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {/* Tab 1: Specifications */}
            {activeTab === 'specifications' && (
              <div className="overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <tbody className="bg-white divide-y divide-gray-200">
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-500 w-1/3">SKU</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{product.sku}</td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-500">Category</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{product.category || 'N/A'}</td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-500">Price</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatPrice(product.price)}</td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-500">Stock Quantity</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {product.stock_quantity !== null ? product.stock_quantity : 'N/A'}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

            {/* Tab 2: Additional Attributes */}
            {activeTab === 'attributes' && (
              <div>
                {product.attributes_json && Object.keys(product.attributes_json).length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.entries(product.attributes_json).map(([key, value]) => (
                      <div key={key} className="border border-gray-200 rounded-lg p-4">
                        <div className="text-sm font-medium text-gray-600 mb-1 capitalize">{key.replace(/_/g, ' ')}</div>
                        <div className="text-lg font-semibold text-gray-900">{String(value)}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    No additional attributes available
                  </div>
                )}
              </div>
            )}

            {/* Tab 3: Price History */}
            {activeTab === 'priceHistory' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Price Trend</h3>
                  <p className="text-sm text-gray-500 mb-4">
                    Historical price changes for this product
                  </p>

                  {/* Time Range Filter */}
                  <div className="mb-4 flex gap-2">
                    <button
                      onClick={() => setPriceHistoryTimeRange(null)}
                      className={`px-3 py-1 text-sm rounded-md border ${
                        priceHistoryTimeRange === null
                          ? 'bg-indigo-600 text-white border-indigo-600'
                          : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      All Time
                    </button>
                    <button
                      onClick={() => setPriceHistoryTimeRange(30)}
                      className={`px-3 py-1 text-sm rounded-md border ${
                        priceHistoryTimeRange === 30
                          ? 'bg-indigo-600 text-white border-indigo-600'
                          : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      Last 30 Days
                    </button>
                    <button
                      onClick={() => setPriceHistoryTimeRange(90)}
                      className={`px-3 py-1 text-sm rounded-md border ${
                        priceHistoryTimeRange === 90
                          ? 'bg-indigo-600 text-white border-indigo-600'
                          : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      Last 90 Days
                    </button>
                    <button
                      onClick={() => setPriceHistoryTimeRange(180)}
                      className={`px-3 py-1 text-sm rounded-md border ${
                        priceHistoryTimeRange === 180
                          ? 'bg-indigo-600 text-white border-indigo-600'
                          : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      6 Months
                    </button>
                  </div>

                  {priceHistoryLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="text-gray-600">Loading price history...</div>
                    </div>
                  ) : priceHistoryError ? (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <span className="text-red-700">{priceHistoryError}</span>
                        <button
                          onClick={fetchPriceHistory}
                          className="text-red-600 hover:text-red-800 underline text-sm"
                        >
                          Retry
                        </button>
                      </div>
                    </div>
                  ) : priceHistory.length === 0 ? (
                    <div className="text-center py-12 bg-gray-50 rounded-lg">
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
                          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                        />
                      </svg>
                      <h3 className="mt-4 text-sm font-medium text-gray-900">No price history available</h3>
                      <p className="mt-2 text-sm text-gray-500">
                        Price history will appear here once the manufacturer updates the product price.
                      </p>
                    </div>
                  ) : (
                    <>
                      {/* Summary Text */}
                      {(() => {
                        const filteredHistory = filterPriceHistoryByDateRange(priceHistory, priceHistoryTimeRange || 90)
                        const stats = calculatePriceHistoryStats(filteredHistory, product?.price || null)
                        const changeCount = filteredHistory.length
                        const days = priceHistoryTimeRange || 90
                        let summaryText = ''
                        
                        if (changeCount === 0) {
                          summaryText = `No price changes recorded in the last ${days} days.`
                        } else if (changeCount === 1) {
                          summaryText = `This product's price has changed once in the last ${days} days.`
                        } else {
                          summaryText = `This product's price has changed ${changeCount} times in the last ${days} days.`
                        }

                        if (stats.priceChangePercent !== null && stats.priceChangePercent !== 0) {
                          const trend = stats.priceChangePercent > 0 ? 'increased' : 'decreased'
                          summaryText += ` Price has ${trend} by ${Math.abs(stats.priceChangePercent).toFixed(1)}% from the first recorded price.`
                        } else if (stats.priceChangePercent === 0) {
                          summaryText += ' Price has remained stable.'
                        }

                        return (
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                            <p className="text-sm text-blue-800">{summaryText}</p>
                          </div>
                        )
                      })()}

                      {/* Chart and Stats Layout */}
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Chart - Left side (2 columns) */}
                        <div className="lg:col-span-2 bg-white border border-gray-200 rounded-lg p-6">
                          <PriceHistoryChart
                            history={filterPriceHistoryByDateRange(priceHistory, priceHistoryTimeRange)}
                            currentPrice={product?.price || null}
                            height={400}
                          />
                        </div>

                        {/* Stats - Right side (1 column) */}
                        <div className="lg:col-span-1">
                          <PriceHistoryStats
                            stats={calculatePriceHistoryStats(
                              filterPriceHistoryByDateRange(priceHistory, priceHistoryTimeRange),
                              product?.price || null
                            )}
                            isRetailer={true}
                          />
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Tab 4: Manufacturer Info */}
            {activeTab === 'manufacturer' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Manufacturer Information</h3>
                  <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Company Name</dt>
                      <dd className="mt-1 text-sm text-gray-900">{product.manufacturer_name || 'N/A'}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Industry</dt>
                      <dd className="mt-1 text-sm text-gray-900">{product.manufacturer_industry || 'N/A'}</dd>
                    </div>
                    {product.manufacturer_email && (
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Contact Email</dt>
                        <dd className="mt-1 text-sm text-gray-900">
                          <a href={`mailto:${product.manufacturer_email}`} className="text-indigo-600 hover:text-indigo-500">
                            {product.manufacturer_email}
                          </a>
                        </dd>
                      </div>
                    )}
                  </dl>
                </div>
                {product.manufacturer_id && (
                  <div className="pt-4 border-t">
                    <Link
                      href={`/retailer/products?manufacturer=${product.manufacturer_id}`}
                      className="inline-flex items-center text-indigo-600 hover:text-indigo-500 font-medium"
                    >
                      View all products from {product.manufacturer_name}
                      <svg className="w-4 h-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              More from {product.manufacturer_name}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedProducts.map((related) => {
                const relatedImage = related.image_urls && related.image_urls.length > 0 ? related.image_urls[0] : null

                return (
                  <Link
                    key={related.id}
                    href={`/retailer/products/${related.id}`}
                    className="bg-gray-50 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="aspect-square bg-gray-200 rounded mb-3 overflow-hidden">
                      {relatedImage ? (
                        <img
                          src={relatedImage}
                          alt={related.product_name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <div className="text-2xl font-bold">
                            {related.product_name[0].toUpperCase()}
                          </div>
                        </div>
                      )}
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2">{related.product_name}</h3>
                    <div className="text-xs text-gray-500 mb-2">SKU: {related.sku}</div>
                    <div className="text-lg font-bold text-indigo-600">{formatPrice(related.price)}</div>
                  </Link>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
