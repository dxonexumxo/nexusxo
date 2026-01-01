'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/utils/supabase'
import Papa from 'papaparse'
import { getComparisonProducts, saveComparisonProducts, removeFromComparison, clearComparison, MAX_PRODUCTS } from '@/utils/comparison'

interface ComparisonProduct {
  id: string
  sku: string
  product_name: string
  manufacturer_name: string
  category: string | null
  description: string | null
  price: number | null
  stock_quantity: number | null
  image_urls: string[] | null
  attributes_json: Record<string, any> | null
}

export default function RetailerComparePage() {
  const router = useRouter()
  const [retailerId, setRetailerId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [products, setProducts] = useState<ComparisonProduct[]>([])
  const [productIds, setProductIds] = useState<string[]>([])
  const [accessibleManufacturerIds, setAccessibleManufacturerIds] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)

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
    // Load product IDs from localStorage
    const ids = getComparisonProducts()
    setProductIds(ids)
  }, [])

  useEffect(() => {
    if (productIds.length > 0 && accessibleManufacturerIds.length > 0) {
      fetchProducts()
    } else if (productIds.length === 0) {
      setProducts([])
    }
  }, [productIds, accessibleManufacturerIds])

  const fetchAccessibleManufacturers = async () => {
    if (!retailerId) return

    try {
      const { data: accessData } = await supabase
        .from('retailer_data_access')
        .select('manufacturer_id')
        .eq('retailer_id', retailerId)
        .eq('access_granted', true)

      if (accessData) {
        const manufacturerIds = accessData.map(a => a.manufacturer_id)
        setAccessibleManufacturerIds(manufacturerIds)
      }
    } catch (err) {
      console.error('Error fetching accessible manufacturers:', err)
    }
  }

  const fetchProducts = async () => {
    if (productIds.length === 0 || accessibleManufacturerIds.length === 0) {
      setProducts([])
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    try {
      // Fetch products with access filter
      const { data: productData, error: productError } = await supabase
        .from('product_data')
        .select(`
          id, sku, product_name, category, description, price, stock_quantity, image_urls, attributes_json, manufacturer_id,
          manufacturers!inner(company_name)
        `)
        .in('id', productIds)
        .in('manufacturer_id', accessibleManufacturerIds)

      if (productError) {
        throw productError
      }

      if (!productData || productData.length === 0) {
        setProducts([])
        // Remove all products from localStorage since none are accessible
        clearComparison()
        setProductIds([])
        setLoading(false)
        return
      }

      // Build products array
      const verifiedProducts: ComparisonProduct[] = productData.map((product: any) => ({
        id: product.id,
        sku: product.sku,
        product_name: product.product_name,
        manufacturer_name: product.manufacturers.company_name,
        category: product.category,
        description: product.description,
        price: product.price,
        stock_quantity: product.stock_quantity,
        image_urls: product.image_urls,
        attributes_json: product.attributes_json,
      }))

      // Remove inaccessible products from localStorage
      const accessibleIds = verifiedProducts.map(p => p.id)
      const inaccessibleIds = productIds.filter(id => !accessibleIds.includes(id))

      if (inaccessibleIds.length > 0) {
        const updatedIds = productIds.filter(id => !inaccessibleIds.includes(id))
        saveComparisonProducts(updatedIds)
        setProductIds(updatedIds)
        
        alert(`${inaccessibleIds.length} product(s) removed from comparison due to access restrictions.`)
      }

      // Sort products to match the order in productIds
      const sortedProducts = productIds
        .map(id => verifiedProducts.find(p => p.id === id))
        .filter((p): p is ComparisonProduct => p !== undefined)

      setProducts(sortedProducts)
    } catch (err: any) {
      console.error('Error fetching products:', err)
      setError(err.message || 'Failed to load products')
    } finally {
      setLoading(false)
    }
  }

  const handleRemove = (productId: string) => {
    removeFromComparison(productId)
    const updatedIds = productIds.filter(id => id !== productId)
    setProductIds(updatedIds)
    saveComparisonProducts(updatedIds)
    setProducts(prev => prev.filter(p => p.id !== productId))
  }

  const handleClearAll = () => {
    clearComparison()
    setProductIds([])
    setProducts([])
  }

  // Get all unique custom attributes across all products
  const allCustomAttributes = useMemo(() => {
    const attributes = new Set<string>()
    products.forEach(product => {
      if (product.attributes_json) {
        Object.keys(product.attributes_json).forEach(key => attributes.add(key))
      }
    })
    return Array.from(attributes).sort()
  }, [products])

  // Check if values differ for an attribute
  const valuesDiffer = (values: (string | number | null)[]): boolean => {
    const filtered = values.filter(v => v !== null && v !== undefined)
    if (filtered.length === 0) return false
    const first = String(filtered[0])
    return filtered.some(v => String(v) !== first)
  }

  // Get price comparison data
  const priceComparison = useMemo(() => {
    const prices = products.map(p => p.price).filter((p): p is number => p !== null && p !== undefined)
    if (prices.length === 0) return null
    const minPrice = Math.min(...prices)
    const maxPrice = Math.max(...prices)
    return { minPrice, maxPrice }
  }, [products])

  // Get stock status styling
  const getStockStyle = (stock: number | null) => {
    if (stock === null || stock < 1) return 'bg-red-100 text-red-800'
    if (stock < 10) return 'bg-yellow-100 text-yellow-800'
    return 'bg-green-100 text-green-800'
  }

  // Get price style
  const getPriceStyle = (price: number | null, isLowest: boolean, isHighest: boolean) => {
    if (price === null || price === undefined) return ''
    if (isLowest) return 'bg-green-100 text-green-800 font-bold'
    if (isHighest) return 'bg-red-100 text-red-800 font-bold'
    return ''
  }

  const handleExportCSV = () => {
    if (products.length === 0) return

    const rows: any[] = []
    
    // Header row
    rows.push({
      Attribute: '',
      ...products.map((p, i) => `Product ${i + 1}`)
    })

    // Standard attributes
    const standardRows = [
      { Attribute: 'Product Name', ...products.map(p => p.product_name) },
      { Attribute: 'Manufacturer', ...products.map(p => p.manufacturer_name) },
      { Attribute: 'SKU', ...products.map(p => p.sku) },
      { Attribute: 'Price', ...products.map(p => p.price !== null ? `$${p.price.toFixed(2)}` : 'N/A') },
      { Attribute: 'Category', ...products.map(p => p.category || 'N/A') },
      { Attribute: 'Stock Quantity', ...products.map(p => p.stock_quantity !== null ? p.stock_quantity : 'N/A') },
      { Attribute: 'Description', ...products.map(p => p.description || 'N/A') },
    ]

    rows.push(...standardRows)

    // Custom attributes
    allCustomAttributes.forEach(attr => {
      rows.push({
        Attribute: attr,
        ...products.map(p => p.attributes_json?.[attr] !== undefined ? String(p.attributes_json[attr]) : '-')
      })
    })

    const csv = Papa.unparse(rows)
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `product_comparison_${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  if (loading && products.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-gray-600">Loading...</div>
      </div>
    )
  }

  // Empty state
  if (products.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <svg
              className="mx-auto h-16 w-16 text-gray-400 mb-4"
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
            <h2 className="text-2xl font-bold text-gray-900 mb-2">No Products to Compare</h2>
            <p className="text-gray-600 mb-6">
              Select products from the catalog and add them to comparison
            </p>
            <Link
              href="/retailer/products"
              className="inline-flex items-center px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-indigo-600 hover:bg-indigo-700"
            >
              Browse Products
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // Need at least 2 products
  if (products.length < 2) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Add More Products</h2>
            <p className="text-gray-600 mb-6">
              You need at least 2 products to compare. You currently have {products.length} product{products.length !== 1 ? 's' : ''}.
            </p>
            <Link
              href="/retailer/products"
              className="inline-flex items-center px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-indigo-600 hover:bg-indigo-700"
            >
              Browse Products
            </Link>
          </div>
        </div>
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
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              </li>
              <li>
                <Link href="/retailer/products" className="hover:text-gray-700">
                  Browse Products
                </Link>
              </li>
              <li>
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              </li>
              <li className="text-gray-900 font-medium">Compare</li>
            </ol>
          </nav>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-extrabold text-gray-900">Compare Products</h1>
              <p className="mt-2 text-sm text-gray-600">
                Side-by-side comparison of up to 4 products
              </p>
              <p className="mt-1 text-sm text-gray-500">
                Comparing {products.length} of {MAX_PRODUCTS} products
              </p>
            </div>
            <div className="flex gap-3">
              {products.length < MAX_PRODUCTS && (
                <Link
                  href="/retailer/products"
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Add Product
                </Link>
              )}
              <button
                onClick={handleClearAll}
                className="px-4 py-2 border border-red-300 rounded-md shadow-sm text-sm font-medium text-red-700 bg-white hover:bg-red-50"
              >
                Clear All
              </button>
            </div>
          </div>
        </div>

        {/* Comparison Table */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 sticky top-0 z-10">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky left-0 bg-gray-50 z-20 min-w-[200px]">
                    Attribute
                  </th>
                  {products.map((product, index) => (
                    <th key={product.id} className="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[250px]">
                      <div className="relative">
                        <button
                          onClick={() => handleRemove(product.id)}
                          className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600"
                          title="Remove from comparison"
                        >
                          ×
                        </button>
                        <div className="space-y-2">
                          {/* Product Image */}
                          {product.image_urls && product.image_urls.length > 0 ? (
                            <img
                              src={product.image_urls[0]}
                              alt={product.product_name}
                              className="w-32 h-32 object-cover rounded mx-auto"
                            />
                          ) : (
                            <div className="w-32 h-32 bg-gray-200 rounded mx-auto flex items-center justify-center text-gray-400 text-2xl font-bold">
                              {product.product_name[0]?.toUpperCase()}
                            </div>
                          )}
                          <div className="text-sm font-semibold text-gray-900">{product.product_name}</div>
                          <Link
                            href={`/retailer/products/${product.id}`}
                            className="inline-block text-xs text-indigo-600 hover:text-indigo-800"
                          >
                            View Details →
                          </Link>
                        </div>
                      </div>
                    </th>
                  ))}
                  {/* Empty columns for remaining slots */}
                  {Array.from({ length: MAX_PRODUCTS - products.length }).map((_, i) => (
                    <th key={`empty-${i}`} className="px-6 py-4 text-center text-xs font-medium text-gray-400 uppercase tracking-wider min-w-[250px] border-l border-dashed border-gray-300">
                      <div className="py-16">
                        <Link
                          href="/retailer/products"
                          className="inline-flex items-center px-4 py-2 border-2 border-dashed border-gray-300 rounded-md text-sm font-medium text-gray-400 hover:border-indigo-400 hover:text-indigo-600"
                        >
                          + Add Product
                        </Link>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {/* Product Name */}
                <tr className="bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-500 sticky left-0 bg-gray-50 z-10">
                    Product Name
                  </td>
                  {products.map((product) => (
                    <td key={product.id} className="px-6 py-4 text-center text-sm text-gray-900 font-semibold">
                      {product.product_name}
                    </td>
                  ))}
                  {Array.from({ length: MAX_PRODUCTS - products.length }).map((_, i) => (
                    <td key={`empty-${i}`} className="px-6 py-4"></td>
                  ))}
                </tr>

                {/* Manufacturer */}
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-500 sticky left-0 bg-white z-10">
                    Manufacturer
                  </td>
                  {products.map((product) => (
                    <td key={product.id} className="px-6 py-4 text-center text-sm text-gray-900">
                      {product.manufacturer_name}
                    </td>
                  ))}
                  {Array.from({ length: MAX_PRODUCTS - products.length }).map((_, i) => (
                    <td key={`empty-${i}`} className="px-6 py-4"></td>
                  ))}
                </tr>

                {/* SKU */}
                <tr className="bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-500 sticky left-0 bg-gray-50 z-10">
                    SKU
                  </td>
                  {products.map((product) => (
                    <td key={product.id} className="px-6 py-4 text-center text-sm text-gray-900">
                      {product.sku}
                    </td>
                  ))}
                  {Array.from({ length: MAX_PRODUCTS - products.length }).map((_, i) => (
                    <td key={`empty-${i}`} className="px-6 py-4"></td>
                  ))}
                </tr>

                {/* Price */}
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-500 sticky left-0 bg-white z-10">
                    Price
                  </td>
                  {products.map((product) => {
                    const isLowest = priceComparison && product.price === priceComparison.minPrice
                    const isHighest = priceComparison && product.price === priceComparison.maxPrice
                    const priceStyle = getPriceStyle(product.price, isLowest, isHighest)
                    const values = products.map(p => p.price)
                    const differs = valuesDiffer(values)

                    return (
                      <td
                        key={product.id}
                        className={`px-6 py-4 text-center text-sm ${priceStyle} ${differs && !priceStyle ? 'bg-yellow-50' : ''}`}
                      >
                        {product.price !== null ? `$${product.price.toFixed(2)}` : 'N/A'}
                        {priceComparison && product.price !== null && (
                          <div className="text-xs mt-1">
                            {isLowest && <span className="text-green-600">Lowest</span>}
                            {isHighest && <span className="text-red-600">Highest</span>}
                            {!isLowest && !isHighest && product.price !== null && priceComparison.minPrice !== null && (
                              <span className="text-gray-500">
                                +${(product.price - priceComparison.minPrice).toFixed(2)} vs lowest
                              </span>
                            )}
                          </div>
                        )}
                      </td>
                    )
                  })}
                  {Array.from({ length: MAX_PRODUCTS - products.length }).map((_, i) => (
                    <td key={`empty-${i}`} className="px-6 py-4"></td>
                  ))}
                </tr>

                {/* Category */}
                <tr className="bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-500 sticky left-0 bg-gray-50 z-10">
                    Category
                  </td>
                  {products.map((product) => {
                    const values = products.map(p => p.category)
                    const differs = valuesDiffer(values)
                    return (
                      <td
                        key={product.id}
                        className={`px-6 py-4 text-center text-sm text-gray-900 ${differs ? 'bg-yellow-50' : ''}`}
                      >
                        {product.category || 'N/A'}
                      </td>
                    )
                  })}
                  {Array.from({ length: MAX_PRODUCTS - products.length }).map((_, i) => (
                    <td key={`empty-${i}`} className="px-6 py-4"></td>
                  ))}
                </tr>

                {/* Stock Quantity */}
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-500 sticky left-0 bg-white z-10">
                    Stock Quantity
                  </td>
                  {products.map((product) => {
                    const stockStyle = getStockStyle(product.stock_quantity)
                    return (
                      <td
                        key={product.id}
                        className={`px-6 py-4 text-center text-sm ${stockStyle} rounded`}
                      >
                        {product.stock_quantity !== null ? product.stock_quantity : 'N/A'}
                      </td>
                    )
                  })}
                  {Array.from({ length: MAX_PRODUCTS - products.length }).map((_, i) => (
                    <td key={`empty-${i}`} className="px-6 py-4"></td>
                  ))}
                </tr>

                {/* Description */}
                <tr className="bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-500 sticky left-0 bg-gray-50 z-10">
                    Description
                  </td>
                  {products.map((product) => (
                    <td key={product.id} className="px-6 py-4 text-sm text-gray-900 max-w-xs">
                      <div className="line-clamp-3">{product.description || 'N/A'}</div>
                    </td>
                  ))}
                  {Array.from({ length: MAX_PRODUCTS - products.length }).map((_, i) => (
                    <td key={`empty-${i}`} className="px-6 py-4"></td>
                  ))}
                </tr>

                {/* Custom Attributes Section */}
                {allCustomAttributes.length > 0 && (
                  <>
                    <tr className="bg-indigo-50">
                      <td colSpan={MAX_PRODUCTS + 1} className="px-6 py-3 text-sm font-bold text-indigo-900 sticky left-0 bg-indigo-50 z-10">
                        Custom Attributes
                      </td>
                    </tr>
                    {allCustomAttributes.map((attr) => {
                      const values = products.map(p => p.attributes_json?.[attr])
                      const differs = valuesDiffer(values)
                      return (
                        <tr key={attr} className={allCustomAttributes.indexOf(attr) % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-500 sticky left-0 bg-inherit z-10 capitalize">
                            {attr.replace(/_/g, ' ')}
                          </td>
                          {products.map((product) => {
                            const value = product.attributes_json?.[attr]
                            return (
                              <td
                                key={product.id}
                                className={`px-6 py-4 text-center text-sm text-gray-900 ${differs ? 'bg-yellow-50' : ''}`}
                              >
                                {value !== undefined && value !== null ? String(value) : '-'}
                              </td>
                            )
                          })}
                          {Array.from({ length: MAX_PRODUCTS - products.length }).map((_, i) => (
                            <td key={`empty-${i}`} className="px-6 py-4"></td>
                          ))}
                        </tr>
                      )
                    })}
                  </>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Bulk Actions */}
        <div className="mt-8 bg-white rounded-xl shadow-lg p-6">
          <div className="flex flex-wrap gap-4 justify-center">
            <button
              onClick={handleExportCSV}
              className="px-6 py-3 bg-indigo-600 text-white rounded-md font-medium hover:bg-indigo-700 transition-colors"
            >
              Download Comparison as CSV
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
