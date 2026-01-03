'use client'

import { useState, useEffect } from 'react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import Image from 'next/image'

interface ImagePreviewProps {
  file: File
  onConfirm: () => void
  onCancel: () => void
  maxWidth?: number
  maxHeight?: number
}

export default function ImagePreview({ 
  file, 
  onConfirm, 
  onCancel,
  maxWidth = 400,
  maxHeight = 400
}: ImagePreviewProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  // Create preview URL from file
  useEffect(() => {
    const reader = new FileReader()
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string)
    }
    reader.readAsDataURL(file)
  }, [file])

  if (!previewUrl) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  return (
    <div className="relative border border-gray-300 rounded-lg overflow-hidden bg-gray-50">
      <button
        onClick={onCancel}
        className="absolute top-2 right-2 z-10 p-1 bg-white rounded-full shadow-md hover:bg-gray-100 transition-colors"
        aria-label="Cancel"
      >
        <XMarkIcon className="w-5 h-5 text-gray-600" />
      </button>
      
      <div className="p-4">
        <div className="relative mx-auto" style={{ maxWidth, maxHeight }}>
          <Image
            src={previewUrl}
            alt="Preview"
            width={maxWidth}
            height={maxHeight}
            className="object-contain rounded-lg"
            style={{ maxWidth: '100%', height: 'auto' }}
          />
        </div>
        
        <div className="mt-4 text-center">
          <p className="text-sm text-gray-600 mb-4">
            {file.name} ({(file.size / 1024).toFixed(2)} KB)
          </p>
          
          <div className="flex gap-3 justify-center">
            <button
              onClick={onCancel}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Confirm Upload
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}