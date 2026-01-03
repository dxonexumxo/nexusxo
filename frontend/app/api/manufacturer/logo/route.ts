import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const BUCKET_NAME = 'manufacturer-logos'
const MAX_FILE_SIZE = 2 * 1024 * 1024 // 2MB
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

async function getServiceSupabaseClient() {
  return createClient(
    supabaseUrl,
    process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseAnonKey
  )
}

async function verifyManufacturer(userId: string) {
  const supabase = await getServiceSupabaseClient()
  const { data, error } = await supabase
    .from('manufacturers')
    .select('id')
    .eq('id', userId)
    .maybeSingle()

  return { isValid: !error && !!data, error }
}

async function getAuthenticatedUser(request: NextRequest) {
  // Try to get access token from Authorization header first
  const authHeader = request.headers.get('Authorization')
  let user: any = null
  
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.replace('Bearer ', '')
    const tokenSupabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    })
    const { data: { user: userFromToken }, error: tokenError } = await tokenSupabase.auth.getUser()
    if (!tokenError && userFromToken) {
      user = userFromToken
    }
  }
  
  // If no user from token, try cookies
  if (!user) {
    const cookieStore = await cookies()
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
      },
    })
    const { data: { session } } = await supabase.auth.getSession()
    user = session?.user
    
    if (!user) {
      const { data: { user: userFromGetUser }, error: authError } = await supabase.auth.getUser()
      if (authError || !userFromGetUser) {
        return { user: null, error: authError?.message || 'No session found' }
      }
      user = userFromGetUser
    }
  }

  return { user, error: null }
}

// Validate image file
function validateImageFile(file: File): { valid: boolean; error?: string } {
  // Check file type
  if (!ACCEPTED_TYPES.includes(file.type)) {
    return { valid: false, error: 'Invalid file type. Please upload JPG, PNG, WebP, or GIF.' }
  }

  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB.` }
  }

  return { valid: true }
}

// Sanitize filename
function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[^a-zA-Z0-9.-]/g, '_')
    .replace(/_{2,}/g, '_')
    .toLowerCase()
}

// POST: Upload logo
export async function POST(request: NextRequest) {
  try {
    const { user, error: authError } = await getAuthenticatedUser(request)
    if (!user || authError) {
      return NextResponse.json({ error: 'Unauthorized', details: authError || 'No session found' }, { status: 401 })
    }

    const manufacturerCheck = await verifyManufacturer(user.id)
    if (!manufacturerCheck.isValid) {
      return NextResponse.json({ error: 'Forbidden - Not a manufacturer' }, { status: 403 })
    }

    const formData = await request.formData()
    const file = formData.get('logo') as File | null

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Validate file
    const validation = validateImageFile(file)
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }

    const serviceSupabase = await getServiceSupabaseClient()

    // Get existing logo to delete it
    const { data: existingManufacturer } = await serviceSupabase
      .from('manufacturers')
      .select('logo_file_name')
      .eq('id', user.id)
      .maybeSingle()

    // Delete old logo if exists
    if (existingManufacturer?.logo_file_name) {
      const oldFilePath = `${user.id}/${existingManufacturer.logo_file_name}`
      await serviceSupabase.storage
        .from(BUCKET_NAME)
        .remove([oldFilePath])
        .catch(err => console.error('Error deleting old logo:', err))
    }

    // Create unique filename
    const fileExt = file.name.split('.').pop() || 'jpg'
    const sanitizedOriginalName = sanitizeFilename(file.name.replace(/\.[^/.]+$/, ''))
    const timestamp = Date.now()
    const fileName = `${sanitizedOriginalName}_${timestamp}.${fileExt}`
    const filePath = `${user.id}/${fileName}`

    // Convert File to ArrayBuffer for upload
    const arrayBuffer = await file.arrayBuffer()
    const uint8Array = new Uint8Array(arrayBuffer)

    // Upload to storage
    const { data: uploadData, error: uploadError } = await serviceSupabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, uint8Array, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: false
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      return NextResponse.json({ error: `Upload failed: ${uploadError.message}` }, { status: 500 })
    }

    // Get public URL
    const { data: { publicUrl } } = serviceSupabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(filePath)

    // Update manufacturer record
    const { error: updateError } = await serviceSupabase
      .from('manufacturers')
      .update({
        logo_url: publicUrl,
        logo_file_name: fileName,
        logo_uploaded_at: new Date().toISOString()
      })
      .eq('id', user.id)

    if (updateError) {
      console.error('Update error:', updateError)
      // Try to delete uploaded file if database update fails
      await serviceSupabase.storage
        .from(BUCKET_NAME)
        .remove([filePath])
        .catch(err => console.error('Error cleaning up uploaded file:', err))
      
      return NextResponse.json({ error: `Failed to update manufacturer record: ${updateError.message}` }, { status: 500 })
    }

    return NextResponse.json({ 
      logoUrl: publicUrl,
      message: 'Logo uploaded successfully'
    })
  } catch (error: any) {
    console.error('Logo upload error:', error)
    return NextResponse.json({ error: error.message || 'Upload failed' }, { status: 500 })
  }
}

// DELETE: Remove logo
export async function DELETE(request: NextRequest) {
  try {
    const { user, error: authError } = await getAuthenticatedUser(request)
    if (!user || authError) {
      return NextResponse.json({ error: 'Unauthorized', details: authError || 'No session found' }, { status: 401 })
    }

    const manufacturerCheck = await verifyManufacturer(user.id)
    if (!manufacturerCheck.isValid) {
      return NextResponse.json({ error: 'Forbidden - Not a manufacturer' }, { status: 403 })
    }

    const serviceSupabase = await getServiceSupabaseClient()

    // Get current logo info
    const { data: manufacturer, error: fetchError } = await serviceSupabase
      .from('manufacturers')
      .select('logo_file_name, logo_url')
      .eq('id', user.id)
      .maybeSingle()

    if (fetchError) {
      console.error('Error fetching manufacturer:', fetchError)
      return NextResponse.json({ error: fetchError.message }, { status: 500 })
    }

    if (!manufacturer?.logo_file_name) {
      return NextResponse.json({ error: 'No logo found' }, { status: 404 })
    }

    // Delete from storage
    const filePath = `${user.id}/${manufacturer.logo_file_name}`
    const { error: deleteError } = await serviceSupabase.storage
      .from(BUCKET_NAME)
      .remove([filePath])

    if (deleteError) {
      console.error('Storage delete error:', deleteError)
      // Continue with database update even if storage delete fails
    }

    // Update manufacturer record
    const { error: updateError } = await serviceSupabase
      .from('manufacturers')
      .update({
        logo_url: null,
        logo_file_name: null,
        logo_uploaded_at: null
      })
      .eq('id', user.id)

    if (updateError) {
      console.error('Update error:', updateError)
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    return NextResponse.json({ message: 'Logo removed successfully' })
  } catch (error: any) {
    console.error('Logo delete error:', error)
    return NextResponse.json({ error: error.message || 'Delete failed' }, { status: 500 })
  }
}