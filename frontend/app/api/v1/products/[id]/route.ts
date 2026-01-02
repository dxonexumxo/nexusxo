import { NextRequest, NextResponse } from 'next/server'
import { validateApiToken, logApiUsage } from '@/lib/api-auth'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const startTime = Date.now()
  const { id } = await params
  
  const authResult = await validateApiToken(request)
  if (!authResult.valid) {
    await logApiUsage(
      null,
      `/api/v1/products/${id}`,
      'GET',
      401,
      Date.now() - startTime,
      request.headers.get('x-forwarded-for') || undefined,
      request.headers.get('user-agent') || undefined,
      authResult.error
    )
    return NextResponse.json({ error: authResult.error }, { status: 401 })
  }

  // Fetch product
  const { data: product, error: productError } = await supabase
    .from('product_data')
    .select('*, manufacturers(id, company_name, industry, email)')
    .eq('id', id)
    .single()

  if (productError || !product) {
    const responseTimeMs = Date.now() - startTime
    await logApiUsage(
      authResult.token!.id,
      `/api/v1/products/${id}`,
      'GET',
      404,
      responseTimeMs,
      request.headers.get('x-forwarded-for') || undefined,
      request.headers.get('user-agent') || undefined,
      'Product not found'
    )
    return NextResponse.json({ error: 'Product not found' }, { status: 404 })
  }

  // Check access for retailers
  if (authResult.token!.retailer_id) {
    const { data: accessData } = await supabase
      .from('retailer_data_access')
      .select('access_granted')
      .eq('retailer_id', authResult.token!.retailer_id)
      .eq('manufacturer_id', product.manufacturer_id)
      .eq('access_granted', true)
      .single()

    if (!accessData) {
      const responseTimeMs = Date.now() - startTime
      await logApiUsage(
        authResult.token!.id,
        `/api/v1/products/${id}`,
        'GET',
        403,
        responseTimeMs,
        request.headers.get('x-forwarded-for') || undefined,
        request.headers.get('user-agent') || undefined,
        'Access denied to manufacturer'
      )
      return NextResponse.json({ error: 'Access denied to this product' }, { status: 403 })
    }
  }

  // Check access for manufacturers (can only see their own products)
  if (authResult.token!.manufacturer_id && !authResult.token!.retailer_id) {
    if (product.manufacturer_id !== authResult.token!.manufacturer_id) {
      const responseTimeMs = Date.now() - startTime
      await logApiUsage(
        authResult.token!.id,
        `/api/v1/products/${id}`,
        'GET',
        403,
        responseTimeMs,
        request.headers.get('x-forwarded-for') || undefined,
        request.headers.get('user-agent') || undefined,
        'Access denied to product'
      )
      return NextResponse.json({ error: 'Access denied to this product' }, { status: 403 })
    }
  }

  const responseTimeMs = Date.now() - startTime

  await logApiUsage(
    authResult.token!.id,
    `/api/v1/products/${id}`,
    'GET',
    200,
    responseTimeMs,
    request.headers.get('x-forwarded-for') || undefined,
    request.headers.get('user-agent') || undefined
  )

  // Transform to API response format
  const transformedData = {
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
      company_name: product.manufacturers.company_name,
      industry: product.manufacturers.industry,
      email: product.manufacturers.email
    } : null,
    created_at: product.created_at,
    updated_at: product.updated_at
  }

  return NextResponse.json({ data: transformedData })
}
