'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Papa from 'papaparse'
import { supabase } from '@/utils/supabase'

type Manufacturer = {
  id: string
  company_name: string
  industry: string
  product_count: number
  sample_products: any[]
}

type StandardField = 'sku' | 'product_name' | 'category' | 'description' | 'price' | 'stock_quantity'

type SelectedAttributes = {
  standard: Set<StandardField>
  custom: Set<string>
}

type ExportFormat = 'csv' | 'json'

export default function RetailerBrowsePage() {
  const router = useRouter()
  const [retailerId, setRetailerId] = useState<string | null>(null)
  const [manufacturers, setManufacturers] = useState<Manufacturer[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedManufacturers, setSelectedManufacturers] = useState<Set<string>>(new Set())
  const [selectedAttributes, setSelectedAttributes] = useState<SelectedAttributes>({
    standard: new Set(['sku', 'product_name']),
    custom: new Set(),
  })
  const [expandedManufacturers, setExpandedManufacturers] = useState<Set<string>>(new Set())
  const [exportFormat, setExportFormat] = useState<ExportFormat>('csv')
  const [downloading, setDownloading] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [customAttributes, setCustomAttributes] = useState<Map<string, Set<string>>>(new Map())

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
    if (retailerId) {
      fetchManufacturers()
    }
  }, [retailerId])

  useEffect(() => {
    if (selectedManufacturers.size > 0) {
      fetchCustomAttributes()
    } else {
      setCustomAttributes(new Map())
    }
  }, [selectedManufacturers])

  const fetchManufacturers = async () => {
    if (!retailerId) return

    try {
      setLoading(true)
      setError(null)

      // Get accessible manufacturers from retailer_data_access
      const { data: accessData, error: accessError } = await supabase
        .from('retailer_data_access')
        .select('manufacturer_id')
        .eq('retailer_id', retailerId)
        .eq('access_granted', true)

      if (accessError) {
        setError('Failed to fetch manufacturer access data')
        setLoading(false)
        return
      }

      if (!accessData || accessData.length === 0) {
        setManufacturers([])
        setLoading(false)
        return
      }

      const manufacturerIds = accessData.map(a => a.manufacturer_id)

      // Get manufacturer details
      const { data: manufacturerData, error: mfgError } = await supabase
        .from('manufacturers')
        .select('id, company_name, industry')
        .in('id', manufacturerIds)

      if (mfgError || !manufacturerData) {
        setError('Failed to fetch manufacturer details')
        setLoading(false)
        return
      }

      // Get product counts and samples for each manufacturer
      const manufacturersWithProducts: Manufacturer[] = await Promise.all(
        manufacturerData.map(async (mfg) => {
          const { data: products, error: productsError } = await supabase
            .from('product_data')
            .select('*')
            .eq('manufacturer_id', mfg.id)
            .limit(3)

          const { count, error: countError } = await supabase
            .from('product_data')
            .select('*', { count: 'exact', head: true })
            .eq('manufacturer_id', mfg.id)

          return {
            id: mfg.id,
            company_name: mfg.company_name,
            industry: mfg.industry || 'Not specified',
            product_count: count || 0,
            sample_products: products || [],
          }
        })
      )

      setManufacturers(manufacturersWithProducts)
    } catch (err) {
      setError('An error occurred while fetching data')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const fetchCustomAttributes = async () => {
    if (!retailerId || selectedManufacturers.size === 0) return

    try {
      const { data: products, error } = await supabase
        .from('product_data')
        .select('manufacturer_id, attributes_json')
        .in('manufacturer_id', Array.from(selectedManufacturers))
        .not('attributes_json', 'is', null)

      if (error) {
        console.error('Error fetching custom attributes:', error)
        return
      }

      const attributesMap = new Map<string, Set<string>>()

      products?.forEach((product) => {
        if (product.attributes_json && typeof product.attributes_json === 'object') {
          const attrs = product.attributes_json as Record<string, any>
          const manufacturerId = product.manufacturer_id

          if (!attributesMap.has(manufacturerId)) {
            attributesMap.set(manufacturerId, new Set())
          }

          Object.keys(attrs).forEach((key) => {
            attributesMap.get(manufacturerId)!.add(key)
          })
        }
      })

      setCustomAttributes(attributesMap)
    } catch (err) {
      console.error('Error processing custom attributes:', err)
    }
  }

  const toggleManufacturerSelection = (manufacturerId: string) => {
    const newSelected = new Set(selectedManufacturers)
    if (newSelected.has(manufacturerId)) {
      newSelected.delete(manufacturerId)
    } else {
      newSelected.add(manufacturerId)
    }
    setSelectedManufacturers(newSelected)
  }

  const toggleExpanded = (manufacturerId: string) => {
    const newExpanded = new Set(expandedManufacturers)
    if (newExpanded.has(manufacturerId)) {
      newExpanded.delete(manufacturerId)
    } else {
      newExpanded.add(manufacturerId)
    }
    setExpandedManufacturers(newExpanded)
  }

  const toggleStandardAttribute = (field: StandardField) => {
    if (field === 'sku' || field === 'product_name') return // Required fields

    const newStandard = new Set(selectedAttributes.standard)
    if (newStandard.has(field)) {
      newStandard.delete(field)
    } else {
      newStandard.add(field)
    }
    setSelectedAttributes({ ...selectedAttributes, standard: newStandard })
  }

  const toggleCustomAttribute = (attribute: string) => {
    const newCustom = new Set(selectedAttributes.custom)
    if (newCustom.has(attribute)) {
      newCustom.delete(attribute)
    } else {
      newCustom.add(attribute)
    }
    setSelectedAttributes({ ...selectedAttributes, custom: newCustom })
  }

  const allCustomAttributes = useMemo(() => {
    const all = new Set<string>()
    customAttributes.forEach((attrs) => {
      attrs.forEach((attr) => all.add(attr))
    })
    return Array.from(all).sort()
  }, [customAttributes])

  const generateFilename = () => {
    if (selectedManufacturers.size === 0) return 'products'
    const manufacturerNames = manufacturers
      .filter((m) => selectedManufacturers.has(m.id))
      .map((m) => m.company_name.replace(/[^a-zA-Z0-9]/g, '_'))
      .join('_')
    const date = new Date().toISOString().split('T')[0]
    return `products_${manufacturerNames}_${date}.${exportFormat}`
  }

  const handleDownload = async () => {
    if (!retailerId || selectedManufacturers.size === 0) return

    setDownloading(true)
    setError(null)
    setSuccessMessage(null)

    try {
      // Fetch all products for selected manufacturers
      const { data: products, error: productsError } = await supabase
        .from('product_data')
        .select('*')
        .in('manufacturer_id', Array.from(selectedManufacturers))

      if (productsError) {
        setError('Failed to fetch products: ' + productsError.message)
        setDownloading(false)
        return
      }

      if (!products || products.length === 0) {
        setError('No products found for selected manufacturers')
        setDownloading(false)
        return
      }

      const filename = generateFilename()
      let blob: Blob
      let mimeType: string

      if (exportFormat === 'csv') {
        // Generate CSV
        const csvRows: any[] = products.map((product) => {
          const row: any = {}

          // Add standard fields
          selectedAttributes.standard.forEach((field) => {
            row[field] = product[field] || ''
          })

          // Add custom attributes as separate columns
          selectedAttributes.custom.forEach((attr) => {
            const attrs = product.attributes_json as Record<string, any> | null
            row[attr] = (attrs && attrs[attr]) || ''
          })

          return row
        })

        const csv = Papa.unparse(csvRows)
        blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
        mimeType = 'text/csv'
      } else {
        // Generate JSON
        const jsonData = {
          export_date: new Date().toISOString(),
          manufacturers: manufacturers
            .filter((m) => selectedManufacturers.has(m.id))
            .map((m) => m.company_name),
          total_products: products.length,
          products: products.map((product) => {
            const productObj: any = {}

            // Add standard fields
            selectedAttributes.standard.forEach((field) => {
              if (product[field] !== null && product[field] !== undefined) {
                productObj[field] = product[field]
              }
            })

            // Add custom attributes
            const customAttrs: Record<string, any> = {}
            selectedAttributes.custom.forEach((attr) => {
              const attrs = product.attributes_json as Record<string, any> | null
              if (attrs && attrs[attr] !== null && attrs[attr] !== undefined) {
                customAttrs[attr] = attrs[attr]
              }
            })

            if (Object.keys(customAttrs).length > 0) {
              productObj.custom_attributes = customAttrs
            }

            return productObj
          }),
        }

        blob = new Blob([JSON.stringify(jsonData, null, 2)], { type: 'application/json' })
        mimeType = 'application/json'
      }

      // Create download record
      await supabase.from('data_exports').insert({
        retailer_id: retailerId,
        export_format: exportFormat,
        filename: filename,
      })

      // Trigger browser download
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      setSuccessMessage(`Successfully downloaded ${products.length} products!`)
      setTimeout(() => setSuccessMessage(null), 5000)
    } catch (err: any) {
      setError('Failed to generate download: ' + (err.message || 'Unknown error'))
    } finally {
      setDownloading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-gray-600">Loading...</div>
      </div>
    )
  }

  if (!retailerId) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900">Browse Product Catalogs</h1>
          <p className="mt-2 text-sm text-gray-600">Select manufacturers and download their product catalogs</p>
        </div>

        {error && (
          <div className="mb-6 rounded-md bg-red-50 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-red-800">{error}</p>
              </div>
            </div>
          </div>
        )}

        {successMessage && (
          <div className="mb-6 rounded-md bg-green-50 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-green-800">{successMessage}</p>
              </div>
            </div>
          </div>
        )}

        {/* Access Status Card */}
        <div className="mb-8 bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Your Access</h2>
              <p className="mt-1 text-sm text-gray-600">
                You have access to <span className="font-semibold text-indigo-600">{manufacturers.length}</span>{' '}
                manufacturer{manufacturers.length !== 1 ? 's' : ''}
              </p>
            </div>
            {manufacturers.length === 0 && (
              <Link
                href="/retailer"
                className="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700"
              >
                Request Access
              </Link>
            )}
          </div>
        </div>

        {manufacturers.length === 0 ? (
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
            <h3 className="mt-4 text-lg font-medium text-gray-900">No Manufacturer Access</h3>
            <p className="mt-2 text-sm text-gray-500">
              You don't have access to any manufacturer catalogs yet. Request access from manufacturers to browse their
              products.
            </p>
            <div className="mt-6">
              <Link
                href="/retailer"
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
              >
                Go to Dashboard
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Manufacturer Cards */}
            <div className="lg:col-span-2 space-y-4">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Select Manufacturers</h2>
              {manufacturers.map((manufacturer) => (
                <div key={manufacturer.id} className="bg-white rounded-xl shadow-lg p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4 flex-1">
                      <input
                        type="checkbox"
                        checked={selectedManufacturers.has(manufacturer.id)}
                        onChange={() => toggleManufacturerSelection(manufacturer.id)}
                        className="mt-1 h-5 w-5 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      />
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900">{manufacturer.company_name}</h3>
                        <p className="text-sm text-gray-600 mt-1">{manufacturer.industry}</p>
                        <div className="mt-2">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                            {manufacturer.product_count} product{manufacturer.product_count !== 1 ? 's' : ''}
                          </span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => toggleExpanded(manufacturer.id)}
                      className="ml-4 text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                    >
                      {expandedManufacturers.has(manufacturer.id) ? 'Hide Preview' : 'Preview Products'}
                    </button>
                  </div>

                  {expandedManufacturers.has(manufacturer.id) && manufacturer.sample_products.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <h4 className="text-sm font-medium text-gray-900 mb-2">Sample Products:</h4>
                      <div className="space-y-2">
                        {manufacturer.sample_products.map((product, idx) => (
                          <div key={idx} className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                            <span className="font-medium">{product.product_name || product.sku}</span>
                            {product.sku && <span className="text-gray-500 ml-2">({product.sku})</span>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Attribute Selection & Download Panel */}
            <div className="lg:col-span-1">
              {selectedManufacturers.size > 0 ? (
                <div className="bg-white rounded-xl shadow-lg p-6 sticky top-8">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Download Options</h2>

                  {/* Standard Fields */}
                  <div className="mb-6">
                    <h3 className="text-sm font-semibold text-gray-900 mb-3">Standard Fields</h3>
                    <div className="space-y-2">
                      {(['sku', 'product_name', 'category', 'description', 'price', 'stock_quantity'] as StandardField[]).map(
                        (field) => {
                          const isRequired = field === 'sku' || field === 'product_name'
                          const isChecked = selectedAttributes.standard.has(field)
                          return (
                            <label key={field} className="flex items-center">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                disabled={isRequired}
                                onChange={() => toggleStandardAttribute(field)}
                                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded disabled:opacity-50"
                              />
                              <span className={`ml-2 text-sm ${isRequired ? 'text-gray-500' : 'text-gray-700'}`}>
                                {field.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                                {isRequired && ' (Required)'}
                              </span>
                            </label>
                          )
                        }
                      )}
                    </div>
                  </div>

                  {/* Custom Attributes */}
                  {allCustomAttributes.length > 0 && (
                    <div className="mb-6">
                      <h3 className="text-sm font-semibold text-gray-900 mb-3">Custom Attributes</h3>
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {allCustomAttributes.map((attr) => (
                          <label key={attr} className="flex items-center">
                            <input
                              type="checkbox"
                              checked={selectedAttributes.custom.has(attr)}
                              onChange={() => toggleCustomAttribute(attr)}
                              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                            />
                            <span className="ml-2 text-sm text-gray-700">{attr}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Format Selector */}
                  <div className="mb-6">
                    <label className="block text-sm font-semibold text-gray-900 mb-2">Format</label>
                    <select
                      value={exportFormat}
                      onChange={(e) => setExportFormat(e.target.value as ExportFormat)}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    >
                      <option value="csv">CSV</option>
                      <option value="json">JSON</option>
                    </select>
                  </div>

                  {/* Filename Preview */}
                  <div className="mb-6">
                    <label className="block text-sm font-semibold text-gray-900 mb-2">Filename</label>
                    <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded border border-gray-200 break-all">
                      {generateFilename()}
                    </div>
                  </div>

                  {/* Download Button */}
                  <button
                    onClick={handleDownload}
                    disabled={downloading}
                    className="w-full px-4 py-3 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    {downloading ? (
                      <>
                        <svg
                          className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                        Generating...
                      </>
                    ) : (
                      'Generate Download'
                    )}
                  </button>
                </div>
              ) : (
                <div className="bg-white rounded-xl shadow-lg p-6 text-center">
                  <p className="text-sm text-gray-500">Select at least one manufacturer to configure download options</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
