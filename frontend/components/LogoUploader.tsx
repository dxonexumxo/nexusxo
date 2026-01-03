'use client'

import { useState, useRef } from 'react'
import { PhotoIcon, TrashIcon } from '@heroicons/react/24/outline'
import ImagePreview from './ImagePreview'
import ManufacturerAvatar from './ManufacturerAvatar'

interface LogoUploaderProps {
  currentLogoUrl?: string | null
  companyName: string
  onUploadSuccess: (url: string) => void
  onError: (error: string) => void
  onRemove: () => void
  uploading?: boolean
}

const MAX_FILE_SIZE = 2 * 1024 * 1024 // 2MB
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

export default function LogoUploader({
  currentLogoUrl,
  companyName,
  onUploadSuccess,
  onError,
  onRemove,
  uploading = false
}: LogoUploaderProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const validateFile = (file: File): string | null => {
    // Check file type
    if (!ACCEPTED_TYPES.includes(file.type)) {
      return 'Invalid file type. Please upload JPG, PNG, WebP, or GIF.'
    }

    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      return `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB.`
    }

    return null
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const error = validateFile(file)
    if (error) {
      onError(error)
      return
    }

    setSelectedFile(file)
    
    // Create preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleConfirmUpload = async () => {
    if (!selectedFile) return

    try {
      // Get session token
      const { supabase } = await import('@/utils/supabase')
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        onError('Please log in to upload a logo')
        return
      }

      // Upload via API route
      const formData = new FormData()
      formData.append('logo', selectedFile)

      const response = await fetch('/api/manufacturer/logo', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        },
        body: formData
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Upload failed')
      }

      const { logoUrl } = await response.json()
      onUploadSuccess(logoUrl)
      
      // Reset state
      setSelectedFile(null)
      setPreviewUrl(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } catch (err: any) {
      onError(err.message || 'Failed to upload logo')
    }
  }

  const handleCancel = () => {
    setSelectedFile(null)
    setPreviewUrl(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleRemove = async () => {
    if (!confirm('Are you sure you want to remove your logo?')) {
      return
    }

    try {
      const { supabase } = await import('@/utils/supabase')
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        onError('Please log in to remove logo')
        return
      }

      const response = await fetch('/api/manufacturer/logo', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Delete failed')
      }

      onRemove()
    } catch (err: any) {
      onError(err.message || 'Failed to remove logo')
    }
  }

  return (
    <div className="space-y-4">
      {/* Current Logo Display */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Current Logo
        </label>
        <div className="flex items-center gap-4">
          <ManufacturerAvatar 
            logoUrl={currentLogoUrl} 
            companyName={companyName} 
            size="lg"
          />
          {currentLogoUrl && (
            <button
              type="button"
              onClick={handleRemove}
              disabled={uploading}
              className="flex items-center gap-2 px-4 py-2 text-red-600 border border-red-300 rounded-lg hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <TrashIcon className="w-4 h-4" />
              Remove Logo
            </button>
          )}
        </div>
      </div>

      {/* Upload Section */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {currentLogoUrl ? 'Replace Logo' : 'Upload Logo'}
        </label>
        
        {previewUrl && selectedFile ? (
          <ImagePreview
            file={selectedFile}
            onConfirm={handleConfirmUpload}
            onCancel={handleCancel}
          />
        ) : (
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-indigo-400 transition-colors">
            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPTED_TYPES.join(',')}
              onChange={handleFileSelect}
              className="hidden"
              id="logo-upload"
              disabled={uploading}
            />
            <label
              htmlFor="logo-upload"
              className="cursor-pointer flex flex-col items-center"
            >
              <PhotoIcon className="w-12 h-12 text-gray-400 mb-2" />
              <span className="text-sm font-medium text-indigo-600 hover:text-indigo-700">
                Click to upload
              </span>
              <span className="text-xs text-gray-500 mt-1">
                JPG, PNG, WebP, or GIF (max 2MB)
              </span>
            </label>
          </div>
        )}

        {uploading && (
          <div className="mt-4 flex items-center gap-2 text-sm text-gray-600">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600"></div>
            Uploading...
          </div>
        )}
      </div>
    </div>
  )
}