import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { parse } from 'json2csv'
import JSZip from 'jszip'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

async function getServiceSupabaseClient() {
  return createClient(
    supabaseUrl,
    process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseAnonKey
  )
}

interface DownloadRequest {
  selection_mode: 'manufacturer' | 'individual'
  manufacturer_id?: string
  product_ids?: string[]
  attributes: string[]
  include_images: boolean
  include_documents: boolean
  format: 'csv' | 'json'
}

export async function POST(request: NextRequest) {
  try {
    // Authenticate user - try Authorization header first, then cookies
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
      const { data: { user: userFromCookie }, error: cookieError } = await supabase.auth.getUser()
      if (!cookieError && userFromCookie) {
        user = userFromCookie
      }
    }

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = user.id

    const serviceSupabase = await getServiceSupabaseClient()

    // Verify user is a retailer
    const { data: retailerData, error: retailerError } = await serviceSupabase
      .from('retailers')
      .select('id')
      .eq('id', userId)
      .maybeSingle()

    if (retailerError || !retailerData) {
      console.error('User is not a retailer:', retailerError)
      return NextResponse.json({ error: 'User is not a retailer' }, { status: 403 })
    }

    const body: DownloadRequest = await request.json()
    console.log('Download request:', { selection_mode: body.selection_mode, attributes_count: body.attributes?.length })

    // Validate request
    if (!body.selection_mode || !body.attributes || body.attributes.length === 0) {
      return NextResponse.json({ error: 'Invalid request: missing required fields' }, { status: 400 })
    }

    if (body.selection_mode === 'manufacturer' && !body.manufacturer_id) {
      return NextResponse.json({ error: 'Manufacturer ID required for manufacturer mode' }, { status: 400 })
    }

    if (body.selection_mode === 'individual' && (!body.product_ids || body.product_ids.length === 0)) {
      return NextResponse.json({ error: 'Product IDs required for individual mode' }, { status: 400 })
    }

    // Verify access for manufacturer mode
    if (body.selection_mode === 'manufacturer' && body.manufacturer_id) {
      const { data: accessData, error: accessError } = await serviceSupabase
        .from('retailer_data_access')
        .select('access_granted')
        .eq('retailer_id', userId)
        .eq('manufacturer_id', body.manufacturer_id)
        .eq('access_granted', true)
        .maybeSingle()

      if (accessError || !accessData) {
        console.error('Access denied to manufacturer:', accessError)
        return NextResponse.json({ error: 'Access denied to this manufacturer' }, { status: 403 })
      }
    }

    // Fetch products
    let query = serviceSupabase
      .from('product_data')
      .select('*')

    if (body.selection_mode === 'manufacturer') {
      query = query.eq('manufacturer_id', body.manufacturer_id!)
      console.log('Fetching products for manufacturer:', body.manufacturer_id)
    } else {
      query = query.in('id', body.product_ids!)
      console.log('Fetching individual products:', body.product_ids?.length)
    }

    const { data: products, error: productsError } = await query

    if (productsError) {
      console.error('Error fetching products:', productsError)
      return NextResponse.json({ 
        error: `Failed to fetch products: ${productsError.message}` 
      }, { status: 500 })
    }

    if (!products || products.length === 0) {
      console.log('No products found')
      return NextResponse.json({ 
        error: 'No products found matching your selection' 
      }, { status: 404 })
    }

    console.log(`Found ${products.length} products`)

    // For individual mode, verify access to each product's manufacturer
    if (body.selection_mode === 'individual' && products.length > 0) {
      const manufacturerIds = [...new Set(products.map(p => p.manufacturer_id).filter(Boolean))]
      if (manufacturerIds.length > 0) {
        const { data: accessData, error: accessError } = await serviceSupabase
          .from('retailer_data_access')
          .select('manufacturer_id')
          .eq('retailer_id', userId)
          .in('manufacturer_id', manufacturerIds)
          .eq('access_granted', true)

        if (accessError) {
          console.error('Error checking access:', accessError)
        } else {
          const accessibleManufacturerIds = new Set(accessData?.map(a => a.manufacturer_id) || [])
          const filteredProducts = products.filter(p => accessibleManufacturerIds.has(p.manufacturer_id))
          
          if (filteredProducts.length === 0) {
            return NextResponse.json({ 
              error: 'No accessible products found' 
            }, { status: 403 })
          }
          
          // Replace products array with filtered ones
          products.splice(0, products.length, ...filteredProducts)
          console.log(`Filtered to ${products.length} accessible products`)
        }
      }
    }

    // Get manufacturer names
    const manufacturerIds = [...new Set(products.map(p => p.manufacturer_id))]
    const { data: manufacturers } = await serviceSupabase
      .from('manufacturers')
      .select('id, company_name')
      .in('id', manufacturerIds)

    const manufacturerMap = new Map(manufacturers?.map(m => [m.id, m.company_name]) || [])

    // Filter products to selected attributes
    const filteredProducts = products.map(product => {
      const filtered: any = {}
      body.attributes.forEach(attr => {
        if (attr === 'manufacturer_name') {
          filtered[attr] = manufacturerMap.get(product.manufacturer_id) || ''
        } else {
          filtered[attr] = product[attr as keyof typeof product] || ''
        }
      })
      return filtered
    })

    // Create ZIP file
    const zip = new JSZip()

    // Generate data file (CSV or JSON)
    let dataContent: string
    let dataFilename: string

    if (body.format === 'csv') {
      try {
        dataContent = parse(filteredProducts, { fields: body.attributes })
        dataFilename = 'products.csv'
      } catch (error) {
        console.error('Error generating CSV:', error)
        return NextResponse.json({ error: 'Failed to generate CSV' }, { status: 500 })
      }
    } else {
      dataContent = JSON.stringify(filteredProducts, null, 2)
      dataFilename = 'products.json'
    }

    zip.file(dataFilename, dataContent)

    // Add images if requested
    if (body.include_images) {
      const imagesFolder = zip.folder('images')
      if (imagesFolder) {
        // Collect image URLs with product IDs for naming
        const imageTasks: Array<{ url: string, filename: string }> = []
        products.forEach((p, index) => {
          const productId = p.id || p.sku || `product_${index}`
          if (p.image_url && typeof p.image_url === 'string') {
            const extension = p.image_url.split('.').pop()?.split('?')[0] || 'jpg'
            imageTasks.push({ 
              url: p.image_url, 
              filename: `${productId}.${extension}` 
            })
          } else if (p.image_urls && Array.isArray(p.image_urls)) {
            p.image_urls.forEach((url: string, imgIndex: number) => {
              if (typeof url === 'string') {
                const extension = url.split('.').pop()?.split('?')[0] || 'jpg'
                imageTasks.push({ 
                  url, 
                  filename: `${productId}_${imgIndex}.${extension}` 
                })
              }
            })
          }
        })

        if (imageTasks.length > 0) {
          console.log(`Downloading ${imageTasks.length} images...`)
          
          // Download images in parallel with error handling
          const imageDownloads = await Promise.allSettled(
            imageTasks.map(async ({ url, filename }) => {
              try {
                const response = await fetch(url, {
                  headers: {
                    'User-Agent': 'Mozilla/5.0 (compatible; NexusXO/1.0)'
                  }
                })
                
                if (!response.ok) {
                  throw new Error(`HTTP ${response.status}`)
                }

                const buffer = Buffer.from(await response.arrayBuffer())
                
                // Validate it's actually an image (check first bytes)
                if (buffer.length === 0) {
                  throw new Error('Empty file')
                }

                // Check for common image formats
                const isValidImage = (
                  (buffer[0] === 0xFF && buffer[1] === 0xD8) || // JPEG
                  (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) || // PNG
                  (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46) || // GIF
                  (buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46) || // WebP (RIFF)
                  (buffer[0] === 0x42 && buffer[1] === 0x4D) // BMP
                )

                // If validation fails, still include it (might be valid but not detected)
                // User can check the file manually

                return { filename, buffer }
              } catch (error: any) {
                console.error(`Failed to download image ${filename} from ${url}:`, error.message)
                return null
              }
            })
          )

          // Add successfully downloaded images to ZIP
          let successCount = 0
          imageDownloads.forEach((result, index) => {
            if (result.status === 'fulfilled' && result.value) {
              imagesFolder.file(result.value.filename, result.value.buffer)
              successCount++
            }
          })

          console.log(`Successfully downloaded ${successCount} out of ${imageTasks.length} images`)
          
          // Add a summary file with all URLs (including failed ones)
          const failedUrls = imageTasks
            .filter((task, index) => {
              const result = imageDownloads[index]
              return result.status === 'rejected' || (result.status === 'fulfilled' && !result.value)
            })
            .map(task => task.url)

          imagesFolder.file('_download_summary.txt', 
            `Image Download Summary\n` +
            `========================\n\n` +
            `Total URLs: ${imageTasks.length}\n` +
            `Successfully downloaded: ${successCount}\n` +
            `Failed: ${imageTasks.length - successCount}\n\n` +
            `Images are named using product IDs/SKUs.\n\n` +
            (failedUrls.length > 0 ? `Failed URLs:\n${failedUrls.join('\n')}\n` : '')
          )
          
          // Also create a file with all image URLs for reference
          imagesFolder.file('_all_image_urls.txt', 
            imageTasks.map(task => task.url).join('\n')
          )
        } else {
          imagesFolder.file('README.txt', 'No product images available')
        }
      }
    }

    // Add documents if requested
    if (body.include_documents) {
      const docsFolder = zip.folder('documents')
      if (docsFolder) {
        // Collect document URLs (assuming there's a documents field)
        // This would need to be implemented based on your schema
        docsFolder.file('readme.txt', 'Document files would be included here')
      }
    }

    // Generate ZIP
    const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' })

    // Save to download_history (try with different possible column names)
    const timestamp = new Date().toISOString().split('T')[0]
    const filename = `products_${timestamp}_${Date.now()}.zip`
    
    try {
      // Try with common column name variations
      await serviceSupabase
        .from('download_history')
        .insert({
          retailer_id: userId,
          filename: filename,
          size: zipBuffer.length, // Try 'size' instead of 'file_size'
          format: body.format,
          download_url: null
        })
    } catch (error) {
      console.error('Error saving download history:', error)
      // Don't fail the download if history save fails
    }

    // Return ZIP file
    return new NextResponse(zipBuffer, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': zipBuffer.length.toString()
      }
    })

  } catch (error: any) {
    console.error('Error generating download:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to generate download' },
      { status: 500 }
    )
  }
}
