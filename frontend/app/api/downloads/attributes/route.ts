import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

async function getServiceSupabaseClient() {
  return createClient(
    supabaseUrl,
    process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseAnonKey
  )
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

    const serviceSupabase = await getServiceSupabaseClient()

    // Verify user is a retailer
    const { data: retailerData, error: retailerError } = await serviceSupabase
      .from('retailers')
      .select('id')
      .eq('id', user.id)
      .maybeSingle()

    if (retailerError || !retailerData) {
      console.error('User is not a retailer:', retailerError)
      return NextResponse.json({ error: 'User is not a retailer' }, { status: 403 })
    }

    const body = await request.json()
    const { selection_mode, manufacturer_id, product_ids } = body

    console.log('📥 [API] Received request body:', {
      selection_mode,
      manufacturer_id,
      product_ids: product_ids?.length || 0,
      body_keys: Object.keys(body)
    })

    if (!selection_mode) {
      return NextResponse.json({ error: 'Selection mode is required' }, { status: 400 })
    }

    // Verify access for manufacturer mode
    if (selection_mode === 'manufacturer' && manufacturer_id) {
      console.log('🔐 [API] Verifying access for retailer:', user.id, 'manufacturer:', manufacturer_id)
      const { data: accessData, error: accessError } = await serviceSupabase
        .from('retailer_data_access')
        .select('access_granted')
        .eq('retailer_id', user.id)
        .eq('manufacturer_id', manufacturer_id)
        .eq('access_granted', true)
        .maybeSingle()

      if (accessError || !accessData) {
        console.error('❌ [API] Access denied to manufacturer:', {
          retailer_id: user.id,
          manufacturer_id,
          error: accessError,
          accessData
        })
        return NextResponse.json({ error: 'Access denied to this manufacturer' }, { status: 403 })
      }
      console.log('✅ [API] Access granted for manufacturer:', manufacturer_id)
    }

    // Build query based on selection mode
    let query = serviceSupabase.from('product_data').select('*').limit(100)

    if (selection_mode === 'manufacturer' && manufacturer_id) {
      query = query.eq('manufacturer_id', manufacturer_id)
      console.log(`🔍 [API] Querying products for manufacturer_id: ${manufacturer_id} (type: ${typeof manufacturer_id})`)
    } else if (selection_mode === 'individual' && product_ids && product_ids.length > 0) {
      query = query.in('id', product_ids)
      console.log(`🔍 [API] Querying ${product_ids.length} individual products`)
    } else {
      // If no specific selection, return empty - user must select something
      console.log('⚠️ [API] No valid selection mode, returning empty attributes')
      return NextResponse.json({ attributes: [] })
    }

    console.log('📊 [API] Executing query...')
    const { data: products, error: productsError } = await query
    
    console.log('📊 [API] Query result:', {
      productsCount: products?.length || 0,
      error: productsError?.message,
      sampleProduct: products?.[0] ? {
        id: products[0].id,
        product_name: products[0].product_name,
        manufacturer_id: products[0].manufacturer_id,
        manufacturer_id_type: typeof products[0].manufacturer_id
      } : null
    })

    if (productsError) {
      console.error('❌ Error fetching products:', productsError)
      return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 })
    }

    if (!products || products.length === 0) {
      console.log(`⚠️ [API] No products found for ${selection_mode === 'manufacturer' ? `manufacturer ${manufacturer_id}` : `${product_ids?.length} products`}`)
      
      // Debug: Check if products exist for this manufacturer at all
      if (selection_mode === 'manufacturer' && manufacturer_id) {
        const { data: allProducts, error: debugError } = await serviceSupabase
          .from('product_data')
          .select('id, product_name, manufacturer_id')
          .eq('manufacturer_id', manufacturer_id)
          .limit(5)
        console.log('🔍 [API] Debug query (checking if products exist):', {
          found: allProducts?.length || 0,
          sample: allProducts?.[0],
          error: debugError
        })
      }
      
      return NextResponse.json({ attributes: [] })
    }

    // Verify all products have the correct manufacturer_id
    const uniqueManufacturerIds = [...new Set(products.map(p => p.manufacturer_id))]
    console.log(`✅ [API] Found ${products.length} products for attribute analysis`, {
      requested_manufacturer_id: manufacturer_id,
      unique_manufacturer_ids_in_results: uniqueManufacturerIds,
      all_match: uniqueManufacturerIds.length === 1 && uniqueManufacturerIds[0] === manufacturer_id
    })
    
    if (uniqueManufacturerIds.length > 1 || (uniqueManufacturerIds[0] !== manufacturer_id)) {
      console.warn('⚠️ [API] WARNING: Products have different manufacturer_ids than requested!', {
        requested: manufacturer_id,
        found: uniqueManufacturerIds
      })
    }

    // Analyze products to find ONLY attributes that actually have values
    // This ensures each manufacturer shows only attributes present in their products
    const attributeSet = new Set<string>()
    const attributeCounts = new Map<string, number>() // Track how many products have each attribute
    const attributeSampleValues = new Map<string, any>() // Store sample values for debugging
    
    products.forEach((product, index) => {
      // Log first product for debugging
      if (index === 0) {
        console.log('📦 [API] Sample product (first of batch):', {
          id: product.id,
          product_name: product.product_name,
          manufacturer_id: product.manufacturer_id,
          all_keys: Object.keys(product).filter(k => !k.startsWith('_'))
        })
      }
      
      Object.keys(product).forEach(key => {
        // Skip internal Supabase fields and relationships
        if (key.startsWith('_') || key === 'manufacturers' || key === 'created_at' || key === 'updated_at') {
          return
        }
        
        const value = product[key]
        
        // Only include attributes that have actual non-null, non-empty values
        let shouldInclude = false
        
        if (value !== null && value !== undefined && value !== '') {
          // Handle arrays and objects
          if (Array.isArray(value) && value.length > 0) {
            shouldInclude = true
          } else if (typeof value === 'object' && Object.keys(value).length > 0) {
            shouldInclude = true
          } else if (typeof value !== 'object') {
            shouldInclude = true
          }
        }
        
        if (shouldInclude) {
          attributeSet.add(key)
          attributeCounts.set(key, (attributeCounts.get(key) || 0) + 1)
          // Store first non-null value as sample
          if (!attributeSampleValues.has(key)) {
            attributeSampleValues.set(key, value)
          }
        }
      })
    })
    
    // Always include manufacturer_name if manufacturer_id exists (it's a computed field)
    if (attributeSet.has('manufacturer_id')) {
      attributeSet.add('manufacturer_name')
    }

    // Convert to sorted array
    const attributes = Array.from(attributeSet).sort()
    
    // Log attribute statistics for debugging
    console.log(`✅ [API] Analyzed ${products.length} products for manufacturer ${manufacturer_id}`)
    console.log(`   Found ${attributes.length} unique attributes:`, attributes)
    if (attributes.length > 0) {
      const attributeDetails = attributes.map(attr => {
        const count = attributeCounts.get(attr) || 0
        const sample = attributeSampleValues.get(attr)
        const sampleStr = typeof sample === 'string' ? sample.substring(0, 30) : 
                         typeof sample === 'object' ? JSON.stringify(sample).substring(0, 30) : 
                         String(sample).substring(0, 30)
        return `${attr}(${count}/${products.length}, sample: ${sampleStr})`
      }).join('\n     ')
      console.log(`   Attribute details:\n     ${attributeDetails}`)
    }

    const response = NextResponse.json({ attributes })
    
    // Add debug headers to response (for client-side inspection)
    response.headers.set('X-Debug-Manufacturer-Id', manufacturer_id || 'none')
    response.headers.set('X-Debug-Products-Found', String(products?.length || 0))
    response.headers.set('X-Debug-Attributes-Count', String(attributes.length))
    
    return response
  } catch (error: any) {
    console.error('❌ [API] Error fetching attributes:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch attributes' },
      { status: 500 }
    )
  }
}
