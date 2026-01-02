import { NextRequest, NextResponse } from 'next/server'
import { validateApiToken, logApiUsage } from '@/lib/api-auth'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET(request: NextRequest) {
  const startTime = Date.now()
  
  const authResult = await validateApiToken(request)
  if (!authResult.valid) {
    await logApiUsage(
      null,
      '/api/v1/products',
      'GET',
      401,
      Date.now() - startTime,
      request.headers.get('x-forwarded-for') || undefined,
      request.headers.get('user-agent') || undefined,
      authResult.error
    )
    return NextResponse.json({ error: authResult.error }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const page = parseInt(searchParams.get('page') || '1')
  const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)
  const manufacturer_id = searchParams.get('manufacturer_id')
  const category = searchParams.get('category')
  const search = searchParams.get('search')

  // For retailers, filter by accessible manufacturers
  let accessibleManufacturerIds: string[] | null = null
  if (authResult.token!.retailer_id) {
    const { data: accessData } = await supabase
      .from('retailer_data_access')
      .select('manufacturer_id')
      .eq('retailer_id', authResult.token!.retailer_id)
      .eq('access_granted', true)
    
    accessibleManufacturerIds = accessData?.map(a => a.manufacturer_id) || []
    
    // If no access, return empty result
    if (accessibleManufacturerIds.length === 0) {
      const responseTimeMs = Date.now() - startTime
      await logApiUsage(
        authResult.token!.id,
        '/api/v1/products',
        'GET',
        200,
        responseTimeMs,
        request.headers.get('x-forwarded-for') || undefined,
        request.headers.get('user-agent') || undefined
      )
      return NextResponse.json({
        data: [],
        pagination: { page, limit, total: 0, pages: 0 },
        meta: { response_time_ms: responseTimeMs }
      })
    }
  }

  let query = supabase
    .from('product_data')
    .select('id, sku, product_name, category, description, price, stock_quantity, image_urls, attributes_json, manufacturer_id, created_at, updated_at, manufacturers!inner(id, company_name)', { count: 'exact' })

  // Apply retailer access filter
  if (accessibleManufacturerIds) {
    query = query.in('manufacturer_id', accessibleManufacturerIds)
  }

  // For manufacturers, only show their own products
  if (authResult.token!.manufacturer_id && !authResult.token!.retailer_id) {
    query = query.eq('manufacturer_id', authResult.token!.manufacturer_id)
  }

  if (manufacturer_id) {
    // Additional check: verify access for retailers
    if (accessibleManufacturerIds && !accessibleManufacturerIds.includes(manufacturer_id)) {
      const responseTimeMs = Date.now() - startTime
      await logApiUsage(
        authResult.token!.id,
        '/api/v1/products',
        'GET',
        403,
        responseTimeMs,
        request.headers.get('x-forwarded-for') || undefined,
        request.headers.get('user-agent') || undefined,
        'Access denied to manufacturer'
      )
      return NextResponse.json({ error: 'Access denied to this manufacturer' }, { status: 403 })
    }
    query = query.eq('manufacturer_id', manufacturer_id)
  }

  if (category) {
    query = query.eq('category', category)
  }

  if (search) {
    query = query.or(`sku.ilike.%${search}%,product_name.ilike.%${search}%,description.ilike.%${search}%`)
  }

  query = query.order('created_at', { ascending: false })
  query = query.range((page - 1) * limit, page * limit - 1)

  const { data, error, count } = await query

  const responseTimeMs = Date.now() - startTime

  await logApiUsage(
    authResult.token!.id,
    '/api/v1/products',
    'GET',
    error ? 500 : 200,
    responseTimeMs,
    request.headers.get('x-forwarded-for') || undefined,
    request.headers.get('user-agent') || undefined,
    error?.message
  )

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Transform data to match API response format
  const transformedData = (data || []).map((product: any) => ({
    id: product.id,
    sku: product.sku,
    name: product.product_name,
    description: product.description,
    price: product.price,
    category: product.category,
    stock_quantity: product.stock_quantity,
    image_urls: product.image_urls,
    attributes: product.attributes_json,
    manufacturer_id: product.manufacturer_id,
    manufacturer: product.manufacturers ? {
      id: product.manufacturers.id,
      company_name: product.manufacturers.company_name
    } : null,
    created_at: product.created_at,
    updated_at: product.updated_at
  }))

  return NextResponse.json({
    data: transformedData,
    pagination: {
      page,
      limit,
      total: count || 0,
      pages: Math.ceil((count || 0) / limit)
    },
    meta: {
      response_time_ms: responseTimeMs
    }
  })
}
