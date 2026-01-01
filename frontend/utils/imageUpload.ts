import { supabase } from './supabase'

export interface UploadResult {
  url: string
  path: string
  error?: string
}

/**
 * Upload product image to Supabase Storage
 * @param file - Image file to upload
 * @param productSku - Product SKU for organizing images
 * @param manufacturerId - Manufacturer ID for folder structure
 * @returns Upload result with public URL
 */
export async function uploadProductImage(
  file: File,
  productSku: string,
  manufacturerId: string
): Promise<UploadResult> {
  try {
    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (!validTypes.includes(file.type)) {
      return { 
        url: '', 
        path: '', 
        error: 'Invalid file type. Please upload JPG, PNG, WebP, or GIF.' 
      }
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      return { 
        url: '', 
        path: '', 
        error: 'File too large. Maximum size is 5MB.' 
      }
    }

    // Create unique filename
    const fileExt = file.name.split('.').pop()
    const timestamp = Date.now()
    const fileName = `${productSku}_${timestamp}.${fileExt}`
    const filePath = `${manufacturerId}/${productSku}/${fileName}`

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('product-images')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (error) {
      console.error('Upload error:', error)
      return { url: '', path: '', error: error.message }
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('product-images')
      .getPublicUrl(filePath)

    return {
      url: publicUrl,
      path: filePath,
      error: undefined
    }
  } catch (err: any) {
    console.error('Upload exception:', err)
    return { url: '', path: '', error: err.message }
  }
}

/**
 * Delete product image from Supabase Storage
 * @param imagePath - Storage path of image to delete
 */
export async function deleteProductImage(imagePath: string): Promise<boolean> {
  try {
    const { error } = await supabase.storage
      .from('product-images')
      .remove([imagePath])

    if (error) {
      console.error('Delete error:', error)
      return false
    }

    return true
  } catch (err) {
    console.error('Delete exception:', err)
    return false
  }
}

/**
 * Upload multiple images
 * @param files - Array of image files
 * @param productSku - Product SKU
 * @param manufacturerId - Manufacturer ID
 */
export async function uploadMultipleImages(
  files: File[],
  productSku: string,
  manufacturerId: string
): Promise<UploadResult[]> {
  const results: UploadResult[] = []
  
  for (const file of files) {
    const result = await uploadProductImage(file, productSku, manufacturerId)
    results.push(result)
  }
  
  return results
}
