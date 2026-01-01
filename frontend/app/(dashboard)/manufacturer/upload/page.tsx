'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Papa from 'papaparse'
import { supabase } from '@/utils/supabase'

type Phase = 'upload' | 'mapping' | 'preview' | 'conflict' | 'uploading' | 'complete'
type ConflictStrategy = 'update' | 'skip' | 'create_new'
type StandardField = 'sku' | 'product_name' | 'category' | 'description' | 'price' | 'stock_quantity' | 'image_urls' | null

type ColumnMapping = {
  csvColumn: string
  mappedField: StandardField
  includeInAttributes: boolean
}

type UploadStats = {
  filename: string
  size: number
  rowCount: number
}

type ConflictInfo = {
  csvRow: number
  sku: string
  existingProduct: any
  newData: any
}

const STANDARD_FIELDS: { value: StandardField; label: string; required: boolean }[] = [
  { value: 'sku', label: 'SKU (Required)', required: true },
  { value: 'product_name', label: 'Product Name (Required)', required: true },
  { value: 'category', label: 'Category', required: false },
  { value: 'description', label: 'Description', required: false },
  { value: 'price', label: 'Price', required: false },
  { value: 'stock_quantity', label: 'Stock Quantity', required: false },
  { value: 'image_urls', label: 'Image URLs (comma-separated)', required: false },
  { value: null, label: '-- Ignore Column --', required: false },
]

const AUTO_MATCH_RULES: Record<string, StandardField> = {
  'sku': 'sku', 'product_id': 'sku', 'item_code': 'sku', 'product_code': 'sku', 'item_id': 'sku',
  'name': 'product_name', 'product_name': 'product_name', 'title': 'product_name', 'item_name': 'product_name', 'product_title': 'product_name', 'product': 'product_name',
  'category': 'category', 'product_category': 'category', 'type': 'category', 'product_type': 'category', 'group': 'category',
  'description': 'description', 'desc': 'description', 'details': 'description', 'product_description': 'description',
  'price': 'price', 'cost': 'price', 'retail_price': 'price', 'unit_price': 'price',
  'stock': 'stock_quantity', 'stock_quantity': 'stock_quantity', 'quantity': 'stock_quantity', 'qty': 'stock_quantity', 'inventory': 'stock_quantity',
  'image_urls': 'image_urls', 'image_url': 'image_urls', 'images': 'image_urls', 'image': 'image_urls', 'photo': 'image_urls', 'photos': 'image_urls', 'picture': 'image_urls', 'pictures': 'image_urls',
}

function autoMatchColumn(columnName: string): StandardField {
  const normalized = columnName.toLowerCase().trim().replace(/[_\s-]/g, '_')
  return AUTO_MATCH_RULES[normalized] || null
}

export default function ManufacturerUploadPage() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [phase, setPhase] = useState<Phase>('upload')
  const [userId, setUserId] = useState<string | null>(null)
  const [uploadStats, setUploadStats] = useState<UploadStats | null>(null)
  const [csvData, setCsvData] = useState<any[]>([])
  const [csvHeaders, setCsvHeaders] = useState<string[]>([])
  const [columnMappings, setColumnMappings] = useState<ColumnMapping[]>([])
  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 })
  const [uploadResults, setUploadResults] = useState({ success: 0, updated: 0, skipped: 0, errors: [] as string[] })
  const [isDragging, setIsDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [conflicts, setConflicts] = useState<ConflictInfo[]>([])
  const [conflictStrategy, setConflictStrategy] = useState<ConflictStrategy>('update')
  const [showConflictDetails, setShowConflictDetails] = useState(false)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
          router.push('/manufacturer/login')
          return
        }

        const { data: manufacturer, error: mfgError } = await supabase
          .from('manufacturers')
          .select('id, company_name')
          .eq('id', user.id)
          .single()

        if (mfgError || !manufacturer) {
          alert('Access denied. This page is for manufacturers only.')
          router.push('/manufacturer/login')
          return
        }

        setUserId(user.id)
      } catch (error) {
        router.push('/manufacturer/login')
      }
    }
    checkAuth()
  }, [router])

  const handleFileSelect = async (file: File) => {
    if (!file.name.endsWith('.csv')) {
      setError('Please upload a CSV file only')
      return
    }

    setError(null)
    setUploadStats({ filename: file.name, size: file.size, rowCount: 0 })

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.data.length === 0) {
          setError('CSV file is empty.')
          return
        }

        const headers = Object.keys(results.data[0] as object)
        const data = results.data as any[]

        setCsvHeaders(headers)
        setCsvData(data)
        setUploadStats(prev => prev ? { ...prev, rowCount: data.length } : null)

        const mappings: ColumnMapping[] = headers.map(header => ({
          csvColumn: header,
          mappedField: autoMatchColumn(header),
          includeInAttributes: false,
        }))

        setColumnMappings(mappings)
        setPhase('mapping')
      },
      error: (error) => {
        setError(`Error parsing CSV: ${error.message}`)
      },
    })
  }

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true) }
  const handleDragLeave = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(false) }
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFileSelect(file)
  }
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFileSelect(file)
  }

  const updateMapping = (csvColumn: string, mappedField: StandardField) => {
    setColumnMappings(prev =>
      prev.map(mapping =>
        mapping.csvColumn === csvColumn
          ? { ...mapping, mappedField, includeInAttributes: mappedField === null ? mapping.includeInAttributes : false }
          : mapping
      )
    )
  }

  const toggleIncludeInAttributes = (csvColumn: string) => {
    setColumnMappings(prev =>
      prev.map(mapping =>
        mapping.csvColumn === csvColumn
          ? { ...mapping, includeInAttributes: !mapping.includeInAttributes }
          : mapping
      )
    )
  }

  const validateMappings = (): string | null => {
    const skuMapped = columnMappings.some(m => m.mappedField === 'sku')
    const productNameMapped = columnMappings.some(m => m.mappedField === 'product_name')
    if (!skuMapped) return 'SKU field must be mapped'
    if (!productNameMapped) return 'Product Name field must be mapped'
    return null
  }

  const handlePreview = async () => {
    const validationError = validateMappings()
    if (validationError) {
      setError(validationError)
      return
    }

    if (!userId) return

    setError(null)
    const skuColumn = columnMappings.find(m => m.mappedField === 'sku')?.csvColumn
    if (!skuColumn) return

    const skusToCheck = csvData.map(row => row[skuColumn]).filter(Boolean)
    
    const { data: existingProducts } = await supabase
      .from('product_data')
      .select('*')
      .eq('manufacturer_id', userId)
      .in('sku', skusToCheck)

    if (existingProducts && existingProducts.length > 0) {
      const conflictList: ConflictInfo[] = []
      csvData.forEach((row, index) => {
        const sku = row[skuColumn]
        const existing = existingProducts.find(p => p.sku === sku)
        if (existing) {
          const newData: any = {}
          columnMappings.forEach(mapping => {
            if (mapping.mappedField) {
              newData[mapping.mappedField] = row[mapping.csvColumn]
            }
          })
          conflictList.push({
            csvRow: index + 2,
            sku: sku,
            existingProduct: existing,
            newData: newData
          })
        }
      })
      setConflicts(conflictList)
      setPhase('conflict')
    } else {
      setPhase('preview')
    }
  }

  const handleUpload = async () => {
    if (!userId) return

    setPhase('uploading')
    setUploadProgress({ current: 0, total: csvData.length })

    const errors: string[] = []
    let successCount = 0
    let updatedCount = 0
    let skippedCount = 0

    for (let i = 0; i < csvData.length; i++) {
      const row = csvData[i]
      setUploadProgress({ current: i + 1, total: csvData.length })

      try {
        const standardFields: any = { manufacturer_id: userId }
        const attributesJson: any = {}

        columnMappings.forEach(mapping => {
          const value = row[mapping.csvColumn]
          if (mapping.mappedField) {
            if (mapping.mappedField === 'price' && value) {
              standardFields[mapping.mappedField] = parseFloat(String(value).replace(/[^0-9.-]/g, ''))
            } else if (mapping.mappedField === 'stock_quantity' && value) {
              standardFields[mapping.mappedField] = parseInt(String(value).replace(/[^0-9]/g, ''), 10)
            } else if (mapping.mappedField === 'image_urls' && value) {
              // Parse comma or semicolon separated URLs into an array
              const urls = String(value)
                .split(/[,;]/)
                .map(url => url.trim())
                .filter(url => url.length > 0)
              if (urls.length > 0) {
                standardFields[mapping.mappedField] = urls
              }
            } else if (value) {
              standardFields[mapping.mappedField] = String(value).trim()
            }
          } else if (mapping.includeInAttributes && value) {
            attributesJson[mapping.csvColumn] = String(value).trim()
          }
        })

        if (Object.keys(attributesJson).length > 0) {
          standardFields.attributes_json = attributesJson
        }

        const { data: existing } = await supabase
          .from('product_data')
          .select('id')
          .eq('manufacturer_id', userId)
          .eq('sku', standardFields.sku)
          .maybeSingle()

        if (existing) {
          if (conflictStrategy === 'skip') {
            skippedCount++
          } else if (conflictStrategy === 'update') {
            await supabase
              .from('product_data')
              .update(standardFields)
              .eq('id', existing.id)
            updatedCount++
          } else {
            standardFields.sku = `${standardFields.sku}_${Date.now()}`
            await supabase.from('product_data').insert(standardFields)
            successCount++
          }
        } else {
          await supabase.from('product_data').insert(standardFields)
          successCount++
        }
      } catch (err: any) {
        errors.push(`Row ${i + 2}: ${err.message}`)
      }
    }

    setUploadResults({ success: successCount, updated: updatedCount, skipped: skippedCount, errors })
    setPhase('complete')
  }

  const getMappedRowsPreview = () => {
    return csvData.slice(0, 5).map(row => {
      const mappedRow: any = {}
      const attributes: any = {}
      columnMappings.forEach(mapping => {
        const value = row[mapping.csvColumn]
        if (mapping.mappedField) {
          if (mapping.mappedField === 'image_urls' && value) {
            // Show comma-separated URLs in preview
            const urls = String(value).split(/[,;]/).map(url => url.trim()).filter(url => url.length > 0)
            mappedRow[mapping.mappedField] = urls.join(', ')
          } else {
            mappedRow[mapping.mappedField] = value
          }
        } else if (mapping.includeInAttributes && value) {
          attributes[mapping.csvColumn] = value
        }
      })
      return { mappedRow, attributes }
    })
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB'
  }

  const requiredFieldsMapped = () => {
    return columnMappings.some(m => m.mappedField === 'sku') && 
           columnMappings.some(m => m.mappedField === 'product_name')
  }

  if (!userId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <div className="text-gray-600">Verifying authentication...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-extrabold text-gray-900">Upload Product Catalog</h1>
            <p className="mt-2 text-sm text-gray-600">Import your products via CSV with intelligent column mapping</p>
          </div>

          {error && (
            <div className="mb-6 rounded-md bg-red-50 p-4 border border-red-200">
              <div className="flex">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <div className="ml-3 flex-1"><p className="text-sm font-medium text-red-800">{error}</p></div>
                <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-600">×</button>
              </div>
            </div>
          )}

          {/* UPLOAD PHASE */}
          {phase === 'upload' && (
            <div className="space-y-6">
              <div
                className={`border-2 border-dashed rounded-lg p-12 text-center transition-all ${
                  isDragging ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300 hover:border-gray-400'
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <svg className="mx-auto h-16 w-16 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                  <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <div className="mt-6">
                  <label htmlFor="file-upload" className="cursor-pointer">
                    <span className="text-lg font-medium text-gray-900">
                      Drag and drop your CSV file here, or <span className="text-indigo-600 hover:text-indigo-500 underline">browse</span>
                    </span>
                    <span className="mt-2 block text-sm text-gray-500">CSV files only</span>
                  </label>
                  <input
                    ref={fileInputRef}
                    id="file-upload"
                    type="file"
                    accept=".csv"
                    className="sr-only"
                    onChange={handleFileInputChange}
                  />
                </div>
              </div>
            </div>
          )}

          {/* MAPPING PHASE */}
          {phase === 'mapping' && uploadStats && (
            <div className="space-y-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold mb-2">File: {uploadStats.filename}</h3>
                <p className="text-sm text-gray-600">{uploadStats.rowCount} rows • {formatFileSize(uploadStats.size)}</p>
              </div>

              <div className="space-y-3">
                {columnMappings.map((mapping, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-center space-x-3">
                      <span className="font-medium w-48">{mapping.csvColumn}</span>
                      <span>→</span>
                      <select
                        value={mapping.mappedField || ''}
                        onChange={(e) => updateMapping(mapping.csvColumn, e.target.value as StandardField)}
                        className="flex-1 rounded border-gray-300"
                      >
                        {STANDARD_FIELDS.map(f => (
                          <option key={f.value || 'null'} value={f.value || ''}>{f.label}</option>
                        ))}
                      </select>
                    </div>
                    {!mapping.mappedField && (
                      <div className="mt-2 ml-52">
                        <input
                          type="checkbox"
                          checked={mapping.includeInAttributes}
                          onChange={() => toggleIncludeInAttributes(mapping.csvColumn)}
                          className="mr-2"
                        />
                        <label className="text-sm">Include in attributes_json</label>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex justify-end space-x-4">
                <button
                  onClick={() => setPhase('upload')}
                  className="px-4 py-2 border rounded text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePreview}
                  disabled={!requiredFieldsMapped()}
                  className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50"
                >
                  Preview Data
                </button>
              </div>
            </div>
          )}

          {/* CONFLICT PHASE */}
          {phase === 'conflict' && (
            <div className="space-y-6">
              <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-6">
                <h3 className="text-lg font-bold text-yellow-900">⚠️ Duplicate Products Found</h3>
                <p className="mt-2 text-sm text-yellow-800">
                  Found {conflicts.length} product(s) with existing SKUs. Choose how to handle:
                </p>
              </div>

              <div className="space-y-4">
                <label className={`flex p-4 border-2 rounded-lg cursor-pointer ${conflictStrategy === 'update' ? 'border-indigo-600 bg-indigo-50' : 'border-gray-200'}`}>
                  <input type="radio" name="strategy" value="update" checked={conflictStrategy === 'update'} onChange={(e) => setConflictStrategy(e.target.value as ConflictStrategy)} className="mt-1" />
                  <div className="ml-3">
                    <span className="font-semibold">Update Existing Products</span>
                    <p className="text-sm text-gray-600">Replace data with new values</p>
                  </div>
                </label>

                <label className={`flex p-4 border-2 rounded-lg cursor-pointer ${conflictStrategy === 'skip' ? 'border-indigo-600 bg-indigo-50' : 'border-gray-200'}`}>
                  <input type="radio" name="strategy" value="skip" checked={conflictStrategy === 'skip'} onChange={(e) => setConflictStrategy(e.target.value as ConflictStrategy)} className="mt-1" />
                  <div className="ml-3">
                    <span className="font-semibold">Skip Duplicates</span>
                    <p className="text-sm text-gray-600">Keep existing, add new only</p>
                  </div>
                </label>

                <label className={`flex p-4 border-2 rounded-lg cursor-pointer ${conflictStrategy === 'create_new' ? 'border-indigo-600 bg-indigo-50' : 'border-gray-200'}`}>
                  <input type="radio" name="strategy" value="create_new" checked={conflictStrategy === 'create_new'} onChange={(e) => setConflictStrategy(e.target.value as ConflictStrategy)} className="mt-1" />
                  <div className="ml-3">
                    <span className="font-semibold">Create New Products</span>
                    <p className="text-sm text-gray-600">Create with modified SKUs</p>
                  </div>
                </label>
              </div>

              <div className="flex justify-between">
                <button onClick={() => setPhase('mapping')} className="px-4 py-2 border rounded">Back</button>
                <button onClick={() => setPhase('preview')} className="px-6 py-2 bg-indigo-600 text-white rounded">Continue</button>
              </div>
            </div>
          )}

          {/* PREVIEW PHASE */}
          {phase === 'preview' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold">Preview (First 5 rows)</h3>
              <div className="overflow-x-auto border rounded">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      {columnMappings.filter(m => m.mappedField).map(m => (
                        <th key={m.mappedField} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{m.mappedField}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y">
                    {getMappedRowsPreview().map((row, i) => (
                      <tr key={i}>
                        {columnMappings.filter(m => m.mappedField).map(m => (
                          <td key={m.mappedField} className="px-6 py-4 text-sm">{row.mappedRow[m.mappedField!] || '-'}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-between">
                <button onClick={() => setPhase(conflicts.length > 0 ? 'conflict' : 'mapping')} className="px-4 py-2 border rounded">Back</button>
                <button onClick={handleUpload} className="px-6 py-2 bg-green-600 text-white rounded">Confirm and Upload</button>
              </div>
            </div>
          )}

          {/* UPLOADING PHASE */}
          {phase === 'uploading' && (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto mb-4"></div>
              <div className="text-xl font-semibold">Uploading... {uploadProgress.current} / {uploadProgress.total}</div>
              <div className="mt-4 w-full bg-gray-200 rounded-full h-3 max-w-xl mx-auto">
                <div className="bg-indigo-600 h-3 rounded-full transition-all" style={{ width: `${(uploadProgress.current / uploadProgress.total) * 100}%` }} />
              </div>
            </div>
          )}

          {/* COMPLETE PHASE */}
          {phase === 'complete' && (
            <div className="space-y-6">
              <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-green-800">✅ Upload Complete!</h3>
              </div>

              <div className="grid grid-cols-4 gap-4">
                <div className="text-center p-4 bg-white border rounded">
                  <div className="text-3xl font-bold text-green-600">{uploadResults.success}</div>
                  <div className="text-sm text-gray-600">New</div>
                </div>
                <div className="text-center p-4 bg-white border rounded">
                  <div className="text-3xl font-bold text-blue-600">{uploadResults.updated}</div>
                  <div className="text-sm text-gray-600">Updated</div>
                </div>
                <div className="text-center p-4 bg-white border rounded">
                  <div className="text-3xl font-bold text-yellow-600">{uploadResults.skipped}</div>
                  <div className="text-sm text-gray-600">Skipped</div>
                </div>
                <div className="text-center p-4 bg-white border rounded">
                  <div className="text-3xl font-bold text-red-600">{uploadResults.errors.length}</div>
                  <div className="text-sm text-gray-600">Errors</div>
                </div>
              </div>

              <div className="flex justify-between">
                <button
                  onClick={() => {
                    setPhase('upload')
                    setCsvData([])
                    setColumnMappings([])
                    setUploadStats(null)
                    setConflicts([])
                    setUploadResults({ success: 0, updated: 0, skipped: 0, errors: [] })
                    if (fileInputRef.current) fileInputRef.current.value = ''
                  }}
                  className="px-6 py-2 border rounded"
                >
                  Upload Another File
                </button>
                <button onClick={() => router.push('/manufacturer')} className="px-6 py-2 bg-indigo-600 text-white rounded">
                  Go to Dashboard
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
