'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/utils/supabase'
import { 
  ArrowDownTrayIcon, 
  DocumentArrowDownIcon,
  FolderIcon,
  ClockIcon,
  PencilIcon,
  TrashIcon,
  PlayIcon,
  XMarkIcon,
  ChevronRightIcon,
  ChevronLeftIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline'

interface Manufacturer {
  id: string
  company_name: string
}

interface DownloadProfile {
  id: string
  name: string
  manufacturer_id: string | null
  product_ids: string[] | null
  selected_attributes: string[]
  include_images: boolean
  include_documents: boolean
  format: 'csv' | 'json'
  created_at: string
}

interface DownloadHistory {
  id: string
  filename: string
  file_size: number
  format: string
  created_at: string
  download_url?: string
}

const ALL_ATTRIBUTES = [
  { key: 'id', label: 'ID', group: 'basic' },
  { key: 'product_name', label: 'Product Name', group: 'basic' },
  { key: 'sku', label: 'SKU', group: 'basic' },
  { key: 'price', label: 'Price', group: 'basic' },
  { key: 'category', label: 'Category', group: 'basic' },
  { key: 'description', label: 'Description', group: 'basic' },
  { key: 'brand', label: 'Brand', group: 'basic' },
  { key: 'manufacturer_name', label: 'Manufacturer Name', group: 'basic' },
  { key: 'subcategory', label: 'Subcategory', group: 'details' },
  { key: 'material', label: 'Material', group: 'details' },
  { key: 'size', label: 'Size', group: 'details' },
  { key: 'upc', label: 'UPC', group: 'details' },
  { key: 'country_of_origin', label: 'Country of Origin', group: 'details' },
  { key: 'stock', label: 'Stock', group: 'details' },
  { key: 'rating', label: 'Rating', group: 'marketing' },
  { key: 'image_url', label: 'Image URL', group: 'marketing' },
  { key: 'hero_ingredient', label: 'Hero Ingredient', group: 'marketing' },
  { key: 'launch_year', label: 'Launch Year', group: 'marketing' },
]

const DEFAULT_ATTRIBUTES = ['id', 'product_name', 'sku', 'price', 'category', 'description', 'brand', 'manufacturer_name']

export default function RetailerDownloadsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  
  // Step 1: Product Selection
  const [selectionMode, setSelectionMode] = useState<'manufacturer' | 'individual'>('manufacturer')
  const [manufacturers, setManufacturers] = useState<Manufacturer[]>([])
  const [selectedManufacturer, setSelectedManufacturer] = useState<string>('')
  const [selectedProducts, setSelectedProducts] = useState<string[]>([])
  const [selectedProductsCount, setSelectedProductsCount] = useState(0)
  
  // Step 2: Attributes - Show all possible attributes (static list)
  const ALL_POSSIBLE_ATTRIBUTES = [
    'id', 'product_name', 'sku', 'price', 'category', 'description', 
    'brand', 'manufacturer_id', 'manufacturer_name', 'subcategory', 
    'material', 'size', 'upc', 'country_of_origin', 'stock_quantity', 
    'stock', 'rating', 'image_url', 'image_urls', 'hero_ingredient', 
    'launch_year', 'attributes_json'
  ]
  const [availableAttributes] = useState<string[]>(ALL_POSSIBLE_ATTRIBUTES)
  const [selectedAttributes, setSelectedAttributes] = useState<string[]>([])
  
  // Step 3: Additional Content
  const [includeImages, setIncludeImages] = useState(false)
  const [includeDocuments, setIncludeDocuments] = useState(false)
  
  // Step 4: Format
  const [format, setFormat] = useState<'csv' | 'json'>('csv')
  
  // Wizard Step
  const [currentStep, setCurrentStep] = useState(1)
  const totalSteps = 4
  
  // Saved Profiles
  const [savedProfiles, setSavedProfiles] = useState<DownloadProfile[]>([])
  const [showSaveProfileModal, setShowSaveProfileModal] = useState(false)
  const [profileName, setProfileName] = useState('')
  
  // Download History
  const [downloadHistory, setDownloadHistory] = useState<DownloadHistory[]>([])
  
  // UI State
  const [downloading, setDownloading] = useState(false)
  const [downloadProgress, setDownloadProgress] = useState<{
    show: boolean
    progress: number
    status: 'preparing' | 'downloading' | 'processing' | 'complete'
    message: string
  }>({
    show: false,
    progress: 0,
    status: 'preparing',
    message: 'Preparing download...'
  })
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [showProductBrowser, setShowProductBrowser] = useState(false)

  useEffect(() => {
    initializePage()
  }, [])

  // Auto-select common attributes when component mounts
  useEffect(() => {
    if (selectedAttributes.length === 0 && availableAttributes.length > 0) {
      const commonAttrs = ['id', 'product_name', 'sku', 'price', 'category', 'description', 'brand']
      setSelectedAttributes(commonAttrs.filter(attr => availableAttributes.includes(attr)))
    }
  }, [availableAttributes, selectedAttributes.length])

  const initializePage = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/retailer/login')
        return
      }
      setUserId(user.id)
      
      await Promise.all([
        fetchManufacturers(user.id),
        fetchSavedProfiles(user.id),
        fetchDownloadHistory(user.id)
      ])
    } catch (error) {
      console.error('Error initializing page:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchManufacturers = async (retailerId: string) => {
    try {
      // Get accessible manufacturers
      const { data: accessData } = await supabase
        .from('retailer_data_access')
        .select('manufacturer_id')
        .eq('retailer_id', retailerId)
        .eq('access_granted', true)

      if (!accessData || accessData.length === 0) {
        setManufacturers([])
        return
      }

      const manufacturerIds = accessData.map(a => a.manufacturer_id)
      const { data: manufacturersData } = await supabase
        .from('manufacturers')
        .select('id, company_name')
        .in('id', manufacturerIds)
        .order('company_name')

      setManufacturers(manufacturersData || [])
    } catch (error) {
      console.error('Error fetching manufacturers:', error)
    }
  }

  const fetchSavedProfiles = async (retailerId: string) => {
    try {
      const { data, error } = await supabase
        .from('download_profiles')
        .select('*')
        .eq('retailer_id', retailerId)
        .order('created_at', { ascending: false })

      if (error) throw error
      setSavedProfiles(data || [])
    } catch (error) {
      console.error('Error fetching profiles:', error)
    }
  }

  const fetchDownloadHistory = async (retailerId: string) => {
    try {
      const { data, error } = await supabase
        .from('download_history')
        .select('*')
        .eq('retailer_id', retailerId)
        .order('created_at', { ascending: false })
        .limit(10)

      if (error) {
        console.error('Error fetching download history:', error)
        // Don't throw, just log - history is optional
        return
      }
      setDownloadHistory(data || [])
    } catch (error) {
      console.error('Error fetching download history:', error)
      // Don't throw - history is optional
    }
  }

  const handleAttributeToggle = (attributeKey: string) => {
    setSelectedAttributes(prev => {
      if (prev.includes(attributeKey)) {
        return prev.filter(a => a !== attributeKey)
      } else {
        return [...prev, attributeKey]
      }
    })
  }

  const getAttributeLabel = (key: string): string => {
    const attr = ALL_ATTRIBUTES.find(a => a.key === key)
    return attr ? attr.label : key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  }

  const getAttributeGroupName = (key: string): string => {
    const attr = ALL_ATTRIBUTES.find(a => a.key === key)
    if (!attr) return 'other'
    if (attr.group === 'basic') return 'Basic Information'
    if (attr.group === 'details') return 'Product Details'
    if (attr.group === 'marketing') return 'Marketing & Media'
    return 'Other'
  }

  const handleSelectAllAttributes = () => {
    if (selectedAttributes.length === availableAttributes.length) {
      setSelectedAttributes([])
    } else {
      setSelectedAttributes([...availableAttributes])
    }
  }

  const handleNextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const canProceedToStep2 = () => {
    if (selectionMode === 'manufacturer') {
      return !!selectedManufacturer
    } else {
      return selectedProducts.length > 0
    }
  }

  const canProceedToStep3 = () => {
    return selectedAttributes.length > 0
  }

  // Group available attributes by their group
  const groupedAttributes = availableAttributes.reduce((acc, key) => {
    const attr = ALL_ATTRIBUTES.find(a => a.key === key)
    // Use the predefined group, or infer from key name, or default to 'other'
    let group = attr?.group || 'other'
    
    // Infer group from attribute key if not in ALL_ATTRIBUTES
    if (!attr) {
      if (['id', 'product_name', 'sku', 'price', 'category', 'description', 'brand', 'manufacturer_id', 'manufacturer_name'].includes(key)) {
        group = 'basic'
      } else if (['subcategory', 'material', 'size', 'upc', 'country_of_origin', 'stock', 'stock_quantity'].includes(key)) {
        group = 'details'
      } else if (['rating', 'image_url', 'image_urls', 'hero_ingredient', 'launch_year'].includes(key)) {
        group = 'marketing'
      } else {
        group = 'other'
      }
    }
    
    if (!acc[group]) acc[group] = []
    acc[group].push(key)
    return acc
  }, {} as Record<string, string[]>)
  
  // Sort groups in display order
  const groupOrder = ['basic', 'details', 'marketing', 'other']
  const sortedGroupedAttributes = Object.entries(groupedAttributes).sort(([a], [b]) => {
    const indexA = groupOrder.indexOf(a)
    const indexB = groupOrder.indexOf(b)
    if (indexA === -1 && indexB === -1) return 0
    if (indexA === -1) return 1
    if (indexB === -1) return -1
    return indexA - indexB
  })

  const handleSaveProfile = async () => {
    if (!profileName.trim() || !userId) {
      setMessage({ type: 'error', text: 'Profile name is required' })
      return
    }

    try {
      const { error } = await supabase
        .from('download_profiles')
        .insert({
          retailer_id: userId,
          name: profileName,
          manufacturer_id: selectionMode === 'manufacturer' ? selectedManufacturer : null,
          product_ids: selectionMode === 'individual' && selectedProducts.length > 0 ? selectedProducts : null,
          selected_attributes: selectedAttributes,
          include_images: includeImages,
          include_documents: includeDocuments,
          format: format
        })

      if (error) throw error

      setMessage({ type: 'success', text: 'Profile saved successfully!' })
      setShowSaveProfileModal(false)
      setProfileName('')
      await fetchSavedProfiles(userId)
      setTimeout(() => setMessage(null), 3000)
    } catch (error: any) {
      console.error('Error saving profile:', error)
      setMessage({ type: 'error', text: 'Failed to save profile: ' + (error.message || 'Unknown error') })
    }
  }

  const handleLoadProfile = (profile: DownloadProfile) => {
    setSelectionMode(profile.manufacturer_id ? 'manufacturer' : 'individual')
    setSelectedManufacturer(profile.manufacturer_id || '')
    setSelectedProducts(profile.product_ids || [])
    setSelectedAttributes(profile.selected_attributes)
    setIncludeImages(profile.include_images)
    setIncludeDocuments(profile.include_documents)
    setFormat(profile.format)
    setMessage({ type: 'success', text: 'Profile loaded successfully!' })
    setTimeout(() => setMessage(null), 3000)
  }

  const handleRunProfile = async (profile: DownloadProfile) => {
    handleLoadProfile(profile)
    // Small delay to ensure state is updated
    setTimeout(() => {
      handleDownload()
    }, 100)
  }

  const handleDeleteProfile = async (profileId: string) => {
    if (!confirm('Are you sure you want to delete this profile?')) return

    try {
      const { error } = await supabase
        .from('download_profiles')
        .delete()
        .eq('id', profileId)

      if (error) throw error
      await fetchSavedProfiles(userId!)
      setMessage({ type: 'success', text: 'Profile deleted successfully!' })
      setTimeout(() => setMessage(null), 3000)
    } catch (error: any) {
      console.error('Error deleting profile:', error)
      setMessage({ type: 'error', text: 'Failed to delete profile' })
    }
  }

  const handleDownload = async () => {
    if (!userId) {
      setMessage({ type: 'error', text: 'Please log in to download' })
      return
    }

    if (selectionMode === 'manufacturer' && !selectedManufacturer) {
      setMessage({ type: 'error', text: 'Please select a manufacturer' })
      return
    }

    if (selectionMode === 'individual' && selectedProducts.length === 0) {
      setMessage({ type: 'error', text: 'Please select at least one product' })
      return
    }

    if (selectedAttributes.length === 0) {
      setMessage({ type: 'error', text: 'Please select at least one attribute' })
      return
    }

    setDownloading(true)
    setMessage(null)
    
    // Show progress overlay
    setDownloadProgress({
      show: true,
      progress: 0,
      status: 'preparing',
      message: 'Preparing download...'
    })

    try {
      // Get session token for authentication
      const { data: { session } } = await supabase.auth.getSession()
      const accessToken = session?.access_token

      // Update progress
      setDownloadProgress(prev => ({
        ...prev,
        progress: 10,
        status: 'downloading',
        message: includeImages 
          ? 'Downloading products and images...' 
          : 'Generating download file...'
      }))

      const response = await fetch('/api/downloads/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken && { 'Authorization': `Bearer ${accessToken}` }),
        },
        credentials: 'include',
        body: JSON.stringify({
          selection_mode: selectionMode,
          manufacturer_id: selectionMode === 'manufacturer' ? selectedManufacturer : undefined,
          product_ids: selectionMode === 'individual' ? selectedProducts : undefined,
          attributes: selectedAttributes,
          include_images: includeImages,
          include_documents: includeDocuments,
          format: format
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(errorData.error || 'Failed to generate download')
      }

      // Update progress
      setDownloadProgress(prev => ({
        ...prev,
        progress: 70,
        status: 'processing',
        message: 'Processing download file...'
      }))

      // Get filename from Content-Disposition header
      const contentDisposition = response.headers.get('Content-Disposition')
      const filename = contentDisposition
        ? contentDisposition.split('filename=')[1]?.replace(/"/g, '') || 'download.zip'
        : 'download.zip'

      // Download the blob
      const blob = await response.blob()
      
      // Update progress
      setDownloadProgress(prev => ({
        ...prev,
        progress: 90,
        status: 'processing',
        message: 'Finalizing download...'
      }))

      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      // Complete
      setDownloadProgress(prev => ({
        ...prev,
        progress: 100,
        status: 'complete',
        message: 'Download complete!'
      }))

      await fetchDownloadHistory(userId)
      
      // Show success message
      setMessage({ 
        type: 'success', 
        text: `Download completed successfully! File: ${filename}` 
      })
      
      // Hide progress after a delay, or user can close it
      setTimeout(() => {
        setDownloadProgress(prev => ({ ...prev, show: false }))
      }, 2000)
      
    } catch (error: any) {
      console.error('Error generating download:', error)
      setDownloadProgress(prev => ({ ...prev, show: false }))
      setMessage({ type: 'error', text: error.message || 'Failed to generate download' })
    } finally {
      setDownloading(false)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  const getAttributeGroup = (group: string) => {
    const labels: Record<string, string> = {
      basic: 'Basic Info',
      details: 'Details',
      marketing: 'Marketing'
    }
    return labels[group] || group
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading downloads...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Download Progress Overlay */}
      {downloadProgress.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {downloadProgress.status === 'complete' ? 'Download Complete!' : 'Downloading...'}
              </h3>
              {(downloadProgress.status === 'complete' || downloadProgress.status === 'preparing') && (
                <button
                  onClick={() => setDownloadProgress(prev => ({ ...prev, show: false }))}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              )}
            </div>
            
            <div className="mb-4">
              <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${
                    downloadProgress.status === 'complete' 
                      ? 'bg-green-500' 
                      : downloadProgress.status === 'processing'
                      ? 'bg-blue-500'
                      : 'bg-indigo-500'
                  }`}
                  style={{ width: `${downloadProgress.progress}%` }}
                />
              </div>
              <p className="text-sm text-gray-600 mt-2 text-center">
                {downloadProgress.message}
              </p>
              {downloadProgress.status !== 'complete' && downloadProgress.status !== 'preparing' && (
                <p className="text-xs text-gray-500 mt-1 text-center">
                  {downloadProgress.progress}% complete
                </p>
              )}
            </div>

            {downloadProgress.status === 'complete' && (
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mb-3">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="text-sm text-gray-700 mb-4">
                  Your download has been saved to your computer.
                </p>
                <button
                  onClick={() => setDownloadProgress(prev => ({ ...prev, show: false }))}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  Close
                </button>
              </div>
            )}

            {downloadProgress.status !== 'complete' && (
              <div className="text-center">
                <p className="text-xs text-gray-500">
                  Please wait while we prepare your download{includeImages ? ' and download images' : ''}...
                </p>
              </div>
            )}
          </div>
        </div>
      )}

    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <ArrowDownTrayIcon className="w-8 h-8 text-indigo-600" />
            <span>Downloads</span>
          </h1>
          <p className="text-gray-600 mt-2">
            Download product catalogs, images, and specifications in your preferred format
          </p>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div className={`rounded-lg p-4 ${
          message.type === 'success' 
            ? 'bg-green-50 border border-green-200 text-green-800' 
            : 'bg-red-50 border border-red-200 text-red-800'
        }`}>
          {message.text}
        </div>
      )}

      {/* Download Configuration Card */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Download Configuration</h2>

        {/* Wizard Step Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {[1, 2, 3, 4].map((step) => (
              <div key={step} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${
                      currentStep === step
                        ? 'bg-indigo-600 border-indigo-600 text-white'
                        : currentStep > step
                        ? 'bg-green-500 border-green-500 text-white'
                        : 'bg-white border-gray-300 text-gray-400'
                    }`}
                  >
                    {currentStep > step ? (
                      <CheckCircleIcon className="w-6 h-6" />
                    ) : (
                      <span className="font-semibold">{step}</span>
                    )}
                  </div>
                  <span className={`text-xs mt-2 ${
                    currentStep === step ? 'text-indigo-600 font-medium' : 'text-gray-500'
                  }`}>
                    {step === 1 && 'Products'}
                    {step === 2 && 'Attributes'}
                    {step === 3 && 'Options'}
                    {step === 4 && 'Format'}
                  </span>
                </div>
                {step < 4 && (
                  <div
                    className={`h-0.5 flex-1 mx-2 ${
                      currentStep > step ? 'bg-green-500' : 'bg-gray-300'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step 1: Select Products */}
        {currentStep === 1 && (
        <div className="mb-8">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Step 1: Select Products</h3>
          <div className="space-y-4">
            <label className="flex items-center">
              <input
                type="radio"
                name="selectionMode"
                checked={selectionMode === 'manufacturer'}
                onChange={() => {
                  setSelectionMode('manufacturer')
                  setSelectedProducts([])
                }}
                className="mr-3"
              />
              <span className="text-gray-700">All products from manufacturer</span>
            </label>
            {selectionMode === 'manufacturer' && (
              <div className="ml-6">
                <select
                  value={selectedManufacturer}
                  onChange={(e) => {
                    const newManufacturerId = e.target.value
                    console.log('🏭 Manufacturer selection changed:', {
                      oldValue: selectedManufacturer,
                      newValue: newManufacturerId,
                      selectedOption: manufacturers.find(m => m.id === newManufacturerId)
                    })
                    setSelectedManufacturer(newManufacturerId)
                  }}
                  className="w-full md:w-64 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Select Manufacturer</option>
                  {manufacturers.map(mfg => (
                    <option key={mfg.id} value={mfg.id}>{mfg.company_name} ({mfg.id})</option>
                  ))}
                </select>
                {selectedManufacturer && (
                  <p className="mt-2 text-sm text-gray-500">
                    Selected: {manufacturers.find(m => m.id === selectedManufacturer)?.company_name || selectedManufacturer}
                  </p>
                )}
              </div>
            )}

            <label className="flex items-center">
              <input
                type="radio"
                name="selectionMode"
                checked={selectionMode === 'individual'}
                onChange={() => {
                  setSelectionMode('individual')
                  setSelectedManufacturer('')
                }}
                className="mr-3"
              />
              <span className="text-gray-700">Individual products</span>
            </label>
            {selectionMode === 'individual' && (
              <div className="ml-6">
                <button
                  onClick={() => setShowProductBrowser(true)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                >
                  Browse Products ({selectedProducts.length} selected)
                </button>
              </div>
            )}
          </div>
          <div className="flex justify-end mt-6">
            <button
              onClick={handleNextStep}
              disabled={!canProceedToStep2()}
              className={`px-6 py-2 rounded-lg flex items-center gap-2 ${
                canProceedToStep2()
                  ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              Next
              <ChevronRightIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
        )}

        {/* Step 2: Select Attributes */}
        {currentStep === 2 && (
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900">Step 2: Select Attributes</h3>
            {availableAttributes.length > 0 && (
              <button
                onClick={handleSelectAllAttributes}
                className="text-sm text-indigo-600 hover:text-indigo-800"
              >
                {selectedAttributes.length === availableAttributes.length ? 'Deselect All' : 'Select All'}
              </button>
            )}
          </div>
          
          {availableAttributes.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No attributes available</p>
            </div>
          ) : (
            <>
              <p className="text-sm text-gray-600 mb-4">
                {selectedAttributes.length} of {availableAttributes.length} attributes selected
              </p>
              
              {/* Grouped Attributes */}
              {sortedGroupedAttributes.length > 0 ? (
                sortedGroupedAttributes.map(([group, attributes]) => (
                  <div key={group} className="mb-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">
                      {getAttributeGroupName(attributes[0])}
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                      {attributes.map(attrKey => (
                        <label key={attrKey} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={selectedAttributes.includes(attrKey)}
                            onChange={() => handleAttributeToggle(attrKey)}
                            className="mr-2"
                          />
                          <span className="text-sm text-gray-700">{getAttributeLabel(attrKey)}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-gray-500">
                  <p>No attributes found. Attributes will be discovered from the selected products.</p>
                </div>
              )}
            </>
          )}
          <div className="flex justify-between mt-6">
            <button
              onClick={handlePreviousStep}
              className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 flex items-center gap-2"
            >
              <ChevronLeftIcon className="w-5 h-5" />
              Previous
            </button>
            <button
              onClick={handleNextStep}
              disabled={!canProceedToStep3()}
              className={`px-6 py-2 rounded-lg flex items-center gap-2 ${
                canProceedToStep3()
                  ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              Next
              <ChevronRightIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
        )}

        {/* Step 3: Additional Content */}
        {currentStep === 3 && (
        <div className="mb-8">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Step 3: Additional Content</h3>
          <div className="space-y-3">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={includeImages}
                onChange={(e) => setIncludeImages(e.target.checked)}
                className="mr-3"
              />
              <span className="text-gray-700">Include product images (ZIP)</span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={includeDocuments}
                onChange={(e) => setIncludeDocuments(e.target.checked)}
                className="mr-3"
              />
              <span className="text-gray-700">Include documents (PDF, docs)</span>
            </label>
          </div>
          <div className="flex justify-between mt-6">
            <button
              onClick={handlePreviousStep}
              className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 flex items-center gap-2"
            >
              <ChevronLeftIcon className="w-5 h-5" />
              Previous
            </button>
            <button
              onClick={handleNextStep}
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2"
            >
              Next
              <ChevronRightIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
        )}

        {/* Step 4: Format */}
        {currentStep === 4 && (
        <div className="mb-8">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Step 4: Format & Download</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className={`cursor-pointer border-2 rounded-lg p-4 ${
              format === 'csv' ? 'border-indigo-600 bg-indigo-50' : 'border-gray-200'
            }`}>
              <input
                type="radio"
                name="format"
                value="csv"
                checked={format === 'csv'}
                onChange={(e) => setFormat(e.target.value as 'csv' | 'json')}
                className="mr-2"
              />
              <span className="font-medium text-gray-900">CSV</span>
              <p className="text-sm text-gray-600 mt-1">Excel-compatible format</p>
            </label>
            <label className={`cursor-pointer border-2 rounded-lg p-4 ${
              format === 'json' ? 'border-indigo-600 bg-indigo-50' : 'border-gray-200'
            }`}>
              <input
                type="radio"
                name="format"
                value="json"
                checked={format === 'json'}
                onChange={(e) => setFormat(e.target.value as 'csv' | 'json')}
                className="mr-2"
              />
              <span className="font-medium text-gray-900">JSON</span>
              <p className="text-sm text-gray-600 mt-1">Developer-friendly format</p>
            </label>
          </div>
          <div className="flex justify-between mt-6">
            <button
              onClick={handlePreviousStep}
              className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 flex items-center gap-2"
            >
              <ChevronLeftIcon className="w-5 h-5" />
              Previous
            </button>
            <div className="flex gap-4">
              <button
                onClick={() => setShowSaveProfileModal(true)}
                className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
              >
                <FolderIcon className="w-5 h-5" />
                Save Profile
              </button>
              <button
                onClick={handleDownload}
                disabled={downloading}
                className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2"
              >
                {downloading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Generating...
                  </>
                ) : (
                  <>
                    <ArrowDownTrayIcon className="w-5 h-5" />
                Download Now
              </>
            )}
          </button>
            </div>
          </div>
        </div>
        )}
      </div>

      {/* Saved Profiles */}
      {savedProfiles.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Saved Download Profiles</h2>
          <div className="space-y-3">
            {savedProfiles.map(profile => (
              <div key={profile.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900">{profile.name}</h3>
                  <p className="text-sm text-gray-600">
                    {profile.selected_attributes.length} attributes • {profile.format.toUpperCase()} • 
                    {profile.include_images && ' Images'} {profile.include_documents && ' Documents'}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleRunProfile(profile)}
                    className="p-2 text-indigo-600 hover:bg-indigo-50 rounded"
                    title="Run"
                  >
                    <PlayIcon className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleLoadProfile(profile)}
                    className="p-2 text-gray-600 hover:bg-gray-100 rounded"
                    title="Edit"
                  >
                    <PencilIcon className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleDeleteProfile(profile.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded"
                    title="Delete"
                  >
                    <TrashIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Download History */}
      {downloadHistory.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <ClockIcon className="w-6 h-6" />
            Recent Downloads
          </h2>
          <div className="space-y-3">
            {downloadHistory.map(item => (
              <div key={item.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900">{item.filename}</h3>
                  <p className="text-sm text-gray-600">
                    {formatFileSize(item.file_size)} • {item.format.toUpperCase()} • {new Date(item.created_at).toLocaleDateString()}
                  </p>
                </div>
                {item.download_url && (
                  <a
                    href={item.download_url}
                    download
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2"
                  >
                    <ArrowDownTrayIcon className="w-4 h-4" />
                    Download Again
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Save Profile Modal */}
      {showSaveProfileModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">Save Download Profile</h2>
              <button
                onClick={() => setShowSaveProfileModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Profile Name
              </label>
              <input
                type="text"
                value={profileName}
                onChange={(e) => setProfileName(e.target.value)}
                placeholder="e.g., Beiersdorf Full Catalog"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveProfile()
                }}
              />
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowSaveProfileModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveProfile}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Product Browser Modal - Simplified placeholder */}
      {showProductBrowser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">Select Products</h2>
              <button
                onClick={() => setShowProductBrowser(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
            <p className="text-gray-600 mb-4">
              Product browser functionality would be implemented here. For now, you can use the manufacturer selection mode.
            </p>
            <div className="flex justify-end">
              <button
                onClick={() => {
                  setShowProductBrowser(false)
                  setSelectionMode('manufacturer')
                }}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                Use Manufacturer Mode Instead
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </>
  )
}
