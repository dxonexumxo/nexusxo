'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/utils/supabase'
import { uploadProductImage, deleteProductImage } from '@/utils/imageUpload'
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
  attributes_json: Record<string, any> | null
  image_urls: string[] | null
  created_at: string
  updated_at: string | null
  manufacturer_id: string
}

type CustomAttribute = {
  key: string
  value: string
}

type Tab = 'images' | 'basic' | 'attributes' | 'priceHistory' | 'history'

type ImagePreview = {
  file: File
  preview: string
  uploading: boolean
  progress: number
}

export default function ManufacturerProductDetailPage() {
  const params = useParams()
  const router = useRouter()
  const productId = params?.id as string

  const [userId, setUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [product, setProduct] = useState<Product | null>(null)
  const [categories, setCategories] = useState<string[]>([])
  const [activeTab, setActiveTab] = useState<Tab>('images')
  const [saving, setSaving] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [showSuccessToast, setShowSuccessToast] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [images, setImages] = useState<string[]>([])
  const [imagePreviews, setImagePreviews] = useState<ImagePreview[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [showImageDeleteModal, setShowImageDeleteModal] = useState(false)
  const [imageToDelete, setImageToDelete] = useState<string | null>(null)
  const [lightboxImage, setLightboxImage] = useState<string | null>(null)
  const [lightboxIndex, setLightboxIndex] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Form state
  const [formData, setFormData] = useState({
    product_name: '',
    sku: '',
    category: '',
    description: '',
    price: '',
    stock_quantity: '',
  })
  const [customAttributes, setCustomAttributes] = useState<CustomAttribute[]>([])
  const [newAttribute, setNewAttribute] = useState({ key: '', value: '' })
  const [isDirty, setIsDirty] = useState(false)
  const [originalData, setOriginalData] = useState<any>(null)

  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Price history state
  const [priceHistory, setPriceHistory] = useState<PriceHistoryEntry[]>([])
  const [priceHistoryLoading, setPriceHistoryLoading] = useState(false)
  const [priceHistoryError, setPriceHistoryError] = useState<string | null>(null)
  const [priceHistoryTimeRange, setPriceHistoryTimeRange] = useState<number | null>(null) // null = all time

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
    if (userId && productId) {
      fetchProduct()
      fetchCategories()
    }
  }, [userId, productId])

  useEffect(() => {
    if (activeTab === 'priceHistory' && productId && !priceHistoryLoading) {
      fetchPriceHistory()
    }
  }, [activeTab, productId])

  // Cleanup preview URLs on unmount
  useEffect(() => {
    return () => {
      imagePreviews.forEach((preview) => {
        URL.revokeObjectURL(preview.preview)
      })
    }
  }, [])

  // Keyboard handlers for lightbox
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!lightboxImage) return

      if (e.key === 'Escape') {
        closeLightbox()
      } else if (e.key === 'ArrowLeft') {
        prevImage()
      } else if (e.key === 'ArrowRight') {
        nextImage()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [lightboxImage, images])

  const fetchProduct = async () => {
    if (!userId || !productId) return

    try {
      const { data, error: fetchError } = await supabase
        .from('product_data')
        .select('*')
        .eq('id', productId)
        .single()

      if (fetchError) {
        setError('Product not found')
        return
      }

      if (data.manufacturer_id !== userId) {
        setError('Unauthorized access to this product')
        router.push('/manufacturer/products')
        return
      }

      setProduct(data)
      setFormData({
        product_name: data.product_name || '',
        sku: data.sku || '',
        category: data.category || '',
        description: data.description || '',
        price: data.price?.toString() || '',
        stock_quantity: data.stock_quantity?.toString() || '',
      })

      // Set images
      setImages(data.image_urls || [])

      // Parse custom attributes
      const attrs = data.attributes_json || {}
      const attrArray: CustomAttribute[] = Object.entries(attrs).map(([key, value]) => ({
        key,
        value: String(value),
      }))
      setCustomAttributes(attrArray)

      setOriginalData({
        ...data,
        attributes_json: attrs,
      })
    } catch (err) {
      console.error('Error fetching product:', err)
      setError('Failed to load product')
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

  const fetchPriceHistory = async () => {
    if (!productId) return

    setPriceHistoryLoading(true)
    setPriceHistoryError(null)

    try {
      const history = await getProductPriceHistory(productId)
      console.log('Price history fetched:', history.length, 'entries for product', productId)
      setPriceHistory(history)
    } catch (err: any) {
      console.error('Error fetching price history:', err)
      setPriceHistoryError('Failed to load price history: ' + (err.message || 'Unknown error'))
    } finally {
      setPriceHistoryLoading(false)
    }
  }

  useEffect(() => {
    if (activeTab === 'priceHistory' && productId) {
      fetchPriceHistory()
    }
  }, [activeTab, productId])

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    setIsDirty(true)
    setErrors((prev) => ({ ...prev, [field]: '' }))
  }

  const handleAttributeChange = (index: number, field: 'key' | 'value', value: string) => {
    setCustomAttributes((prev) => {
      const updated = [...prev]
      updated[index][field] = value
      return updated
    })
    setIsDirty(true)
  }

  const handleAddAttribute = () => {
    if (!newAttribute.key.trim()) {
      setErrors((prev) => ({ ...prev, newAttribute: 'Attribute key is required' }))
      return
    }

    if (customAttributes.some((attr) => attr.key === newAttribute.key)) {
      setErrors((prev) => ({ ...prev, newAttribute: 'Attribute key already exists' }))
      return
    }

    setCustomAttributes((prev) => [...prev, { ...newAttribute }])
    setNewAttribute({ key: '', value: '' })
    setIsDirty(true)
    setErrors((prev) => ({ ...prev, newAttribute: '' }))
  }

  const handleRemoveAttribute = (index: number) => {
    setCustomAttributes((prev) => prev.filter((_, i) => i !== index))
    setIsDirty(true)
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.product_name.trim()) {
      newErrors.product_name = 'Product name is required'
    }

    if (!formData.sku.trim()) {
      newErrors.sku = 'SKU is required'
    }

    if (formData.price && isNaN(parseFloat(formData.price))) {
      newErrors.price = 'Price must be a valid number'
    } else if (formData.price && parseFloat(formData.price) < 0) {
      newErrors.price = 'Price must be positive'
    }

    if (formData.stock_quantity && isNaN(parseInt(formData.stock_quantity, 10))) {
      newErrors.stock_quantity = 'Stock quantity must be a valid integer'
    } else if (formData.stock_quantity && parseInt(formData.stock_quantity, 10) < 0) {
      newErrors.stock_quantity = 'Stock quantity must be non-negative'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSave = async () => {
    if (!validateForm() || !product || !userId) return

    setSaving(true)
    setError(null)

    try {
      // Build attributes JSON
      const attributesJson: Record<string, any> = {}
      customAttributes.forEach((attr) => {
        if (attr.key.trim()) {
          attributesJson[attr.key.trim()] = attr.value.trim()
        }
      })

      const updateData: any = {
        product_name: formData.product_name.trim(),
        category: formData.category.trim() || null,
        description: formData.description.trim() || null,
        price: formData.price ? parseFloat(formData.price) : null,
        stock_quantity: formData.stock_quantity ? parseInt(formData.stock_quantity, 10) : null,
        attributes_json: Object.keys(attributesJson).length > 0 ? attributesJson : null,
        updated_at: new Date().toISOString(),
      }

      const { error: updateError } = await supabase
        .from('product_data')
        .update(updateData)
        .eq('id', product.id)
        .eq('manufacturer_id', userId)

      if (updateError) {
        throw updateError
      }

      setIsDirty(false)
      setShowSuccessToast(true)
      setTimeout(() => setShowSuccessToast(false), 3000)
      fetchProduct() // Refresh data
    } catch (err: any) {
      console.error('Error saving product:', err)
      setError(err.message || 'Failed to save product')
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    if (product) {
      setFormData({
        product_name: product.product_name || '',
        sku: product.sku || '',
        category: product.category || '',
        description: product.description || '',
        price: product.price?.toString() || '',
        stock_quantity: product.stock_quantity?.toString() || '',
      })

      const attrs = product.attributes_json || {}
      const attrArray: CustomAttribute[] = Object.entries(attrs).map(([key, value]) => ({
        key,
        value: String(value),
      }))
      setCustomAttributes(attrArray)

      setIsDirty(false)
      setErrors({})
    }
  }

  const handleDelete = async () => {
    if (!product || !userId) return

    setDeleting(true)
    try {
      const { error: deleteError } = await supabase
        .from('product_data')
        .delete()
        .eq('id', product.id)
        .eq('manufacturer_id', userId)

      if (deleteError) {
        throw deleteError
      }

      router.push('/manufacturer/products')
    } catch (err: any) {
      console.error('Error deleting product:', err)
      setError(err.message || 'Failed to delete product')
      setDeleting(false)
      setShowDeleteModal(false)
    }
  }

  const handleFileSelect = (files: FileList | null) => {
    if (!files || files.length === 0) return

    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
    const maxSize = 5 * 1024 * 1024 // 5MB

    const newPreviews: ImagePreview[] = []

    Array.from(files).forEach((file) => {
      if (!validTypes.includes(file.type)) {
        setError(`Invalid file type: ${file.name}. Please upload JPG, PNG, WebP, or GIF.`)
        return
      }

      if (file.size > maxSize) {
        setError(`File too large: ${file.name}. Maximum size is 5MB.`)
        return
      }

      const preview = URL.createObjectURL(file)
      newPreviews.push({
        file,
        preview,
        uploading: false,
        progress: 0,
      })
    })

    setImagePreviews((prev) => [...prev, ...newPreviews])
    setError(null)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    handleFileSelect(e.dataTransfer.files)
  }

  const removePreview = (index: number) => {
    setImagePreviews((prev) => {
      const updated = [...prev]
      URL.revokeObjectURL(updated[index].preview)
      updated.splice(index, 1)
      return updated
    })
  }

  const handleUploadImages = async () => {
    if (!product || !userId || imagePreviews.length === 0) return

    const uploadedUrls: string[] = []
    const errors: string[] = []

    // Upload each image
    for (let i = 0; i < imagePreviews.length; i++) {
      setImagePreviews((prev) => {
        const updated = [...prev]
        updated[i].uploading = true
        updated[i].progress = 0
        return updated
      })

      try {
        const result = await uploadProductImage(imagePreviews[i].file, product.sku, userId)

        if (result.error) {
          errors.push(`${imagePreviews[i].file.name}: ${result.error}`)
          setImagePreviews((prev) => {
            const updated = [...prev]
            updated[i].uploading = false
            return updated
          })
        } else {
          uploadedUrls.push(result.url)
          setImagePreviews((prev) => {
            const updated = [...prev]
            updated[i].uploading = false
            updated[i].progress = 100
            return updated
          })
        }
      } catch (err: any) {
        errors.push(`${imagePreviews[i].file.name}: ${err.message}`)
        setImagePreviews((prev) => {
          const updated = [...prev]
          updated[i].uploading = false
          return updated
        })
      }
    }

    if (errors.length > 0) {
      setError(errors.join(', '))
    }

    // Update product with new image URLs
    if (uploadedUrls.length > 0) {
      const newImageUrls = [...images, ...uploadedUrls]

      const { error: updateError } = await supabase
        .from('product_data')
        .update({
          image_urls: newImageUrls,
          updated_at: new Date().toISOString(),
        })
        .eq('id', product.id)
        .eq('manufacturer_id', userId)

      if (updateError) {
        setError('Failed to update product images: ' + updateError.message)
      } else {
        setImages(newImageUrls)
        setImagePreviews([])
        setShowSuccessToast(true)
        setTimeout(() => setShowSuccessToast(false), 3000)
        fetchProduct()
      }
    }
  }

  const extractImagePath = (url: string): string => {
    // Extract path from URL: https://xxx.supabase.co/storage/v1/object/public/product-images/[path]
    const match = url.match(/product-images\/(.+)$/)
    return match ? match[1] : ''
  }

  const handleDeleteImage = async () => {
    if (!product || !userId || !imageToDelete) return

    const imagePath = extractImagePath(imageToDelete)

    if (!imagePath) {
      setError('Invalid image path')
      setShowImageDeleteModal(false)
      return
    }

    try {
      const success = await deleteProductImage(imagePath)

      if (!success) {
        throw new Error('Failed to delete image from storage')
      }

      // Remove from product's image_urls array
      const newImageUrls = images.filter((url) => url !== imageToDelete)

      const { error: updateError } = await supabase
        .from('product_data')
        .update({
          image_urls: newImageUrls.length > 0 ? newImageUrls : null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', product.id)
        .eq('manufacturer_id', userId)

      if (updateError) {
        throw updateError
      }

      setImages(newImageUrls)
      setShowImageDeleteModal(false)
      setImageToDelete(null)
      setShowSuccessToast(true)
      setTimeout(() => setShowSuccessToast(false), 3000)

      // Close lightbox if deleted image was being viewed
      if (lightboxImage === imageToDelete) {
        setLightboxImage(null)
      }
    } catch (err: any) {
      console.error('Error deleting image:', err)
      setError(err.message || 'Failed to delete image')
      setShowImageDeleteModal(false)
    }
  }

  const openLightbox = (url: string) => {
    setLightboxImage(url)
    setLightboxIndex(images.indexOf(url))
  }

  const closeLightbox = () => {
    setLightboxImage(null)
  }

  const nextImage = () => {
    if (lightboxImage && images.length > 0) {
      const currentIndex = images.indexOf(lightboxImage)
      const nextIndex = (currentIndex + 1) % images.length
      setLightboxImage(images[nextIndex])
      setLightboxIndex(nextIndex)
    }
  }

  const prevImage = () => {
    if (lightboxImage && images.length > 0) {
      const currentIndex = images.indexOf(lightboxImage)
      const prevIndex = (currentIndex - 1 + images.length) % images.length
      setLightboxImage(images[prevIndex])
      setLightboxIndex(prevIndex)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-gray-600">Loading...</div>
      </div>
    )
  }

  if (error && !product) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="bg-white rounded-xl shadow-lg p-8 text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Link
            href="/manufacturer/products"
            className="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700"
          >
            Back to Products
          </Link>
        </div>
      </div>
    )
  }

  if (!product) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <nav className="flex mb-4" aria-label="Breadcrumb">
            <ol className="flex items-center space-x-2 text-sm text-gray-500">
              <li>
                <Link href="/manufacturer/products" className="hover:text-gray-700">
                  Products
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
              <li className="text-gray-900 font-medium">{product.product_name}</li>
            </ol>
          </nav>

          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-extrabold text-gray-900">{product.product_name}</h1>
              <p className="mt-2 text-sm text-gray-600">SKU: {product.sku}</p>
            </div>
            <div className="flex space-x-3">
              <Link
                href="/manufacturer/products"
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Back to Products
              </Link>
              <button
                onClick={() => setShowDeleteModal(true)}
                className="px-4 py-2 border border-red-300 rounded-md text-sm font-medium text-red-700 hover:bg-red-50"
              >
                Delete Product
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-lg">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              {[
                { id: 'images', label: 'Product Images' },
                { id: 'basic', label: 'Basic Information' },
                { id: 'attributes', label: 'Custom Attributes' },
                { id: 'priceHistory', label: 'Price History' },
                { id: 'history', label: 'Product History' },
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
            {/* Tab 1: Product Images */}
            {activeTab === 'images' && (
              <div className="space-y-6">
                {/* Image Gallery */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Product Images</h3>
                  {images.length === 0 ? (
                    <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
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
                          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                      <p className="mt-2 text-sm text-gray-500">No images uploaded yet</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {images.map((url, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={url}
                            alt={`Product image ${index + 1}`}
                            className="w-full h-48 object-cover rounded-lg cursor-pointer"
                            onClick={() => openLightbox(url)}
                          />
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              setImageToDelete(url)
                              setShowImageDeleteModal(true)
                            }}
                            className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Upload Section */}
                <div className="border-t border-gray-200 pt-6">
                  <h4 className="text-sm font-medium text-gray-900 mb-4">Upload Images</h4>
                  
                  {/* Drag and Drop Zone */}
                  <div
                    className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                      isDragging ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300 hover:border-gray-400'
                    }`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                  >
                    <svg
                      className="mx-auto h-12 w-12 text-gray-400"
                      stroke="currentColor"
                      fill="none"
                      viewBox="0 0 48 48"
                    >
                      <path
                        d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <div className="mt-4">
                      <label htmlFor="image-upload" className="cursor-pointer">
                        <span className="mt-2 block text-sm font-medium text-gray-900">
                          Drag and drop images here, or{' '}
                          <span className="text-indigo-600 hover:text-indigo-500">click to browse</span>
                        </span>
                        <span className="mt-1 block text-xs text-gray-500">
                          JPG, PNG, WebP, or GIF (Max 5MB per image)
                        </span>
                      </label>
                      <input
                        ref={fileInputRef}
                        id="image-upload"
                        name="image-upload"
                        type="file"
                        accept=".jpg,.jpeg,.png,.webp,.gif"
                        multiple
                        className="sr-only"
                        onChange={(e) => handleFileSelect(e.target.files)}
                      />
                    </div>
                  </div>

                  {/* Preview Grid */}
                  {imagePreviews.length > 0 && (
                    <div className="mt-6">
                      <h5 className="text-sm font-medium text-gray-900 mb-4">Preview ({imagePreviews.length} images)</h5>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {imagePreviews.map((preview, index) => (
                          <div key={index} className="relative group">
                            <img
                              src={preview.preview}
                              alt={`Preview ${index + 1}`}
                              className="w-full h-32 object-cover rounded-lg"
                            />
                            {preview.uploading ? (
                              <div className="absolute inset-0 bg-black bg-opacity-50 rounded-lg flex items-center justify-center">
                                <div className="text-white text-sm">Uploading...</div>
                              </div>
                            ) : (
                              <button
                                onClick={() => removePreview(index)}
                                className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                      <div className="mt-4 flex justify-end">
                        <button
                          onClick={handleUploadImages}
                          disabled={imagePreviews.some((p) => p.uploading)}
                          className="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Upload All ({imagePreviews.length})
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Tab 2: Basic Information */}
            {activeTab === 'basic' && (
              <div className="space-y-6">
                <div>
                  <label htmlFor="product_name" className="block text-sm font-medium text-gray-700 mb-1">
                    Product Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="product_name"
                    value={formData.product_name}
                    onChange={(e) => handleInputChange('product_name', e.target.value)}
                    className={`block w-full rounded-md border ${
                      errors.product_name ? 'border-red-300' : 'border-gray-300'
                    } shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2`}
                  />
                  {errors.product_name && <p className="mt-1 text-sm text-red-600">{errors.product_name}</p>}
                </div>

                <div>
                  <label htmlFor="sku" className="block text-sm font-medium text-gray-700 mb-1">
                    SKU <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="sku"
                    value={formData.sku}
                    disabled
                    className="block w-full rounded-md border border-gray-300 bg-gray-100 shadow-sm sm:text-sm px-3 py-2 cursor-not-allowed"
                  />
                  <p className="mt-1 text-xs text-gray-500">SKU cannot be changed</p>
                </div>

                <div>
                  <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                    Category
                  </label>
                  <input
                    type="text"
                    id="category"
                    list="categories"
                    value={formData.category}
                    onChange={(e) => handleInputChange('category', e.target.value)}
                    className="block w-full rounded-md border border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2"
                  />
                  <datalist id="categories">
                    {categories.map((cat) => (
                      <option key={cat} value={cat} />
                    ))}
                  </datalist>
                </div>

                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    id="description"
                    rows={5}
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    className="block w-full rounded-md border border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">
                      Price
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-gray-500 sm:text-sm">$</span>
                      </div>
                      <input
                        type="number"
                        id="price"
                        step="0.01"
                        min="0"
                        value={formData.price}
                        onChange={(e) => handleInputChange('price', e.target.value)}
                        className={`block w-full pl-7 rounded-md border ${
                          errors.price ? 'border-red-300' : 'border-gray-300'
                        } shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2`}
                      />
                    </div>
                    {errors.price && <p className="mt-1 text-sm text-red-600">{errors.price}</p>}
                    <p className="mt-1 text-xs text-gray-500">
                      Price history will be updated automatically when you save changes.
                    </p>
                  </div>

                  <div>
                    <label htmlFor="stock_quantity" className="block text-sm font-medium text-gray-700 mb-1">
                      Stock Quantity
                    </label>
                    <input
                      type="number"
                      id="stock_quantity"
                      min="0"
                      step="1"
                      value={formData.stock_quantity}
                      onChange={(e) => handleInputChange('stock_quantity', e.target.value)}
                      className={`block w-full rounded-md border ${
                        errors.stock_quantity ? 'border-red-300' : 'border-gray-300'
                      } shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2`}
                    />
                    {errors.stock_quantity && <p className="mt-1 text-sm text-red-600">{errors.stock_quantity}</p>}
                  </div>
                </div>
              </div>
            )}

            {/* Tab 3: Custom Attributes */}
            {activeTab === 'attributes' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Custom Attributes</h3>
                  {customAttributes.length === 0 ? (
                    <p className="text-sm text-gray-500">No custom attributes defined</p>
                  ) : (
                    <div className="space-y-4">
                      {customAttributes.map((attr, index) => (
                        <div key={index} className="flex items-start space-x-4 p-4 border border-gray-200 rounded-lg">
                          <div className="flex-1 grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Key</label>
                              <input
                                type="text"
                                value={attr.key}
                                onChange={(e) => handleAttributeChange(index, 'key', e.target.value)}
                                className="block w-full rounded-md border border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Value</label>
                              <input
                                type="text"
                                value={attr.value}
                                onChange={(e) => handleAttributeChange(index, 'value', e.target.value)}
                                className="block w-full rounded-md border border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2"
                              />
                            </div>
                          </div>
                          <button
                            onClick={() => handleRemoveAttribute(index)}
                            className="mt-6 text-red-600 hover:text-red-800"
                          >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="border-t border-gray-200 pt-6">
                  <h4 className="text-sm font-medium text-gray-900 mb-4">Add New Attribute</h4>
                  <div className="flex space-x-4">
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Key</label>
                      <input
                        type="text"
                        value={newAttribute.key}
                        onChange={(e) => setNewAttribute((prev) => ({ ...prev, key: e.target.value }))}
                        className="block w-full rounded-md border border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2"
                        placeholder="e.g., Color, Size"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Value</label>
                      <input
                        type="text"
                        value={newAttribute.value}
                        onChange={(e) => setNewAttribute((prev) => ({ ...prev, value: e.target.value }))}
                        className="block w-full rounded-md border border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2"
                        placeholder="e.g., Red, Large"
                      />
                    </div>
                    <div className="flex items-end">
                      <button
                        onClick={handleAddAttribute}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                  {errors.newAttribute && <p className="mt-1 text-sm text-red-600">{errors.newAttribute}</p>}
                </div>
              </div>
            )}

            {/* Tab 4: Price History */}
            {activeTab === 'priceHistory' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Price History</h3>
                  <p className="text-sm text-gray-500 mb-4">
                    Prices are recorded automatically whenever you change them.
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
                      <h3 className="mt-4 text-sm font-medium text-gray-900">No price changes recorded yet</h3>
                      <p className="mt-2 text-sm text-gray-500">
                        Price history will appear here once you update the product price.
                      </p>
                    </div>
                  ) : (
                    <>
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
                            isRetailer={false}
                          />
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Tab 5: Product History */}
            {activeTab === 'history' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Product Information</h3>
                  <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Created</dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {new Date(product.created_at).toLocaleString()}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Last Updated</dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {product.updated_at ? new Date(product.updated_at).toLocaleString() : 'Never'}
                      </dd>
                    </div>
                  </dl>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Access Information</h3>
                  <p className="text-sm text-gray-500">
                    This product is available to retailers who have been granted access by your company.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Sticky Save Bar */}
        {isDirty && (
          <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-sm text-amber-600">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span>You have unsaved changes</span>
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={handleCancel}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Success Toast */}
        {showSuccessToast && (
          <div className="fixed top-4 right-4 bg-green-50 border border-green-200 rounded-lg shadow-lg p-4 z-50 flex items-center space-x-2">
            <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            <span className="text-sm font-medium text-green-800">Product saved successfully!</span>
          </div>
        )}

        {/* Error Toast */}
        {error && (
          <div className="fixed top-4 right-4 bg-red-50 border border-red-200 rounded-lg shadow-lg p-4 z-50 flex items-center space-x-2">
            <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
            <span className="text-sm font-medium text-red-800">{error}</span>
            <button
              onClick={() => setError(null)}
              className="ml-4 text-red-600 hover:text-red-800"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>
        )}

        {/* Image Lightbox Modal */}
        {lightboxImage && (
          <div
            className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center"
            onClick={closeLightbox}
          >
            <button
              onClick={closeLightbox}
              className="absolute top-4 right-4 text-white hover:text-gray-300 z-10"
            >
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            {images.length > 1 && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    prevImage()
                  }}
                  className="absolute left-4 text-white hover:text-gray-300 z-10"
                >
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    nextImage()
                  }}
                  className="absolute right-4 text-white hover:text-gray-300 z-10"
                >
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </>
            )}
            <div className="max-w-4xl max-h-[90vh] p-4" onClick={(e) => e.stopPropagation()}>
              <img
                src={lightboxImage}
                alt="Product image"
                className="max-w-full max-h-[90vh] object-contain mx-auto"
              />
              {images.length > 1 && (
                <div className="text-center mt-4 text-white text-sm">
                  Image {lightboxIndex + 1} of {images.length}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Image Delete Confirmation Modal */}
        {showImageDeleteModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
            <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Delete Image</h3>
              <p className="text-sm text-gray-500 mb-2">Are you sure you want to delete this image?</p>
              <p className="text-sm text-red-600 mb-6">This action cannot be undone.</p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowImageDeleteModal(false)
                    setImageToDelete(null)
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteImage}
                  className="px-4 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
            <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Delete Product</h3>
              <p className="text-sm text-gray-500 mb-2">
                Are you sure you want to delete <span className="font-medium">{product.product_name}</span>?
              </p>
              <p className="text-sm text-red-600 mb-6">This action cannot be undone.</p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="px-4 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {deleting ? 'Deleting...' : 'Delete Forever'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
